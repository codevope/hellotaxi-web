"use client";

import { useEffect, useRef } from 'react';
import { useDriverRideStore } from '@/store/driver-ride-store';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot, query, collection, where, QuerySnapshot, DocumentChange, FirestoreError, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  updateDriverNotificationPreferences, 
  getCurrentDeviceInfo,
  hasRecentAudioPermission 
} from '@/lib/notification-preferences';
import type { Driver, EnrichedDriver, Ride } from '@/lib/types';

export const useDriverNotifications = (driver?: Driver | EnrichedDriver | null) => {
  const { incomingRequest } = useDriverRideStore();
  const { 
    notifyNewService, 
    playSound, 
    playNotificationSound, // Sonido específico para notificaciones
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
  
  // Ref para mantener el ID del ride activo previo
  const previousActiveRideId = useRef<string | null>(null);

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

  // Efecto para escuchar cancelaciones de viajes asignados al conductor
  useEffect(() => {
    if (!driver?.id) {
      console.log('🚫 No hay conductor ID, no se puede escuchar cancelaciones');
      return;
    }

    console.log('🔍 Configurando listener de cancelaciones para conductor:', driver.id);
    console.log('🔍 Driver data completa:', driver);

    // Escuchar todos los viajes donde este conductor está asignado
    const ridesQuery = query(
      collection(db, 'rides'),
      where('driver', '==', doc(db, 'drivers', driver.id))
    );

    console.log('🔍 Query configurado para escuchar viajes del conductor:', driver.id);

    const unsubscribe = onSnapshot(ridesQuery, (snapshot: QuerySnapshot) => {
      console.log('📡 [Driver Notifications] Snapshot recibido:', {
        docsCount: snapshot.docs.length,
        changesCount: snapshot.docChanges().length
      });

      snapshot.docChanges().forEach((change: DocumentChange) => {
        console.log('🔍 [Driver Notifications] Cambio detectado:', {
          type: change.type,
          docId: change.doc.id
        });

        if (change.type === 'modified') {
          const rideData = { id: change.doc.id, ...change.doc.data() } as Ride;
          
          console.log('🔍 [Driver Notifications] Viaje modificado:', {
            rideId: rideData.id,
            status: rideData.status,
            cancelledBy: rideData.cancelledBy,
            driverAssigned: driver.id
          });
          
          // Solo notificar si es una cancelación por pasajero
          if (rideData.status === 'cancelled' && rideData.cancelledBy === 'passenger') {
            console.log('❌ [Driver Notifications] CANCELACIÓN DETECTADA:', {
              rideId: rideData.id,
              reason: rideData.cancellationReason?.reason,
              cancelledBy: rideData.cancelledBy,
              driverAssigned: driver.id
            });
            
            handleRideCancellation(rideData);
          } else {
            console.log('ℹ️ [Driver Notifications] No es cancelación por pasajero, ignorando');
          }
        }
      });
    }, (error: FirestoreError) => {
      console.error('❌ [Driver Notifications] Error escuchando cancelaciones de viajes:', error);
    });

    // Cleanup
    return () => {
      console.log('🧹 Limpiando listener de cancelaciones para conductor:', driver.id);
      unsubscribe();
    };
  }, [driver?.id]);

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

  const handleRideCancellation = async (rideData: Ride) => {
    console.log('❌ Procesando cancelación de viaje por pasajero:', {
      rideId: rideData.id,
      cancelledBy: rideData.cancelledBy,
      reason: rideData.cancellationReason?.reason,
      cancelledAt: rideData.cancelledAt || new Date().toISOString(),
      pickup: rideData.pickup || rideData.pickupLocation
    });
    
    // Reproducir sonido de notificación específico (notification.mp3)
    console.log('🔔 Intentando reproducir sonido de notificación específico...');
    let soundPlayed = false;
    
    // Intentar primero con playNotificationSound
    if (playNotificationSound) {
      soundPlayed = await playNotificationSound({ volume: 1.0 });
      console.log('🔔 Resultado reproducción playNotificationSound:', soundPlayed);
    }
    
    // Si falló, usar playSound como fallback
    if (!soundPlayed && playSound) {
      soundPlayed = await playSound({ volume: 1.0 });
      console.log('🔊 Resultado reproducción playSound (fallback):', soundPlayed);
    }
    
    if (!soundPlayed) {
      console.log('⚠️ No se pudo reproducir ningún sonido - verificar permisos de audio');
    }
    
    // Cambiar estado del conductor a disponible
    if (driver?.id) {
      try {
        console.log('🔄 Cambiando estado del conductor a disponible...', {
          driverId: driver.id,
          driverName: driver.name
        });
        const driverRef = doc(db, 'drivers', driver.id);
        await updateDoc(driverRef, {
          status: 'available'
        });
        console.log('✅ Estado del conductor cambiado a disponible exitosamente');
      } catch (error) {
        console.error('❌ Error cambiando estado del conductor:', error);
        console.error('❌ Driver data:', driver);
      }
    } else {
      console.log('⚠️ No se puede cambiar estado: driver o driver.id no disponible', {
        hasDriver: !!driver,
        driverId: driver?.id
      });
    }
    
    // Preparar mensaje detallado
    const cancellationMessage = rideData.cancellationReason?.reason || 'No se especificó motivo';
    const pickupInfo = rideData.pickup || (rideData.pickupLocation ? `Lat: ${rideData.pickupLocation.lat}, Lng: ${rideData.pickupLocation.lng}` : '');
    
    // Mostrar notificación toast prominente con más información
    console.log('📱 Mostrando toast de cancelación...');
    toast({
      title: '🚫 Viaje Cancelado por Pasajero',
      description: `${cancellationMessage}${pickupInfo ? `\nRecogida: ${pickupInfo}` : ''}\n📍 Estado: Disponible nuevamente`,
      duration: 25000, // 25 segundos para que el conductor tenga tiempo de leer
      className: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white shadow-lg',
      variant: 'destructive'
    });

    // Enviar notificación del navegador si están habilitadas
    if (hasPermission && 'Notification' in window) {
      try {
        console.log('🔔 Enviando notificación del navegador...');
        const notification = new Notification('🚫 Viaje Cancelado - HelloTaxi', {
          body: `El pasajero canceló el viaje.\nMotivo: ${cancellationMessage}${pickupInfo ? `\nRecogida: ${pickupInfo}` : ''}`,
          icon: '/icons/android/android-chrome-192x192.png',
          badge: '/icons/android/android-chrome-96x96.png',
          tag: `ride-cancellation-${rideData.id}`,
          requireInteraction: true
        });

        // Auto-cerrar después de 20 segundos
        setTimeout(() => {
          notification.close();
        }, 20000);

        console.log('🔔 Notificación del navegador enviada para cancelación');
      } catch (error) {
        console.error('❌ Error enviando notificación del navegador:', error);
      }
    } else {
      console.log('🔔 Notificaciones del navegador no disponibles o sin permisos');
    }

    // Log detallado para debugging
    console.log('✅ Notificación de cancelación procesada completamente:', {
      soundPlayed,
      hasPermission,
      notificationSupported: 'Notification' in window,
      cancellationDetails: {
        rideId: rideData.id,
        reason: cancellationMessage,
        pickup: pickupInfo,
        cancelledAt: rideData.cancelledAt
      }
    });
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
    testCancellationNotification, // Nueva función para probar cancelaciones
    isLoaded,
    playSound, // Exponer función de reproducir sonido
  };
};