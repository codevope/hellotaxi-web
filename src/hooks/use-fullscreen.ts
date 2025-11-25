'use client';

import { useState, useEffect } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'browser' | 'standalone' | 'fullscreen' | 'minimal-ui'>('browser');

  useEffect(() => {
    // Detectar el modo de visualización actual
    const detectDisplayMode = () => {
      // Verificar si está en modo standalone (PWA instalada)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Verificar si está en modo fullscreen
      const isFullscreenMode = window.matchMedia('(display-mode: fullscreen)').matches;
      
      // Verificar si está en modo minimal-ui
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      // Verificar si es iOS standalone
      const isIOSStandalone = (window.navigator as any).standalone === true;

      if (isFullscreenMode) {
        setDisplayMode('fullscreen');
        setIsFullscreen(true);
      } else if (isStandalone || isIOSStandalone) {
        setDisplayMode('standalone');
        setIsFullscreen(true);
      } else if (isMinimalUI) {
        setDisplayMode('minimal-ui');
        setIsFullscreen(false);
      } else {
        setDisplayMode('browser');
        setIsFullscreen(false);
      }
    };

    detectDisplayMode();

    // Escuchar cambios en el modo de visualización
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const fullscreenQuery = window.matchMedia('(display-mode: fullscreen)');
    
    const handleChange = () => detectDisplayMode();
    
    if (standaloneQuery.addEventListener) {
      standaloneQuery.addEventListener('change', handleChange);
      fullscreenQuery.addEventListener('change', handleChange);
    } else {
      // Fallback para navegadores antiguos
      standaloneQuery.addListener(handleChange);
      fullscreenQuery.addListener(handleChange);
    }

    // Detectar cambios en fullscreen API del navegador
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      if (standaloneQuery.removeEventListener) {
        standaloneQuery.removeEventListener('change', handleChange);
        fullscreenQuery.removeEventListener('change', handleChange);
      } else {
        standaloneQuery.removeListener(handleChange);
        fullscreenQuery.removeListener(handleChange);
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Función para solicitar modo fullscreen
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  // Función para salir del modo fullscreen
  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  };

  return {
    isFullscreen,
    displayMode,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
