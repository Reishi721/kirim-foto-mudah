import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { PhotoFile } from '@/lib/browseTypes';
import { ImageIcon, FileIcon, Image as ImageIconLucide } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { LazyImage } from '@/components/ui/lazy-image';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoGridProps {
  photos: PhotoFile[];
  onPhotoClick: (photo: PhotoFile, index: number) => void;
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  const { displayedItems, hasMore, loadMoreRef } = useInfiniteScroll(photos, 20);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="rounded-full bg-muted/50 p-8 mb-6">
          <ImageIconLucide className="w-20 h-20 text-muted-foreground/40" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-3">No photos found</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
          Try adjusting your filters or select a different folder to view photos
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <ImageIconLucide className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedItems.map((photo, idx) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (idx % 20) * 0.02 }}
          >
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden group"
              onClick={() => onPhotoClick(photo, idx)}
            >
              <div className="aspect-square bg-muted relative overflow-hidden">
                {photo.url ? (
                  <LazyImage
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* End of results */}
      {!hasMore && displayedItems.length > 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          All photos loaded ({displayedItems.length} total)
        </div>
      )}
    </div>
  );
}
