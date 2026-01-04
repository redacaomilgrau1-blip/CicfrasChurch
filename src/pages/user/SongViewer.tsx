import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronUp, ChevronDown, Music, Type, SkipForward, SkipBack, ListMusic } from 'lucide-react';
import { getSong, addRecentSong } from '@/lib/db';
import { getPlaylistItems, getPlaylist } from '@/lib/playlistService';
import { transposeChord, getKeySignature, AccidentalPreference } from '@/lib/chordTransposer';
import { parseContent, ParsedLine } from '@/lib/chordParser';
import { getDisplayTitle } from '@/lib/songTitle';
import { Song, PlaylistItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

const SongViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playlistId = searchParams.get('playlistId');
  
  const [song, setSong] = useState<Song | null>(null);
  const [transpose, setTranspose] = useState(0);
  const [accidentalPref, setAccidentalPref] = useState<AccidentalPreference>('sharps');
  const [fontSize, setFontSize] = useState(16);
  const [useTwoColumns, setUseTwoColumns] = useState(false);
  
  // Playlist Context State
  const [nextSongId, setNextSongId] = useState<string | null>(null);
  const [prevSongId, setPrevSongId] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadSong(id);
      if (playlistId) {
        loadPlaylistContext(id, playlistId);
      }
    }
  }, [id, playlistId]);

  const loadSong = async (songId: string) => {
    const loadedSong = await getSong(songId);
    if (loadedSong) {
      setSong(loadedSong);
      await addRecentSong(songId);
      if (loadedSong.key) {
        setAccidentalPref(getKeySignature(loadedSong.key));
      }
    }
  };

  const loadPlaylistContext = async (currentSongId: string, pId: string) => {
    try {
      const items = await getPlaylistItems(pId);
      const playlist = await getPlaylist(pId);
      if (playlist) setPlaylistName(playlist.name);

      const currentIndex = items.findIndex(item => item.song_id === currentSongId);
      if (currentIndex !== -1 && currentIndex < items.length - 1) {
        setNextSongId(items[currentIndex + 1].song_id);
      } else {
        setNextSongId(null);
      }

      if (currentIndex > 0) {
        setPrevSongId(items[currentIndex - 1].song_id);
      } else {
        setPrevSongId(null);
      }
    } catch (e) {
      console.error("Failed to load playlist context", e);
    }
  };

  const handleTransposeUp = () => setTranspose((prev) => (prev + 1) % 12);
  const handleTransposeDown = () => setTranspose((prev) => (prev - 1 + 12) % 12);
  const toggleAccidentalPreference = () => setAccidentalPref((prev) => (prev === 'sharps' ? 'flats' : 'sharps'));
  const increaseFont = () => setFontSize(prev => Math.min(prev + 2, 24));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 2, 12));

  const parsedLines = useMemo(() => {
    if (!song) return [];
    return parseContent(song.content);
  }, [song]);

  const lyricLineCount = useMemo(() => {
    return parsedLines.filter(line => line.type === 'lyric' || line.type === 'both').length;
  }, [parsedLines]);

  const shouldUseTwoColumns = lyricLineCount > 10;

  useEffect(() => {
    setUseTwoColumns(shouldUseTwoColumns);
  }, [shouldUseTwoColumns, song?.id]);

  const findSplitIndex = (lines: ParsedLine[]) => {
    if (lines.length < 2) return lines.length;
    const target = Math.ceil(lines.length / 2);
    let offset = 0;
    while (target - offset > 1 || target + offset < lines.length - 1) {
      const leftIndex = target - offset;
      const rightIndex = target + offset;
      if (leftIndex > 0 && (lines[leftIndex].type === 'empty' || lines[leftIndex].type === 'directive')) {
        return leftIndex + 1;
      }
      if (rightIndex < lines.length && (lines[rightIndex].type === 'empty' || lines[rightIndex].type === 'directive')) {
        return rightIndex + 1;
      }
      offset += 1;
    }
    return target;
  };

  const splitIndex = useMemo(() => findSplitIndex(parsedLines), [parsedLines]);
  const leftLines = useMemo(() => parsedLines.slice(0, splitIndex), [parsedLines, splitIndex]);
  const rightLines = useMemo(() => parsedLines.slice(splitIndex), [parsedLines, splitIndex]);

  const renderLine = (line: ParsedLine, index: number) => {
    const chordLineHeight = `${fontSize * 1.2}px`;

    if (line.type === 'empty') {
      return <div key={index} className="h-4" />;
    }

    if (line.type === 'chord') {
      return (
        <div key={index} className="relative mb-0.5" style={{ height: chordLineHeight }}>
          <div
            className="absolute top-0 left-0 w-full whitespace-pre font-mono font-bold text-purple-700 dark:text-purple-400"
            style={{ fontSize: `${fontSize}px` }}
          >
            {line.chordPositions?.map((cp, idx) => {
              const transposedChord = transposeChord(cp.chord, transpose, accidentalPref);
              return (
                <span key={idx} className="absolute" style={{ left: `${cp.position}ch` }}>
                  {transposedChord}
                </span>
              );
            })}
          </div>
        </div>
      );
    }

    if (line.type === 'lyric') {
      return (
        <div key={index} className="font-mono whitespace-pre text-foreground mb-1 leading-snug" style={{ fontSize: `${fontSize}px` }}>
          {line.lyric}
        </div>
      );
    }

    if (line.type === 'both') {
      return (
        <div key={index} className="mb-3 group hover:bg-accent/10 rounded px-[-4px] -mx-1 transition-colors">
          <div className="relative" style={{ height: chordLineHeight }}>
            <div
              className="absolute bottom-[-2px] left-0 w-full whitespace-pre font-mono font-bold text-purple-700 dark:text-purple-400 z-10"
              style={{ fontSize: `${fontSize}px` }}
            >
              {line.chordPositions?.map((cp, idx) => {
                const transposedChord = transposeChord(cp.chord, transpose, accidentalPref);
                return (
                  <span key={idx} className="absolute" style={{ left: `${cp.position}ch` }}>
                    {transposedChord}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="font-mono whitespace-pre text-foreground leading-snug font-medium" style={{ fontSize: `${fontSize}px` }}>
            {line.lyric}
          </div>
        </div>
      );
    }

    return (
      <div key={index} className="text-muted-foreground italic text-xs mb-2 mt-2 font-semibold">
        {line.content}
      </div>
    );
  };

  const renderLines = (lines: ParsedLine[], offset: number) => {
    return lines.map((line, index) => renderLine(line, offset + index));
  };

  if (!song) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const currentKey = song.key
    ? transposeChord(song.key, transpose, accidentalPref)
    : null;

  return (
    <>
      <Helmet>
        <title>{getDisplayTitle(song.title)} - Cifra</title>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground flex flex-col pb-20">
        <nav className="bg-background/95 backdrop-blur border-b border-border sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-2 py-2">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => playlistId ? navigate(`/user/playlist/${playlistId}`) : navigate('/user')} 
                className="-ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {playlistName ? 'Playlist' : 'Voltar'}
              </Button>
              <div className="text-center flex-1 min-w-0">
                 <h1 className="text-sm font-bold truncate">{getDisplayTitle(song.title)}</h1>
                 <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
              </div>
              <ModeToggle />
            </div>

            {/* Controls Toolbar */}
            <div className="flex items-center justify-between gap-2 bg-secondary/30 rounded-lg p-2 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleTransposeDown}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <div className="min-w-[3rem] text-center">
                   <div className="text-[10px] text-muted-foreground uppercase font-bold">Tom</div>
                   <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                     {currentKey || '?'}
                   </div>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleTransposeUp}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>

              <div className="h-6 w-px bg-border mx-1"></div>

               <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={decreaseFont}>
                  <span className="text-xs">A-</span>
                </Button>
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={increaseFont}>
                  <Type className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="h-6 w-px bg-border mx-1"></div>

              <Button variant="ghost" size="sm" onClick={toggleAccidentalPreference} className="text-xs h-8 px-2">
                {accidentalPref === 'sharps' ? 'T#' : 'Tb'}
              </Button>

              <div className="h-6 w-px bg-border mx-1"></div>

              <Button
                variant={useTwoColumns ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUseTwoColumns(prev => !prev)}
                className={useTwoColumns ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
              >
                {useTwoColumns ? '2 Col' : '1 Col'}
              </Button>
            </div>
          </div>
        </nav>

        <div className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="select-text"
          >
            {useTwoColumns ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
                <div>{renderLines(leftLines, 0)}</div>
                <div>{renderLines(rightLines, splitIndex)}</div>
              </div>
            ) : (
              renderLines(parsedLines, 0)
            )}
          </motion.div>
        </div>

        {/* Playlist Navigation Footer */}
        {playlistId && (prevSongId || nextSongId) && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-3 z-40"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                {prevSongId && (
                  <Link to={`/user/view/${prevSongId}?playlistId=${playlistId}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <SkipBack className="w-4 h-4 mr-2" />
                      <span>Música Anterior</span>
                    </Button>
                  </Link>
                )}
                {nextSongId && (
                  <Link to={`/user/view/${nextSongId}?playlistId=${playlistId}`} className="flex-1">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg">
                      <span className="mr-2">Próxima Música</span>
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default SongViewer;





