/**
 * Browser-local IndexedDB storage adapter for Phase 1 local development.
 * Provides persistent local storage for creative drafts and large binary attachments
 * (audio recordings, images, documents) without hitting localStorage size limitations.
 */

const DB_NAME = "the-source-local-vault";
const DB_VERSION = 1;
const DRAFTS_STORE = "drafts";
const ASSETS_STORE = "assets";

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(ASSETS_STORE)) {
        db.createObjectStore(ASSETS_STORE, { keyPath: "storagePath" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraftToIndexedDB(key: string, data: Record<string, unknown>): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, "readwrite");
    const store = tx.objectStore(DRAFTS_STORE);
    store.put({ key, ...data, savedAt: Date.now() });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDraftFromIndexedDB<T = Record<string, unknown>>(key: string): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, "readonly");
    const store = tx.objectStore(DRAFTS_STORE);
    const request = store.get(key);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result as T);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDraftFromIndexedDB(key: string): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFTS_STORE, "readwrite");
    const store = tx.objectStore(DRAFTS_STORE);
    store.delete(key);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveAssetToIndexedDB(
  storagePath: string,
  blob: Blob,
  filename: string,
  mimeType: string
): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(ASSETS_STORE, "readwrite");
    const store = tx.objectStore(ASSETS_STORE);
    store.put({
      storagePath,
      blob,
      filename,
      mimeType,
      size: blob.size,
      savedAt: Date.now(),
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAssetFromIndexedDB(storagePath: string): Promise<Blob | null> {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(ASSETS_STORE, "readonly");
    const store = tx.objectStore(ASSETS_STORE);
    const request = store.get(storagePath);

    request.onsuccess = () => {
      if (request.result?.blob) {
        resolve(request.result.blob as Blob);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAssetFromIndexedDB(storagePath: string): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(ASSETS_STORE, "readwrite");
    const store = tx.objectStore(ASSETS_STORE);
    store.delete(storagePath);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
