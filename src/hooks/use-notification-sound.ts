"use client";

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationSoundOptions {
  volume?: number;
  loop?: boolean;
  autoPlay?: boolean;
}

export const useNotificationSound = (soundPath: string = '/sounds/taxiiiii.mp3') => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [hasTriedReactivation, setHasTriedReactivation] = useState(false); // Usar estado en lugar de ref
  const { toast } = useToast();

  useEffect(() => {
    // Crear el elemento de audio
    audioRef.current = new Audio(soundPath);
    audioRef.current.preload = 'auto';
    
    // Configurar eventos
    const audio = audioRef.current;
    
    const handleCanPlayThrough = () => {
      setIsLoaded(true);
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    const handleError = (error: Event) => {
      console.error('Error cargando el audio:', error);
      toast({
        title: 'Error de audio',
        description: 'No se pudo cargar el sonido de notificación.',
        variant: 'destructive',
      });
    };

    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Verificar permisos de notificación
    checkNotificationPermission();
    
    // Restaurar estado del audio desde localStorage
    restoreAudioState();

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [soundPath, toast]);

  const restoreAudioState = () => {
    try {
      const savedAudioPermission = localStorage.getItem('hellotaxi-audio-permission');
      if (savedAudioPermission === 'granted') {
        setAudioPermissionGranted(true);
        console.log('🔊 Estado de audio restaurado desde localStorage');
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
    if (!audioRef.current || !isLoaded) {
      console.warn('Audio no está listo para habilitar');
      return false;
    }

    try {
      // Intentar reproducir un audio silencioso para activar el contexto de audio
      const originalVolume = audioRef.current.volume;
      audioRef.current.volume = 0.01; // Muy bajo volumen
      audioRef.current.currentTime = 0;
      
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = originalVolume;
      
      setAudioEnabled(true);
      setAudioPermissionGranted(true);
      setHasTriedReactivation(false); // Resetear para permitir futuras reactivaciones
      saveAudioState(true); // Persistir estado
      console.log('✅ Audio habilitado correctamente y guardado');
      return true;
    } catch (error) {
      console.error('Error habilitando audio:', error);
      saveAudioState(false);
      return false;
    }
  };

  const tryReenableAudio = async (): Promise<boolean> => {
    // Solo intentar si el usuario había habilitado el audio previamente y no se ha intentado ya
    if (!audioPermissionGranted || !audioRef.current || !isLoaded || hasTriedReactivation) {
      return false;
    }

    setHasTriedReactivation(true);

    try {
      // Intentar reproducir silenciosamente para reactivar
      const originalVolume = audioRef.current.volume;
      audioRef.current.volume = 0.001;
      audioRef.current.currentTime = 0;
      
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = originalVolume;
      
      setAudioEnabled(true);
      console.log('🔄 Audio rehabilitado automáticamente');
      return true;
    } catch (error) {
      console.log('⚠️ No se pudo rehabilitar automáticamente el audio, requiere interacción');
      setAudioEnabled(false);
      return false;
    }
  };

  const playSound = async (options: NotificationSoundOptions = {}) => {
    if (!audioRef.current || !isLoaded) {
      console.warn('Audio no está listo para reproducir');
      return false;
    }

    // Si el audio no está habilitado pero el usuario había dado permisos, intentar rehabilitar
    if (!audioEnabled && audioPermissionGranted) {
      const reenabledSuccessfully = await tryReenableAudio();
      if (!reenabledSuccessfully) {
        toast({
          title: 'Interacción requerida',
          description: 'Haz clic en "Reactivar Sonido" para volver a habilitar las alertas de audio.',
          duration: 8000,
          className: 'border-l-4 border-l-[#049DD9]',
        });
        return false;
      }
    }

    // Si el audio no está habilitado y no hay permisos previos
    if (!audioEnabled) {
      console.warn('Audio no habilitado por el usuario');
      toast({
        title: 'Sonido deshabilitado',
        description: 'Haz clic en "Habilitar Sonido" para recibir alertas de audio.',
        duration: 5000,
        className: 'border-l-4 border-l-[#F2F2F2] bg-gray-50',
      });
      return false;
    }

    try {
      // Configurar opciones
      audioRef.current.volume = options.volume ?? 0.7;
      audioRef.current.loop = options.loop ?? false;
      
      // Resetear el audio al inicio
      audioRef.current.currentTime = 0;
      
      // Reproducir
      await audioRef.current.play();
      console.log('🎵 Audio reproducido correctamente');
      return true;
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
      
      // Si es un error de interacción del usuario, mostrar toast
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setAudioEnabled(false); // Resetear estado
        toast({
          title: 'Sonido bloqueado',
          description: 'Habilita nuevamente el sonido haciendo clic en "Reactivar Sonido".',
          duration: 8000,
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
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