import { Song, RecentSong } from '@/types';
import { supabase } from '@/lib/customSupabaseClient';
import {
  bulkUpsertSongsAdmin,
  clearAllSongsAdmin,
  deleteSongAdmin,
  saveSongAdmin
} from '@/lib/adminApi';

const DB_NAME = 'ChordManagerDB';
const DB_VERSION = 1;
const RECENT_STORE = 'recent';
const SETTINGS_STORE = 'settings';

let db: IDBDatabase | null = null;

const parseDate = (value?: string | null) => {
  if (!value) return 0;
  return new Date(value).getTime();
};

const mapRowToSong = (row: any): Song => ({
  id: row.id,
  title: row.title,
  artist: row.artist ?? undefined,
  key: row.key ?? undefined,
  content: row.content,
  createdAt: parseDate(row.created_at),
  updatedAt: parseDate(row.updated_at),
});

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
  await saveSongAdmin(song);
};

export const bulkUpsertSongs = async (songs: Song[]): Promise<void> => {
  await bulkUpsertSongsAdmin(songs);
};

export const getSong = async (id: string): Promise<Song | undefined> => {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching song:', error);
    return undefined;
  }
  if (!data) return undefined;
  return mapRowToSong(data);
};

export const getAllSongs = async (): Promise<Song[]> => {
  const { data, error } = await supabase
    .from('songs')
    .select('*');

  if (error) {
    console.error('Error fetching songs:', error);
    return [];
  }
  return (data || []).map(mapRowToSong);
};

export const deleteSong = async (id: string): Promise<void> => {
  await deleteSongAdmin(id);
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

  if (recentEntries.length === 0) return [];

  const ids = recentEntries.map(entry => entry.songId);
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('Error fetching recent songs:', error);
    return [];
  }

  const songsById = new Map((data || []).map((row) => [row.id, mapRowToSong(row)]));
  return recentEntries
    .map((entry) => songsById.get(entry.songId))
    .filter((song): song is Song => !!song);
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
  
  const stores = [RECENT_STORE];
  
  for (const storeName of stores) {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  await clearAllSongsAdmin();
};
