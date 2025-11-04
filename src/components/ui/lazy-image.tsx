import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  containerClassName?: string;
}

export function LazyImage({ 
  src, 
  alt, 
  fallbackSrc, 
  className, 
  containerClassName,
  ...props 
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
      setHasError(false);
    };
    
    img.onerror = () => {
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setIsLoading(false);
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    };
  }, [isInView, src, fallbackSrc]);

  return (
    <div ref={imgRef} className={cn('relative', containerClassName)}>
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <ImageOff className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          {...props}
        />
      )}
    </div>
  );
}
