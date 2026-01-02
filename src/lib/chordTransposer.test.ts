
import { describe, it, expect } from 'vitest';
import { transposeChord, getKeySignature } from './chordTransposer';

describe('chordTransposer', () => {
  describe('transposeChord', () => {
    it('should transpose major chords up correctly with sharps', () => {
      expect(transposeChord('C', 2, 'sharps')).toBe('D');
      expect(transposeChord('G', 2, 'sharps')).toBe('A');
      expect(transposeChord('D', 5, 'sharps')).toBe('G');
    });

    it('should transpose major chords down correctly with sharps', () => {
      expect(transposeChord('D', -2, 'sharps')).toBe('C');
      expect(transposeChord('A', -2, 'sharps')).toBe('G');
      expect(transposeChord('C', -5, 'sharps')).toBe('G');
    });

    it('should transpose chords with flats preference', () => {
      expect(transposeChord('C', 1, 'flats')).toBe('Db');
      expect(transposeChord('F', 1, 'flats')).toBe('Gb');
      expect(transposeChord('Bb', 2, 'flats')).toBe('C');
    });

    it('should preserve chord suffixes', () => {
      expect(transposeChord('Cmaj7', 2, 'sharps')).toBe('Dmaj7');
      expect(transposeChord('Am7', 3, 'sharps')).toBe('Cm7');
      expect(transposeChord('G7/B', 5, 'sharps')).toBe('C7/B');
    });

    it('should handle wrap-around correctly', () => {
      expect(transposeChord('B', 1, 'sharps')).toBe('C');
      expect(transposeChord('C', -1, 'sharps')).toBe('B');
      expect(transposeChord('A', 14, 'sharps')).toBe('B');
    });

    it('should handle complex chord types', () => {
      expect(transposeChord('Dsus4', 2, 'sharps')).toBe('Esus4');
      expect(transposeChord('Fdim', 3, 'sharps')).toBe('G#dim');
      expect(transposeChord('Gadd9', -2, 'sharps')).toBe('Fadd9');
    });
  });

  describe('getKeySignature', () => {
    it('should return sharps for sharp keys', () => {
      expect(getKeySignature('G')).toBe('sharps');
      expect(getKeySignature('D')).toBe('sharps');
      expect(getKeySignature('A')).toBe('sharps');
      expect(getKeySignature('E')).toBe('sharps');
    });

    it('should return flats for flat keys', () => {
      expect(getKeySignature('F')).toBe('flats');
      expect(getKeySignature('Bb')).toBe('flats');
      expect(getKeySignature('Eb')).toBe('flats');
      expect(getKeySignature('Ab')).toBe('flats');
    });

    it('should default to sharps for C major', () => {
      expect(getKeySignature('C')).toBe('sharps');
    });

    it('should handle keys with accidentals in name', () => {
      expect(getKeySignature('F#')).toBe('sharps');
      expect(getKeySignature('C#')).toBe('sharps');
      expect(getKeySignature('Db')).toBe('flats');
      expect(getKeySignature('Gb')).toBe('flats');
    });
  });
});
