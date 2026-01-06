
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Music, Settings, Filter, Calendar, Type, ListMusic, Plus, Trash2, ChevronUp } from 'lucide-react';
import { getAllSongs, getRecentSongs } from '@/lib/db';
import { createPlaylist, getPlaylists, deletePlaylist } from '@/lib/playlistService';
import { sortSongs } from '@/lib/search';
import { getDisplayTitle } from '@/lib/songTitle';
import { Song, Playlist } from '@/types';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from '@/components/ui/use-toast';

const UserHome: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Data State
  const [songs, setSongs] = useState<Song[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [sortOrder, setSortOrder] = useState<'title' | 'created'>('title');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    let result = normalizedQuery
      ? songs.filter(song =>
          song.title.toLowerCase().includes(normalizedQuery) ||
          (song.artist || '').toLowerCase().includes(normalizedQuery)
        )
      : songs;
    result = sortSongs(result, sortOrder);
    setFilteredSongs(result);
    setCurrentPage(1);
  }, [songs, searchQuery, sortOrder]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadData = async () => {
    const allSongs = await getAllSongs();
    const recent = await getRecentSongs();
    const allPlaylists = await getPlaylists();
    
    setSongs(allSongs);
    setRecentSongs(recent);
    setPlaylists(allPlaylists);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    const playlist = await createPlaylist(newPlaylistName.trim());
    if (playlist) {
      setPlaylists([playlist, ...playlists]);
      setNewPlaylistName('');
      setIsDialogOpen(false);
      toast({ title: "Playlist criada", description: `"${playlist.name}" foi criada.` });
    } else {
      toast({ title: "Erro", description: "Não foi possível criar a playlist.", variant: "destructive" });
    }
  };

  const handleDeletePlaylist = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`Tem certeza que deseja apagar a playlist "${name}"?`)) {
      const success = await deletePlaylist(id);
      if (success) {
        setPlaylists(playlists.filter(p => p.id !== id));
        toast({ title: "Playlist removida" });
      }
    }
  };

  const isHinario = (title: string) => {
    const normalized = title.trim().toLowerCase();
    return normalized.startsWith('hino') || normalized.startsWith('hinos');
  };
  const hinarioAll = filteredSongs.filter(song => isHinario(song.title));
  const louvorAll = filteredSongs.filter(song => !isHinario(song.title));

