"use client";

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationSoundOptions {
  volume?: number;
  loop?: boolean;
  autoPlay?: boolean;
  soundFile?: string; // Nombre del archivo sin extensión (ej: 'taxi', 'arrived', 'notification')
}

export const useNotificationSound = (soundPath: string = '/sounds/taxi.mp3') => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map()); // Cache para múltiples sonidos
  const [isLoaded, setIsLoaded] = useState(true); // Cambiar a true para evitar bloqueos
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [hasTriedReactivation, setHasTriedReactivation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // No crear audio por defecto, solo cuando se necesite
    // Verificar permisos de notificación
    checkNotificationPermission();
    
    // Restaurar estado del audio desde localStorage
    restoreAudioState();

    // Listener global para habilitar audio en primera interacción
    const handleFirstInteraction = async () => {
      if (!audioPermissionGranted) {
        const enabled = await enableAudio();
        if (enabled) {
          // Remover listeners después de habilitar
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('touchstart', handleFirstInteraction);
          document.removeEventListener('keydown', handleFirstInteraction);
        }
      }
    };

    // Agregar listeners para múltiples tipos de interacción
    document.addEventListener('click', handleFirstInteraction, { once: false });
    document.addEventListener('touchstart', handleFirstInteraction, { once: false });
    document.addEventListener('keydown', handleFirstInteraction, { once: false });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const restoreAudioState = () => {
    try {
      const savedAudioPermission = localStorage.getItem('hellotaxi-audio-permission');
      if (savedAudioPermission === 'granted') {
        setAudioPermissionGranted(true);
        setAudioEnabled(true); // Habilitar automáticamente si ya fue concedido antes
      } else if (savedAudioPermission === null) {
        // Primera vez - NO habilitar hasta que haya interacción del usuario
        setAudioPermissionGranted(false);
        setAudioEnabled(false);
      } else {
        // savedAudioPermission === 'denied'
        setAudioPermissionGranted(false);
        setAudioEnabled(false);
      }
    } catch (error) {
      console.warn('No se pudo restaurar el estado del audio:', error);
    }
  };

  const saveAudioState = (granted: boolean) => {
    try {
      localStorage.setItem('hellotaxi-audio-permission', granted ? 'granted' : 'denied');
    } catch (error) {
      console.warn('No se pudo guardar el estado del audio:', error);
    }
  };

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      return granted;
    }
    return false;
  };

  const enableAudio = async (): Promise<boolean> => {
    // Simplemente marcar como habilitado, la reproducción real validará si funciona
    setAudioEnabled(true);
    setAudioPermissionGranted(true);
    setHasTriedReactivation(false); // Resetear para permitir futuras reactivaciones
    saveAudioState(true); // Persistir estado
    return true;
  };

  const tryReenableAudio = async (): Promise<boolean> => {
    if (!audioPermissionGranted || hasTriedReactivation) {
      return false;
    }

    setHasTriedReactivation(true);
    
    // Simplemente marcar como habilitado, la próxima reproducción validará
    setAudioEnabled(true);
    return true;
  };

  const playSound = async (options: NotificationSoundOptions = {}) => {
    // Si el audio no está habilitado, mostrar mensaje y no intentar reproducir
    if (!audioEnabled && !audioPermissionGranted) {
  
      // Solo mostrar el toast una vez
      if (!hasTriedReactivation) {
        setHasTriedReactivation(true);
        toast({
          title: 'Sonido bloqueado',
          description: 'Haz clic en cualquier lugar para habilitar el sonido.',
          duration: 8000,
          variant: 'destructive',
        });
      }
      return false;
    }

    try {
      const soundFileName = options.soundFile || 'taxi';
      const audio = new Audio(`/sounds/${soundFileName}.mp3`);
      audio.volume = options.volume ?? 0.7;
      audio.loop = options.loop ?? false;
      
      await audio.play();
      
      // Marcar como habilitado si la reproducción fue exitosa
      if (!audioEnabled) {
        setAudioEnabled(true);
        setAudioPermissionGranted(true);
        saveAudioState(true);
      }
      
      return true;
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setAudioEnabled(false);
        
        // Solo mostrar el toast una vez
        if (!hasTriedReactivation) {
          setHasTriedReactivation(true);
          toast({
            title: 'Sonido bloqueado',
            description: 'Haz clic en cualquier lugar para habilitar el sonido.',
            duration: 8000,
            variant: 'destructive',
          });
        }
      }
      return false;
    }
  };

  const playNotificationSound = async (options: NotificationSoundOptions = {}) => {
    // Determinar qué archivo de sonido usar
    const soundFileName = options.soundFile || 'notification';
    const soundPath = `/sounds/${soundFileName}.mp3`;
    
    // Reutilizar instancia de audio desde caché o crear nueva si no existe
    let notificationAudio = audioCacheRef.current.get(soundFileName);
    
    if (!notificationAudio) {
      notificationAudio = new Audio(soundPath);
      notificationAudio.preload = 'auto';
      audioCacheRef.current.set(soundFileName, notificationAudio);
    }
    
    // Si el audio no está habilitado, mostrar mensaje y no intentar reproducir
    if (!audioEnabled && !audioPermissionGranted) {
      
      // Solo mostrar el toast una vez
      if (!hasTriedReactivation) {
        setHasTriedReactivation(true);
        toast({
          title: 'Sonido bloqueado',
          description: 'Haz clic en cualquier lugar para habilitar el sonido.',
          duration: 8000,
          variant: 'destructive',
        });
      }
      return false;
    }

    try {
      // Si el audio ya está reproduciéndose, reiniciarlo
      if (!notificationAudio.paused) {
        notificationAudio.currentTime = 0;
      }
      
      // Configurar opciones
      notificationAudio.volume = options.volume ?? 0.7;
      notificationAudio.loop = options.loop ?? false;
      
      // Resetear el audio al inicio
      notificationAudio.currentTime = 0;
      
      // Reproducir con manejo de errores específico
      const playPromise = notificationAudio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      
      // Marcar como habilitado si la reproducción fue exitosa
      if (!audioEnabled) {
        setAudioEnabled(true);
        setAudioPermissionGranted(true);
        saveAudioState(true);
      }
      
      return true;
    } catch (error) {
      // Ignorar errores de interrupción de play/pause
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setAudioEnabled(false);
        
        // Solo mostrar el toast una vez
        if (!hasTriedReactivation) {
          setHasTriedReactivation(true);
          toast({
            title: 'Sonido bloqueado',
            description: 'Haz clic en cualquier lugar para habilitar el sonido.',
            duration: 8000,
            variant: 'destructive',
          });
        }
        return false;
      }
      
      console.error(`Error reproduciendo sonido ${soundPath}:`, error);
      return false;
    }
  };

  const stopSound = () => {
    // Detener todos los sonidos en cache
    audioCacheRef.current.forEach((audio) => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setIsPlaying(false);
  };

  const showNotificationWithSound = async (
    title: string, 
    body: string, 
    options: NotificationSoundOptions = {}
  ) => {
    // Reproducir sonido
    await playSound(options);
    
    // Mostrar notificación visual
    if (hasPermission && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/icons/android/android-launchericon-192-192.png',
        tag: 'hellotaxi-service',
        requireInteraction: true,
      });
    } else {
      // Fallback con toast
      toast({
        title,
        description: body,
        duration: 8000,
      });
    }
  };

  const notifyNewService = async (serviceDetails: {
    pickup: string;
    destination?: string;
    fare?: number;
    distance?: string;
  }) => {
    const title = 'Nuevo servicio disponible';
    const body = `Recogida: ${serviceDetails.pickup}${
      serviceDetails.destination ? `\nDestino: ${serviceDetails.destination}` : ''
    }${
      serviceDetails.fare ? `\nTarifa: S/ ${serviceDetails.fare}` : ''
    }`;

    await showNotificationWithSound(title, body, {
      volume: 0.8,
      loop: false
    });
  };

  return {
    playSound,
    playNotificationSound, // Nueva función para eventos específicos
    stopSound,
    showNotificationWithSound,
    notifyNewService,
    enableAudio,
    tryReenableAudio,
    isLoaded,
    isPlaying,
    hasPermission,
    audioEnabled,
    audioPermissionGranted,
    hasTriedReactivation,
    requestNotificationPermission,
  };
};