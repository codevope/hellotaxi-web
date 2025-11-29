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
  }, []);

  const restoreAudioState = () => {
    try {
      const savedAudioPermission = localStorage.getItem('hellotaxi-audio-permission');
      if (savedAudioPermission === 'granted') {
        setAudioPermissionGranted(true);
        setAudioEnabled(true); // Habilitar automáticamente si ya fue concedido antes
        console.log('🔊 Estado de audio restaurado desde localStorage');
      } else if (savedAudioPermission === null) {
        // Primera vez - habilitar por defecto
        setAudioPermissionGranted(true);
        setAudioEnabled(true);
        saveAudioState(true);
        console.log('🔊 Audio habilitado por defecto (primera vez)');
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
      // Pequeño delay para evitar interrumpir el play()
      await new Promise(resolve => setTimeout(resolve, 100));
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
      // Manejar específicamente el error de falta de interacción del usuario
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          console.warn('🔊 [Audio] Error: Se requiere interacción del usuario para habilitar audio');
          return false; // No mostrar error, es esperado
        } else if (error.message.includes('interrupted')) {
          console.log('🔊 [Audio] Audio interrumpido durante activación (normal)');
          setAudioEnabled(true);
          setAudioPermissionGranted(true);
          saveAudioState(true);
          return true;
        }
      }
      
      console.error('🔊 [Audio] Error inesperado habilitando audio:', error);
      saveAudioState(false);
      return false;
    }
  };

  const tryReenableAudio = async (): Promise<boolean> => {
    if (!audioPermissionGranted || hasTriedReactivation) {
      return false;
    }

    setHasTriedReactivation(true);

    try {
      const testAudio = new Audio('/sounds/notification.mp3');
      testAudio.volume = 0.001;
      
      await testAudio.play();
      await new Promise(resolve => setTimeout(resolve, 100));
      testAudio.pause();
      
      setAudioEnabled(true);
      console.log('🔄 Audio rehabilitado automáticamente');
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          console.log('🔊 [Audio] Reactivación requiere interacción del usuario');
          setAudioEnabled(false);
          return false;
        } else if (error.message.includes('interrupted')) {
          console.log('🔊 [Audio] Audio interrumpido durante reactivación (normal)');
          setAudioEnabled(true);
          return true;
        }
      }
      
      console.log('⚠️ [Audio] No se pudo rehabilitar automáticamente el audio');
      setAudioEnabled(false);
      return false;
    }
  };

  const playSound = async (options: NotificationSoundOptions = {}) => {
    // Intentar habilitar automáticamente si no está habilitado
    if (!audioEnabled) {
      console.log('🔊 Audio no habilitado, intentando habilitar automáticamente...');
      const enabled = await enableAudio();
      if (!enabled) {
        console.warn('🔊 Se requiere interacción del usuario para habilitar audio');
        return false;
      }
    }

    try {
      const soundFileName = options.soundFile || 'taxi';
      const audio = new Audio(`/sounds/${soundFileName}.mp3`);
      audio.volume = options.volume ?? 0.7;
      audio.loop = options.loop ?? false;
      
      await audio.play();
      console.log('🎵 Audio reproducido correctamente');
      return true;
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setAudioEnabled(false);
        toast({
          title: 'Sonido bloqueado',
          description: 'Habilita nuevamente el sonido.',
          duration: 8000,
          variant: 'destructive',
        });
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
      console.log(`🎵 Nueva instancia de audio creada para: ${soundFileName}`);
    }
    
    // Intentar habilitar automáticamente si no está habilitado
    if (!audioEnabled) {
      console.log('🔊 [Notification] Audio no habilitado, intentando habilitar automáticamente...');
      const enabled = await enableAudio();
      if (!enabled) {
        console.warn('🔊 [Notification] Se requiere interacción del usuario para habilitar audio');
        return false;
      }
    }

    try {
      // Si el audio ya está reproduciéndose, detenerlo primero
      if (!notificationAudio.paused) {
        notificationAudio.pause();
        notificationAudio.currentTime = 0;
        console.log(`⏹️ Audio detenido para reproducir nuevamente: ${soundFileName}`);
      }
      
      // Configurar opciones
      notificationAudio.volume = options.volume ?? 0.7;
      notificationAudio.loop = options.loop ?? false;
      
      // Resetear el audio al inicio
      notificationAudio.currentTime = 0;
      
      // Reproducir
      await notificationAudio.play();
      console.log(`🔔 Sonido reproducido correctamente: ${soundPath}`);
      return true;
    } catch (error) {
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