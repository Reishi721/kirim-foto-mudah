import { useCallback, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileWithProgress } from '@/lib/uploadSchema';
import { compressImage, createImagePreview } from '@/lib/imageCompression';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadZoneProps {
  files: FileWithProgress[];
  onFilesAdded: (files: FileWithProgress[]) => void;
  onFileRemoved: (fileId: string) => void;
  disabled?: boolean;
}

export function FileUploadZone({ files, onFilesAdded, onFileRemoved, disabled }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

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
        status: 'pending',
        preview,
      });
    }

    onFilesAdded(newFiles);

    // Start compression in background
    newFiles.forEach(async (fileWithProgress) => {
      try {
        const compressed = await compressImage(fileWithProgress.file);
        // Update the file with compressed version
        onFilesAdded([{ ...fileWithProgress, compressedFile: compressed }]);
      } catch (error) {
        console.error('Compression failed:', error);
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

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex flex-col items-center gap-3">
          <Upload className="w-12 h-12 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Drop images here or click to browse</p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports: JPG, PNG, WebP (max 10MB per file)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            Select Files
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileInput}
            disabled={disabled}
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    {file.status !== 'pending' && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      </div>
                    )}
                  </div>
                  {file.status === 'pending' && !disabled && (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onFileRemoved(file.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {file.file.name}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
