import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Upload, FileJson, Music, AlertTriangle, FileText } from 'lucide-react';
import { getAllSongs, saveSong, clearAllData } from '@/lib/db';
import { parseChordPro, exportToChordPro, splitChordProSongs } from '@/lib/chordpro';
import { Song } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const ImportExport: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importCategory, setImportCategory] = useState<'Louvor' | 'Hino'>('Louvor');
   const normalizeSongKey = (title: string, artist: string, content: string) => (
    `${title.trim().toLowerCase()}|${artist.trim().toLowerCase()}|${content.trim().toLowerCase()}`
  );

  // Refs for hidden file inputs
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const chordProInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = async () => {
    const songs = await getAllSongs();
    const dataStr = JSON.stringify(songs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-cifras-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportação concluída',
      description: `${songs.length} músicas exportadas para JSON.`,
    });
  };

  const handleExportChordPro = async () => {
    const songs = await getAllSongs();
    let combinedContent = '';

    songs.forEach((song, index) => {
      if (index > 0) combinedContent += '\n\n---\n\n';
      combinedContent += exportToChordPro(song);
    });

    const dataBlob = new Blob([combinedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `songs-chordpro-${new Date().toISOString().split('T')[0]}.cho`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportação concluída',
      description: `${songs.length} músicas exportadas para ChordPro.`,
    });
  };

  const handleDownloadTemplate = () => {
    const templateContent = `{title: Exemplo de Música 1}
{artist: Banda Teste}
{key: C}

C              G
Esta é a primeira linha da música
Am             F
Esta é a segunda linha

---

{title: Exemplo de Música 2}
{artist: Cantor Teste}
{key: G}

G              D
Outra música começa aqui
Em             C
Separada por três traços`;

    const blob = new Blob([templateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-importacao.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Modelo baixado", description: "Use este arquivo como guia para importar suas músicas." });
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setImporting(true);
        const content = e.target?.result as string;
        const songs = JSON.parse(content) as Song[];

        for (const song of songs) {
          await saveSong(song);
        }

        toast({
          title: 'Importação concluída',
          description: `${songs.length} músicas importadas do JSON.`,
        });

      } catch (error) {
        toast({
          title: 'Falha na importação',
          description: 'Formato de arquivo JSON inválido.',
          variant: 'destructive',
        });
      } finally {
        setImporting(false);
        // Reset input so same file can be selected again if needed
        if (jsonInputRef.current) jsonInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

    const processImportChordPro = (file: File, prefix: string) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setImporting(true);
        const content = e.target?.result as string;
        const prefixLower = prefix.toLowerCase();
        
        const sections = splitChordProSongs(content);
        const existingSongs = await getAllSongs();
        const existingKeys = new Set(existingSongs.map(song => normalizeSongKey(song.title, song.artist || '', song.content)));
        
        let importedCount = 0;
        let failCount = 0;

        for (const section of sections) {
          const trimmedSection = section.trim();
          if (!trimmedSection) continue;

          const parsed = parseChordPro(trimmedSection);
          
          if (parsed.title && parsed.content) {
            try {
              const now = Date.now();
              // Create a unique ID to ensure no collisions during bulk import
                            const uniqueId = `song-${now}-${Math.random().toString(36).substr(2, 6)}`;
              const title = prefixLower && !parsed.title.toLowerCase().startsWith(prefixLower)
                ? `${prefix} ${parsed.title}`
                : parsed.title;
              const artist = parsed.artist || 'Desconhecido';
              const contentText = parsed.content;
              const dedupeKey = normalizeSongKey(title, artist, contentText);
              if (existingKeys.has(dedupeKey)) {
                continue;
              }
              existingKeys.add(dedupeKey);
              
              const song: Song = {
                id: uniqueId,
                title,
                artist,
                key: parsed.key,
                content: contentText,
                createdAt: now,
                updatedAt: now,
              };
              
              await saveSong(song);
              importedCount++;
            } catch (err) {
              console.error("Error saving song:", err);
              failCount++;
            }
          } else {
             // Failed to parse title or content
             failCount++;
          }
        }

        if (importedCount > 0) {
          toast({
            title: 'Importação concluída',
            description: `${importedCount} músicas adicionadas à biblioteca. ${failCount > 0 ? `(${failCount} falharam)` : ''}`,
          });
        } else {
          toast({
            title: 'Nenhuma música importada',
            description: 'Verifique o formato do arquivo (use o modelo).',
            variant: 'destructive',
          });
        }

      } catch (error) {
        console.error(error);
        toast({
          title: 'Falha na importação',
          description: 'Erro ao ler o arquivo.',
          variant: 'destructive',
        });
      } finally {
        setImporting(false);
        setImportFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImportChordPro = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setIsImportDialogOpen(true);
    if (chordProInputRef.current) chordProInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    if (!importFile) return;
    setIsImportDialogOpen(false);
    processImportChordPro(importFile, importCategory);
  };

  const handleClearAll = async () => {
    if (window.confirm('Tem certeza que deseja apagar TODAS as músicas? Isso não pode ser desfeito!')) {
      await clearAllData();
      toast({
        title: 'Dados apagados',
        description: 'Todas as músicas foram removidas.',
      });
    }
  };

  // Helper to trigger refs
  const triggerJsonImport = () => jsonInputRef.current?.click();
  const triggerChordProImport = () => chordProInputRef.current?.click();

  return (
    <>
      <Helmet>
        <title>Importar/Exportar - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <nav className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-sm font-bold">Backup e Dados</h1>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          
          {/* Hidden Inputs */}
          <input 
            type="file" 
            accept=".json" 
            ref={jsonInputRef}
            onChange={handleImportJSON} 
            disabled={importing} 
            className="hidden" 
          />
          <input 
            type="file" 
            accept=".cho,.txt" 
            ref={chordProInputRef}
            onChange={handleImportChordPro} 
            disabled={importing} 
            className="hidden" 
          />

          {/* Export Section */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-600" />
              Exportar
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
               <div className="p-4 rounded-lg border border-border bg-card hover:border-purple-500/50 transition-colors">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-blue-500" /> JSON
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Backup completo para restaurar neste app.</p>
                  <Button onClick={handleExportJSON} variant="outline" size="sm" className="w-full">
                    Baixar JSON
                  </Button>
               </div>
               <div className="p-4 rounded-lg border border-border bg-card hover:border-purple-500/50 transition-colors">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Music className="w-4 h-4 text-green-500" /> ChordPro
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Formato compatível com outros apps de música.</p>
                  <Button onClick={handleExportChordPro} variant="outline" size="sm" className="w-full">
                    Baixar ChordPro
                  </Button>
               </div>
            </div>
          </section>

          {/* Import Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                Importar
              </h2>
              <Button variant="ghost" size="sm" onClick={handleDownloadTemplate} className="text-xs h-8">
                 <FileText className="w-3 h-3 mr-2" />
                 Baixar Modelo (.txt)
              </Button>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
               <div className="p-4 rounded-lg border border-border bg-card">
                  <h3 className="font-semibold mb-2">Arquivo JSON</h3>
                  <p className="text-xs text-muted-foreground mb-4">Restaure um backup anterior.</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full" 
                    disabled={importing}
                    onClick={triggerJsonImport}
                  >
                    {importing ? 'Importando...' : 'Selecionar JSON'}
                  </Button>
               </div>
               <div className="p-4 rounded-lg border border-border bg-card">
                  <h3 className="font-semibold mb-2">Lista de Músicas (.txt/.cho)</h3>
                  <p className="text-xs text-muted-foreground mb-4">Importe várias músicas separadas por "---".</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full" 
                    disabled={importing}
                    onClick={triggerChordProImport}
                  >
                    {importing ? 'Importando...' : 'Selecionar .cho/.txt'}
                  </Button>
               </div>
            </div>
          </section>
          <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
            setIsImportDialogOpen(open);
            if (!open) setImportFile(null);
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Selecionar categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Escolha a categoria para prefixar os titulos importados.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={importCategory === 'Louvor' ? 'default' : 'outline'}
                    onClick={() => setImportCategory('Louvor')}
                    className="flex-1"
                  >
                    Louvor
                  </Button>
                  <Button
                    type="button"
                    variant={importCategory === 'Hino' ? 'default' : 'outline'}
                    onClick={() => setImportCategory('Hino')}
                    className="flex-1"
                  >
                    Hino
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmImport}>
                  Importar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Danger Zone */}
          <section className="pt-6 border-t border-border mt-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Zona de Perigo
            </h2>
            <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <p className="text-sm text-muted-foreground mb-4">
                Esta ação apagará permanentemente todas as músicas do banco de dados local.
              </p>
              <Button onClick={handleClearAll} variant="destructive" size="sm">
                Apagar Tudo
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default ImportExport;




