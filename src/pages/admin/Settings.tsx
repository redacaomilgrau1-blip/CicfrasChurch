import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { setAdminPin, storeAdminPin } from '@/lib/adminApi';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPin, setCurrentPin] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleSave = async () => {
    if (!currentPin.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe o PIN atual.',
        variant: 'destructive',
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: 'Erro',
        description: 'Os PINs nÇœo coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (pin.length < 4) {
      toast({
        title: 'Erro',
        description: 'O PIN deve ter no mÇðnimo 4 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const ok = await setAdminPin(currentPin.trim(), pin.trim());
      if (!ok) {
        throw new Error('Falha ao atualizar PIN');
      }
      storeAdminPin(pin.trim());
      toast({
        title: 'ConfiguraÇõÇæes salvas',
        description: 'Seu PIN de administrador foi atualizado.',
      });
      setCurrentPin('');
      setPin('');
      setConfirmPin('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar o PIN. Verifique o PIN atual.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>ConfiguraÇõÇæes - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <nav className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-sm font-bold">ConfiguraÇõÇæes</h1>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <section className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold">SeguranÇõa</h2>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    PIN Atual
                  </label>
                  <input
                    type="password"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="Digite o PIN atual"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Novo PIN
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Digite o novo PIN"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Confirmar PIN
                  </label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Confirme o novo PIN"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="pt-2">
                  <Button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-700">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar AlteraÇõÇæes
                  </Button>
                </div>
              </div>
            </section>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Settings;
