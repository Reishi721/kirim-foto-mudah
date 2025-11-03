import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid3x3, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FolderTree } from '@/components/browse/FolderTree';
import { FiltersToolbar } from '@/components/browse/FiltersToolbar';
import { PhotoGrid } from '@/components/browse/PhotoGrid';
import { PhotoList } from '@/components/browse/PhotoList';
import { PreviewDrawer } from '@/components/browse/PreviewDrawer';
import { supabase } from '@/integrations/supabase/client';
import { buildFolderTree } from '@/lib/folderHierarchy';
import { PhotoFile, UploadRecord, FolderNode, ViewMode, FilterState } from '@/lib/browseTypes';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState<UploadRecord[]>([]);
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FolderNode | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoFile | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  // Parse filters from URL
  const filters: FilterState = useMemo(() => ({
    search: searchParams.get('search') || '',
    type: (searchParams.get('type') as FilterState['type']) || 'all',
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    supir: searchParams.get('supir') || undefined,
  }), [searchParams]);

  // Load upload records
  useEffect(() => {
    loadRecords();
  }, []);

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

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('upload_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRecords(data || []);
      setFolderTree(buildFolderTree(data || []));
    } catch (error) {
      console.error('Error loading records:', error);
      toast.error('Failed to load records');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPhotosFromFolder = async (folderPath: string) => {
    setIsLoadingPhotos(true);
    try {
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

          // Find matching record for metadata
          const record = records.find((r) => r.folder_path === folderPath);

          return {
            id: file.id,
            name: file.name,
            path: filePath,
            size: file.metadata?.size || 0,
            type: file.metadata?.mimetype || 'unknown',
            uploadedAt: file.created_at || file.updated_at || new Date().toISOString(),
            url: urlData.publicUrl,
            metadata: record
              ? {
                  noSuratJalan: record.no_surat_jalan,
                  tanggal: record.tanggal,
                  tipe: record.tipe as 'Pengiriman' | 'Pengembalian',
                  supir: record.supir,
                  helper1: record.helper1,
                  helper2: record.helper2,
                }
              : undefined,
          };
        })
      );

      setPhotos(photoFiles);
    } catch (error) {
      console.error('Error loading photos:', error);
      toast.error('Failed to load photos');
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

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (p) => !p.metadata || new Date(p.metadata.tanggal) >= new Date(filters.dateFrom!)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(
        (p) => !p.metadata || new Date(p.metadata.tanggal) <= new Date(filters.dateTo!)
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Folder Tree */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg text-foreground">Folder Structure</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {records.length} delivery records
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FolderTree
            nodes={folderTree}
            onNodeClick={(node) => {
              setSelectedFolder(node.path);
              setSelectedNode(node);
            }}
            selectedPath={selectedFolder || undefined}
          />
        </div>
      </div>

      {/* Right Panel - Results */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <h1 className="text-xl font-semibold text-foreground">Browse Photos</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <FiltersToolbar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          drivers={uniqueDrivers}
        />

        {/* Results Area */}
        <div className="flex-1 overflow-hidden relative">
          {!selectedFolder ? (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Select a folder to view photos
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose a folder from the tree on the left to browse photos
                </p>
              </div>
            </div>
          ) : selectedNode?.type !== 'nosj' ? (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Navigate deeper to view photos
                </h3>
                <p className="text-sm text-muted-foreground">
                  Photos are only available at the delivery/return level (No SJ)
                </p>
              </div>
            </div>
          ) : isLoadingPhotos ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
