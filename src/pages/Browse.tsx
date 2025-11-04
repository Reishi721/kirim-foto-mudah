import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Grid3x3, List, Loader2, PanelLeftClose, PanelLeft, ChevronLeft, FolderTree as FolderTreeIcon, ImageOff, FolderOpen, Upload as UploadIconLucide } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { FolderTree } from '@/components/browse/FolderTree';
import { FolderGrid } from '@/components/browse/FolderGrid';
import { FiltersToolbar } from '@/components/browse/FiltersToolbar';
import { PhotoGrid } from '@/components/browse/PhotoGrid';
import { PhotoList } from '@/components/browse/PhotoList';
import { PreviewDrawer } from '@/components/browse/PreviewDrawer';
import { BreadcrumbNav } from '@/components/browse/BreadcrumbNav';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { buildFolderTree } from '@/lib/folderHierarchy';
import { PhotoFile, UploadRecord, FolderNode, ViewMode, FilterState } from '@/lib/browseTypes';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { useUploadRecords } from '@/hooks/useUploadRecords';
import { offlineStorage } from '@/lib/offlineStorage';
import { BrowseSkeleton } from '@/components/ui/skeleton-loader';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: records = [], isLoading } = useUploadRecords();
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FolderNode | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoFile | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  // Parse filters from URL
  const filters: FilterState = useMemo(() => ({
    search: searchParams.get('search') || '',
    type: (searchParams.get('type') as FilterState['type']) || 'all',
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    supir: searchParams.get('supir') || undefined,
  }), [searchParams]);

  // Build folder tree when records change
  useEffect(() => {
    if (records.length > 0) {
      setFolderTree(buildFolderTree(records));
    }
  }, [records]);

  // Auto-select folder from URL parameter
  useEffect(() => {
    const folderParam = searchParams.get('folder');
    if (folderParam && folderTree.length > 0) {
      const node = findNodeInTree(folderTree, folderParam);
      if (node) {
        setSelectedFolder(node.path);
        setSelectedNode(node);
      }
    }
  }, [folderTree, searchParams]);

  // Load photos when leaf folder selected
  useEffect(() => {
    if (selectedFolder && selectedNode?.type === 'nosj') {
      loadPhotosFromFolder(selectedFolder);
    } else if (selectedFolder) {
      // Clear photos for non-leaf nodes
      setPhotos([]);
    }
  }, [selectedFolder, selectedNode]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [photos, filters]);

  const loadPhotosFromFolder = async (folderPath: string) => {
    setIsLoadingPhotos(true);
    try {
      // Try to fetch from network first
      const { data: files, error } = await supabase.storage
        .from('surat-jalan-uploads')
        .list(folderPath);

      if (error) throw error;

      // Get public URLs and metadata
      const photoFiles: PhotoFile[] = await Promise.all(
        (files || []).map(async (file) => {
          const filePath = `${folderPath}/${file.name}`;
          const { data: urlData } = supabase.storage
            .from('surat-jalan-uploads')
            .getPublicUrl(filePath);

          const record = records.find((r) => r.folder_path === folderPath);

          return {
            id: file.id,
            name: file.name,
            path: filePath,
            size: file.metadata?.size || 0,
            type: file.metadata?.mimetype || 'unknown',
            uploadedAt: file.created_at || file.updated_at || new Date().toISOString(),
            url: urlData.publicUrl,
            folderPath: folderPath,
            metadata: record
              ? {
                  noSuratJalan: record.no_surat_jalan,
                  tanggal: record.tanggal,
                  tipe: record.tipe as 'Pengiriman' | 'Pengembalian',
                  customerName: record.customer_name,
                  supir: record.supir,
                  helper1: record.helper1,
                  helper2: record.helper2,
                  description: record.description,
                }
              : undefined,
          };
        })
      );

      setPhotos(photoFiles);
      // Cache photos for offline access (cast for storage)
      await offlineStorage.savePhotos(folderPath, photoFiles as any);
    } catch (error) {
      console.error('Error loading photos:', error);
      // Try offline cache
      const cachedPhotos = await offlineStorage.getPhotos(folderPath);
      if (cachedPhotos.length > 0) {
        setPhotos(cachedPhotos as any);
        toast.info('Showing cached photos - offline mode');
      } else {
        toast.error('Failed to load photos');
      }
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...photos];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.metadata?.noSuratJalan.toLowerCase().includes(search)
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter((p) => p.metadata?.tipe === filters.type);
    }

    // Date range filter - fixed timezone issue
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom + 'T00:00:00');
      filtered = filtered.filter(
        (p) => !p.metadata || new Date(p.metadata.tanggal + 'T00:00:00') >= fromDate
      );
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo + 'T23:59:59');
      filtered = filtered.filter(
        (p) => !p.metadata || new Date(p.metadata.tanggal + 'T00:00:00') <= toDate
      );
    }

    // Driver filter
    if (filters.supir) {
      filtered = filtered.filter((p) => p.metadata?.supir === filters.supir);
    }

    setFilteredPhotos(filtered);
  };

  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    const params = new URLSearchParams();
    
    if (updated.search) params.set('search', updated.search);
    if (updated.type !== 'all') params.set('type', updated.type);
    if (updated.dateFrom) params.set('dateFrom', updated.dateFrom);
    if (updated.dateTo) params.set('dateTo', updated.dateTo);
    if (updated.supir) params.set('supir', updated.supir);

    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleGoBack = () => {
    if (!selectedFolder) return;
    
    // Split the path and go up one level
    const pathParts = selectedFolder.split('/');
    pathParts.pop(); // Remove the last segment
    
    if (pathParts.length === 0) {
      // Back to root - clear selection
      setSelectedFolder(null);
      setSelectedNode(null);
      setPhotos([]);
    } else {
      // Navigate to parent folder
      const parentPath = pathParts.join('/');
      const parentNode = findNodeInTree(folderTree, parentPath);
      setSelectedFolder(parentPath);
      setSelectedNode(parentNode);
    }
  };

  const handlePhotoClick = (photo: PhotoFile, index: number) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);
  };

  const handlePreviousPhoto = () => {
    if (selectedPhotoIndex > 0) {
      const newIndex = selectedPhotoIndex - 1;
      setSelectedPhoto(filteredPhotos[newIndex]);
      setSelectedPhotoIndex(newIndex);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex < filteredPhotos.length - 1) {
      const newIndex = selectedPhotoIndex + 1;
      setSelectedPhoto(filteredPhotos[newIndex]);
      setSelectedPhotoIndex(newIndex);
    }
  };

  const uniqueDrivers = useMemo(
    () => Array.from(new Set(records.map((r) => r.supir))).sort(),
    [records]
  );

  const uniqueDates = useMemo(
    () => Array.from(new Set(records.map((r) => r.tanggal))).sort().reverse(),
    [records]
  );

  const breadcrumbPaths = useMemo(() => {
    if (!selectedFolder) return [];
    const parts = selectedFolder.split('/');
    return parts.map((_, index) => ({
      name: parts[index],
      path: parts.slice(0, index + 1).join('/'),
    }));
  }, [selectedFolder]);

  const activeFilterCount = useMemo(() => {
    return (
      (filters.search ? 1 : 0) +
      (filters.type !== 'all' ? 1 : 0) +
      (filters.dateFrom ? 1 : 0) +
      (filters.dateTo ? 1 : 0) +
      (filters.supir ? 1 : 0)
    );
  }, [filters]);

  // Helper function to find a node in the folder tree recursively
  const findNodeInTree = (nodes: FolderNode[], path: string): FolderNode | null => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findNodeInTree(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const FolderTreeContent = () => (
    <>
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex-1">
          <h2 className="font-semibold text-lg text-foreground">Folder Structure</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {records.length} delivery records
          </p>
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="hover:bg-muted"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <FolderTree
          nodes={folderTree}
          onNodeClick={(node) => {
            setSelectedFolder(node.path);
            setSelectedNode(node);
            if (isMobile) setIsMobileSheetOpen(false);
          }}
          selectedPath={selectedFolder || undefined}
        />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      <AnimatePresence>
        {isSidebarOpen && !isMobile && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-r flex-col overflow-hidden flex"
          >
            <FolderTreeContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sheet for Folder Navigation */}
      {isMobile && (
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0 flex flex-col">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Folder Structure</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <FolderTree
                nodes={folderTree}
                onNodeClick={(node) => {
                  setSelectedFolder(node.path);
                  setSelectedNode(node);
                  setIsMobileSheetOpen(false);
                }}
                selectedPath={selectedFolder || undefined}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Right Panel - Results */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumb Navigation */}
        {breadcrumbPaths.length > 0 && (
          <div className="px-3 sm:px-4 py-2 border-b bg-muted/30">
            <BreadcrumbNav
              paths={breadcrumbPaths}
              onNavigate={(path) => {
                if (path === null) {
                  setSelectedFolder(null);
                  setSelectedNode(null);
                } else {
                  const node = findNodeInTree(folderTree, path);
                  setSelectedFolder(path);
                  setSelectedNode(node || null);
                }
              }}
            />
          </div>
        )}

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border-b"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              {isMobile ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMobileSheetOpen(true)}
                  className="flex items-center gap-2 shrink-0 hover-lift"
                >
                  <FolderTreeIcon className="h-4 w-4" />
                  <span>Folders</span>
                </Button>
              ) : !isSidebarOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center gap-2 shrink-0 hover-lift"
                >
                  <PanelLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Folders</span>
                </Button>
              )}
              {selectedFolder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoBack}
                  className="flex items-center gap-2 shrink-0 hover-lift"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-primary rounded-full" />
                <h1 className="text-lg sm:text-xl font-bold text-foreground whitespace-nowrap">Browse Photos</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="hover-lift"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="hover-lift"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        <FiltersToolbar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          drivers={uniqueDrivers}
        />

        {/* Results Area */}
        <div className="flex-1 overflow-hidden relative">
          {!selectedFolder ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center p-8"
            >
              <div className="rounded-full bg-gradient-primary/10 p-8 mb-6">
                <FolderOpen className="h-20 w-20 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Welcome to Browse
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
                Select a folder from the sidebar to view delivery records and photos. 
                Use filters to quickly find what you're looking for.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/upload')} className="hover-lift">
                  <UploadIconLucide className="mr-2 h-4 w-4" />
                  Upload New Photos
                </Button>
                {!isSidebarOpen && !isMobile && (
                  <Button onClick={() => setIsSidebarOpen(true)} variant="outline" className="hover-lift">
                    <PanelLeft className="mr-2 h-4 w-4" />
                    Show Folders
                  </Button>
                )}
              </div>
            </motion.div>
          ) : selectedNode?.type !== 'nosj' && selectedNode?.children ? (
            <FolderGrid 
              folders={selectedNode.children} 
              onFolderClick={(folder) => {
                setSelectedFolder(folder.path);
                setSelectedNode(folder);
              }} 
            />
          ) : selectedNode?.type !== 'nosj' ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <FolderTreeIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Empty Folder
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This folder doesn't contain any delivery records yet
              </p>
              <Button onClick={() => window.location.href = '/upload'} variant="outline">
                Upload Photos
              </Button>
            </div>
          ) : isLoadingPhotos ? (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="w-full aspect-square rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <ImageOff className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Photos Found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filters.search || filters.type !== 'all' || filters.supir 
                  ? 'Try adjusting your filters to see more results' 
                  : 'This delivery record doesn\'t have any photos yet'}
              </p>
              {activeFilterCount > 0 && (
                <Button onClick={handleClearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <PhotoGrid photos={filteredPhotos} onPhotoClick={handlePhotoClick} />
          ) : (
            <PhotoList photos={filteredPhotos} onPhotoClick={handlePhotoClick} />
          )}
        </div>
      </div>

      {/* Preview Drawer */}
      <AnimatePresence>
        {selectedPhoto && (
          <PreviewDrawer
            photo={selectedPhoto}
            currentIndex={selectedPhotoIndex}
            totalPhotos={filteredPhotos.length}
            onClose={() => setSelectedPhoto(null)}
            onPrevious={selectedPhotoIndex > 0 ? handlePreviousPhoto : undefined}
            onNext={selectedPhotoIndex < filteredPhotos.length - 1 ? handleNextPhoto : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
