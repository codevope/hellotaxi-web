import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, collection, where, query, onSnapshot, getDoc, updateDoc, writeBatch, increment, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDriverRideStore } from '@/store/driver-ride-store';
import type { Ride, User, EnrichedDriver, Location } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 📍 Actualizar ubicación del conductor en Firestore cada 60 segundos
  useEffect(() => {
    if (!driver || !activeRide) {
      // Limpiar intervalo si no hay conductor o viaje activo
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
      return;
    }

    const updateDriverLocation = async () => {
      if (!navigator.geolocation) return;
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          try {
            const driverRef = doc(db, 'drivers', driver.id);
            await updateDoc(driverRef, { location: newLocation });
            setDriverLocation(newLocation); // Actualizar estado local
            console.log('📍 [DRIVER] Ubicación actualizada:', newLocation);
          } catch (error) {
            console.error('❌ [DRIVER] Error actualizando ubicación:', error);
          }
        },
        (error) => {
          console.error('❌ [DRIVER] Error obteniendo geolocalización:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // Actualizar inmediatamente
    updateDriverLocation();

    // Configurar intervalo de 60 segundos (1 minuto)
    locationUpdateIntervalRef.current = setInterval(updateDriverLocation, 60000);

    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
    };
  }, [driver, activeRide]);

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
        const batch = writeBatch(db);
        batch.update(rideRef, { status: 'completed' });
        batch.update(driverRef, { status: 'available' });
        batch.update(doc(db, 'users', ride.passenger.id), { totalRides: increment(1) });
        await batch.commit();
        toast({ title: '¡Viaje Finalizado!', description: 'Ahora califica al pasajero.' });
        setAvailability(true);
      } else {
        await updateDoc(rideRef, { status: newStatus });
        
        // Mensajes específicos según el estado
        const statusMessages = {
          'arrived': { title: '✅ Llegada Confirmada', description: 'Has marcado que llegaste al punto de recojo' },
          'in-progress': { title: '🚗 Viaje Iniciado', description: 'El viaje ha comenzado oficialmente' }
        };
        
        if (statusMessages[newStatus]) {
          toast(statusMessages[newStatus]);
        }
      }
    } catch (e) {
      console.error('Error updating ride status:', e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado del viaje.' });
    } finally {
      setIsCompletingRide(false);
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
