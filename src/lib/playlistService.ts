
import { supabase } from './customSupabaseClient';
import { Playlist, PlaylistItem, Song } from '@/types';
import { upsertSongInSupabase } from '@/lib/songService';

// Playlist CRUD
export async function createPlaylist(name: string): Promise<Playlist | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Error fetching user for playlist:', userError);
    return null;
  }

  const { data, error } = await supabase
    .from('playlists')
    .insert([{ name, user_id: user.id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating playlist:', error);
    return null;
  }
  return data;
}

export async function getPlaylists(): Promise<Playlist[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching playlists:', error);
    return [];
  }
  return data || [];
}

export async function deletePlaylist(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting playlist:', error);
    return false;
  }
  return true;
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) return null;
  return data;
}

// Playlist Items CRUD
export async function getPlaylistItems(playlistId: string): Promise<PlaylistItem[]> {
  const { data, error } = await supabase
    .from('playlist_items')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching playlist items:', error);
    return [];
  }
  return data || [];
}

export async function addSongToPlaylist(
  playlistId: string,
  songId: string,
  song?: Song
): Promise<PlaylistItem | null> {
  try {
    if (song) {
      await upsertSongInSupabase(song);
    }

    // Get current max position to append to the end
    // Note: We use maybeSingle() instead of single() to gracefully handle empty results
    const { data: maxPosData } = await supabase
      .from('playlist_items')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const nextPos = (maxPosData?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from('playlist_items')
      .insert([{ playlist_id: playlistId, song_id: songId, position: nextPos }])
      .select()
      .single();

    if (error) {
      console.error('Error adding song to playlist:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Unexpected error in addSongToPlaylist:', err);
    return null;
  }
}

export async function removePlaylistItem(itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('playlist_items')
    .delete()
    .eq('id', itemId);

  return !error;
}

export async function updatePlaylistOrder(items: PlaylistItem[]): Promise<boolean> {
  if (items.length === 0) return true;

  const updates = items.map((item, index) => ({
    id: item.id,
    playlist_id: item.playlist_id,
    song_id: item.song_id,
    position: index
  }));

  const { error } = await supabase
    .from('playlist_items')
    .upsert(updates);

  if (error) {
    console.error('Error reordering playlist:', error);
    return false;
  }
  return true;
}
