import { Song } from '@/types';
import { supabase } from '@/lib/customSupabaseClient';

const buildSongPayload = (song: Song) => ({
  id: song.id,
  title: song.title,
  artist: song.artist ?? null,
  key: song.key ?? null,
  content: song.content,
  created_at: song.createdAt,
  updated_at: song.updatedAt,
});

const mapSupabaseSong = (row: {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  content: string;
  created_at?: number | null;
  updated_at?: number | null;
}): Song => {
  const now = Date.now();
  return {
    id: row.id,
    title: row.title,
    artist: row.artist ?? undefined,
    key: row.key ?? undefined,
    content: row.content,
    createdAt: row.created_at ?? now,
    updatedAt: row.updated_at ?? now,
  };
};

export const upsertSongInSupabase = async (song: Song): Promise<void> => {
  try {
    const payload = buildSongPayload(song);
    const { error } = await supabase
      .from('songs')
      .upsert([payload], { onConflict: 'id' });

    if (error) {
      console.error('Error syncing song to Supabase:', error);
    }
  } catch (err) {
    console.error('Unexpected error syncing song to Supabase:', err);
  }
};

export const fetchSongsFromSupabase = async (): Promise<Song[]> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('id,title,artist,key,content,created_at,updated_at');

    if (error) {
      console.error('Error fetching songs from Supabase:', error);
      return [];
    }

    return (data || []).map(mapSupabaseSong);
  } catch (err) {
    console.error('Unexpected error fetching songs from Supabase:', err);
    return [];
  }
};

export const fetchSongFromSupabase = async (id: string): Promise<Song | null> => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('id,title,artist,key,content,created_at,updated_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching song from Supabase:', error);
      return null;
    }

    return mapSupabaseSong(data);
  } catch (err) {
    console.error('Unexpected error fetching song from Supabase:', err);
    return null;
  }
};

export const deleteSongInSupabase = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting song in Supabase:', error);
    }
  } catch (err) {
    console.error('Unexpected error deleting song in Supabase:', err);
  }
};
