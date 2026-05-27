import { generateGuid } from '@/utils';

const DB_NAME = 'builder_crm_images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

const objectUrlCache = new Map<string, string>();

let databasePromise: Promise<IDBDatabase> | null = null;

const getDatabase = (): Promise<IDBDatabase> => {
    if (!databasePromise) {
        databasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error ?? new Error('IndexedDB error'));
        });
    }

    return databasePromise;
};

const runTransaction = async <T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
    const db = await getDatabase();

    return new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = action(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB transaction error'));
        transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction error'));
    });
};

export const saveImageBlob = async (blob: Blob, id = generateGuid()): Promise<string> => {
    await runTransaction('readwrite', (store) => store.put(blob, id));
    return id;
};

export const getImageBlob = async (id: string): Promise<Blob | null> => {
    try {
        const blob = await runTransaction<Blob | undefined>('readonly', (store) => store.get(id));
        return blob ?? null;
    } catch {
        return null;
    }
};

export const deleteImage = async (id: string): Promise<void> => {
    const cachedUrl = objectUrlCache.get(id);
    if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
        objectUrlCache.delete(id);
    }

    await runTransaction('readwrite', (store) => store.delete(id));
};

export const getImageObjectUrl = async (id: string): Promise<string | null> => {
    const cached = objectUrlCache.get(id);
    if (cached) {
        return cached;
    }

    const blob = await getImageBlob(id);
    if (!blob) {
        return null;
    }

    const url = URL.createObjectURL(blob);
    objectUrlCache.set(id, url);
    return url;
};

export const revokeImageObjectUrl = (id: string) => {
    const cached = objectUrlCache.get(id);
    if (cached) {
        URL.revokeObjectURL(cached);
        objectUrlCache.delete(id);
    }
};
