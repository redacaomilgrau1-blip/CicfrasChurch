
export type AccidentalPreference = 'sharps' | 'flats';

const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const CHORD_REGEX = /^([A-G][#b]?)(.*)/;

const normalizeChord = (chord: string): { root: string; suffix: string } | null => {
  const match = chord.match(CHORD_REGEX);
  if (!match) return null;
  
  return {
    root: match[1],
    suffix: match[2]
  };
};

const getChordIndex = (root: string): number => {
  let index = CHROMATIC_SHARPS.indexOf(root);
  if (index === -1) {
    index = CHROMATIC_FLATS.indexOf(root);
  }
  return index;
};

export const transposeChord = (
  chord: string, 
  semitones: number, 
  preference: AccidentalPreference = 'sharps'
): string => {
  const normalized = normalizeChord(chord);
  if (!normalized) return chord;

  const { root, suffix } = normalized;
  const currentIndex = getChordIndex(root);
  
  if (currentIndex === -1) return chord;

  let newIndex = (currentIndex + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  const chromaticScale = preference === 'sharps' ? CHROMATIC_SHARPS : CHROMATIC_FLATS;
  const newRoot = chromaticScale[newIndex];

  return newRoot + suffix;
};

export const getKeySignature = (key: string): AccidentalPreference => {
  const sharpsKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
  const flatsKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
  
  if (sharpsKeys.includes(key) || key.includes('#')) {
    return 'sharps';
  }
  if (flatsKeys.includes(key) || key.includes('b')) {
    return 'flats';
  }
  
  return 'sharps';
};
