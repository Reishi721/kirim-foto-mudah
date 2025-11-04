import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/notificationService';

export interface QueuedUpload {
  id: string;
  metadata: any;
  files: File[];
  timestamp: number;
  status: 'pending' | 'uploading' | 'failed';
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'upload_queue';
const MAX_RETRIES = 3;

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedUpload[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load queue from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setQueue(parsed);
      } catch (error) {
        console.error('Failed to parse upload queue:', error);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notificationService.add({
        type: 'success',
        title: 'Back Online',
        message: 'Connection restored. Processing queued uploads...',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      notificationService.add({
        type: 'info',
        title: 'Offline Mode',
        message: 'Uploads will be queued and synced when online',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process queue when online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isProcessing) {
      processQueue();
    }
  }, [isOnline, queue, isProcessing]);

  const addToQueue = (metadata: any, files: File[]) => {
    const queueItem: QueuedUpload = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metadata,
      files,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    setQueue(prev => [...prev, queueItem]);

    notificationService.add({
      type: 'info',
      title: 'Upload Queued',
      message: `${files.length} files queued for upload`,
    });

    return queueItem.id;
  };

  const processQueue = async () => {
    if (isProcessing || !isOnline) return;

    setIsProcessing(true);

    const pendingItems = queue.filter(
      item => item.status === 'pending' || (item.status === 'failed' && item.retryCount < MAX_RETRIES)
    );

    for (const item of pendingItems) {
      try {
        // Update status to uploading
        setQueue(prev =>
          prev.map(q => (q.id === item.id ? { ...q, status: 'uploading' as const } : q))
        );

        // Here you would call your actual upload function
        // For now, we'll simulate it
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Remove from queue on success
        setQueue(prev => prev.filter(q => q.id !== item.id));

        notificationService.add({
          type: 'success',
          title: 'Upload Complete',
          message: `${item.files.length} files uploaded successfully`,
        });
      } catch (error) {
        // Increment retry count on failure
        setQueue(prev =>
          prev.map(q =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'failed' as const,
                  retryCount: q.retryCount + 1,
                }
              : q
          )
        );

        if (item.retryCount >= MAX_RETRIES - 1) {
          notificationService.add({
            type: 'error',
            title: 'Upload Failed',
            message: `Failed to upload after ${MAX_RETRIES} attempts`,
          });
        }
      }
    }

    setIsProcessing(false);
  };

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const retryFailed = () => {
    setQueue(prev =>
      prev.map(q => (q.status === 'failed' ? { ...q, status: 'pending' as const } : q))
    );
  };

  const clearQueue = () => {
    setQueue([]);
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  };

  return {
    queue,
    isOnline,
    isProcessing,
    addToQueue,
    removeFromQueue,
    retryFailed,
    clearQueue,
    queueCount: queue.length,
    pendingCount: queue.filter(q => q.status === 'pending').length,
    failedCount: queue.filter(q => q.status === 'failed').length,
  };
}
