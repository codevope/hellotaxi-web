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

    if (incomingRequest && isLoaded) {
      handleNewServiceRequest(incomingRequest);
    }
  }, [incomingRequest, isLoaded]);

  // Efecto para escuchar cancelaciones de viajes asignados al conductor
  useEffect(() => {
    if (!driver?.id) {
      return;
    }

    // Escuchar todos los viajes donde este conductor está asignado
    const ridesQuery = query(
      collection(db, 'rides'),
      where('driver', '==', doc(db, 'drivers', driver.id))
    );

    const unsubscribe = onSnapshot(ridesQuery, (snapshot: QuerySnapshot) => {
      snapshot.docChanges().forEach((change: DocumentChange) => {


        if (change.type === 'modified') {
          const rideData = { id: change.doc.id, ...change.doc.data() } as Ride;
          
          // Solo notificar si es una cancelación por pasajero
          if (rideData.status === 'cancelled' && rideData.cancelledBy === 'passenger') {

            handleRideCancellation(rideData);
          } else {
            console.log('[Driver Notifications] No es cancelación por pasajero, ignorando');
          }
        }
      });
    }, (error: FirestoreError) => {
      console.error('[Driver Notifications] Error escuchando cancelaciones de viajes:', error);
    });

    // Cleanup
    return () => {
      console.log('🧹 Limpiando listener de cancelaciones para conductor:', driver.id);
      unsubscribe();
    };
  }, [driver?.id]);

  const handleNewServiceRequest = async (request: any) => {

    // Preparar datos del servicio
    const serviceDetails = {
      pickup: request.pickup || request.pickupLocation || 'Ubicación no especificada',
      destination: request.dropoff || request.destinationLocation,
      fare: request.fare || request.negotiatedFare || request.initialFare,
      distance: request.distance ? `${request.distance} km` : undefined,
    };

    // Mostrar toast
    toast({
      title: '🚕 Nueva solicitud de servicio',
      description: `Recogida: ${serviceDetails.pickup}${serviceDetails.destination ? `\nDestino: ${serviceDetails.destination}` : ''}${serviceDetails.fare ? `\nTarifa: S/ ${serviceDetails.fare}` : ''}`,
      duration: 10000,
      className: 'border-l-4 border-l-[#2E4CA6] bg-gradient-to-r from-blue-50 to-white',
    });

    // Mostrar notificación nativa si hay permisos
    if (hasPermission && 'Notification' in window) {
      try {
        const notification = new Notification('🚕 Nueva Solicitud - HelloTaxi', {
          body: `Recogida: ${serviceDetails.pickup}${serviceDetails.destination ? `\nDestino: ${serviceDetails.destination}` : ''}${serviceDetails.fare ? `\nTarifa: S/ ${serviceDetails.fare}` : ''}`,
          icon: '/icons/android/android-launchericon-192-192.png',
          badge: '/icons/android/android-launchericon-96-96.png',
          tag: `new-service-${request.id}`,
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto-cerrar después de 10 segundos
        setTimeout(() => notification.close(), 10000);
      } catch (error) {
        console.error('[Driver] Error mostrando notificación nativa:', error);
      }
    }

    // Reproducir sonido específico para nueva solicitud (taxi.mp3)
    if (audioEnabled) {
      try {
        const soundResult = await playNotificationSound({ 
          volume: 0.8,
          soundFile: 'taxi'
        });
        console.log('[Driver] Resultado reproducción sonido:', soundResult);
      } catch (error) {
        console.error('[Driver] Error reproduciendo sonido:', error);
      }
    } else {
      console.log('[Driver] Audio no habilitado, sonido no reproducido');
    }

    // Log para debugging
    console.log('Nueva solicitud de servicio procesada:', serviceDetails);
  };

  const handleRideCancellation = async (rideData: Ride) => {


    // Cambiar estado del conductor a disponible
    if (driver?.id) {
      try {
        const driverRef = doc(db, 'drivers', driver.id);
        await updateDoc(driverRef, {
          status: 'available'
        });
      } catch (error) {
        console.error('Error cambiando estado del conductor:', error);
      }
    } else {
      console.log('No se puede cambiar estado: driver o driver.id no disponible', {
        hasDriver: !!driver,
        driverId: driver?.id
      });
    }
    
    // Preparar mensaje detallado
    const cancellationMessage = rideData.cancellationReason?.reason || 'No se especificó motivo';
    const pickupInfo = rideData.pickup || (rideData.pickupLocation ? `Lat: ${rideData.pickupLocation.lat}, Lng: ${rideData.pickupLocation.lng}` : '');
    
    // Mostrar notificación toast prominente con más información
    toast({
      title: 'Viaje Cancelado por Pasajero',
      description: `${cancellationMessage}${pickupInfo ? `\nRecogida: ${pickupInfo}` : ''}\n📍 Estado: Disponible nuevamente`,
      duration: 25000, // 25 segundos para que el conductor tenga tiempo de leer
      className: 'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white shadow-lg',
      variant: 'destructive'
    });

    // Reproducir sonido específico para cancelación (notification.mp3)
    if (audioEnabled) {
      try {
        const soundResult = await playNotificationSound({ 
          volume: 0.8,
          soundFile: 'notification' // Sonido específico para cancelación
        });
      } catch (error) {
        console.error('[Driver] Error reproduciendo sonido:', error);
      }
    } else {
      console.log('[Driver] Audio no habilitado, sonido no reproducido');
    }

    // Enviar notificación del navegador si están habilitadas
    if (hasPermission && 'Notification' in window) {
      try {
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

        console.log('Notificación del navegador enviada para cancelación');
      } catch (error) {
        console.error('Error enviando notificación del navegador:', error);
      }
    } else {
      console.log('Notificaciones del navegador no disponibles o sin permisos');
    }

  };

  // Función mejorada para habilitar audio que sincroniza con BD
  const enableAudioWithDB = async (): Promise<boolean> => {
    const success = await enableAudio();
    
    if (success && driver) {
      try {
        await updateDriverNotificationPreferences(driver.id, {
          soundNotifications: true,
          browserNotifications: hasPermission || false,
          lastAudioPermissionGranted: new Date().toISOString(),
          deviceInfo: getCurrentDeviceInfo(),
        });

      } catch (error) {
        console.error('Error guardando preferencias en BD:', error);
      }
    } else {
      console.log('No se pudo habilitar audio o no hay conductor');
    }
    
    return success;
  };

  // Función para sincronizar permisos de notificación con BD
  const updateNotificationPermissions = async (granted: boolean) => {
    if (driver) {
      try {
        await updateDriverNotificationPreferences(driver.id, {
          browserNotifications: granted,
          deviceInfo: getCurrentDeviceInfo(),
        });
      } catch (error) {
        console.error('Error actualizando permisos de notificación:', error);
      }
    }
  };

  // Verificar si debería intentar reactivar basado en BD
  const shouldAttemptReactivation = (): boolean => {
    if (!driver?.notificationPreferences) return false;
    
    return hasRecentAudioPermission(driver.notificationPreferences, 24) && 
           driver.notificationPreferences.soundNotifications;
  };


  return {
    hasPermission,
    audioEnabled,
    audioPermissionGranted,
    hasTriedReactivation,
    enableAudio: enableAudioWithDB,
    tryReenableAudio,
    requestNotificationPermission,
    updateNotificationPermissions,
    shouldAttemptReactivation,
    isLoaded,
    playSound,
  };
};