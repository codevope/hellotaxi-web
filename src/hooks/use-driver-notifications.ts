"use client";

import { useEffect } from 'react';
import { useDriverRideStore } from '@/store/driver-ride-store';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useToast } from '@/hooks/use-toast';
import { 
  updateDriverNotificationPreferences, 
  getCurrentDeviceInfo,
  hasRecentAudioPermission 
} from '@/lib/notification-preferences';
import type { Driver, EnrichedDriver } from '@/lib/types';

export const useDriverNotifications = (driver?: Driver | EnrichedDriver | null) => {
  const { incomingRequest } = useDriverRideStore();
  const { 
    notifyNewService, 
    playSound, 
    enableAudio,
    tryReenableAudio,
    hasPermission, 
    audioEnabled,
    audioPermissionGranted,
    hasTriedReactivation,
    requestNotificationPermission,
    isLoaded 
  } = useNotificationSound();
  const { toast } = useToast();

  // Efecto para verificar estado del conductor cuando cambia
  useEffect(() => {
    if (driver) {
      console.log('👤 Estado del conductor cargado:', {
        id: driver.id,
        name: driver.name,
        hasNotificationPreferences: !!driver.notificationPreferences,
        notificationPreferences: driver.notificationPreferences,
        localStorageAudio: localStorage.getItem('hellotaxi-audio-permission'),
      });
    }
  }, [driver]);

  // Efecto para detectar nuevas solicitudes
  useEffect(() => {
    console.log('🔍 useDriverNotifications - Estado actual:', {
      incomingRequest: !!incomingRequest,
      isLoaded,
      hasPermission,
      requestId: incomingRequest?.id
    });
    
    if (incomingRequest && isLoaded) {
      console.log('🚕 Nueva solicitud detectada, reproduciendo sonido...');
      handleNewServiceRequest(incomingRequest);
    }
  }, [incomingRequest, isLoaded]);

  const handleNewServiceRequest = async (request: any) => {
    console.log('🎵 Procesando nueva solicitud de servicio:', request);
    console.log('🔊 Estado de permisos:', { hasPermission, isLoaded });
    
    // Si no hay permisos, solicitar primero
    if (!hasPermission) {
      console.log('⚠️ No hay permisos, solicitando...');
      const granted = await requestNotificationPermission();
      if (!granted) {
        console.log('❌ Permisos denegados, usando fallback');
        // Fallback: solo sonido y toast
        const soundPlayed = await playSound({ volume: 0.8 });
        console.log('🔊 Sonido reproducido (fallback):', soundPlayed);
        toast({
          title: 'Nueva solicitud',
          description: `Recogida: ${request.pickup || request.pickupLocation || 'Ubicación no especificada'}`,
          duration: 10000,
          className: 'border-l-4 border-l-[#2E4CA6] bg-gradient-to-r from-blue-50 to-white',
        });
        return;
      }
    }

    // Preparar datos del servicio
    const serviceDetails = {
      pickup: request.pickup || request.pickupLocation || 'Ubicación no especificada',
      destination: request.dropoff || request.destinationLocation,
      fare: request.fare || request.negotiatedFare || request.initialFare,
      distance: request.distance ? `${request.distance} km` : undefined,
    };

    console.log('📋 Detalles del servicio preparados:', serviceDetails);

    // Enviar notificación completa con sonido
    console.log('🔔 Enviando notificación completa...');
    await notifyNewService(serviceDetails);

    // Log para debugging
    console.log('✅ Nueva solicitud de servicio procesada:', serviceDetails);
  };

  // Función mejorada para habilitar audio que sincroniza con BD
  const enableAudioWithDB = async (): Promise<boolean> => {
    console.log('🔊 Intentando habilitar audio con sincronización BD...');
    const success = await enableAudio();
    
    if (success && driver) {
      console.log('🔊 Audio habilitado, guardando en BD...', driver.id);
      try {
        await updateDriverNotificationPreferences(driver.id, {
          soundNotifications: true,
          browserNotifications: hasPermission || false,
          lastAudioPermissionGranted: new Date().toISOString(),
          deviceInfo: getCurrentDeviceInfo(),
        });
        
        console.log('✅ Preferencias guardadas en BD exitosamente');
      } catch (error) {
        console.error('❌ Error guardando preferencias en BD:', error);
      }
    } else {
      console.log('❌ No se pudo habilitar audio o no hay conductor');
    }
    
    return success;
  };

  // Función para sincronizar permisos de notificación con BD
  const updateNotificationPermissions = async (granted: boolean) => {
    if (driver) {
      console.log('🔔 Actualizando permisos de notificación en BD:', { granted, driverId: driver.id });
      try {
        await updateDriverNotificationPreferences(driver.id, {
          browserNotifications: granted,
          deviceInfo: getCurrentDeviceInfo(),
        });
        console.log('✅ Permisos de notificación actualizados en BD');
      } catch (error) {
        console.error('❌ Error actualizando permisos de notificación:', error);
      }
    }
  };

  // Verificar si debería intentar reactivar basado en BD
  const shouldAttemptReactivation = (): boolean => {
    if (!driver?.notificationPreferences) return false;
    
    return hasRecentAudioPermission(driver.notificationPreferences, 24) && 
           driver.notificationPreferences.soundNotifications;
  };

  const testNotification = async () => {
    const mockRequest = {
      id: 'test-123',
      pickupLocation: 'Av. Larco 1234, Miraflores',
      destinationLocation: 'Centro Comercial Larcomar',
      initialFare: 25,
      negotiatedFare: 30,
      distance: 3.2,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      passenger: {
        id: 'passenger-123',
        name: 'María García',
        email: 'maria@example.com',
        phone: '+51987654321',
      }
    };

    await handleNewServiceRequest(mockRequest);
  };

  return {
    hasPermission,
    audioEnabled,
    audioPermissionGranted,
    hasTriedReactivation,
    enableAudio: enableAudioWithDB, // Función mejorada con BD
    tryReenableAudio,
    requestNotificationPermission,
    updateNotificationPermissions,
    shouldAttemptReactivation,
    testNotification,
    isLoaded,
    playSound, // Exponer función de reproducir sonido
  };
};