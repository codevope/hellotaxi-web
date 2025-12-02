"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
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
  
  // 💾 Cargar datos del conductor desde localStorage si no se proporciona
  const [cachedDriver, setCachedDriver] = useState<any>(null);
  
  useEffect(() => {
    if (!driver) {
      try {
        const storedDriver = localStorage.getItem('hellotaxi-driver-data');
        if (storedDriver) {
          const driverData = JSON.parse(storedDriver);
          setCachedDriver(driverData);
        }
      } catch (error) {
        console.error(' [Safe] Error cargando datos del conductor desde localStorage:', error);
      }
    } else {
      setCachedDriver(driver);
    }
  }, [driver]);
  
  // Usar driver proporcionado o el cacheado
  const activeDriver = driver || cachedDriver;
  
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

  // Habilitar audio en primera interacción del usuario (solo si no está ya habilitado)
  useEffect(() => {
    // Solo agregar listeners si el audio NO está habilitado y NO hay permiso previo
    const hasPermission = localStorage.getItem('hellotaxi-audio-permission') === 'granted';
    
    if (!audioEnabled && !hasPermission && capabilities.canUseNotifications) {
      
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

  // Función para manejar cancelación de viaje (usar useCallback para estabilizar)
  const handleRideCancellation = useCallback(async (rideData: Ride) => {
    // Prevenir múltiples notificaciones para la misma cancelación
    const cancellationKey = `${rideData.id}-${rideData.cancelledAt}`;
    
    if (lastProcessedCancellation.current === cancellationKey) {
      return;
    }
    
    
    // Marcar como procesada INMEDIATAMENTE
    lastProcessedCancellation.current = cancellationKey;
    
    // Reproducir sonido de error para cancelación
    if (audioEnabled) {
      try {
        await playNotificationSound({ 
          volume: 0.8,
          soundFile: 'error'
        });
      } catch (error) {
        console.error('[Driver] Error reproduciendo sonido:', error);
      }
    } else {
      console.log('[Driver] Audio no habilitado, omitiendo sonido');
    }
    
    // Cambiar estado del conductor a disponible
    if (activeDriver?.id) {
      try {
        const driverRef = doc(db, 'drivers', activeDriver.id);
        await updateDoc(driverRef, {
          status: 'available'
        });
      } catch (error) {
        console.error('[Safe] Error cambiando estado del conductor:', error);
      }
    } else {
      console.log('[Safe] No se puede cambiar estado: driver ID no disponible');
    }
    
    // Preparar información detallada
    const cancellationMessage = rideData.cancellationReason?.reason || 'No se especificó motivo';
    const pickupInfo = rideData.pickup || (rideData.pickupLocation ? `Lat: ${rideData.pickupLocation.lat}, Lng: ${rideData.pickupLocation.lng}` : '');
    
    // Mostrar notificación toast prominente
    console.log('[Safe] Mostrando toast de cancelación...');
    toast({
      title: 'Viaje Cancelado por Pasajero',
      description: `${cancellationMessage}${pickupInfo ? `\nRecogida: ${pickupInfo}` : ''}`,
      duration: 25000,
      className: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white shadow-lg',
      variant: 'destructive'
    });

    // Enviar notificación del navegador si están habilitadas
    if (capabilities.canUseNotifications && hasPermission && 'Notification' in window) {
      try {
        new Notification('Viaje Cancelado - HelloTaxi', {
          body: `El pasajero canceló el viaje.\nMotivo: ${cancellationMessage}${pickupInfo ? `\nRecogida: ${pickupInfo}` : ''}`,
          icon: '/icons/android/android-chrome-192x192.png',
          badge: '/icons/android/android-chrome-96x96.png',
          tag: `ride-cancellation-${rideData.id}`,
          requireInteraction: true
        });
      } catch (error) {
        console.error(' [Safe] Error enviando notificación del navegador:', error);
      }
    }
  }, [audioEnabled, playNotificationSound, activeDriver?.id, capabilities.canUseNotifications, hasPermission, toast]);

  //  DESHABILITADO - Este listener está duplicado y causa conflictos
  // La detección de cancelaciones ahora se maneja en:
  // 1. use-incoming-ride-requests.ts (para solicitudes antes de aceptar)
  // 2. driver-active-ride-provider.tsx (para viajes activos después de aceptar)

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