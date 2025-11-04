import { useCallback, useState } from 'react';
import { Upload, X, ImageIcon, Sparkles, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileWithProgress } from '@/lib/uploadSchema';
import { compressImage, createImagePreview } from '@/lib/imageCompression';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';

interface FileUploadZoneProps {
  files: FileWithProgress[];
  onFilesAdded: (files: FileWithProgress[]) => void;
  onFileRemoved: (fileId: string) => void;
  disabled?: boolean;
}

export function FileUploadZone({ files, onFilesAdded, onFileRemoved, disabled }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = useIsMobile();

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: FileWithProgress[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith('image/')) continue;

      const id = `file-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = await createImagePreview(file);
      
      newFiles.push({
        id,
        file,
        progress: 0,
        status: 'compressing',
        preview,
      });
    }

    onFilesAdded(newFiles);

    // Start compression in background
    newFiles.forEach(async (fileWithProgress) => {
      try {
        const compressed = await compressImage(fileWithProgress.file);
        onFilesAdded([{ ...fileWithProgress, compressedFile: compressed, status: 'pending' }]);
      } catch (error) {
        console.error('Compression failed:', error);
        onFilesAdded([{ ...fileWithProgress, status: 'pending' }]);
      }
    });
  }, [onFilesAdded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const compressingFiles = files.filter(f => f.status === 'compressing');
  const compressingProgress = compressingFiles.length > 0 ? 50 : 0;

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-220 glass-card ${
          isDragging
            ? 'border-brand bg-brand/5 scale-[1.02]'
            : 'border-border/50 hover:border-brand/50 hover:bg-brand/5'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-gradient-brand opacity-10 pointer-events-none" />
        )}
        
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand/10 group-hover:bg-brand/20 transition-colors">
              <Upload className="w-10 h-10 text-brand" />
            </div>
            {isDragging && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-6 h-6 text-brand" />
              </motion.div>
            )}
          </div>
          
          <div>
            <p className="font-semibold text-lg text-foreground mb-2">
              {isDragging ? 'Drop your images here' : 'Drop images here or click to browse'}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports JPG, PNG, WebP • Auto-compressed • Max 10MB per file
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
            {isMobile && (
              <Button
                type="button"
                variant="default"
                size="lg"
                disabled={disabled}
                onClick={() => document.getElementById('camera-input')?.click()}
                className="flex-1 sm:flex-initial min-h-[48px]"
              >
                <Camera className="mr-2 h-5 w-5" />
                Take Photo
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={disabled}
              onClick={() => document.getElementById('file-input')?.click()}
              className="flex-1 sm:flex-initial min-h-[48px]"
            >
              <Upload className="mr-2 h-5 w-5" />
              {isMobile ? 'Choose Files' : 'Select Files'}
            </Button>
          </div>
          
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={handleFileInput}
            disabled={disabled}
          />
          
          {isMobile && (
            <input
              id="camera-input"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileInput}
              disabled={disabled}
            />
          )}
        </div>
      </div>

      {/* Compression Progress */}
      {compressingFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-4 w-4 text-brand animate-pulse" />
            <p className="text-sm font-medium">Compressing {compressingFiles.length} image{compressingFiles.length !== 1 ? 's' : ''}...</p>
          </div>
          <Progress value={compressingProgress} className="h-2" />
        </motion.div>
      )}

      {/* File Grid */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            {files.filter(f => f.compressedFile).length > 0 && (
              <p className="text-xs text-success flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Optimized for upload
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05, duration: 0.22 }}
                  className="relative group"
                  layout
                >
                  <div className="aspect-square rounded-xl overflow-hidden glass-card ring-1 ring-border/50 hover-lift">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {file.status === 'compressing' && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-full border-3 border-brand border-t-transparent animate-spin" />
                        <p className="text-xs font-medium">Optimizing...</p>
                      </div>
                    )}
                  </div>
                  
                  {file.status === 'pending' && !disabled && (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-8 w-8 sm:h-7 sm:w-7 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-soft"
                      onClick={() => onFileRemoved(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2 truncate">
                    {file.file.name}
                  </p>
                  
                  {file.compressedFile && (
                    <p className="text-xs text-success flex items-center gap-1 mt-0.5">
                      <Sparkles className="h-3 w-3" />
                      {Math.round((file.compressedFile.size / file.file.size) * 100)}% size
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
