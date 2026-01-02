import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Upload, Settings, ArrowLeft, Music, ChevronUp } from 'lucide-react';
import { getAllSongs, deleteSong } from '@/lib/db';
import { getDisplayTitle } from '@/lib/songTitle';
import { Song } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ModeToggle } from '@/components/mode-toggle';

const AdminHome: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadSongs();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadSongs = async () => {
    const allSongs = await getAllSongs();
    setSongs(allSongs.sort((a, b) => a.title.localeCompare(b.title)));
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${title}"?`)) {
      await deleteSong(id);
      toast({
        title: 'Música excluída',
        description: `"${title}" foi removida com sucesso.`,
      });
      loadSongs();
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleSongs = normalizedQuery
    ? songs.filter(song =>
        song.title.toLowerCase().includes(normalizedQuery) ||
        (song.artist || '').toLowerCase().includes(normalizedQuery)
      )
    : songs;

  const isHinario = (title: string) => {
    const normalized = title.trim().toLowerCase();
    return normalized.startsWith('hino') || normalized.startsWith('hinos');
  };


  const hinarioSongs = visibleSongs.filter(song => isHinario(song.title));
  const louvorSongs = visibleSongs.filter(song => !isHinario(song.title));

  return (
    <>
      <Helmet>
        <title>Admin - Gerenciador</title>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <nav className="border-b border-border bg-card">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-lg">Cifras Church Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <ModeToggle />
                <Button variant="outline" size="sm" onClick={() => navigate('/user')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <Link to="/admin/new">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Música
                </Button>
              </Link>
              <Link to="/admin/import">
                <Button variant="secondary" size="sm" className="whitespace-nowrap">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar/Exportar
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button variant="secondary" size="sm" className="whitespace-nowrap">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Biblioteca</h2>
            <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded-full">{visibleSongs.length} músicas</span>
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por título ou artista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md px-4 py-2 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          {visibleSongs.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground mb-4">Nenhuma música cadastrada</p>
              <Link to="/admin/new">
                <Button>Adicionar Primeira Música</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                {hinarioSongs.map((song, index) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="bg-card rounded-lg p-3 border border-border hover:border-purple-500/50 transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1 mr-4">
                      <h3 className="font-semibold truncate">{getDisplayTitle(song.title)}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{song.artist || 'Sem artista'}</span>
                        {song.key && <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px]">Tom: {song.key}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Link to={`/admin/edit/${song.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(song.id, song.title)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-2">
                {louvorSongs.map((song, index) => (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="bg-card rounded-lg p-3 border border-border hover:border-purple-500/50 transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1 mr-4">
                      <h3 className="font-semibold truncate">{getDisplayTitle(song.title)}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{song.artist || 'Sem artista'}</span>
                        {song.key && <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px]">Tom: {song.key}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Link to={`/admin/edit/${song.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(song.id, song.title)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

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

export default AdminHome;