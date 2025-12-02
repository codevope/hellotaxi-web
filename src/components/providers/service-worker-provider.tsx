"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Share } from 'lucide-react';

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
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { toast } = useToast();
  const pathname = usePathname();
  
  // Detectar si estamos en móvil
  const isMobilePath = pathname?.startsWith('/mobile');

  useEffect(() => {
    // Detectar iOS y si ya está instalado
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
    
    setIsIOS(isIOSDevice);
    setIsStandalone(isInStandalone);

    // No mostrar nada si ya está instalado
    if (isInStandalone) return;

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          
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

    // Verificar si ya fue rechazado
    const wasPromptDismissed = localStorage.getItem('pwa-install-dismissed');
    
    // Manejar evento de instalación PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Mostrar banner después de un tiempo si no fue rechazado
      if (!wasPromptDismissed) {
        setTimeout(() => {
          setShowInstallBanner(true);
        }, isMobilePath ? 3000 : 8000); // Más rápido en móvil
      }
    };

    // Para iOS, mostrar después de un tiempo sin necesidad de evento
    if (isIOSDevice && isMobilePath && !wasPromptDismissed) {
      setTimeout(() => setShowInstallBanner(true), 5000);
    }

    // Detectar si ya está instalada
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      localStorage.removeItem('pwa-install-dismissed');
      toast({
        title: '¡HelloTaxi instalada!',
        description: 'La aplicación se ha instalado correctamente.',
        duration: 3000,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast, isMobilePath]);

  // Función para instalar la PWA
  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: 'Instalando...',
          description: 'HelloTaxi se está instalando en tu dispositivo.',
          duration: 3000,
        });
      } else {
        console.log('Usuario rechazó instalar la PWA');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowInstallBanner(false);
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Renderizar banner de instalación
  if (showInstallBanner && !isStandalone) {
    // Banner para iOS en móvil
    if (isIOS && isMobilePath) {
      return (
        <Card className="fixed bottom-4 left-4 right-4 z-50 border-blue-500 bg-white shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Instalar HelloTaxi
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Instala la app en tu iPhone para acceso rápido
                </p>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Share className="h-4 w-4" />
                    <span>1. Toca el botón "Compartir"</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Download className="h-4 w-4" />
                    <span>2. Selecciona "Agregar a pantalla de inicio"</span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={dismissInstallBanner}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Banner para Android/Chrome
    if (isInstallable && deferredPrompt) {
      return (
        <Card className={`fixed ${isMobilePath ? 'bottom-4' : 'bottom-4'} left-4 right-4 z-50 border-green-500 bg-white shadow-xl animate-in ${isMobilePath ? 'slide-in-from-bottom' : 'slide-in-from-top'}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Download className="h-5 w-5 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Instalar HelloTaxi
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {isMobilePath ? 'Instala la app para mejor experiencia' : 'Acceso rápido desde tu escritorio'}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  onClick={installPWA}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white text-xs px-4"
                >
                  Instalar
                </Button>
                <Button
                  onClick={dismissInstallBanner}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-gray-100 "
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  return null;
}