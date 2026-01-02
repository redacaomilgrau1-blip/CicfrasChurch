
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music, Lock, BookOpen, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <div className="bg-purple-600/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-purple-500/30">
          <Music className="w-10 h-10 text-purple-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Chord Manager
        </h1>
        <p className="text-lg text-slate-300">
          Your offline-first companion for chords, lyrics, and setlists.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 hover:border-purple-500/50 transition-colors group"
        >
          <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
            <BookOpen className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Song Library</h2>
          <p className="text-slate-400 mb-6">
            Browse songs, transpose chords instantly, and view lyrics with perfect alignment.
          </p>
          <Link to="/user">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
              Open Library
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 hover:border-purple-500/50 transition-colors group"
        >
          <div className="bg-purple-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
            <Lock className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Area</h2>
          <p className="text-slate-400 mb-6">
            Manage your catalog, edit songs, import/export data, and configure settings.
          </p>
          <Link to="/admin">
            <Button variant="outline" className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-900/50 hover:text-white h-12 text-lg">
              Admin Access
            </Button>
          </Link>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 text-slate-500 text-sm flex items-center gap-6"
      >
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500"></div>
           Offline Ready
        </div>
        <div className="flex items-center gap-2">
           <Mic2 className="w-4 h-4" />
           Lyrics & Chords
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
