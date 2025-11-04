// IndexedDB wrapper for offline storage
const DB_NAME = 'documentingSystemDB';
const DB_VERSION = 1;
const RECORDS_STORE = 'uploadRecords';
const PHOTOS_STORE = 'photos';
const QUEUE_STORE = 'uploadQueue';

interface UploadRecord {
  id: string;
  [key: string]: any;
}

interface Photo {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
  url: string;
  folderPath: string;
  metadata?: any;
}

interface QueueItem {
  id: string;
  type: 'upload' | 'delete';
  data: any;
  timestamp: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(RECORDS_STORE)) {
          db.createObjectStore(RECORDS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
          const photoStore = db.createObjectStore(PHOTOS_STORE, { keyPath: 'id' });
          photoStore.createIndex('folderPath', 'folderPath', { unique: false });
        }
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Upload Records
  async saveRecords(records: UploadRecord[]): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction(RECORDS_STORE, 'readwrite');
    const store = transaction.objectStore(RECORDS_STORE);

    for (const record of records) {
      store.put(record);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getRecords(): Promise<UploadRecord[]> {
    const db = await this.ensureDb();
    const transaction = db.transaction(RECORDS_STORE, 'readonly');
    const store = transaction.objectStore(RECORDS_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Photos
  async savePhotos(folderPath: string, photos: Photo[]): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction(PHOTOS_STORE, 'readwrite');
    const store = transaction.objectStore(PHOTOS_STORE);

    for (const photo of photos) {
      store.put({ ...photo, folderPath });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getPhotos(folderPath: string): Promise<Photo[]> {
    const db = await this.ensureDb();
    const transaction = db.transaction(PHOTOS_STORE, 'readonly');
    const store = transaction.objectStore(PHOTOS_STORE);
    const index = store.index('folderPath');
    const request = index.getAll(folderPath);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Upload Queue for offline uploads
  async addToQueue(item: Omit<QueueItem, 'id' | 'timestamp'>): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction(QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);

    const queueItem: QueueItem = {
      ...item,
      id: `queue-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    store.add(queueItem);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getQueue(): Promise<QueueItem[]> {
    const db = await this.ensureDb();
    const transaction = db.transaction(QUEUE_STORE, 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromQueue(id: string): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction(QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    store.delete(id);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction([RECORDS_STORE, PHOTOS_STORE, QUEUE_STORE], 'readwrite');
    
    transaction.objectStore(RECORDS_STORE).clear();
    transaction.objectStore(PHOTOS_STORE).clear();
    transaction.objectStore(QUEUE_STORE).clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();

// Initialize on import
offlineStorage.init().catch(console.error);
