import { supabase } from '@/lib/customSupabaseClient';
import { Song } from '@/types';

const ADMIN_PIN_KEY = 'admin_pin';

const getStoredPin = (): string | null => {
  return sessionStorage.getItem(ADMIN_PIN_KEY);
};

export const storeAdminPin = (pin: string) => {
  sessionStorage.setItem(ADMIN_PIN_KEY, pin);
};

export const clearAdminPin = () => {
  sessionStorage.removeItem(ADMIN_PIN_KEY);
};

const requirePin = (): string => {
  const pin = getStoredPin();
  if (!pin) {
    throw new Error('PIN nao encontrado. Entre novamente no admin.');
  }
  return pin;
};

const toIso = (value?: number) => {
  if (!value) return null;
  return new Date(value).toISOString();
};

const mapSongForApi = (song: Song) => ({
  id: song.id,
  title: song.title,
  artist: song.artist ?? null,
  key: song.key ?? null,
  content: song.content,
  created_at: toIso(song.createdAt),
  updated_at: toIso(song.updatedAt),
});

const invokeAdmin = async <T,>(body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke<T>('admin', { body });
  if (error) {
    throw new Error(error.message || 'Falha ao chamar funcao admin.');
  }
  return data as T;
};

export const verifyAdminPin = async (pin: string): Promise<boolean> => {
  const data = await invokeAdmin<{ ok: boolean }>(
    { action: 'verify_pin', pin }
  );
  return !!data?.ok;
};

export const setAdminPin = async (currentPin: string, newPin: string): Promise<boolean> => {
  const data = await invokeAdmin<{ ok: boolean }>(
    { action: 'set_pin', currentPin, newPin }
  );
  return !!data?.ok;
};

export const saveSongAdmin = async (song: Song): Promise<void> => {
  const pin = requirePin();
  await invokeAdmin({ action: 'save_song', pin, song: mapSongForApi(song) });
};

export const bulkUpsertSongsAdmin = async (songs: Song[]): Promise<void> => {
  const pin = requirePin();
  const payload = songs.map(mapSongForApi);
  await invokeAdmin({ action: 'bulk_upsert_songs', pin, songs: payload });
};

export const deleteSongAdmin = async (id: string): Promise<void> => {
  const pin = requirePin();
  await invokeAdmin({ action: 'delete_song', pin, id });
};

export const clearAllSongsAdmin = async (): Promise<void> => {
  const pin = requirePin();
  await invokeAdmin({ action: 'clear_songs', pin });
};
