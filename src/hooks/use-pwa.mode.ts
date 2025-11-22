'use client';

import { useEffect, useState, useCallback } from 'react';

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAMode() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const navigator = window.navigator as NavigatorWithStandalone;
    const checkPWA = window.matchMedia('(display-mode: standalone)').matches ||
                     navigator.standalone === true;
    setIsPWA(checkPWA);
  }, []);

  return isPWA;
}

export function usePWA() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Verificar si ya está en modo standalone
    const navigator = window.navigator as NavigatorWithStandalone;
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          navigator.standalone === true ||
                          document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandalone);

    // Listener para el evento de instalación
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    // Listener para cuando la app se instala
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showInstallPrompt = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isStandalone,
    isInstallable,
    showInstallPrompt,
    canInstall: !!deferredPrompt
  };
}