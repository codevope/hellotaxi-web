import { useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Location } from '@/lib/types';
import { getSettings } from '@/services/settings-service';
import { useGeolocation } from '@/hooks/geolocation/use-geolocation';

interface UseDriverAvailabilityLocationParams {
  driverId?: string;
  isAvailable: boolean;
}

/**
 * Hook para actualizar la ubicación del conductor cuando está disponible (sin viaje activo)
 * Retorna la ubicación actual del conductor para mostrar en el mapa
 */
export function useDriverAvailabilityLocation({ 
  driverId, 
  isAvailable 
}: UseDriverAvailabilityLocationParams): Location | null {
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<number>(15000);
  const lastLocationRef = useRef<Location | null>(null);
  const geoRequestCountRef = useRef<number>(0);
  const lastGeoRequestTimeRef = useRef<number>(0);
  const currentLocationRef = useRef<Location | null>(null);

  // Usar el hook mejorado de geolocalización con fallback automático
  const { location: geoLocation, error: geoError, requestLocation } = useGeolocation();

  // Cargar intervalo de actualización desde Firebase
  useEffect(() => {
    const loadUpdateInterval = async () => {
      try {
        const settings = await getSettings();
        updateIntervalRef.current = (settings.locationUpdateInterval || 15) * 1000;
        console.log('[AVAILABLE DRIVER] Intervalo de actualización:', updateIntervalRef.current / 1000, 'segundos');
      } catch (error) {
        console.error('[AVAILABLE DRIVER] Error loading location update interval:', error);
        updateIntervalRef.current = 15000; // Usar default si hay error
      }
    };

    loadUpdateInterval();
  }, []);

  // Guardar ubicación en Firebase cuando el conductor está disponible
  useEffect(() => {
    if (!driverId || !isAvailable) {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
      geoRequestCountRef.current = 0;
      return;
    }

    if (!navigator.geolocation) {
      console.warn('[AVAILABLE DRIVER] Geolocation API no está disponible');
      return;
    }

    const updateDriverLocationInFirebase = async () => {
      if (!geoLocation) {
        console.log('[AVAILABLE DRIVER] ⏳ Sin ubicación aún, esperando...');
        return;
      }

      const newLocation: Location = {
        lat: geoLocation.latitude,
        lng: geoLocation.longitude,
      };

      // Actualizar referencia local para retornar en el hook
      currentLocationRef.current = newLocation;

      // No actualizar si es la misma ubicación
      if (lastLocationRef.current && 
          lastLocationRef.current.lat === newLocation.lat &&
          lastLocationRef.current.lng === newLocation.lng) {
        console.log('[AVAILABLE DRIVER] 📍 Ubicación sin cambios, omitiendo actualización');
        return;
      }

      try {
        const driverRef = doc(db, 'drivers', driverId);
        await updateDoc(driverRef, { location: newLocation });
        lastLocationRef.current = newLocation;
        console.log('[AVAILABLE DRIVER] ✅ Ubicación actualizada en Firebase:', newLocation);
      } catch (error) {
        console.error('[AVAILABLE DRIVER] ❌ Error actualizando ubicación en Firebase:', error);
      }
    };

    // Actualizar inmediatamente si tenemos ubicación
    if (geoLocation) {
      updateDriverLocationInFirebase();
    }

    // Configurar intervalo para actualizar periódicamente
    // Pero evitar llamar requestLocation demasiado frecuentemente
    locationUpdateIntervalRef.current = setInterval(() => {
      // Actualizar ubicación existente en Firebase
      updateDriverLocationInFirebase();
      
      // Solo pedir nueva ubicación cada 3 intervalos (para evitar timeouts)
      geoRequestCountRef.current++;
      if (geoRequestCountRef.current >= 3) {
        const now = Date.now();
        // Solo si pasaron al menos 45 segundos desde la última solicitud
        if (now - lastGeoRequestTimeRef.current > 45000) {
          console.log('[AVAILABLE DRIVER] 🔄 Solicitando ubicación fresca...');
          lastGeoRequestTimeRef.current = now;
          geoRequestCountRef.current = 0;
          requestLocation();
        }
      }
    }, updateIntervalRef.current);

    // Pedir ubicación inicial
    console.log('[AVAILABLE DRIVER] 🔄 Solicitando ubicación inicial...');
    lastGeoRequestTimeRef.current = Date.now();
    requestLocation();

    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
    };
  }, [driverId, isAvailable, geoLocation, requestLocation]);

  // Registrar errores de geolocalización (sin spam)
  useEffect(() => {
    if (geoError && geoError.code === 1) {
      // Solo mostrar permiso denegado una vez
      console.warn('[AVAILABLE DRIVER] ❌ Permiso de ubicación denegado');
    }
  }, [geoError?.code]);

  // Retornar la ubicación actual del conductor
  return currentLocationRef.current;
}
