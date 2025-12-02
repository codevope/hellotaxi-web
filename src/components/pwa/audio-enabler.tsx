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
        className="fixed top-4 sm:top-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 sm:max-w-md sm:w-full"
      >
        <div className="bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] rounded-lg shadow-2xl p-3 sm:p-4 border border-white/20">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="bg-white/20 p-1.5 sm:p-2 rounded-full shrink-0">
              <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm sm:text-base mb-0.5 sm:mb-1">
                🔊 Activa el Sonido
              </h3>
              <p className="text-xs sm:text-sm text-white/90 mb-2 sm:mb-3 leading-tight">
                Habilita los sonidos para recibir alertas de audio cuando cambien el estado de tu viaje o lleguen nuevas solicitudes
              </p>
              
              <div className="flex flex-col xs:flex-row gap-2">
                <Button
                  onClick={handleEnable}
                  className="bg-white text-[#2E4CA6] hover:bg-white/90 font-semibold flex-1 text-xs sm:text-sm h-8 sm:h-9"
                  size="sm"
                >
                  Activar Sonido
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  className="text-white hover:bg-white/20 text-xs sm:text-sm h-8 sm:h-9"
                  size="sm"
                >
                  Ahora no
                </Button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white transition-colors shrink-0 -mt-1 -mr-1"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
