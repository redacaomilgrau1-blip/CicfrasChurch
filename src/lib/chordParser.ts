
export interface ParsedLine {
  type: 'chord' | 'lyric' | 'both' | 'directive' | 'empty';
  content: string;
  chordPositions?: Array<{ chord: string; position: number }>;
  lyric?: string;
}

const CHORD_TOKEN_REGEX = /\b[A-G][#b]?(?:maj|min|m|sus|dim|aug|add)?[0-9]?(?:\/[A-G][#b]?)?(?![A-Za-z0-9_])/;
const CHORD_REGEX = new RegExp(CHORD_TOKEN_REGEX.source, 'g');

export const parseLine = (line: string): ParsedLine => {
  const rawLine = line.replace(/\r$/, '');
  const trimmed = rawLine.trim();

  if (!trimmed) {
    return { type: 'empty', content: '' };
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return { type: 'directive', content: trimmed };
  }

  const chordMatches = Array.from(rawLine.matchAll(CHORD_REGEX));

  if (chordMatches.length === 0) {
    return { type: 'lyric', content: rawLine, lyric: rawLine };
  }

  const hasNonChordContent = rawLine.replace(CHORD_REGEX, '').trim().length > 0;

  if (chordMatches.length >= 2) {
    const chordPositions = chordMatches.map(match => ({
      chord: match[0],
      position: match.index || 0
    }));
    return { type: 'chord', content: rawLine, chordPositions };
  }

  if (!hasNonChordContent && chordMatches.length > 0) {
    const chordPositions = chordMatches.map(match => ({
      chord: match[0],
      position: match.index || 0
    }));
    return { type: 'chord', content: rawLine, chordPositions };
  }

  return { type: 'lyric', content: rawLine, lyric: rawLine };
};

export const parseContent = (content: string): ParsedLine[] => {
  const lines = content.split('\n');
  return lines.map(parseLine);
};
