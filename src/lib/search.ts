
import { Song } from '@/types';

export const searchSongs = (songs: Song[], query: string): Song[] => {
  if (!query.trim()) {
    return songs;
  }

  const lowerQuery = query.toLowerCase();

  return songs.filter(song => {
    const titleMatch = song.title.toLowerCase().includes(lowerQuery);
    const artistMatch = song.artist?.toLowerCase().includes(lowerQuery);
    const lyricsMatch = song.content.toLowerCase().includes(lowerQuery);

    return titleMatch || artistMatch || lyricsMatch;
  });
};

export const sortSongs = (songs: Song[], sortBy: 'title' | 'artist' | 'recent' | 'created'): Song[] => {
  const sorted = [...songs];

  switch (sortBy) {
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'artist':
      sorted.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
      break;
    case 'recent':
      // This usually relies on separate 'recent' data, but if passed a list of accessed times
      // it would work differently. Here we assume generic song list sort.
      // For actual "Recents" list, we use a separate fetch function in db.ts
      sorted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      break;
    case 'created':
      sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      break;
  }

  return sorted;
};
