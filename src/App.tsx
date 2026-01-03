
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import PinProtection from '@/components/PinProtection';
import UserHome from '@/pages/user/UserHome';
import PlaylistDetail from '@/pages/user/PlaylistDetail';
import SongViewer from '@/pages/user/SongViewer';
import AdminHome from '@/pages/admin/AdminHome';
import SongEditor from '@/pages/admin/SongEditor';
import ImportExport from '@/pages/admin/ImportExport';
import Settings from '@/pages/admin/Settings';
import { initDB } from '@/lib/db';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';

function App() {
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
      } catch (error) {
        console.error("Failed to initialize DB:", error);
      }
    };
    initialize();
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="chord-manager-theme">
      <Helmet>
        <title>Gerenciador de Cifras - App Offline</title>
        <meta name="description" content="Gerencie, visualize e transponha cifras e letras offline." />
      </Helmet>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<UserHome />} />
            <Route path="/user" element={<UserHome />} />
            <Route path="/user/playlist/:id" element={<PlaylistDetail />} />
            <Route path="/user/view/:id" element={<SongViewer />} />
            <Route path="/admin" element={<PinProtection><AdminHome /></PinProtection>} />
            <Route path="/admin/new" element={<PinProtection><SongEditor /></PinProtection>} />
            <Route path="/admin/edit/:id" element={<PinProtection><SongEditor /></PinProtection>} />
            <Route path="/admin/import" element={<PinProtection><ImportExport /></PinProtection>} />
            <Route path="/admin/settings" element={<PinProtection><Settings /></PinProtection>} />
          </Routes>
        </Router>
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
