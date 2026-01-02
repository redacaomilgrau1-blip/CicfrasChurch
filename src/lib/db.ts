import { Song, RecentSong } from '@/types';

const DB_NAME = 'ChordManagerDB';
const DB_VERSION = 1;
const SONGS_STORE = 'songs';
const RECENT_STORE = 'recent';
const SETTINGS_STORE = 'settings';

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(SONGS_STORE)) {
        const songsStore = database.createObjectStore(SONGS_STORE, { keyPath: 'id' });
        songsStore.createIndex('title', 'title', { unique: false });
        songsStore.createIndex('artist', 'artist', { unique: false });
        songsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!database.objectStoreNames.contains(RECENT_STORE)) {
        const recentStore = database.createObjectStore(RECENT_STORE, { keyPath: 'songId' });
        recentStore.createIndex('accessedAt', 'accessedAt', { unique: false });
      }

      if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
        database.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
  });
};

export const saveSong = async (song: Song): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SONGS_STORE], 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);
    store.put(song);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
};

export const getSong = async (id: string): Promise<Song | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SONGS_STORE], 'readonly');
    const store = transaction.objectStore(SONGS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllSongs = async (): Promise<Song[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SONGS_STORE], 'readonly');
    const store = transaction.objectStore(SONGS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const deleteSong = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SONGS_STORE], 'readwrite');
    const store = transaction.objectStore(SONGS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const addRecentSong = async (songId: string): Promise<void> => {
  const database = await initDB();
  const recent: RecentSong = {
    songId,
    accessedAt: Date.now()
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([RECENT_STORE], 'readwrite');
    const store = transaction.objectStore(RECENT_STORE);
    const request = store.put(recent);

    request.onsuccess = async () => {
      await pruneRecentSongs();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};

export const getRecentSongs = async (): Promise<Song[]> => {
  const database = await initDB();
  
  const recentEntries: RecentSong[] = await new Promise((resolve, reject) => {
    const transaction = database.transaction([RECENT_STORE], 'readonly');
    const store = transaction.objectStore(RECENT_STORE);
    const index = store.index('accessedAt');
    const request = index.openCursor(null, 'prev');
    const results: RecentSong[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor && results.length < 20) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });

  const songs: Song[] = [];
  for (const entry of recentEntries) {
    const song = await getSong(entry.songId);
    if (song) {
      songs.push(song);
    }
  }

  return songs;
};

const pruneRecentSongs = async (): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([RECENT_STORE], 'readwrite');
    const store = transaction.objectStore(RECENT_STORE);
    const index = store.index('accessedAt');
    const request = index.openCursor(null, 'prev');
    let count = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        count++;
        if (count > 20) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const getSetting = async (key: string): Promise<any> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SETTINGS_STORE], 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
};

export const setSetting = async (key: string, value: any): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SETTINGS_STORE], 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.put({ key, value });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearAllData = async (): Promise<void> => {
  const database = await initDB();
  
  const stores = [SONGS_STORE, RECENT_STORE];
  
  for (const storeName of stores) {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
