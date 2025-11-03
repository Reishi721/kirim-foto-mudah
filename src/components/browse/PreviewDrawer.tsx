import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhotoFile } from '@/lib/browseTypes';
import { format } from 'date-fns';
import { motion, useMotionValue, PanInfo } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface PreviewDrawerProps {
  photo: PhotoFile;
  currentIndex: number;
  totalPhotos: number;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onOpenMap?: () => void;
}

export function PreviewDrawer({
  photo,
  currentIndex,
  totalPhotos,
  onClose,
  onPrevious,
  onNext,
  onOpenMap,
}: PreviewDrawerProps) {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 100;
    
    if (info.offset.x > threshold && onPrevious) {
      onPrevious();
    } else if (info.offset.x < -threshold && onNext) {
      onNext();
    }
  };
  const metadata = photo.metadata;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-white border-l shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="font-semibold text-foreground">Photo Preview</h3>
            <p className="text-xs text-muted-foreground">
              {currentIndex + 1} of {totalPhotos}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onPrevious} disabled={!onPrevious}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext} disabled={!onNext}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Image Preview with Swipe Gesture */}
      <div className="relative bg-muted flex-shrink-0 overflow-hidden" style={{ height: '400px' }}>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {photo.url ? (
            <img
              src={photo.url}
              alt={photo.name}
              className="w-full h-full object-contain select-none pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No preview available
            </div>
          )}
        </motion.div>
        
        {/* Swipe Indicators */}
        {isDragging && (
          <>
            {onPrevious && (
              <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none">
                <ChevronLeft className="w-16 h-16 text-primary" />
              </div>
            )}
            {onNext && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none">
                <ChevronRight className="w-16 h-16 text-primary" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Metadata */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* File Info */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">File Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Filename:</span>
              <span className="font-medium text-foreground truncate ml-2 max-w-[300px]">
                {photo.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium text-foreground">
                {(photo.size / 1024).toFixed(2)} KB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium text-foreground">{photo.type}</span>
            </div>
            {photo.uploadedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uploaded:</span>
                <span className="font-medium text-foreground">
                  {format(new Date(photo.uploadedAt), 'PPpp')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Metadata */}
        {metadata && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Delivery Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Document No:</span>
                  <span className="font-medium text-foreground">{metadata.noSuratJalan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal:</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(metadata.tanggal), 'PPP')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipe:</span>
                  <Badge variant={metadata.tipe === 'Pengiriman' ? 'default' : 'secondary'}>
                    {metadata.tipe}
                  </Badge>
                </div>
                {metadata.customerName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium text-foreground">{metadata.customerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supir:</span>
                  <span className="font-medium text-foreground">{metadata.supir}</span>
                </div>
                {metadata.helper1 && metadata.helper1 !== '—' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Helper 1:</span>
                    <span className="font-medium text-foreground">{metadata.helper1}</span>
                  </div>
                )}
                {metadata.helper2 && metadata.helper2 !== '—' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Helper 2:</span>
                    <span className="font-medium text-foreground">{metadata.helper2}</span>
                  </div>
                )}
                {metadata.description && (
                  <div className="flex flex-col gap-1 pt-2">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="text-foreground text-sm bg-muted p-3 rounded-md">
                      {metadata.description}
                    </p>
                  </div>
                )}
                {metadata.keterangan && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Keterangan:</span>
                    <p className="text-foreground text-xs bg-muted p-2 rounded">
                      {metadata.keterangan}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Geo Info */}
        {metadata?.geo && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Location</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordinates:</span>
                  <span className="font-medium text-foreground">
                    {metadata.geo.lat.toFixed(6)}, {metadata.geo.lng.toFixed(6)}
                  </span>
                </div>
                {metadata.geo.address && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Address:</span>
                    <p className="text-foreground text-xs">{metadata.geo.address}</p>
                  </div>
                )}
                {onOpenMap && (
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={onOpenMap}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Open on Map
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Tags */}
        {metadata?.tags && metadata.tags.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <Separator />
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <a href={photo.url} download={photo.name}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
