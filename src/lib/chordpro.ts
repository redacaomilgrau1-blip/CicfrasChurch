
import { Song } from '@/types';

const splitByTitleMarkers = (content: string): string[] => {
  const parts = content.split(/(?=^\{(?:title|t):)/m);
  return parts.map(part => part.trim()).filter(Boolean);
};

export const splitChordProSongs = (content: string): string[] => {
  const normalized = content.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');

  const separatorParts = normalized
    .split(/\n\s*-{3,}\s*\n/)
    .map(part => part.trim())
    .filter(Boolean);

  if (separatorParts.length > 1) {
    return separatorParts;
  }

  const titleParts = splitByTitleMarkers(normalized);
  return titleParts.length > 0 ? titleParts : [normalized.trim()];
};

export const parseChordPro = (content: string): Partial<Song> => {
  const lines = content.split('\n');
  const song: Partial<Song> = {
    title: '',
    artist: '',
    key: '',
    content: ''
  };

  const contentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('{title:') || trimmed.startsWith('{t:')) {
      song.title = trimmed.replace(/\{(?:title|t):\s*/, '').replace(/\}/, '').trim();
    } else if (trimmed.startsWith('{artist:') || trimmed.startsWith('{a:')) {
      song.artist = trimmed.replace(/\{(?:artist|a):\s*/, '').replace(/\}/, '').trim();
    } else if (trimmed.startsWith('{key:') || trimmed.startsWith('{k:')) {
      song.key = trimmed.replace(/\{(?:key|k):\s*/, '').replace(/\}/, '').trim();
    } else {
      contentLines.push(line);
    }
  }

  song.content = contentLines.join('\n').trim();

  return song;
};

export const exportToChordPro = (song: Song): string => {
  const lines: string[] = [];

  if (song.title) {
    lines.push(`{title: ${song.title}}`);
  }
  if (song.artist) {
    lines.push(`{artist: ${song.artist}}`);
  }
  if (song.key) {
    lines.push(`{key: ${song.key}}`);
  }

  lines.push('');
  lines.push(song.content);

  return lines.join('\n');
};
