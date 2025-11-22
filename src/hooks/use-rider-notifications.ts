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
      
      console.log('🔍 [Rider] Verificando capacidades del navegador...');
      console.log('🔍 [Rider] Notification API:', hasNotificationAPI);
      console.log('🔍 [Rider] Contexto seguro:', isSecure);
      
      setCanUseNotifications(hasNotificationAPI);
      setIsSecureContext(isSecure);
      
      if (hasNotificationAPI) {
        const permission = Notification.permission;
        console.log('🔍 [Rider] Permisos de notificación:', permission);
        setHasPermission(permission === 'granted');
      }
      
      setIsLoaded(true);
    };

    checkCapabilities();
  }, []);

  // Solicitar permisos de notificación
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!canUseNotifications) {
      console.warn('⚠️ [Rider] API de notificaciones no disponible');
      return false;
    }

    try {
      console.log('📝 [Rider] Solicitando permisos de notificación...');
      const permission = await Notification.requestPermission();
      console.log('📝 [Rider] Resultado permisos:', permission);
      
      const granted = permission === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        toast({
          title: "✅ Permisos otorgados",
          description: "Recibirás notificaciones del estado del viaje",
        });
      }
      
      return granted;
    } catch (error) {
      console.error('❌ [Rider] Error solicitando permisos:', error);
      return false;
    }
  }, [canUseNotifications, toast]);

  // Manejar cambios de estado del conductor
  const handleDriverStatusChange = useCallback(async (
    previousStatus: string,
    newStatus: string,
    rideData: any
  ) => {
    console.log('🚗 [Rider] Procesando cambio de estado:', {
      anterior: previousStatus,
      nuevo: newStatus,
      viaje: rideData.id
    });

    let title = '';
    let message = '';
    let shouldPlaySound = true;

    switch (newStatus) {
      case 'arrived':
        title = '🚗 ¡Tu conductor ha llegado!';
        message = 'El conductor está esperándote en el punto de recojo';
        break;
      case 'in-progress':
        title = '🚀 ¡Viaje iniciado!';
        message = 'Tu viaje ha comenzado, disfruta el trayecto';
        break;
      case 'completed':
        title = '🎉 ¡Viaje completado!';
        message = 'Has llegado a tu destino. ¡Gracias por elegir HelloTaxi!';
        break;
      default:
        shouldPlaySound = false;
        console.log('🔇 [Rider] Estado no relevante para notificaciones:', newStatus);
        return;
    }

    // Mostrar toast
    toast({
      title,
      description: message,
      duration: 5000,
    });

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

        console.log('🔔 [Rider] Notificación nativa mostrada:', title);
      } catch (error) {
        console.error('❌ [Rider] Error mostrando notificación nativa:', error);
      }
    }

    // Reproducir sonido
    if (shouldPlaySound && audioEnabled) {
      try {
        console.log('🔊 [Rider] Reproduciendo sonido de notificación...');
        const soundResult = await playNotificationSound({ volume: 0.8 });
        console.log('🔊 [Rider] Resultado reproducción sonido:', soundResult);
      } catch (error) {
        console.error('❌ [Rider] Error reproduciendo sonido:', error);
      }
    }
  }, [hasPermission, canUseNotifications, audioEnabled, playNotificationSound, toast]);

  // Escuchar cambios en los viajes del rider
  useEffect(() => {
    if (!riderId || !isLoaded) {
      console.log('⏳ [Rider] Esperando rider ID o carga inicial...');
      return;
    }

    console.log('👂 [Rider] Configurando listener de viajes para rider:', riderId);

    // Query para viajes activos del rider (incluir completed para detectar finalización)
    const ridesQuery = query(
      collection(db, 'rides'),
      where('passenger', '==', doc(db, 'users', riderId)),
      where('status', 'in', ['accepted', 'arrived', 'in-progress', 'completed'])
    );

    console.log('👂 [Rider] Query configurado para estados: accepted, arrived, in-progress, completed');

    const unsubscribe = onSnapshot(ridesQuery, async (snapshot) => {
      console.log('📡 [Rider] Cambios detectados en viajes:', {
        totalDocs: snapshot.size,
        cambios: snapshot.docChanges().length
      });

      for (const change of snapshot.docChanges()) {
        console.log('📡 [Rider] Tipo de cambio:', change.type);
        
        if (change.type === 'modified' || change.type === 'added') {
          const rideDataRaw = change.doc.data();
          const rideData = { id: change.doc.id, ...rideDataRaw } as any;
          
          const currentStatus = rideData.status;
          const previousStatus = lastRideStatus.current[rideData.id];
          
          console.log('🔄 [Rider] Viaje detectado:', {
            rideId: rideData.id,
            statusAnterior: previousStatus,
            statusActual: currentStatus,
            esNuevoViaje: change.type === 'added'
          });

          // Solo notificar si es un cambio real de estado (no la primera vez que vemos el viaje)
          if (previousStatus && previousStatus !== currentStatus && 
              ['arrived', 'in-progress', 'completed'].includes(currentStatus)) {
            console.log('🎯 [Rider] ¡Cambio de estado real detectado!');
            await handleDriverStatusChange(previousStatus, currentStatus, rideData);
          } else if (!previousStatus && ['arrived', 'in-progress'].includes(currentStatus)) {
            // Si es la primera vez que vemos el viaje y ya está en un estado avanzado
            console.log('🎯 [Rider] Nuevo viaje en estado avanzado detectado');
            await handleDriverStatusChange('accepted', currentStatus, rideData);
          }

          // Actualizar el tracking de estado
          lastRideStatus.current[rideData.id] = currentStatus;
        }
      }
    }, (error) => {
      console.error('❌ [Rider] Error en listener de viajes:', error);
    });

    return () => {
      console.log('🔌 [Rider] Desconectando listener de viajes');
      unsubscribe();
    };
  }, [riderId, isLoaded, handleDriverStatusChange]);

  // Función de prueba
  const testDriverStatusNotification = useCallback(() => {
    console.log('🧪 [Rider] Ejecutando prueba de notificación...');
    
    handleDriverStatusChange('accepted', 'arrived', {
      id: 'test-ride-123',
      pickup: 'Av. Prueba 123',
      dropoff: 'Destino Test 456'
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