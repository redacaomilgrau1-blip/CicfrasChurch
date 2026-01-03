
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Reorder } from 'framer-motion';
import { ArrowLeft, GripVertical, Trash2, Plus, Music, AlertCircle, Loader2 } from 'lucide-react';
import { getPlaylist, getPlaylistItems, addSongToPlaylist, removePlaylistItem, updatePlaylistOrder, deletePlaylist } from '@/lib/playlistService';
import { getAllSongs } from '@/lib/db';
import { getDisplayTitle } from '@/lib/songTitle';
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

  const filteredAddSongs = allSongs
    .filter(s => !items.some(i => i.song_id === s.id))
    .filter(s => s.title.toLowerCase().includes(searchSong.toLowerCase()));

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
                  <DialogTitle>Adicionar à Playlist</DialogTitle>
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
        </div>
      </div>
    </>
  );
};

export default PlaylistDetail;








