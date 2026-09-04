export type SyncStatus = "local" | "pending" | "synced" | "conflict";

export type OfflineRecord<T> = {
  id: string;
  entity: string;
  payload: T;
  version: number;
  updatedAt: string;
  status: SyncStatus;
};

const DB_NAME = "ceiling-os";
const DB_VERSION = 1;
const STORE = "records";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("INDEXED_DB_UNAVAILABLE"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("INDEXED_DB_OPEN_FAILED"));
  });
}

export async function putOffline<T>(record: OfflineRecord<T>): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("INDEXED_DB_WRITE_FAILED"));
  });
  db.close();
}

export async function getOffline<T>(id: string): Promise<OfflineRecord<T> | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    request.onsuccess = () => {
      db.close();
      resolve((request.result as OfflineRecord<T> | undefined) ?? null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error ?? new Error("INDEXED_DB_READ_FAILED"));
    };
  });
}

export async function listPending(): Promise<OfflineRecord<unknown>[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => {
      db.close();
      resolve((request.result as OfflineRecord<unknown>[]).filter((x) => x.status === "pending" || x.status === "local"));
    };
    request.onerror = () => {
      db.close();
      reject(request.error ?? new Error("INDEXED_DB_LIST_FAILED"));
    };
  });
}
