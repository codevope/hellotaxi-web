
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GeocodingService } from '@/services/geocoding-service';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: number;
}

export interface UseGeolocationReturn {
  location: LocationData | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  permissionStatus: PermissionState | null;
  requestLocation: () => void;
}

const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000, // 10 segundos - más tolerante
  maximumAge: 30000, // Aceptar ubicación en caché de hasta 30 segundos
};

const LOW_ACCURACY_FALLBACK_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8000, // 8 segundos - más rápido
  maximumAge: 60000, // Aceptar ubicación más antigua
};


export function useGeolocation(
  options: PositionOptions = HIGH_ACCURACY_OPTIONS
): UseGeolocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  
  // Referencias para evitar llamadas repetidas muy rápido
  const lastRequestTimeRef = useRef<number>(0);
  const pendingRequestRef = useRef<boolean>(false);
  const MIN_REQUEST_INTERVAL = 5000; // Mínimo 5 segundos entre solicitudes

  const isSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

  useEffect(() => {
    if (isSupported && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
        setPermissionStatus(permission.state);
        
        const handleChange = () => setPermissionStatus(permission.state);
        permission.addEventListener('change', handleChange);
        return () => permission.removeEventListener('change', handleChange);
      });
    }
  }, [isSupported]);

  const requestLocation = useCallback(() => {
    // Evitar llamadas demasiado frecuentes
    const now = Date.now();
    if (pendingRequestRef.current) {
      console.log('[GEOLOCATION] ⏳ Solicitud ya en progreso, ignorando');
      return;
    }
    
    if (now - lastRequestTimeRef.current < MIN_REQUEST_INTERVAL) {
      console.log(`[GEOLOCATION] ⏳ Esperando ${Math.ceil((MIN_REQUEST_INTERVAL - (now - lastRequestTimeRef.current)) / 1000)}s para nueva solicitud...`);
      return;
    }

    if (!isSupported) {
      setError({
        code: 0,
        message: 'La geolocalización no es soportada por este navegador.',
      } as GeolocationPositionError);
      return;
    }

    pendingRequestRef.current = true;
    lastRequestTimeRef.current = now;
    setLoading(true);
    setError(null);

    // Variable para rastrear si ya se obtuvo una ubicación
    let locationObtained = false;

    // Intentar primero con alta precisión
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        locationObtained = true;
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = Date.now();
        
        try {
          const address = await GeocodingService.reverseGeocode(latitude, longitude);
          setLocation({ latitude, longitude, accuracy, timestamp, address });
          console.log('[GEOLOCATION] ✅ Ubicación obtenida (ALTA PRECISIÓN):', { latitude, longitude, accuracy: `${accuracy}m` });
        } catch (geocodingError) {
          console.warn("[GEOLOCATION] ⚠️ Geocoding falló, usando coordenadas");
          setLocation({
            latitude,
            longitude,
            accuracy,
            timestamp,
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          });
        } finally {
          setLoading(false);
          pendingRequestRef.current = false;
        }
      },
      (error) => {
        // Si hubo timeout y no obtuvimos ubicación, intentar con baja precisión
        if (error.code === 3 && !locationObtained) {
          console.log('[GEOLOCATION] ⏱️ Timeout en alta precisión, intentando fallback de baja precisión...');
          
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              locationObtained = true;
              const { latitude, longitude, accuracy } = position.coords;
              const timestamp = Date.now();
              
              try {
                const address = await GeocodingService.reverseGeocode(latitude, longitude);
                setLocation({ latitude, longitude, accuracy, timestamp, address });
                console.log('[GEOLOCATION] ✅ Ubicación obtenida (BAJA PRECISIÓN - FALLBACK):', { latitude, longitude, accuracy: `${accuracy}m` });
              } catch (geocodingError) {
                console.warn("[GEOLOCATION] ⚠️ Geocoding falló en fallback, usando coordenadas");
                setLocation({
                  latitude,
                  longitude,
                  accuracy,
                  timestamp,
                  address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
                });
              } finally {
                setLoading(false);
                pendingRequestRef.current = false;
              }
            },
            (fallbackError) => {
              // Si fallback también falla, mostrar el error original
              const errorMessages: Record<number, string> = {
                1: 'PERMISO DENEGADO: El usuario denegó el acceso a la ubicación. Por favor, habilita los permisos de ubicación en tu navegador.',
                2: 'POSICIÓN NO DISPONIBLE: No se pudo obtener la ubicación. Intenta en un lugar con mejor cobertura de señal.',
                3: 'TIMEOUT: La solicitud de geolocalización tardó demasiado. Intenta nuevamente.',
              };

              const errorMessage = errorMessages[fallbackError.code] || `Error de geolocalización desconocido (Código: ${fallbackError.code})`;
              
              console.log(`[GEOLOCATION] ❌ ${errorMessage}`);
              console.log('[GEOLOCATION] Detalles del error:', {
                code: fallbackError.code,
                message: fallbackError.message,
                timestamp: new Date().toISOString(),
                intentoFallback: true,
              });

              setError(fallbackError);
              setLoading(false);
              pendingRequestRef.current = false;
            },
            LOW_ACCURACY_FALLBACK_OPTIONS
          );
        } else {
          // Error que no es timeout o ya tenemos ubicación
          const errorMessages: Record<number, string> = {
            1: 'PERMISO DENEGADO: El usuario denegó el acceso a la ubicación. Por favor, habilita los permisos de ubicación en tu navegador.',
            2: 'POSICIÓN NO DISPONIBLE: No se pudo obtener la ubicación. Intenta en un lugar con mejor cobertura de señal.',
            3: 'TIMEOUT: La solicitud de geolocalización tardó demasiado. Intenta nuevamente.',
          };

          const errorMessage = errorMessages[error.code] || `Error de geolocalización desconocido (Código: ${error.code})`;
          
          console.log(`[GEOLOCATION] ❌ ${errorMessage}`);
          console.log('[GEOLOCATION] Detalles del error:', {
            code: error.code,
            message: error.message,
            timestamp: new Date().toISOString(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
          });

          setError(error);
          setLoading(false);
          pendingRequestRef.current = false;
        }
      },
      HIGH_ACCURACY_OPTIONS
    );
  }, [isSupported]);


  return {
    location,
    error,
    loading,
    permissionStatus,
    requestLocation,
  };
}
