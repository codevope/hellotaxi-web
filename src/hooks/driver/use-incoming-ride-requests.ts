import { useEffect, useState, useCallback } from 'react';
import { doc, collection, query, where, onSnapshot, runTransaction, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ride, User, EnrichedDriver, ServiceType } from '@/lib/types';
import { useDriverRideStore } from '@/store/driver-ride-store';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Determina si un conductor puede ver un viaje basado en el tipo de servicio.
 * Jerarquía:
 * - Económico: Todos los conductores pueden ver (economy, comfort, exclusive)
 * - Confort: Solo conductores Confort y Exclusivo pueden ver
 * - Exclusivo: Solo conductores Exclusivo pueden ver
 */
function canDriverSeeRide(driverServiceType: ServiceType, rideServiceType: ServiceType): boolean {
  // Viajes económicos: todos los conductores pueden verlos
  if (rideServiceType === 'economy') {
    return true;
  }
  
  // Viajes confort: solo confort y exclusivo
  if (rideServiceType === 'comfort') {
    return driverServiceType === 'comfort' || driverServiceType === 'exclusive';
  }
  
  // Viajes exclusivos: solo exclusivo
  if (rideServiceType === 'exclusive') {
    return driverServiceType === 'exclusive';
  }
  
  return false;
}

interface IncomingRide extends Omit<Ride, 'passenger'> { passenger: User }

interface NotificationSoundOptions {
  soundFile?: string;
  volume?: number;
}

interface UseIncomingRideRequestsParams {
  driver?: EnrichedDriver | null;
  isAvailable: boolean;
  rejectedRideIds: string[];
  setRejectedRideIds: React.Dispatch<React.SetStateAction<string[]>>;
  toast?: any;
  playNotificationSound?: (options?: NotificationSoundOptions) => Promise<boolean>;
}

