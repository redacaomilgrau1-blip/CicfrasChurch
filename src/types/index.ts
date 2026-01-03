
export interface Song {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface RecentSong {
  songId: string;
  accessedAt: number;
}

export interface AppSettings {
  pin: string;
  defaultAccidentalPreference: 'sharps' | 'flats';
}

export interface Playlist {
  id: string;
  name: string;
  user_id?: string;
  created_at?: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  song_id: string;
  position: number;
  song?: Song; // Helper for UI when joined with local data
}
