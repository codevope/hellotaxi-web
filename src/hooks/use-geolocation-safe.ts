"use client";

import { useState, useEffect, useCallback } from 'react';
import { getBrowserCapabilities } from '@/lib/browser-capabilities';
import { GeocodingService } from '@/services/geocoding-service';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: number;
}

export interface UseGeolocationSafeReturn {
  location: LocationData | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  permissionStatus: PermissionState | null;
  canUseGeolocation: boolean;
  requestLocation: () => void;
}

// Ubicación por defecto para Lima, Perú (fallback)
const LIMA_DEFAULT_LOCATION: LocationData = {
  latitude: -12.0464,
  longitude: -77.0428,
  accuracy: 1000,
  address: 'Lima, Perú (ubicación aproximada)',
  timestamp: Date.now(),
};

export function useGeolocationSafe(): UseGeolocationSafeReturn {
  const [capabilities] = useState(getBrowserCapabilities());
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);

  const { canUseGeolocation } = capabilities;

  // Verificar permisos solo si es seguro
  useEffect(() => {
    if (canUseGeolocation && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
        setPermissionStatus(permission.state);
        
        const handleChange = () => setPermissionStatus(permission.state);
        permission.addEventListener('change', handleChange);
        return () => permission.removeEventListener('change', handleChange);
      }).catch(() => {
        // Ignorar errores de permisos en contextos no seguros
        console.log('No se pueden verificar permisos de geolocalización');
      });
    } else if (!canUseGeolocation) {
      // En contexto no seguro, usar ubicación por defecto
      console.log('Usando ubicación por defecto debido a contexto no seguro');
      setLocation(LIMA_DEFAULT_LOCATION);
    }
  }, [canUseGeolocation]);

  const requestLocation = useCallback(() => {
    if (!canUseGeolocation) {
      // En lugar de mostrar error, usar ubicación por defecto
      console.log('Geolocalización no disponible, usando ubicación por defecto');
      setLocation(LIMA_DEFAULT_LOCATION);
      return;
    }

    if (!('geolocation' in navigator)) {
      const geoError = {
        code: 0,
        message: 'La geolocalización no es soportada por este navegador.',
      } as GeolocationPositionError;
      setError(geoError);
      setLocation(LIMA_DEFAULT_LOCATION); // Fallback
      return;
    }

    setLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = Date.now();
        
        try {
          const address = await GeocodingService.reverseGeocode(latitude, longitude);
          setLocation({ latitude, longitude, accuracy, timestamp, address });
        } catch (geocodingError) {
          console.error("Geocoding failed:", geocodingError);
          // Fallback to coordinates if geocoding fails
          setLocation({
            latitude,
            longitude,
            accuracy,
            timestamp,
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation Error:', error);
        setError(error);
        setLoading(false);
        
        // En caso de error, usar ubicación por defecto
        setLocation(LIMA_DEFAULT_LOCATION);
      },
      options
    );
  }, [canUseGeolocation]);

  return {
    location,
    error,
    loading,
    permissionStatus,
    canUseGeolocation,
    requestLocation,
  };
}