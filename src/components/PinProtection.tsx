
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { storeAdminPin, verifyAdminPin } from '@/lib/adminApi';

interface PinProtectionProps {
  children: React.ReactNode;
}

const PinProtection: React.FC<PinProtectionProps> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    verifyAdminPin(pin)
      .then((ok) => {
        if (ok) {
          storeAdminPin(pin);
          setIsUnlocked(true);
          setError('');
        } else {
          setError('PIN incorreto. Tente novamente.');
          setPin('');
        }
      })
      .catch(() => {
        setError('Falha ao validar PIN. Tente novamente.');
      })
      .finally(() => setIsLoading(false));
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl shadow-lg p-6 w-full max-w-sm"
      >
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full">
            <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">Área Administrativa</h2>
            <p className="text-sm text-muted-foreground mt-1">Digite o PIN para continuar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Digite o PIN"
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-center text-lg tracking-widest text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            {error && (
              <p className="text-destructive text-xs mt-2 text-center font-medium">{error}</p>
            )}
          </div>

          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
            Desbloquear
          </Button>
          
          <Link to="/">
             <Button variant="ghost" className="w-full text-xs text-muted-foreground mt-2 hover:bg-transparent hover:text-foreground">
               Voltar para Início
             </Button>
          </Link>
        </form>
      </motion.div>
    </div>
  );
};

export default PinProtection;
