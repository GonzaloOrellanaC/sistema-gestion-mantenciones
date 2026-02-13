// Lightweight IndexedDB utility for storing review state per work order
const DB_NAME = 'sistema-review-db';
const DB_VERSION = 1;
const STORE_NAME = 'reviews';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (ev: any) => {
      const db = ev.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveReviewState(workOrderId: string, data: any) {
  if (!workOrderId) return;
  try {
    const db = await openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id: workOrderId, data });
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(tx.error || new Error('Transaction failed'));
    });
  } catch (e) {
    // swallow errors to avoid breaking UI
    console.warn('saveReviewState failed', e);
  }
}

export async function loadReviewState(workOrderId: string) {
  if (!workOrderId) return null;
  try {
    const db = await openDb();
    return new Promise<any>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(workOrderId);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('loadReviewState failed', e);
    return null;
  }
}

export async function clearReviewState(workOrderId: string) {
  if (!workOrderId) return;
  try {
    const db = await openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(workOrderId);
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(tx.error || new Error('Transaction failed'));
    });
  } catch (e) {
    console.warn('clearReviewState failed', e);
  }
}

export default { saveReviewState, loadReviewState, clearReviewState };
