"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNotificationSound } from './use-notification-sound';
import { useToast } from './use-toast';

export interface RiderNotificationHook {
  hasPermission: boolean;
  audioEnabled: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  enableAudio: () => Promise<boolean>;
  isLoaded: boolean;
  canUseNotifications: boolean;
  isSecureContext: boolean;
  testDriverStatusNotification: () => void;
}

export function useRiderNotifications(riderId: string | undefined): RiderNotificationHook {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [canUseNotifications, setCanUseNotifications] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(false);

  // Ref para trackear el último estado de cada viaje
  const lastRideStatus = useRef<{ [rideId: string]: string }>({});

  const { audioEnabled, enableAudio, playNotificationSound } = useNotificationSound();
  const { toast } = useToast();

  // Verificar capacidades del navegador
  useEffect(() => {
    const checkCapabilities = () => {
      const hasNotificationAPI = 'Notification' in window;
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1';

      setCanUseNotifications(hasNotificationAPI);
      setIsSecureContext(isSecure);
      
      if (hasNotificationAPI) {
        const permission = Notification.permission;
        setHasPermission(permission === 'granted');
      }
      
      setIsLoaded(true);
    };

    checkCapabilities();
  }, []);

  // Habilitar audio en primera interacción del usuario (solo si no está ya habilitado)
  useEffect(() => {
    // Solo agregar listeners si el audio NO está habilitado y NO hay permiso previo
    const hasPermission = localStorage.getItem('hellotaxi-audio-permission') === 'granted';
    
    if (!audioEnabled && !hasPermission && canUseNotifications) {
      
      const handleFirstInteraction = async () => {
        const enabled = await enableAudio();
        if (enabled) {
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('touchstart', handleFirstInteraction);
          document.removeEventListener('keydown', handleFirstInteraction);
        }
      };

      document.addEventListener('click', handleFirstInteraction);
      document.addEventListener('touchstart', handleFirstInteraction);
      document.addEventListener('keydown', handleFirstInteraction);

      return () => {
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  // Solicitar permisos de notificación
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!canUseNotifications) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        toast({
          title: "Permisos otorgados",
          description: "Recibirás notificaciones del estado del viaje",
        });
      }
      
      return granted;
    } catch (error) {
      return false;
    }
  }, [canUseNotifications, toast]);

  // Efecto para solicitar permisos y habilitar audio automáticamente cuando se carga la app
  useEffect(() => {
    const requestInitialPermissions = async () => {
      if (!riderId || !isLoaded || !canUseNotifications) return;
      
      // Solo solicitar si no se han solicitado antes
      const hasAskedBefore = localStorage.getItem('hellotaxi-rider-permissions-asked');
      
      if (!hasPermission && !hasAskedBefore) {
        
        // Mostrar toast informativo primero
        toast({
          title: "🔔 Activa las notificaciones",
          description: "Para recibir actualizaciones de tu viaje en tiempo real",
          duration: 8000,
        });
        
        // Esperar un momento antes de solicitar permisos
        setTimeout(async () => {
          const granted = await requestNotificationPermission();
          localStorage.setItem('hellotaxi-rider-permissions-asked', 'true');
          
          if (granted) {
            // Habilitar audio automáticamente
            const audioResult = await enableAudio();
            
            if (audioResult) {
              toast({
                title: " Todo listo",
                description: "Notificaciones y sonido activados. Recibirás alertas cuando el conductor cambie el estado de tu viaje",
                duration: 5000,
              });
            } else {
              // Si falla la activación automática de audio (requiere interacción)
             console.log('[Rider] No se pudo habilitar audio automáticamente, requiere interacción del usuario');
            }
          }
        }, 3000);
      } else if (hasPermission && !audioEnabled) {
        // Si ya tiene permisos pero el audio no está habilitado, intentar habilitarlo
        await enableAudio();
      }
    };

    requestInitialPermissions();
  }, [riderId, isLoaded, canUseNotifications, hasPermission, audioEnabled, requestNotificationPermission, enableAudio, toast]);

  // Manejar cambios de estado del conductor
  const handleDriverStatusChange = useCallback(async (
    previousStatus: string,
    newStatus: string,
    rideData: any
  ) => {

    let title = '';
    let message = '';
    let shouldPlaySound = true;
    let soundFile = 'notification'; // sonido por defecto

    switch (newStatus) {
      case 'accepted':
        title = '¡Viaje aceptado!';
        message = 'Un conductor ha aceptado tu solicitud y se dirige hacia ti';
        soundFile = 'taxi';
        break;
      case 'arrived':
        title = '¡Tu conductor ha llegado!';
        message = 'El conductor está esperándote en el punto de recojo';
        soundFile = 'notification';
        break;
      case 'in-progress':
        title = '¡Viaje iniciado!';
        message = 'Tu viaje ha comenzado, disfruta el trayecto';
        soundFile = 'arrived';
        break;
      case 'completed':
        // No reproducir sonido si ya fue calificado (evita duplicado al enviar rating)
        if (rideData.isRatedByPassenger) {
          shouldPlaySound = false;
        }
        title = '¡Viaje completado!';
        message = 'Has llegado a tu destino. ¡Gracias por elegir HelloTaxi!';
        soundFile = 'notification';
        break;
      default:
        shouldPlaySound = false;
        return;
    }

    // Mostrar toast solo si no ha sido calificado
    if (!rideData.isRatedByPassenger || newStatus !== 'completed') {
      toast({
        title,
        description: message,
        duration: 2000,
      });
    }

    // Mostrar notificación nativa si hay permisos
    if (hasPermission && canUseNotifications) {
      try {
        const notification = new Notification(title, {
          body: message,
          icon: '/icons/android/android-launchericon-192-192.png',
          badge: '/icons/android/android-launchericon-96-96.png',
          tag: `ride-status-${rideData.id}`,
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto-cerrar después de 8 segundos
        setTimeout(() => notification.close(), 8000);
      } catch (error) {
        console.error(' [Rider] Error mostrando notificación nativa:', error);
      }
    }

    // Reproducir sonido específico según el evento
    if (shouldPlaySound && audioEnabled) {
      try {
         const soundResult = await playNotificationSound({ 
          volume: 0.8,
          soundFile: soundFile // Pasar el archivo de sonido específico
        });
      } catch (error) {
        console.error(' [Rider] Error reproduciendo sonido:', error);
      }
    }
  }, [hasPermission, canUseNotifications, audioEnabled, playNotificationSound, toast]);

  // Escuchar cambios en los viajes del rider
  useEffect(() => {
    if (!riderId || !isLoaded) {
      return;
    }

    // Query para viajes activos del rider (incluir todos los estados relevantes)
    const ridesQuery = query(
      collection(db, 'rides'),
      where('passenger', '==', doc(db, 'users', riderId)),
      where('status', 'in', ['accepted', 'arrived', 'in-progress', 'completed'])
    );

    const unsubscribe = onSnapshot(ridesQuery, async (snapshot) => {


      for (const change of snapshot.docChanges()) {
        
        if (change.type === 'modified' || change.type === 'added') {
          const rideDataRaw = change.doc.data();
          const rideData = { id: change.doc.id, ...rideDataRaw } as any;
          
          const currentStatus = rideData.status;
          const previousStatus = lastRideStatus.current[rideData.id];

          // Solo notificar si es un cambio real de estado (no la primera vez que vemos el viaje)
          if (previousStatus && previousStatus !== currentStatus && 
              ['accepted', 'arrived', 'in-progress', 'completed'].includes(currentStatus)) {
            await handleDriverStatusChange(previousStatus, currentStatus, rideData);
          } else if (!previousStatus && ['accepted', 'arrived', 'in-progress'].includes(currentStatus)) {
            // Si es la primera vez que vemos el viaje y ya está en un estado avanzado
            await handleDriverStatusChange('pending', currentStatus, rideData);
          }

          // Actualizar el tracking de estado
          lastRideStatus.current[rideData.id] = currentStatus;
        }
      }
    }, (error) => {
      console.error(' [Rider] Error en listener de viajes:', error);
    });

    return () => {
      unsubscribe();
    };
  }, [riderId, isLoaded, handleDriverStatusChange]);

  // Función de prueba
  const testDriverStatusNotification = useCallback(() => {
    
    handleDriverStatusChange('pending', 'accepted', {
      id: 'test-ride-123',
      pickup: 'Av. Prueba 123, Miraflores',
      dropoff: 'Centro Comercial Test, San Isidro',
      driver: 'Juan Pérez'
    });
  }, [handleDriverStatusChange]);

  return {
    hasPermission,
    audioEnabled,
    requestNotificationPermission,
    enableAudio,
    isLoaded,
    canUseNotifications,
    isSecureContext,
    testDriverStatusNotification
  };
}