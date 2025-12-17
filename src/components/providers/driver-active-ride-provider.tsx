'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { doc, collection, where, query, onSnapshot, getDoc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDriverRideStore } from '@/store/driver-ride-store';
import type { Ride, User, EnrichedDriver, Location } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useDriverAuth } from '@/hooks/auth/use-driver-auth';
import { getSettings } from '@/services/settings-service';

export interface EnrichedRide extends Omit<Ride, 'passenger' | 'driver'> {
  passenger: User;
  driver: EnrichedDriver;
}

interface DriverActiveRideContextType {
  activeRide: EnrichedRide | null;
  completedRideForRating: EnrichedRide | null;
  setCompletedRideForRating: (ride: EnrichedRide | null) => void;
  updateRideStatus: (ride: EnrichedRide, newStatus: 'arrived' | 'in-progress' | 'completed') => Promise<void>;
  isCompletingRide: boolean;
  driverLocation: Location | null;
}

const DriverActiveRideContext = createContext<DriverActiveRideContextType | null>(null);

export function useDriverActiveRideContext() {
  const context = useContext(DriverActiveRideContext);
  if (!context) {
    throw new Error('useDriverActiveRideContext must be used within DriverActiveRideProvider');
  }
  return context;
}

interface DriverActiveRideProviderProps {
  children: React.ReactNode;
}

export function DriverActiveRideProvider({ children }: DriverActiveRideProviderProps) {
  const { driver } = useDriverAuth();
  const { activeRide, setActiveRide } = useDriverRideStore();
  const [completedRideForRating, setCompletedRideForRating] = useState<EnrichedRide | null>(null);
  const [isCompletingRide, setIsCompletingRide] = useState(false);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [updateInterval, setUpdateInterval] = useState(15000); // Default 15 segundos en ms
  const { toast } = useToast();
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar intervalo de actualización desde Firebase
  useEffect(() => {
    async function loadUpdateInterval() {
      try {
        const settings = await getSettings();
        // Convertir de segundos a milisegundos
        setUpdateInterval((settings.locationUpdateInterval || 15) * 1000);
      } catch (error) {
        console.error('Error loading location update interval:', error);
      }
    }
    loadUpdateInterval();
  }, []);

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
            setDriverLocation(newLocation);
          } catch (error) {
            console.error(' [PROVIDER] Error actualizando ubicación:', error);
          }
        },
        (error) => {
          console.error(' [PROVIDER] Error obteniendo geolocalización:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // Actualizar inmediatamente
    updateDriverLocation();

    // Configurar intervalo usando el valor de Firebase (en milisegundos)
    locationUpdateIntervalRef.current = setInterval(updateDriverLocation, updateInterval);

    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
    };
  }, [driver, activeRide, updateInterval]);

  // 🎧 Listener principal para viajes activos con detección de cancelación
  useEffect(() => {
    if (!driver) {
      return;
    }

    const driverRef = doc(db, 'drivers', driver.id);
    
    // Query para viajes activos (sin cancelled)
    const q = query(
      collection(db, 'rides'), 
      where('driver', '==', driverRef), 
      where('status', 'in', ['accepted', 'arrived', 'in-progress', 'completed'])
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {

      // Buscar viaje activo (solo accepted, arrived, in-progress)
      if (!snapshot.empty) {
        const rideDoc = snapshot.docs.find(d => 
          ['accepted', 'arrived', 'in-progress'].includes(d.data().status)
        );


        if (!rideDoc) {
          // Verificar si el viaje completado corresponde al activo anterior para iniciar rating
          const currentActiveRide = useDriverRideStore.getState().activeRide;
          if (currentActiveRide) {
            const completedRideDoc = snapshot.docs.find(
              d => d.data().status === 'completed' && d.id === currentActiveRide.id
            );
            
            if (completedRideDoc) {
              // Viaje completado - mostrar para rating
              const rideData = { id: completedRideDoc.id, ...completedRideDoc.data() } as Ride;
              const passengerSnap = await getDoc(rideData.passenger);
              
              if (passengerSnap.exists() && driver) {
                setCompletedRideForRating({
                  ...(rideData as any),
                  driver,
                  passenger: passengerSnap.data() as User,
                });
              }
              setActiveRide(null);
            } else {
              // No hay viaje completado - fue cancelado
              toast({
                title: 'Viaje Cancelado',
                description: 'El pasajero canceló el viaje.',
                duration: 6000,
                variant: 'destructive',
              });
              
              const audio = new Audio('/sounds/error.mp3');
              audio.volume = 0.7;
              audio.play().catch(e => console.error('Error sonido:', e));
              
              setActiveRide(null);
              
              // Restaurar disponibilidad
              useDriverRideStore.getState().setAvailability(true);
              
              // Actualizar estado del conductor en Firestore
              const driverRef = doc(db, 'drivers', driver.id);
              updateDoc(driverRef, { status: 'available' }).catch(err => 
                console.error('Error actualizando estado del conductor:', err)
              );
            }
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
        const currentActiveRide = useDriverRideStore.getState().activeRide;
        if (currentActiveRide) {
          setActiveRide(null);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [driver, setActiveRide, toast]);



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
        useDriverRideStore.getState().setAvailability(true);
      } else {
        await updateDoc(rideRef, { status: newStatus });
        
        // Mensajes específicos según el estado
        const statusMessages = {
          'arrived': { title: ' Llegada Confirmada', description: 'Has marcado que llegaste al punto de recojo' },
          'in-progress': { title: 'Viaje Iniciado', description: 'El viaje ha comenzado oficialmente' }
        };
        
        if (statusMessages[newStatus]) {
          toast(statusMessages[newStatus]);
        }
      }
    } catch (e) {
      console.error(' [PROVIDER] Error updating ride status:', e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado del viaje.' });
    } finally {
      setIsCompletingRide(false);
    }
  }, [toast]);

  const contextValue: DriverActiveRideContextType = {
    activeRide,
    completedRideForRating,
    setCompletedRideForRating,
    updateRideStatus,
    isCompletingRide,
    driverLocation,
  };

  return (
    <DriverActiveRideContext.Provider value={contextValue}>
      {children}
    </DriverActiveRideContext.Provider>
  );
}
