
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Reorder } from 'framer-motion';
import { ArrowLeft, GripVertical, Trash2, Plus, Music, AlertCircle, Loader2, Download } from 'lucide-react';
import { getPlaylist, getPlaylistItems, addSongToPlaylist, removePlaylistItem, updatePlaylistOrder, deletePlaylist } from '@/lib/playlistService';
import { getAllSongs } from '@/lib/db';
import { getDisplayTitle } from '@/lib/songTitle';
import { parseContent, ParsedLine } from '@/lib/chordParser';
import { Playlist, PlaylistItem, Song } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const PlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSong, setSearchSong] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (playlistId: string) => {
    setLoading(true);
    try {
      // 1. Fetch playlist metadata
      const pData = await getPlaylist(playlistId);
      if (!pData) {
        toast({ title: "Playlist não encontrada", variant: "destructive" });
        navigate('/user');
        return;
      }
      setPlaylist(pData);

      // 2. Fetch Items from Supabase
      const pItems = await getPlaylistItems(playlistId);
      
      // 3. Fetch Local Songs to join
      const localSongs = await getAllSongs();
      setAllSongs(localSongs);

      // 4. Join data (match song_id from Supabase with local IndexedDB data)
      const joinedItems = pItems.map(item => ({
        ...item,
        song: localSongs.find(s => s.id === item.song_id)
      }));

      setItems(joinedItems);
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao carregar playlist", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (newOrder: PlaylistItem[]) => {
    setItems(newOrder);
    // Persist new order to Supabase
    updatePlaylistOrder(newOrder);
  };

  const handleRemoveItem = async (itemId: string) => {
    const success = await removePlaylistItem(itemId);
    if (success) {
      setItems(prev => prev.filter(i => i.id !== itemId));
    } else {
      toast({ title: "Erro ao remover música", variant: "destructive" });
    }
  };

  const handleAddSong = async (songId: string) => {
    if (!id) return;
    const songData = allSongs.find(s => s.id === songId);
    const newItem = await addSongToPlaylist(id, songId, songData);
    if (newItem) {
      // Optimistically update list
      setItems(current => [...current, { ...newItem, song: songData }]);
      toast({ title: "Música adicionada" });
      setIsAddOpen(false);
    } else {
      toast({ title: "Erro ao adicionar", description: "Verifique sua conexão.", variant: "destructive" });
    }
  };

  const handleDeletePlaylist = async () => {
    if (!id || !playlist) return;
    if (window.confirm(`Tem certeza que deseja apagar a playlist "${playlist.name}"?`)) {
      const success = await deletePlaylist(id);
      if (success) {
        navigate('/user');
        toast({ title: "Playlist excluída" });
      } else {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      }
    }
  };

  const handleExportPdf = () => {
    if (!playlist) return;
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      toast({ title: "Nao foi possivel abrir a janela de impressao", variant: "destructive" });
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const fontSize = 22;

    const renderLine = (line: ParsedLine, fontSize: number) => {
      const chordLineHeight = `${fontSize * 1.2}px`;
      if (line.type === 'empty') {
        return '<div class="line empty"></div>';
      }

      if (line.type === 'chord') {
        const chords = (line.chordPositions || [])
          .map(cp => `<span class="chord" style="left:${cp.position}ch">${escapeHtml(cp.chord)}</span>`)
          .join('');
        return `<div class="line chord-line" style="height:${chordLineHeight}"><div class="chords" style="font-size:${fontSize}px">${chords}</div></div>`;
      }

      if (line.type === 'lyric') {
        return `<div class="line lyric" style="font-size:${fontSize}px">${escapeHtml(line.lyric)}</div>`;
      }

      if (line.type === 'both') {
        const chords = (line.chordPositions || [])
          .map(cp => `<span class="chord" style="left:${cp.position}ch">${escapeHtml(cp.chord)}</span>`)
          .join('');
        return `
          <div class="line both">
            <div class="chords" style="height:${chordLineHeight}">
              <div class="chord-layer" style="font-size:${fontSize}px">${chords}</div>
            </div>
            <div class="lyric" style="font-size:${fontSize}px">${escapeHtml(line.lyric)}</div>
          </div>
        `;
      }

      return `<div class="line directive">${escapeHtml(line.content)}</div>`;
    };

    const pages = items.length
      ? items.map((item, index) => {
          if (!item.song) {
            return `
              <section class="page">
                <h1>${escapeHtml(playlist.name)}</h1>
                <div class="meta">Item ${index + 1}</div>
                <div class="missing">Musica nao encontrada (ID: ${escapeHtml(item.song_id)})</div>
              </section>
            `;
          }

          const songTitle = escapeHtml(getDisplayTitle(item.song.title));
          const artist = escapeHtml(item.song.artist || '');
          const parsed = parseContent(item.song.content || '');
          const contentHtml = parsed.map(line => renderLine(line, fontSize)).join('');
          return `
            <section class="page">
              <div class="song-header">
                <h1>${songTitle}</h1>
                ${artist ? `<div class="artist">${artist}</div>` : ''}
              </div>
              <div class="content">
                ${contentHtml || '<div class="empty">Cifra vazia</div>'}
              </div>
            </section>
          `;
        }).join('')
      : `
          <section class="page">
            <h1>${escapeHtml(playlist.name)}</h1>
            <div class="empty">Playlist vazia</div>
          </section>
        `;

    const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(playlist.name)} - PDF</title>
    <style>
      :root {
        --bg: #ffffff;
        --text: #111827;
        --muted: #6b7280;
        --border: #e5e7eb;
        --chord: #7e22ce;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #0f0f12;
          --text: #f5f5f5;
          --muted: #a1a1aa;
          --border: #2b2b2f;
          --chord: #c084fc;
        }
      }
      * { box-sizing: border-box; }
      body {
        font-family: "Segoe UI", Arial, sans-serif;
        background: var(--bg);
        color: var(--text);
        margin: 0;
      }
      @page { size: A4 portrait; margin: 14mm; }
      h1 { margin: 0 0 6px; font-size: 24px; }
      .page {
        min-height: 100vh;
        padding: 18px 20px;
        border-bottom: 1px solid var(--border);
      }
      .page:last-child { border-bottom: none; }
      .song-header { margin-bottom: 16px; }
      .artist { color: var(--muted); font-size: 12px; }
      .meta { color: var(--muted); font-size: 12px; margin-bottom: 18px; }
      .content { font-family: "Consolas", "Courier New", monospace; }
      .line { margin: 0; white-space: pre; }
      .line.empty { height: 12px; }
      .lyric { color: var(--text); line-height: 1.25; }
      .chord-line, .chords { position: relative; }
      .chord-layer, .chords {
        position: relative;
        font-weight: 700;
        color: var(--chord);
        white-space: pre;
      }
      .chord { position: absolute; top: 0; }
      .both { margin-bottom: 6px; }
      .directive { color: var(--muted); font-size: 12px; font-style: italic; margin: 8px 0; }
      .missing { color: #b91c1c; font-weight: 600; }
      .empty { color: var(--muted); font-style: italic; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page { page-break-after: always; break-after: page; border-bottom: none; }
        .page:last-child { page-break-after: auto; break-after: auto; }
      }
    </style>
  </head>
  <body>
    ${pages}
  </body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 200);
  };

  const filteredAddSongs = allSongs
    .filter(s => !items.some(i => i.song_id === s.id))
    .filter(s => s.title.toLowerCase().includes(searchSong.toLowerCase()));
  const firstPlayableSong = items.find(item => item.song)?.song;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        <span>Carregando playlist...</span>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{playlist?.name || 'Playlist'} - Detalhes</title>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground pb-20">
        <nav className="border-b border-border bg-card sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/user')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold truncate max-w-[200px] sm:max-w-md">
                {playlist?.name}
              </h1>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-destructive hover:bg-destructive/10"
              onClick={handleDeletePlaylist}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          
          {/* Actions Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Música
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Adicionar  Playlist</DialogTitle>
                </DialogHeader>
                <Input 
                  placeholder="Buscar na biblioteca..." 
                  value={searchSong} 
                  onChange={e => setSearchSong(e.target.value)}
                  className="mb-2"
                />
                <div className="overflow-y-auto flex-1 border rounded-md p-1 min-h-[200px]">
                  {filteredAddSongs.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground p-8">
                      {searchSong ? "Nenhuma música encontrada." : "Todas as suas músicas já estão na playlist."}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filteredAddSongs.map(song => (
                        <div 
                          key={song.id} 
                          className="flex items-center justify-between p-3 hover:bg-accent rounded-md cursor-pointer transition-colors" 
                          onClick={() => handleAddSong(song.id)}
                        >
                          <div className="overflow-hidden">
                            <div className="font-semibold text-sm truncate">{getDisplayTitle(song.title)}</div>
                            <div className="text-xs text-muted-foreground truncate">{song.artist}</div>
                          </div>
                          <Plus className="w-4 h-4 text-purple-600 flex-shrink-0 ml-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleExportPdf}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          {/* List */}
          {items.length === 0 ? (
            <div className="text-center py-12 bg-card/50 rounded-xl border border-dashed flex flex-col items-center">
              <Music className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground font-medium">Esta playlist está vazia.</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Adicione músicas da biblioteca para preencher a playlist.
              </p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2">
              {items.map((item) => (
                <Reorder.Item key={item.id} value={item}>
                  <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow select-none group">
                    <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {item.song ? (
                        <Link to={`/user/view/${item.song.id}?playlistId=${id}`} className="block">
                           <div className="font-semibold text-sm truncate group-hover:text-purple-600 transition-colors">
                             {getDisplayTitle(item.song.title)}
                           </div>
                           <div className="text-xs text-muted-foreground truncate">
                             {item.song.artist}
                           </div>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2 text-destructive text-sm opacity-70">
                           <AlertCircle className="w-4 h-4" />
                           <span>Música não encontrada (ID: {item.song_id})</span>
                        </div>
                      )}
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}

          {firstPlayableSong && (
            <div className="fixed bottom-4 left-1/2 w-full max-w-3xl -translate-x-1/2 px-4">
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate(`/user/view/${firstPlayableSong.id}?playlistId=${id}`)}
              >
                Comecar louvor
              </Button>
            </div>
          )}</div>
      </div>
    </>
  );
};

export default PlaylistDetail;








