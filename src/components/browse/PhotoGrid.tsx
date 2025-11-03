import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { PhotoFile } from '@/lib/browseTypes';
import { ImageIcon, FileIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface PhotoGridProps {
  photos: PhotoFile[];
  onPhotoClick: (photo: PhotoFile, index: number) => void;
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(photos.length / 4),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 240,
    overscan: 5,
  });

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <ImageIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No photos found</h3>
        <p className="text-sm text-muted-foreground">Try adjusting your filters or select a different folder</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto p-4">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIdx = virtualRow.index * 4;
          const rowPhotos = photos.slice(startIdx, startIdx + 4);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                {rowPhotos.map((photo, idx) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden group"
                      onClick={() => onPhotoClick(photo, startIdx + idx)}
                    >
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {photo.url ? (
                          <img
                            src={photo.url}
                            alt={photo.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileIcon className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium truncate text-foreground">{photo.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {(photo.size / 1024).toFixed(1)} KB
                          </span>
                          {photo.uploadedAt && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(photo.uploadedAt), 'MMM dd, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
