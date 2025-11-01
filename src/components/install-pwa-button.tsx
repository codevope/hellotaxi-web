"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar si es iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA instalada exitosamente');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleClose = () => {
    setShowInstallPrompt(false);
  };

  // No mostrar en iOS (no soporta installPrompt) o si no hay prompt disponible
  if (isIOS || (!showInstallPrompt && !isIOS)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between bg-amber-500 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center space-x-3">
        <Download className="h-5 w-5" />
        <div>
          <p className="font-semibold text-sm">Instalar HelloTaxi</p>
          <p className="text-xs opacity-90">Acceso rápido desde tu pantalla de inicio</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          onClick={handleInstall}
          size="sm"
          variant="secondary"
          className="bg-white text-amber-500 hover:bg-gray-100"
        >
          Instalar
        </Button>
        <Button
          onClick={handleClose}
          size="sm"
          variant="ghost"
          className="text-white hover:bg-amber-600 p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}