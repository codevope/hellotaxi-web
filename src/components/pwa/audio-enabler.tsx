'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioEnablerProps {
  onEnable: () => Promise<boolean>;
  isEnabled: boolean;
}

export function AudioEnabler({ onEnable, isEnabled }: AudioEnablerProps) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verificar si ya fue descartado en esta sesión
    const wasDismissedThisSession = sessionStorage.getItem('audio-enabler-dismissed');
    
    if (wasDismissedThisSession === 'true') {
      setDismissed(true);
      return;
    }

    // Mostrar después de 2 segundos si no está habilitado
    if (!isEnabled && !dismissed) {
      const timer = setTimeout(() => {
        setShow(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isEnabled, dismissed]);

  // Ocultar cuando se habilita
  useEffect(() => {
    if (isEnabled && show) {
      setShow(false);
    }
  }, [isEnabled, show]);

  const handleEnable = async () => {
    const enabled = await onEnable();
    if (enabled) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('audio-enabler-dismissed', 'true');
  };

  if (!show || isEnabled || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
      >
        <div className="bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] rounded-lg shadow-2xl p-4 border border-white/20">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Volume2 className="h-5 w-5 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">
                🔊 Activa el Sonido
              </h3>
              <p className="text-sm text-white/90 mb-3">
                Habilita los sonidos para recibir alertas de audio cuando cambien el estado de tu viaje o lleguen nuevas solicitudes
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleEnable}
                  className="bg-white text-[#2E4CA6] hover:bg-white/90 font-semibold flex-1"
                  size="sm"
                >
                  Activar Sonido
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  size="sm"
                >
                  Ahora no
                </Button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
