import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { PhotoFile } from '@/lib/browseTypes';
import { ImageIcon, FileIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PhotoListProps {
  photos: PhotoFile[];
  onPhotoClick: (photo: PhotoFile, index: number) => void;
}

export function PhotoList({ photos, onPhotoClick }: PhotoListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: photos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
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
    <div ref={parentRef} className="h-full overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 p-4 bg-muted border-b text-xs font-semibold text-muted-foreground">
        <div className="col-span-1">Preview</div>
        <div className="col-span-4">Filename</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-3">Upload Date</div>
      </div>

      {/* Virtual List */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const photo = photos[virtualRow.index];

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
              <div
                className={cn(
                  'grid grid-cols-12 gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b',
                  virtualRow.index % 2 === 0 && 'bg-background'
                )}
                onClick={() => onPhotoClick(photo, virtualRow.index)}
              >
                <div className="col-span-1">
                  <div className="w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center">
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <FileIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="col-span-4 flex items-center">
                  <span className="text-sm truncate text-foreground">{photo.name}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-muted-foreground">{photo.metadata?.tipe || '-'}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-muted-foreground">
                    {(photo.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="text-sm text-muted-foreground">
                    {photo.uploadedAt ? format(new Date(photo.uploadedAt), 'MMM dd, yyyy HH:mm') : '-'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
