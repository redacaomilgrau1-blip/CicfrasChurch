
import { supabase } from './customSupabaseClient';
import { Playlist, PlaylistItem, Song } from '@/types';
import { upsertSongInSupabase } from '@/lib/songService';

const LOCAL_PLAYLISTS_KEY = 'local_playlists';
const LOCAL_PLAYLIST_ITEMS_KEY = 'local_playlist_items';

const loadLocalPlaylists = (): Playlist[] => {
  try {
    const raw = localStorage.getItem(LOCAL_PLAYLISTS_KEY);
    return raw ? (JSON.parse(raw) as Playlist[]) : [];
  } catch {
    return [];
  }
};

const saveLocalPlaylists = (playlists: Playlist[]): void => {
  localStorage.setItem(LOCAL_PLAYLISTS_KEY, JSON.stringify(playlists));
};

const loadLocalPlaylistItems = (): PlaylistItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_PLAYLIST_ITEMS_KEY);
    return raw ? (JSON.parse(raw) as PlaylistItem[]) : [];
  } catch {
    return [];
  }
};

const saveLocalPlaylistItems = (items: PlaylistItem[]): void => {
  localStorage.setItem(LOCAL_PLAYLIST_ITEMS_KEY, JSON.stringify(items));
};

// Playlist CRUD
export async function createPlaylist(name: string): Promise<Playlist | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Error fetching user for playlist:', userError);
    const playlists = loadLocalPlaylists();
    const now = new Date().toISOString();
    const playlist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      created_at: now
    };
    saveLocalPlaylists([playlist, ...playlists]);
    return playlist;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return loadLocalPlaylists();
  }

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const playlists = loadLocalPlaylists().filter(p => p.id !== id);
    const items = loadLocalPlaylistItems().filter(item => item.playlist_id !== id);
    saveLocalPlaylists(playlists);
    saveLocalPlaylistItems(items);
    return true;
  }

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const playlists = loadLocalPlaylists();
    return playlists.find(p => p.id === id) || null;
  }

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return loadLocalPlaylistItems()
      .filter(item => item.playlist_id === playlistId)
      .sort((a, b) => a.position - b.position);
  }

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const items = loadLocalPlaylistItems();
      const currentItems = items.filter(item => item.playlist_id === playlistId);
      const maxPos = currentItems.reduce((max, item) => Math.max(max, item.position), -1);
      const nextPos = maxPos + 1;
      const newItem: PlaylistItem = {
        id: `pli-${Date.now()}`,
        playlist_id: playlistId,
        song_id: songId,
        position: nextPos
      };
      saveLocalPlaylistItems([...items, newItem]);
      return newItem;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const items = loadLocalPlaylistItems().filter(item => item.id !== itemId);
    saveLocalPlaylistItems(items);
    return true;
  }

  const { error } = await supabase
    .from('playlist_items')
    .delete()
    .eq('id', itemId);

  return !error;
}

export async function updatePlaylistOrder(items: PlaylistItem[]): Promise<boolean> {
  if (items.length === 0) return true;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const existing = loadLocalPlaylistItems();
    const ordered = items.map((item, index) => ({
      ...item,
      position: index
    }));
    const updated = existing.map(item => {
      const match = ordered.find(updatedItem => updatedItem.id === item.id);
      return match ? match : item;
    });
    saveLocalPlaylistItems(updated);
    return true;
  }

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
