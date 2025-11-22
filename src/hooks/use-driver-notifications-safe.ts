"use client";

import { useEffect, useState, useRef } from 'react';
import { getBrowserCapabilities } from '@/lib/browser-capabilities';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useToast } from '@/hooks/use-toast';
import { useDriverRideStore } from '@/store/driver-ride-store';
import { doc, onSnapshot, query, collection, where, QuerySnapshot, DocumentChange, FirestoreError, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Driver, EnrichedDriver, Ride } from '@/lib/types';

export const useDriverNotificationsSafe = (driver?: Driver | EnrichedDriver | null) => {
  const [capabilities] = useState(getBrowserCapabilities());
  const { toast } = useToast();
  
  // Ref para mantener el ID del ride activo previo
  const previousActiveRideId = useRef<string | null>(null);

  // Ref para prevenir múltiples notificaciones de la misma cancelación
  const lastProcessedCancellation = useRef<string | null>(null);

  // Solo usar el hook de sonido si es seguro
  const soundHook = capabilities.canUseNotifications ? 
    useNotificationSound() : 
    {
      hasPermission: false,
      audioEnabled: false,
      audioPermissionGranted: false,
      hasTriedReactivation: false,
      isLoaded: true,
      playSound: async () => false,
      playNotificationSound: async () => false, // Agregar función de sonido específico
      enableAudio: async () => false,
      tryReenableAudio: async () => false,
      requestNotificationPermission: async () => false,
      notifyNewService: async () => {},
    };

  const { 
    hasPermission, 
    audioEnabled,
    audioPermissionGranted,
    hasTriedReactivation,
    enableAudio,
    tryReenableAudio,
    requestNotificationPermission,
    notifyNewService,
    isLoaded,
    playSound,
    playNotificationSound // Agregar función de sonido específico
  } = soundHook;

  // Mostrar advertencia de SSL una sola vez
  useEffect(() => {
    if (!capabilities.isSecureContext && capabilities.isProduction && driver) {
      const hasShownWarning = sessionStorage.getItem('ssl-warning-shown');
      if (!hasShownWarning) {
        toast({
          title: 'Funcionalidad Limitada',
          description: 'Esta aplicación requiere HTTPS. Las notificaciones y geolocalización no estarán disponibles.',
          duration: 10000,
          variant: 'destructive',
        });
        sessionStorage.setItem('ssl-warning-shown', 'true');
      }
    }
  }, [capabilities, driver, toast]);

  // Efecto para escuchar cancelaciones de viajes asignados al conductor
  useEffect(() => {
    if (!driver?.id) {
      console.log('🚫 [Safe] No hay conductor ID, no se puede escuchar cancelaciones');
      return;
    }

    console.log('🔍 [Safe] Configurando listener de cancelaciones para conductor:', driver.id);

    // Escuchar todos los viajes donde este conductor está asignado
    const ridesQuery = query(
      collection(db, 'rides'),
      where('driver', '==', doc(db, 'drivers', driver.id))
    );

    console.log('🔍 [Safe] Query configurado para escuchar viajes del conductor:', driver.id);

    const unsubscribe = onSnapshot(ridesQuery, (snapshot: QuerySnapshot) => {
      console.log('📡 [Safe] Snapshot recibido:', {
        docsCount: snapshot.docs.length,
        changesCount: snapshot.docChanges().length
      });

      snapshot.docChanges().forEach((change: DocumentChange) => {
        console.log('🔍 [Safe] Cambio detectado:', {
          type: change.type,
          docId: change.doc.id
        });

        if (change.type === 'modified') {
          const rideData = { id: change.doc.id, ...change.doc.data() } as Ride;
          
          console.log('🔍 [Safe] Viaje modificado:', {
            rideId: rideData.id,
            status: rideData.status,
            cancelledBy: rideData.cancelledBy,
            driverAssigned: driver.id
          });
          
          // Solo notificar si es una cancelación por pasajero
          if (rideData.status === 'cancelled' && rideData.cancelledBy === 'passenger') {
            console.log('❌ [Safe] CANCELACIÓN DETECTADA:', {
              rideId: rideData.id,
              reason: rideData.cancellationReason?.reason,
              cancelledBy: rideData.cancelledBy,
              driverAssigned: driver.id
            });
            
            handleRideCancellation(rideData);
          } else {
            console.log('ℹ️ [Safe] No es cancelación por pasajero, ignorando');
          }
        }
      });
    }, (error: FirestoreError) => {
      console.error('❌ [Safe] Error escuchando cancelaciones de viajes:', error);
    });

    // Cleanup
    return () => {
      console.log('🧹 [Safe] Limpiando listener de cancelaciones para conductor:', driver.id);
      unsubscribe();
    };
  }, [driver?.id]);

  const handleRideCancellation = async (rideData: Ride) => {
    // Prevenir múltiples notificaciones para la misma cancelación
    const cancellationKey = `${rideData.id}-${rideData.cancelledAt}`;
    
    if (lastProcessedCancellation.current === cancellationKey) {
      console.log('🔄 [Safe] Cancelación ya procesada, ignorando:', cancellationKey);
      return;
    }
    
    console.log('❌ [Safe] Procesando NUEVA cancelación de viaje:', {
      rideId: rideData.id,
      cancellationKey,
      reason: rideData.cancellationReason?.reason,
      pickup: rideData.pickup || rideData.pickupLocation
    });
    
    // Marcar como procesada INMEDIATAMENTE
    lastProcessedCancellation.current = cancellationKey;
    
    // Reproducir sonido de notificación de cancelación (si es posible)
    console.log('🔊 [Safe] Intentando reproducir sonido de cancelación (notification.mp3)...');
    if (capabilities.canUseNotifications) {
      try {
        const soundPlayed = await playNotificationSound({ volume: 0.8 });
        console.log('🔊 [Safe] Resultado reproducción notification.mp3:', soundPlayed);
        
        if (!soundPlayed) {
          console.log('🔊 [Safe] Sonido falló, intentando fallback...');
          // Fallback directo
          const fallbackAudio = new Audio('/sounds/notification.mp3');
          fallbackAudio.volume = 0.8;
          try {
            await fallbackAudio.play();
            console.log('🔊 [Safe] ✅ Fallback audio exitoso');
          } catch (fallbackError) {
            console.error('🔊 [Safe] ❌ Fallback audio falló:', fallbackError);
          }
        }
      } catch (soundError) {
        console.error('🔊 [Safe] Error en playNotificationSound:', soundError);
      }
    } else {
      console.log('🔊 [Safe] Notificaciones no disponibles, no se puede reproducir sonido');
    }
    
    // Cambiar estado del conductor a disponible
    if (driver?.id) {
      try {
        console.log('🔄 [Safe] Cambiando estado del conductor a disponible...');
        const driverRef = doc(db, 'drivers', driver.id);
        await updateDoc(driverRef, {
          status: 'available'
        });
        console.log('✅ [Safe] Estado del conductor cambiado a disponible');
      } catch (error) {
        console.error('❌ [Safe] Error cambiando estado del conductor:', error);
      }
    } else {
      console.log('⚠️ [Safe] No se puede cambiar estado: driver ID no disponible');
    }
    
    // Preparar información detallada
    const cancellationMessage = rideData.cancellationReason?.reason || 'No se especificó motivo';
    const pickupInfo = rideData.pickup || (rideData.pickupLocation ? `Lat: ${rideData.pickupLocation.lat}, Lng: ${rideData.pickupLocation.lng}` : '');
    
    // Mostrar notificación toast prominente (siempre funciona)
    console.log('📱 [Safe] Mostrando toast de cancelación...');
    toast({
      title: '🚫 Viaje Cancelado por Pasajero',
      description: `${cancellationMessage}${pickupInfo ? `\nRecogida: ${pickupInfo}` : ''}`,
      duration: 25000,
      className: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white shadow-lg',
      variant: 'destructive'
    });

    // Enviar notificación del navegador si están habilitadas
    if (capabilities.canUseNotifications && hasPermission && 'Notification' in window) {
      try {
        console.log('🔔 [Safe] Enviando notificación del navegador...');
        new Notification('🚫 Viaje Cancelado - HelloTaxi', {
          body: `El pasajero canceló el viaje.\nMotivo: ${cancellationMessage}${pickupInfo ? `\nRecogida: ${pickupInfo}` : ''}`,
          icon: '/icons/android/android-chrome-192x192.png',
          badge: '/icons/android/android-chrome-96x96.png',
          tag: `ride-cancellation-${rideData.id}`,
          requireInteraction: true
        });
        console.log('🔔 [Safe] Notificación del navegador enviada para cancelación');
      } catch (error) {
        console.error('❌ [Safe] Error enviando notificación del navegador:', error);
      }
    } else {
      console.log('🔔 [Safe] Notificaciones del navegador no disponibles');
    }

    console.log('✅ [Safe] Notificación de cancelación procesada completamente');
  };

  // Versión segura de las funciones
  const safeEnableAudio = async (): Promise<boolean> => {
    if (!capabilities.canUseNotifications) {
      toast({
        title: 'HTTPS Requerido',
        description: 'Las notificaciones requieren una conexión segura (HTTPS).',
        variant: 'destructive',
      });
      return false;
    }
    return enableAudio();
  };

  const safeRequestNotificationPermission = async (): Promise<boolean> => {
    if (!capabilities.canUseNotifications) {
      return false;
    }
    return requestNotificationPermission();
  };

  const safePlaySound = async (options?: any) => {
    if (!capabilities.canUseNotifications) {
      return false;
    }
    return playSound(options);
  };

  // Función de prueba que funciona sin SSL
  const testNotification = async () => {
    if (capabilities.canUseNotifications) {
      const mockRequest = {
        id: 'test-123',
        pickupLocation: 'Av. Larco 1234, Miraflores',
        destinationLocation: 'Centro Comercial Larcomar',
        initialFare: 25,
      };
      await notifyNewService({
        pickup: mockRequest.pickupLocation,
        destination: mockRequest.destinationLocation,
        fare: mockRequest.initialFare,
      });
    } else {
      toast({
        title: 'Modo de Prueba',
        description: 'Nueva solicitud: Av. Larco 1234, Miraflores → Centro Comercial Larcomar (S/ 25)',
        duration: 8000,
        className: 'border-l-4 border-l-[#2E4CA6]',
      });
    }
  };

  // Función de prueba para cancelaciones
  const testCancellationNotification = async () => {
    const mockCancelledRide = {
      id: 'test-cancellation-123',
      pickup: 'Av. Larco 1234, Miraflores',
      dropoff: 'Centro Comercial Larcomar',
      status: 'cancelled' as const,
      cancelledBy: 'passenger' as const,
      cancellationReason: {
        code: 'PASSENGER_CANCELLED_RIDE',
        reason: 'El pasajero decidió cancelar el viaje'
      },
      date: new Date().toISOString(),
      fare: 25,
    } as Ride;

    await handleRideCancellation(mockCancelledRide);
  };

  // Función segura para playNotificationSound
  const safePlayNotificationSound = async (options?: any) => {
    if (!capabilities.canUseNotifications) return false;
    if (!playNotificationSound) return false;
    return playNotificationSound(options);
  };

  return {
    // Capacidades del navegador
    isSecureContext: capabilities.isSecureContext,
    canUseNotifications: capabilities.canUseNotifications,
    
    // Estados originales (seguros)
    hasPermission: capabilities.canUseNotifications ? hasPermission : false,
    audioEnabled: capabilities.canUseNotifications ? audioEnabled : false,
    audioPermissionGranted: capabilities.canUseNotifications ? audioPermissionGranted : false,
    hasTriedReactivation,
    isLoaded,
    
    // Funciones seguras
    enableAudio: safeEnableAudio,
    tryReenableAudio: capabilities.canUseNotifications ? tryReenableAudio : async () => false,
    requestNotificationPermission: safeRequestNotificationPermission,
    updateNotificationPermissions: async () => {}, // Stub para compatibilidad
    shouldAttemptReactivation: () => false, // Deshabilitado en HTTP
    testNotification,
    testCancellationNotification, // Nueva función para probar cancelaciones
    playSound: safePlaySound,
    playNotificationSound: safePlayNotificationSound, // Agregar función específica
  };
};