export function useIncomingRideRequests({ driver, isAvailable, rejectedRideIds, setRejectedRideIds, toast, playNotificationSound }: UseIncomingRideRequestsParams) {
  const { incomingRequest, activeRide, setIncomingRequest, isCountering, setIsCountering } = useDriverRideStore();
  const [requestTimeLeft, setRequestTimeLeft] = useState(30);
  const [counterOfferAmount, setCounterOfferAmount] = useState('0');
  // Estado para tracking del timer activo
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Listener de viajes buscando (searching)
  useEffect(() => {

    
    if (!driver) {
      return;
    }
    
    
    // Verificar que el conductor tenga vehículo con serviceType
    if (!driver.vehicle?.serviceType) {
      return;
    }


    const q = query(collection(db, 'rides'), where('status', '==', 'searching'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {

      
      // Verificar condiciones dentro del listener
      if (!isAvailable) {
        return;
      }
      // Si ya hay un viaje activo, no procesar nuevas solicitudes
      if (useDriverRideStore.getState().activeRide) return;
      
      const currentIncomingRequest = useDriverRideStore.getState().incomingRequest;
      
      // Si hay una solicitud actual, verificar si aún existe en el snapshot
      if (currentIncomingRequest) {
        const stillExists = snapshot.docs.some(d => d.id === currentIncomingRequest.id && d.data().status === 'searching');
        
        if (!stillExists) {
         setIncomingRequest(null);
          setIsCountering(false);
          // No retornar aquí, continuar procesando por si hay nuevas solicitudes
        } else {
          // La solicitud actual aún existe, no procesar otras
          return;
        }
      }
      
      const potential = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Ride))
        .filter(ride => {
          const alreadyRejected = rejectedRideIds.includes(ride.id) || ride.rejectedBy?.some(ref => ref.id === driver.id);
          
          // Verificar si el viaje fue ofrecido hace más de 40 segundos (considerarlo expirado)
          let alreadyOffered = !!ride.offeredTo;
          if (alreadyOffered && ride.offeredToTimestamp) {
            const offeredTime = new Date(ride.offeredToTimestamp).getTime();
            const now = Date.now();
            const elapsed = (now - offeredTime) / 1000; // segundos transcurridos
            
            if (elapsed > 40) {
              alreadyOffered = false; // Tratar como si no estuviera ofrecido
            }
          }
          
          // 🎯 FILTRO JERÁRQUICO: Verificar si el conductor puede ver este viaje
          const canSeeRide = canDriverSeeRide(driver.vehicle!.serviceType, ride.serviceType);

          
          return !alreadyOffered && !alreadyRejected && canSeeRide;
        });
      if (potential.length === 0) return;
      const rideToOffer = potential[0];
      const rideRef = doc(db, 'rides', rideToOffer.id);
      try {
        await runTransaction(db, async tx => {
          const fresh = await tx.get(rideRef);
          if (!fresh.exists() || fresh.data().status !== 'searching' || fresh.data().offeredTo) {
            throw new Error('Ride taken or cancelled');
          }
          tx.update(rideRef, { 
            offeredTo: doc(db, 'drivers', driver.id),
            offeredToTimestamp: new Date().toISOString()
          });
        });
        const passengerSnap = await getDoc(rideToOffer.passenger);
        if (passengerSnap.exists()) {
          const passengerData = passengerSnap.data() as User;
          const { passenger: _p, ...rest } = rideToOffer;
          const newRequest = { ...rest, passenger: passengerData };
          
          // Usar setTimeout para evitar actualizaciones de estado durante render
          setTimeout(async () => {
            setIncomingRequest(newRequest);
        
            
            if (pathname && !pathname.startsWith('/driver')) {
              try {
                router.push('/driver');
              } catch (error) {
                console.error(' [REDIRECT] Error en router.push:', error);
              }
            } else {
              console.log('[REDIRECT] Ya está en /driver o pathname no válido, no redirigir');
            }
            
            // Reproducir sonido de notificación (taxi.mp3 para solicitudes entrantes)
            if (playNotificationSound) {
              try {
                const soundResult = await playNotificationSound({ soundFile: 'taxi' });
              } catch (error) {
                console.error(' MOBILE: Error playing notification sound:', error);
              }
            } else {
              console.log('MOBILE: playNotificationSound no disponible');
            }
            
            // Mostrar toast inmediatamente para dispositivos móviles
            if (toast) {
              toast({
                title: 'Nueva solicitud de viaje',
                description: `Recogida: ${newRequest.pickup}`,
                duration: 2000,
                className: 'border-l-4 border-l-[#2E4CA6] bg-gradient-to-r from-blue-50 to-white',
              });
            } else {
              console.log('MOBILE: toast no disponible');
            }
          }, 0);
        }
      } catch (e) {
        console.log('Could not secure ride offer:', (e as Error).message);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [driver, rejectedRideIds, setIncomingRequest, setIsCountering, toast, playNotificationSound, router, pathname, isAvailable]);

  //  Listener para detectar cancelación de solicitud entrante
  useEffect(() => {
    if (!incomingRequest) {
      return;
    }

    const rideRef = doc(db, 'rides', incomingRequest.id);
    const requestId = incomingRequest.id;
    
    const unsubscribe = onSnapshot(rideRef, (snapshot) => {
      const currentRequest = useDriverRideStore.getState().incomingRequest;
      if (!currentRequest || currentRequest.id !== requestId) {
        return;
      }

      if (!snapshot.exists()) {
        setIncomingRequest(null);
        setIsCountering(false);
        return;
      }

      const rideData = snapshot.data();
      
      if (rideData.status === 'cancelled') {

        toast({
          title: 'Viaje Cancelado',
          description: 'El pasajero canceló la solicitud de viaje.',
          duration: 6000,
          variant: 'destructive',
        });

        const audio = new Audio('/sounds/error.mp3');
        audio.volume = 0.7;
        audio.play().catch(e => console.error('Error sonido:', e));
        
        setIncomingRequest(null);
        setIsCountering(false);
      } else if (rideData.status === 'accepted' && rideData.driver?.id !== driver?.id) {
        
        toast({
          title: '⚠️ Viaje Tomado',
          description: 'Otro conductor aceptó este viaje.',
          duration: 5000,
          variant: 'default',
        });
        
        setIncomingRequest(null);
        setIsCountering(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [incomingRequest, toast, driver, setIncomingRequest, setIsCountering]);

  // Countdown / auto reject
  const autoRejectRequest = useCallback(async (requestId: string) => {
    if (!driver) {
      return;
    }
    
    // Verificar que la solicitud actual aún sea la misma antes de proceder
    const currentRequest = useDriverRideStore.getState().incomingRequest;
    if (!currentRequest || currentRequest.id !== requestId) {
      return;
    }
    
    // Mostrar notificación de tiempo agotado ANTES de limpiar
    if (toast) {
      toast({
        title: 'Tiempo Agotado',
        description: 'La solicitud de viaje ha expirado.',
        duration: 4000,
        className: 'border-l-4 border-l-yellow-500',
      });
    }

    // Reproducir sonido de error para timeout
    if (playNotificationSound) {
      try {
        await playNotificationSound({ soundFile: 'error' });
      } catch (error) {
      }
    }
    
    // Check if the ride is still in a state that can be auto-rejected
    const rideRef = doc(db, 'rides', requestId);
    try {
      const rideSnap = await getDoc(rideRef);
      if (!rideSnap.exists()) {
        // Solo limpiar UI si el viaje ya no existe
        setIncomingRequest(null);
        setIsCountering(false);
        setRejectedRideIds(prevIds => [...prevIds, requestId]);
        return;
      }
      
      const rideData = rideSnap.data();
      if (rideData.status === 'counter-offered') {
        setIncomingRequest(null);
        setIsCountering(false);
        return;
      }
      
      if (!['searching'].includes(rideData.status)) {
        setIncomingRequest(null);
        setIsCountering(false);
        return;
      }
      
      await updateDoc(rideRef, { 
        rejectedBy: arrayUnion(doc(db, 'drivers', driver.id)), 
        offeredTo: null 
      });
    } catch (err) {
      console.error(' [AUTO-REJECT] Error updating database:', err);
    }
    
    // Limpiar el store DESPUÉS de mostrar notificaciones
    setIncomingRequest(null);
    setIsCountering(false);
    setRejectedRideIds(prevIds => [...prevIds, requestId]);
    
  }, [driver, setIncomingRequest, setIsCountering, setRejectedRideIds, toast, playNotificationSound]);

  useEffect(() => {
    if (!incomingRequest) { 
      setRequestTimeLeft(30); 
      setIsCountering(false);
      setCounterOfferAmount('0');
      if (activeTimerId) {
        setActiveTimerId(null);
      }
      return; 
    }
    
    // Solo crear nuevo timer si no hay uno activo para esta solicitud
    if (activeTimerId === incomingRequest.id) {
      return;
    }
    
    setActiveTimerId(incomingRequest.id);
    setRequestTimeLeft(30);
    
    const requestId = incomingRequest.id; // Capturar ID al momento de crear el timer
    let timeLeft = 30;
    
    const timer = setInterval(() => {
      // 🛑 DETENER el temporizador si el conductor está haciendo una contraoferta
      const currentState = useDriverRideStore.getState();
      if (currentState.isCountering) {
        return; // No decrementar el tiempo mientras se hace contraoferta
      }

      timeLeft -= 1;
      
      setRequestTimeLeft(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        
        // Verificar que la solicitud aún sea la actual antes de ejecutar auto-reject
        const current = useDriverRideStore.getState().incomingRequest;
        if (current && current.id === requestId && driver) {
          setTimeout(() => autoRejectRequest(requestId), 0);
        } else {
          console.log('[TIMER] Solicitud ya no es actual, cancelando auto-reject');
        }
      }
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [incomingRequest?.id]); // Solo depender del ID para evitar loops infinitos

  const acceptRequest = useCallback(async () => {
    if (!incomingRequest || !driver) return;
    const rideRef = doc(db, 'rides', incomingRequest.id);
    setIncomingRequest(null);
    try {
      await runTransaction(db, async tx => {
        const snap = await tx.get(rideRef);
        if (!snap.exists()) {
          throw new Error('El viaje ya no existe.');
        }
        
        const rideData = snap.data();
        
        if (!['searching','counter-offered'].includes(rideData.status)) {
          throw new Error(`El viaje ya no está disponible. Estado actual: ${rideData.status}`);
        }
        
        if (rideData.status === 'cancelled') {
          throw new Error('El viaje ha sido cancelado.');
        }
        
        tx.update(rideRef, { status: 'accepted', driver: doc(db, 'drivers', driver.id), offeredTo: null });
        tx.update(doc(db, 'drivers', driver.id), { status: 'on-ride' });
      });
    } catch (e: any) {
      console.error(' Error accepting request:', e);
      
      // Si el viaje fue cancelado, mostrar mensaje específico y cerrar sheet
      if (e.message?.includes('cancelado') || e.message?.includes('cancelled')) {
        if (toast) {
          toast({ 
            variant: 'destructive', 
            title: 'Viaje Cancelado', 
            description: 'El pasajero canceló el viaje.' 
          });
        }
        // Cerrar el sheet automáticamente
        setIncomingRequest(null);
        setIsCountering(false);
      } else if (e.message?.includes('no está disponible') || e.message?.includes('no existe')) {
        if (toast) {
          toast({ 
            variant: 'destructive', 
            title: '⚠️ Viaje No Disponible', 
            description: 'El viaje ya fue tomado por otro conductor.' 
          });
        }
        // Cerrar el sheet automáticamente
        setIncomingRequest(null);
        setIsCountering(false);
      } else {
        if (toast) {
          toast({ variant: 'destructive', title: 'Error', description: e.message || 'No se pudo aceptar el viaje.' });
        }
      }
    }
  }, [incomingRequest, driver, setIncomingRequest, toast]);

  const rejectRequest = useCallback(async () => {
    if (!incomingRequest || !driver) return;
    const rideRef = doc(db, 'rides', incomingRequest.id);
    setIncomingRequest(null);
    setRejectedRideIds(prev => [...prev, incomingRequest.id]);
    
    // Resetear estado de contraoferta
    setIsCountering(false);
    
    // Si el conductor rechaza una contraoferta que él mismo hizo, 
    // necesitamos regresar el viaje a estado 'searching'
    try {
      await runTransaction(db, async (tx) => {
        const rideSnap = await tx.get(rideRef);
        if (!rideSnap.exists()) return;
        
        const rideData = rideSnap.data();
        const driverRef = doc(db, 'drivers', driver.id);
        
        const updateData: any = { 
          rejectedBy: arrayUnion(driverRef), 
          offeredTo: null 
        };
        
        // Si este conductor hizo una contraoferta y la está cancelando,
        // regresar el viaje a búsqueda activa
        if (rideData.status === 'counter-offered' && 
            rideData.offeredTo && 
            rideData.offeredTo.id === driver.id) {
          updateData.status = 'searching';
          updateData.fare = rideData.originalFare || rideData.fare; // Restaurar tarifa original si existe
        }
        
        tx.update(rideRef, updateData);
      });
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      // Fallback al método anterior si la transacción falla
      await updateDoc(rideRef, { 
        rejectedBy: arrayUnion(doc(db, 'drivers', driver.id)), 
        offeredTo: null 
      });
    }
  }, [incomingRequest, driver, setIncomingRequest, setRejectedRideIds]);

  const submitCounterOffer = useCallback(async () => {
    if (!incomingRequest || !counterOfferAmount || !driver) return;

    
    const rideRef = doc(db, 'rides', incomingRequest.id);
    const driverRef = doc(db, 'drivers', driver.id);
    
    try {
      // Validar que el viaje aún esté disponible antes de enviar contraoferta
      await runTransaction(db, async (tx) => {
        const rideSnapshot = await tx.get(rideRef);
        
        if (!rideSnapshot.exists()) {
          throw new Error('El viaje ya no existe');
        }
        
        const rideData = rideSnapshot.data();
        
        // Verificar que el viaje esté en un estado válido para contraoferta
        if (!['searching', 'counter-offered'].includes(rideData.status)) {
          throw new Error(`El viaje ya no está disponible. Estado actual: ${rideData.status}`);
        }
        
        // Si está cancelado, no permitir contraoferta
        if (rideData.status === 'cancelled') {
          throw new Error('El viaje ha sido cancelado y no se puede hacer contraoferta');
        }
        
        const updateData = { 
          fare: parseFloat(counterOfferAmount), 
          originalFare: incomingRequest.fare, // Guardar tarifa original para poder restaurarla
          status: 'counter-offered', 
          offeredTo: driverRef 
        };
        
        tx.update(rideRef, updateData);
      });
      
      // Clear the incoming request immediately to prevent auto-reject
      setIncomingRequest(null);
      setIsCountering(false);
      
      if (toast) {
        toast({ title: 'Contraoferta Enviada', description: `Has propuesto una tarifa de S/${parseFloat(counterOfferAmount).toFixed(2)}` });
      }
    } catch (e: any) {
      console.error(' Error submitting counter offer:', e);
      
      // Si el viaje fue cancelado, mostrar mensaje específico y cerrar sheet
      if (e.message?.includes('cancelado') || e.message?.includes('cancelled')) {
        if (toast) {
          toast({ 
            variant: 'destructive', 
            title: 'Viaje Cancelado', 
            description: 'El pasajero canceló el viaje mientras preparabas tu contraoferta.' 
          });
        }
        // Cerrar el sheet automáticamente
        setIncomingRequest(null);
        setIsCountering(false);
      } else if (e.message?.includes('no está disponible') || e.message?.includes('no existe')) {
        if (toast) {
          toast({ 
            variant: 'destructive', 
            title: '⚠️ Viaje No Disponible', 
            description: 'El viaje ya fue tomado por otro conductor.' 
          });
        }
        // Cerrar el sheet automáticamente
        setIncomingRequest(null);
        setIsCountering(false);
      } else {
        if (toast) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la contraoferta.' });
        }
      }
    }
  }, [incomingRequest, counterOfferAmount, driver, toast, setIncomingRequest, setIsCountering]);

  const startCounterMode = useCallback(() => {
    if (!incomingRequest) return;
    setCounterOfferAmount(incomingRequest.fare.toString());
    setIsCountering(true);
  }, [incomingRequest, setIsCountering]);

  return {
    incomingRequest,
    requestTimeLeft,
    isCountering,
    counterOfferAmount,
    setCounterOfferAmount,
    acceptRequest,
    rejectRequest,
    submitCounterOffer,
    startCounterMode,
  };
}
