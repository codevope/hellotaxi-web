import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, collection, where, query, onSnapshot, getDoc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDriverRideStore } from '@/store/driver-ride-store';
import type { Ride, User, EnrichedDriver, Location } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/geolocation/use-geolocation';
import { getSettings } from '@/services/settings-service';

export interface EnrichedRide extends Omit<Ride, 'passenger' | 'driver'> {
  passenger: User;
  driver: EnrichedDriver;
}

interface UseDriverActiveRideParams {
  driver?: EnrichedDriver | null;
  setAvailability: (v: boolean) => void;
}

export function useDriverActiveRide({ driver, setAvailability }: UseDriverActiveRideParams) {
  const { activeRide, setActiveRide } = useDriverRideStore();
  const [completedRideForRating, setCompletedRideForRating] = useState<EnrichedRide | null>(null);
  const [isCompletingRide, setIsCompletingRide] = useState(false);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [updateInterval, setUpdateInterval] = useState(15000); // Default 15 segundos en ms
  const { toast } = useToast();
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<Location | null>(null);
  const geoRequestCountRef = useRef<number>(0);
  const lastGeoRequestTimeRef = useRef<number>(0);

  // Usar el hook mejorado de geolocalización con fallback automático
  const { location: geoLocation, error: geoError, requestLocation } = useGeolocation();

  // Cargar intervalo de actualización desde Firebase
  useEffect(() => {
    async function loadUpdateInterval() {
      try {
        const settings = await getSettings();
        // Convertir de segundos a milisegundos
        setUpdateInterval((settings.locationUpdateInterval || 15) * 1000);
      } catch (error) {
        console.error('[ACTIVE RIDE] Error loading location update interval:', error);
      }
    }
    loadUpdateInterval();
  }, []);

  // 📍 Actualizar ubicación del conductor en Firestore durante viajes activos
  useEffect(() => {
    if (!driver || !activeRide) {
      // Limpiar intervalo si no hay conductor o viaje activo
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
      geoRequestCountRef.current = 0;
      lastLocationRef.current = null;
      return;
    }

    if (!navigator.geolocation) {
      console.warn('[ACTIVE RIDE] Geolocation API no está disponible');
      return;
    }

    const updateDriverLocationInFirebase = async () => {
      if (!geoLocation) {
        console.log('[ACTIVE RIDE] ⏳ Sin ubicación aún, esperando...');
        return;
      }

      const newLocation: Location = {
        lat: geoLocation.latitude,
        lng: geoLocation.longitude,
      };

      // No actualizar si es la misma ubicación
      if (lastLocationRef.current && 
          lastLocationRef.current.lat === newLocation.lat &&
          lastLocationRef.current.lng === newLocation.lng) {
        console.log('[ACTIVE RIDE] 📍 Ubicación sin cambios, omitiendo actualización');
        return;
      }

      try {
        const driverRef = doc(db, 'drivers', driver.id);
        await updateDoc(driverRef, { location: newLocation });
        setDriverLocation(newLocation); // Actualizar estado local
        lastLocationRef.current = newLocation;
        console.log('[ACTIVE RIDE] ✅ Ubicación actualizada en Firebase:', newLocation);
      } catch (error) {
        console.error('[ACTIVE RIDE] ❌ Error actualizando ubicación:', error);
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
          console.log('[ACTIVE RIDE] 🔄 Solicitando ubicación fresca...');
          lastGeoRequestTimeRef.current = now;
          geoRequestCountRef.current = 0;
          requestLocation();
        }
      }
    }, updateInterval);

    // Pedir ubicación inicial
    console.log('[ACTIVE RIDE] 🔄 Solicitando ubicación inicial...');
    lastGeoRequestTimeRef.current = Date.now();
    requestLocation();

    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
    };
  }, [driver, activeRide, geoLocation, requestLocation, updateInterval]);

  // Listener principal para viajes activos
  useEffect(() => {
    if (!driver) return;
    const driverRef = doc(db, 'drivers', driver.id);

    const q = query(collection(db, 'rides'), where('driver', '==', driverRef), where('status', 'in', ['accepted','arrived','in-progress','completed']));

    const unsubscribe = onSnapshot(q, async (snapshot) => {


      if (!snapshot.empty) {
        const rideDoc = snapshot.docs.find(d => d.data().status !== 'completed');


        if (!rideDoc) {
          // Verificar si el viaje completado corresponde al activo anterior para iniciar rating
          if (useDriverRideStore.getState().activeRide !== null) {
            const completedRideDoc = snapshot.docs.find(d => d.data().status === 'completed' && d.id === useDriverRideStore.getState().activeRide?.id);
            if (completedRideDoc) {
              const rideData = { id: completedRideDoc.id, ...completedRideDoc.data() } as Ride;
              const passengerSnap = await getDoc(rideData.passenger);
              if (passengerSnap.exists() && driver) {
                setCompletedRideForRating({
                  ...(rideData as any),
                  driver,
                  passenger: passengerSnap.data() as User,
                });
              }
            }
            setActiveRide(null);
          }
          return;
        }

        const rideData = { id: rideDoc.id, ...rideDoc.data() } as Ride;

        if (rideData.passenger && driver) {
          const passengerSnap = await getDoc(rideData.passenger);
          if (passengerSnap.exists()) {
            const passengerData = passengerSnap.data() as User;
            const { driver: _driverRef, passenger: _passengerRef, ...rest } = rideData as any;
            const enriched: EnrichedRide = { ...rest, driver, passenger: passengerData };
            setActiveRide(enriched);
          }
        }
      } else {
        if (useDriverRideStore.getState().activeRide !== null) {
          setActiveRide(null);
        }
      }
    });

    return () => unsubscribe();
  }, [driver, setActiveRide]);

  const updateRideStatus = useCallback(async (ride: EnrichedRide, newStatus: 'arrived' | 'in-progress' | 'completed') => {
    setIsCompletingRide(true);
    try {
      const rideRef = doc(db, 'rides', ride.id);
      const driverRef = doc(db, 'drivers', ride.driver.id);
      
      if (newStatus === 'completed') {
        console.log('[ACTIVE RIDE] Completando viaje con batch...');
        const batch = writeBatch(db);
        batch.update(rideRef, { status: 'completed' });
        batch.update(driverRef, { status: 'available' });
        batch.update(doc(db, 'users', ride.passenger.id), { increment: 1 });
        await batch.commit();
        console.log('[ACTIVE RIDE] Batch completado exitosamente');
        toast({ title: '¡Viaje Finalizado!', description: 'Ahora califica al pasajero.' });
        setAvailability(true);
      } else {
        await updateDoc(rideRef, { status: newStatus });
        
        // Mensajes específicos según el estado
        const statusMessages = {
          'arrived': { title: 'Llegada Confirmada', description: 'Has marcado que llegaste al punto de recojo' },
          'in-progress': { title: 'Viaje Iniciado', description: 'El viaje ha comenzado oficialmente' }
        };
        
        if (statusMessages[newStatus]) {
          toast(statusMessages[newStatus]);
        }
      }
    } catch (e) {
      console.error('[ACTIVE RIDE] Error updating ride status:', e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado del viaje.' });
    } finally {
      setIsCompletingRide(false);
      console.log('[ACTIVE RIDE] Proceso finalizado');
    }
  }, [toast, setAvailability]);

  return {
    activeRide,
    completedRideForRating,
    setCompletedRideForRating,
    updateRideStatus,
    isCompletingRide,
    driverLocation,
  };
}
