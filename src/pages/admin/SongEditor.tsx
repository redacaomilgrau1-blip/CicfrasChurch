
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { getSong, saveSong } from '@/lib/db';
import { parseContent } from '@/lib/chordParser';
import { Song } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const SongEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [content, setContent] = useState('');
  const isEditing = !!id;

  useEffect(() => {
    if (id) {
      loadSong(id);
    }
  }, [id]);

  const loadSong = async (songId: string) => {
    const song = await getSong(songId);
    if (song) {
      setTitle(song.title);
      setArtist(song.artist || '');
      setKey(song.key || '');
      setContent(song.content);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira o título da música.',
        variant: 'destructive',
      });
      return;
    }

    const now = Date.now();
    const song: Song = {
      id: id || `song-${now}`,
      title: title.trim(),
      artist: artist.trim() || undefined,
      key: key.trim() || undefined,
      content: content.trim(),
      createdAt: id ? (await getSong(id))?.createdAt || now : now,
      updatedAt: now,
    };

    await saveSong(song);

    toast({
      title: isEditing ? 'Música atualizada' : 'Música criada',
      description: `"${song.title}" foi salva com sucesso.`,
    });

    navigate('/admin');
  };

  const renderPreview = () => {
    if (!content.trim()) return null;

    const lines = parseContent(content);
    const fontSize = 14;
    const chordLineHeight = `${fontSize * 1.2}px`;

    return lines.map((line, index) => {
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
              {line.chordPositions?.map((cp, idx) => (
                <span key={idx} className="absolute" style={{ left: `${cp.position}ch` }}>
                  {cp.chord}
                </span>
              ))}
            </div>
          </div>
        );
      }

      if (line.type === 'lyric') {
        return (
          <div key={index} className="font-sans text-foreground mb-1 leading-snug" style={{ fontSize: `${fontSize}px` }}>
            {line.lyric}
          </div>
        );
      }

      if (line.type === 'both') {
        return (
          <div key={index} className="mb-3 rounded px-[-4px] -mx-1">
            <div className="relative" style={{ height: chordLineHeight }}>
              <div
                className="absolute bottom-[-2px] left-0 w-full whitespace-pre font-mono font-bold text-purple-700 dark:text-purple-400 z-10"
                style={{ fontSize: `${fontSize}px` }}
              >
                {line.chordPositions?.map((cp, idx) => (
                  <span key={idx} className="absolute" style={{ left: `${cp.position}ch` }}>
                    {cp.chord}
                  </span>
                ))}
              </div>
            </div>
            <div className="font-sans text-foreground leading-snug font-medium" style={{ fontSize: `${fontSize}px` }}>
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
    });
  };

  return (
    <>
      <Helmet>
        <title>{isEditing ? 'Editar Música' : 'Nova Música'} - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <nav className="border-b border-border bg-card sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <h1 className="text-sm font-bold truncate">
              {isEditing ? 'Editar' : 'Nova Música'}
            </h1>
            <Button onClick={handleSave} size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Amazing Grace"
                className="w-full px-3 py-2 bg-card border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Artista
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Ex: John Newton"
                  className="w-full px-3 py-2 bg-card border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Tom (Original)
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Ex: G, Am"
                  className="w-full px-3 py-2 bg-card border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Cifra e Letra
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite a cifra aqui..."
                rows={15}
                className="w-full px-3 py-2 bg-card border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm leading-relaxed"
              />
            </div>

            <div className="bg-card/70 rounded-lg p-3 border border-border">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                Previa de visualizacao
              </div>
              <div className="text-foreground">
                {renderPreview()}
              </div>
            </div>


            <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground border border-border">
              <h3 className="font-semibold mb-1">Dicas de Formatação:</h3>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Coloque os acordes em uma linha separada acima da letra.</li>
                <li>Os acordes são detectados automaticamente (ex: C, G, Am, D7).</li>
                <li>Deixe linhas em branco para separar estrofes.</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SongEditor;
