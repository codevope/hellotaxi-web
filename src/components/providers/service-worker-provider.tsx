"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function ServiceWorkerProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado exitosamente:', registration);
          
          // Verificar actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast({
                    title: 'Nueva versión disponible',
                    description: 'Recarga la página para obtener la última versión.',
                    duration: 5000,
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('Error al registrar el Service Worker:', error);
        });
    }

    // Manejar evento de instalación PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Detectar si ya está instalada
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast({
        title: '¡HelloTaxi instalada!',
        description: 'La aplicación se ha instalado correctamente.',
        duration: 3000,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Mostrar prompt de instalación después de un tiempo
    const showInstallPrompt = setTimeout(() => {
      if (isInstallable && deferredPrompt) {
        toast({
          title: 'Instalar HelloTaxi',
          description: '¿Quieres instalar la app para un acceso más rápido?',
          duration: 8000,
        });
      }
    }, 30000); // 30 segundos

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(showInstallPrompt);
    };
  }, [isInstallable, deferredPrompt, toast]);

  // Función para instalar la PWA (puedes exportarla si necesitas usarla en otros componentes)
  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Usuario aceptó instalar la PWA');
      } else {
        console.log('Usuario rechazó instalar la PWA');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return null;
}