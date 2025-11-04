import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll<T>(
  items: T[],
  itemsPerPage: number = 20,
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 0.8, rootMargin = '100px' } = options;
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Reset when items change
    setDisplayedItems(items.slice(0, itemsPerPage));
    setPage(1);
    setHasMore(items.length > itemsPerPage);
  }, [items, itemsPerPage]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    const startIndex = page * itemsPerPage;
    const endIndex = nextPage * itemsPerPage;
    const newItems = items.slice(startIndex, endIndex);

    if (newItems.length > 0) {
      setDisplayedItems((prev) => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(endIndex < items.length);
    } else {
      setHasMore(false);
    }
  }, [items, page, itemsPerPage]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current = observer;
    observer.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadMore, threshold, rootMargin]);

  return {
    displayedItems,
    hasMore,
    loadMoreRef,
    isLoading: false,
  };
}