const totalPages = Math.max(
  1,
  Math.ceil(Math.max(hinarioAll.length, louvorAll.length) / pageSize)
);
const safePage = Math.min(currentPage, totalPages);
const pageStart = (safePage - 1) * pageSize;
const pageEnd = pageStart + pageSize;

  const hinarioSongs = hinarioAll.slice(pageStart, pageEnd);
  const louvorSongs = louvorAll.slice(pageStart, pageEnd);



  return (
    <>
      <Helmet>
        <title>Biblioteca - Gerenciador de Cifras</title>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-purple-600 rounded-lg p-1.5">
                <Music className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight hidden sm:inline-block">Cifras Church</span>
            </div>
            
            <div className="flex items-center gap-2">
              <ModeToggle />
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">
          <Tabs defaultValue="library" className="space-y-6">
            <div className="flex items-center justify-center">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="library">Biblioteca</TabsTrigger>
                <TabsTrigger value="playlists">Playlists</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="library" className="space-y-8">
              {/* Search Section */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por título, artista ou letra..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-card border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base transition-all"
                />
              </div>

              {/* Recent Songs */}
              {!searchQuery && recentSongs.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3 text-purple-600 dark:text-purple-400">
                    <Clock className="w-4 h-4" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">Acessados Recentemente</h2>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 snap-x -mx-4 px-4 scrollbar-hide">
                    {recentSongs.map((song) => (
                      <Link key={song.id} to={`/user/view/${song.id}`} className="snap-start flex-shrink-0">
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          className="bg-card border border-border rounded-lg p-3 w-40 h-32 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-purple-500/50 transition-all"
                        >
                          <div className="line-clamp-2 font-semibold text-sm leading-tight text-card-foreground">
                            {getDisplayTitle(song.title)}
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground truncate mb-1">
                              {song.artist || 'Artista desconhecido'}
                            </div>
                            {song.key && (
                              <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">
                                Tom: {song.key}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* All Songs Gallery */}
              <section>
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <Music className="w-4 h-4" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">
                      {searchQuery ? 'Resultados da Busca' : 'Todas as Músicas'}
                      <span className="ml-2 text-muted-foreground font-normal normal-case">({filteredSongs.length})</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Por página</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="h-8 rounded-md border border-input bg-card px-2 text-xs"
                      >
                        {[10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                          <Filter className="w-3.5 h-3.5" />
                          {sortOrder === 'title' ? 'A-Z' : 'Data'}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSortOrder('title')}>
                          <Type className="w-4 h-4 mr-2" />
                          Ordem Alfab?tica
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOrder('created')}>
                          <Calendar className="w-4 h-4 mr-2" />
                          Data de Importa??o
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {filteredSongs.length === 0 ? (
                  <div className="text-center py-12 bg-card/50 rounded-xl border border-border border-dashed">
                    <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground text-sm">
                      {searchQuery ? 'Nenhuma música encontrada' : 'Nenhuma música cadastrada'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      {hinarioSongs.length === 0 ? (
                        <div className="text-center py-10 bg-card/50 rounded-xl border border-border border-dashed">
                          <p className="text-muted-foreground text-sm">Nenhum hino encontrado</p>
                        </div>
                      ) : (
                        <div className="bg-card/50 border border-border rounded-2xl p-3">
                          <div className="flex flex-col gap-2">
                            {hinarioSongs.map((song, index) => (
                              <motion.div
                                key={song.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                              >
                                <Link to={`/user/view/${song.id}`}>
                                  <div className="bg-card hover:bg-accent/50 rounded-lg p-4 border border-border hover:border-purple-500/30 transition-all group">
                                    <div className="flex justify-between items-start gap-2">
                                      <div>
                                        <h3 className="font-bold text-card-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                                          {getDisplayTitle(song.title)}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                          {song.artist || 'Artista desconhecido'}
                                        </p>
                                      </div>
                                      {song.key && (
                                        <span className="flex-shrink-0 text-xs font-mono bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                          {song.key}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      {louvorSongs.length === 0 ? (
                        <div className="text-center py-10 bg-card/50 rounded-xl border border-border border-dashed">
                          <p className="text-muted-foreground text-sm">Nenhum louvor encontrado</p>
                        </div>
                      ) : (
                        <div className="bg-card/50 border border-border rounded-2xl p-3">
                          <div className="flex flex-col gap-2">
                            {louvorSongs.map((song, index) => (
                              <motion.div
                                key={song.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                              >
                                <Link to={`/user/view/${song.id}`}>
                                  <div className="bg-card hover:bg-accent/50 rounded-lg p-4 border border-border hover:border-purple-500/30 transition-all group">
                                    <div className="flex justify-between items-start gap-2">
                                      <div>
                                        <h3 className="font-bold text-card-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                                          {getDisplayTitle(song.title)}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                          {song.artist || 'Artista desconhecido'}
                                        </p>
                                      </div>
                                      {song.key && (
                                        <span className="flex-shrink-0 text-xs font-mono bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                          {song.key}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={safePage <= 1}
                  >
                    Anterior
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    Página {safePage} de {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={safePage >= totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="playlists" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-purple-600" />
                  Minhas Playlists
                </h2>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Playlist
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Playlist</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        placeholder="Nome da playlist (ex: Culto Domingo)"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}>Criar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {playlists.length === 0 ? (
                <div className="text-center py-16 bg-card/50 rounded-xl border border-border border-dashed">
                  <ListMusic className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground mb-4">Nenhuma playlist criada ainda.</p>
                  <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                    Criar Primeira Playlist
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {playlists.map((playlist) => (
                    <Link to={`/user/playlist/${playlist.id}`} key={playlist.id}>
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-purple-500/50 transition-all group relative"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                              <ListMusic className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{playlist.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                Criada em {new Date(playlist.created_at || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 z-10"
                            onClick={(e) => handleDeletePlaylist(e, playlist.id, playlist.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        {showBackToTop && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="fixed bottom-6 right-6 rounded-full shadow-lg border border-border"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Voltar ao topo"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
        )}
      </div>
    </>
  );
};

export default UserHome;
