"use client";

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, Ride, Driver } from '@/lib/types';

/**
 * HOOK DE LÓGICA DE NEGOCIO PARA RIDERS
 * 
 * Hook headless que maneja toda la lógica de negocio de los pasajeros
 * separada de la UI para mejor testabilidad y reutilización.
 */

interface UseRideLogicProps {
  user: User | null;
  initialHistoryLimit?: number;
}

interface RideLogicState {
  // Estado del viaje
  activeRide: Ride | null;
  nearbyDrivers: Driver[];
  estimatedFare: number | null;
  estimatedTime: number | null;
  
  // Ubicaciones
  currentLocation: { lat: number; lng: number } | null;
  pickupLocation: { lat: number; lng: number; address: string } | null;
  dropoffLocation: { lat: number; lng: number; address: string } | null;
  
  // Estados de carga
  isRequestingRide: boolean;
  isCancellingRide: boolean;
  isRatingDriver: boolean;
  
  // Chat
  chatMessages: any[];
  
  // Historial
  rideHistory: Ride[];
  hasMoreHistory: boolean;
  
  // Contraoferta
  hasCounterOffer: boolean;
  counterOfferAmount: number | null;
}

export function useRideLogic({ user, initialHistoryLimit = 25 }: UseRideLogicProps) {
  const { toast } = useToast();
  
  // ====================================
  // ESTADO PRINCIPAL
  // ====================================
  
  const [state, setState] = useState<RideLogicState>({
    activeRide: null,
    nearbyDrivers: [],
    estimatedFare: null,
    estimatedTime: null,
    currentLocation: null,
    pickupLocation: null,
    dropoffLocation: null,
    isRequestingRide: false,
    isCancellingRide: false,
    isRatingDriver: false,
    chatMessages: [],
    rideHistory: [],
    hasMoreHistory: true,
    hasCounterOffer: false,
    counterOfferAmount: null,
  });
  
  const unsubscribeRefs = useRef<(() => void)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ====================================
  // INICIALIZACIÓN
  // ====================================
  
  useEffect(() => {
    // Inicializar audio de notificaciones
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.8;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // ====================================
  // GEOLOCALIZACIÓN
  // ====================================
  
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setState(prev => ({
            ...prev,
            currentLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          }));
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          toast({
            variant: 'destructive',
            title: 'Error de ubicación',
            description: 'No se pudo obtener tu ubicación actual.',
          });
        },
        { enableHighAccuracy: true, maximumAge: 30000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [toast]);

  // ====================================
  // VIAJE ACTIVO Y CHAT
  // ====================================
  
  useEffect(() => {
    if (!user) return;

    // Listener para viaje activo
    const rideQuery = query(
      collection(db, 'rides'),
      where('passenger.id', '==', user.uid),
      where('status', 'in', [
        'requested', 
        'accepted', 
        'driver_arriving', 
        'driver_arrived', 
        'in_progress',
        'counter_offered'
      ]),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribeRide = onSnapshot(rideQuery, (snapshot) => {
      if (!snapshot.empty) {
        const rideData = snapshot.docs[0].data() as Ride;
        const ride = { ...rideData, id: snapshot.docs[0].id };
        
        setState(prev => {
          // Detectar nuevo viaje o cambio de estado
          const isNewRide = !prev.activeRide || prev.activeRide.id !== ride.id;
          const statusChanged = prev.activeRide?.status !== ride.status;
          
          if (isNewRide || statusChanged) {
            playNotificationSound();
          }
          
          return {
            ...prev,
            activeRide: ride,
            hasCounterOffer: ride.status === 'counter_offered',
            counterOfferAmount: ride.counterOffer?.amount || null,
          };
        });
      } else {
        setState(prev => ({
          ...prev,
          activeRide: null,
          hasCounterOffer: false,
          counterOfferAmount: null,
        }));
      }
    });

    unsubscribeRefs.current.push(unsubscribeRide);
    
    return () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [user]);

  // ====================================
  // CONDUCTORES CERCANOS
  // ====================================
  
  useEffect(() => {
    if (!state.currentLocation || state.activeRide) return;

    const driversQuery = query(
      collection(db, 'drivers'),
      where('status', '==', 'available')
    );

    const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
      const drivers = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Driver[];

      // Filtrar conductores cercanos (simulación)
      const nearbyDrivers = drivers.filter(driver => {
        if (!driver.location || !state.currentLocation) return false;
        const distance = calculateDistance(
          state.currentLocation.lat,
          state.currentLocation.lng,
          driver.location.lat,
          driver.location.lng
        );
        return distance <= 10; // 10km de radio
      });

      setState(prev => ({ ...prev, nearbyDrivers }));
    });

    unsubscribeRefs.current.push(unsubscribeDrivers);
  }, [state.currentLocation, state.activeRide]);

  // ====================================
  // HISTORIAL DE VIAJES
  // ====================================
  
  useEffect(() => {
    if (!user) return;

    loadRideHistory();
  }, [user]);

  const loadRideHistory = async () => {
    if (!user) return;

    try {
      const historyQuery = query(
        collection(db, 'rides'),
        where('passenger.id', '==', user.uid),
        where('status', 'in', ['completed', 'cancelled']),
        orderBy('createdAt', 'desc'),
        limit(initialHistoryLimit)
      );

      const snapshot = await getDocs(historyQuery);
      const rides = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Ride[];

      setState(prev => ({
        ...prev,
        rideHistory: rides,
        hasMoreHistory: rides.length === initialHistoryLimit,
      }));
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  // ====================================
  // FUNCIONES DE ACCIÓN
  // ====================================
  
  const requestRide = async (
    pickup: { lat: number; lng: number; address: string },
    dropoff: { lat: number; lng: number; address: string },
    options?: {
      serviceType?: string;
      notes?: string;
      estimatedFare?: number;
    }
  ) => {
    if (!user || !pickup || !dropoff) return;

    setState(prev => ({ ...prev, isRequestingRide: true }));

    try {
      const rideData = {
        passenger: {
          id: user.uid,
          name: user.displayName || 'Pasajero',
          phone: user.phoneNumber || '',
          email: user.email || '',
        },
        pickupLocation: pickup,
        dropoffLocation: dropoff,
        pickupAddress: pickup.address,
        dropoffAddress: dropoff.address,
        status: 'requested',
        serviceType: options?.serviceType || 'economy',
        fare: options?.estimatedFare || state.estimatedFare,
        notes: options?.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'rides'), rideData);
      
      toast({
        title: 'Viaje solicitado',
        description: 'Buscando conductor disponible...',
      });

      // Limpiar ubicaciones
      setState(prev => ({
        ...prev,
        pickupLocation: null,
        dropoffLocation: null,
        estimatedFare: null,
        estimatedTime: null,
      }));

    } catch (error) {
      console.error('Error solicitando viaje:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo solicitar el viaje. Inténtalo de nuevo.',
      });
    } finally {
      setState(prev => ({ ...prev, isRequestingRide: false }));
    }
  };

  const cancelRide = async () => {
    if (!state.activeRide) return;

    setState(prev => ({ ...prev, isCancellingRide: true }));

    try {
      await updateDoc(doc(db, 'rides', state.activeRide.id), {
        status: 'cancelled_by_passenger',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Viaje cancelado',
        description: 'Tu viaje ha sido cancelado exitosamente.',
      });
    } catch (error) {
      console.error('Error cancelando viaje:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cancelar el viaje.',
      });
    } finally {
      setState(prev => ({ ...prev, isCancellingRide: false }));
    }
  };

  const rateDriver = async (rating: number, comment: string) => {
    if (!state.activeRide) return;

    setState(prev => ({ ...prev, isRatingDriver: true }));

    try {
      await updateDoc(doc(db, 'rides', state.activeRide.id), {
        passengerRating: rating,
        passengerComment: comment,
        ratedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Calificación enviada',
        description: `Has calificado al conductor con ${rating} estrellas.`,
      });
    } catch (error) {
      console.error('Error enviando calificación:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo enviar la calificación.',
      });
    } finally {
      setState(prev => ({ ...prev, isRatingDriver: false }));
    }
  };

  const acceptCounterOffer = async () => {
    if (!state.activeRide) return;

    try {
      await updateDoc(doc(db, 'rides', state.activeRide.id), {
        status: 'accepted',
        fare: state.counterOfferAmount,
        counterOfferAcceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Contraoferta aceptada',
        description: `Tarifa acordada: $${state.counterOfferAmount}`,
      });
    } catch (error) {
      console.error('Error aceptando contraoferta:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo aceptar la contraoferta.',
      });
    }
  };

  const rejectCounterOffer = async () => {
    if (!state.activeRide) return;

    try {
      await updateDoc(doc(db, 'rides', state.activeRide.id), {
        status: 'cancelled_by_passenger',
        cancelReason: 'counter_offer_rejected',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Contraoferta rechazada',
        description: 'El viaje ha sido cancelado.',
      });
    } catch (error) {
      console.error('Error rechazando contraoferta:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo rechazar la contraoferta.',
      });
    }
  };

  const loadMoreHistory = async () => {
    // Implementar paginación del historial
    if (!user || !state.hasMoreHistory) return;

    try {
      const lastRide = state.rideHistory[state.rideHistory.length - 1];
      const historyQuery = query(
        collection(db, 'rides'),
        where('passenger.id', '==', user.uid),
        where('status', 'in', ['completed', 'cancelled']),
        orderBy('createdAt', 'desc'),
        limit(25)
      );

      const snapshot = await getDocs(historyQuery);
      const newRides = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Ride[];

      setState(prev => ({
        ...prev,
        rideHistory: [...prev.rideHistory, ...newRides],
        hasMoreHistory: newRides.length === 25,
      }));
    } catch (error) {
      console.error('Error cargando más historial:', error);
    }
  };

  // ====================================
  // UTILIDADES
  // ====================================
  
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.log('No se pudo reproducir notificación:', error);
      });
    }
  };

  const updateProfile = async (data: any) => {
    // Implementar actualización de perfil
    console.log('Actualizar perfil:', data);
  };

  const sendMessage = async (message: string) => {
    // Implementar envío de mensaje
    console.log('Enviar mensaje:', message);
  };

  // ====================================
  // RETURN DEL HOOK
  // ====================================
  
  return {
    ...state,
    
    // Funciones de acción
    requestRide,
    cancelRide,
    rateDriver,
    acceptCounterOffer,
    rejectCounterOffer,
    updateProfile,
    sendMessage,
    loadMoreHistory,
    playNotificationSound,

    // Funciones para establecer ubicaciones
    setPickupLocation: (location: { lat: number; lng: number; address: string } | null) => {
      setState(prev => ({ ...prev, pickupLocation: location }));
    },
    
    setDropoffLocation: (location: { lat: number; lng: number; address: string } | null) => {
      setState(prev => ({ ...prev, dropoffLocation: location }));
    },

    // Función para estimación de tarifa
    setEstimatedFare: (fare: number | null) => {
      setState(prev => ({ ...prev, estimatedFare: fare }));
    },

    setEstimatedTime: (time: number | null) => {
      setState(prev => ({ ...prev, estimatedTime: time }));
    },
  };
}

// Función auxiliar para calcular distancia
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}