import { useEffect, useState, useCallback } from 'react';
import { doc, collection, query, where, onSnapshot, runTransaction, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ride, User, EnrichedDriver } from '@/lib/types';
import { useDriverRideStore } from '@/store/driver-ride-store';

interface IncomingRide extends Omit<Ride, 'passenger'> { passenger: User }

interface UseIncomingRideRequestsParams {
  driver?: EnrichedDriver | null;
  isAvailable: boolean;
  rejectedRideIds: string[];
  setRejectedRideIds: React.Dispatch<React.SetStateAction<string[]>>;
  toast?: any;
  playNotificationSound?: () => Promise<boolean>;
}

export function useIncomingRideRequests({ driver, isAvailable, rejectedRideIds, setRejectedRideIds, toast, playNotificationSound }: UseIncomingRideRequestsParams) {
  const { incomingRequest, activeRide, setIncomingRequest, isCountering, setIsCountering } = useDriverRideStore();
  const [requestTimeLeft, setRequestTimeLeft] = useState(30);
  const [counterOfferAmount, setCounterOfferAmount] = useState('0');
  // Estado para tracking del timer activo
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);

  // Listener de viajes buscando (searching)
  useEffect(() => {
    console.log('🔍 [DEBUG] Estado del hook:', {
      hasDriver: !!driver,
      driverId: driver?.id,
      isAvailable,
      hasActiveRide: !!activeRide,
      hasIncomingRequest: !!incomingRequest
    });
    
    if (!driver || !isAvailable || activeRide || incomingRequest) return;

    const q = query(collection(db, 'rides'), where('status', '==', 'searching'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (useDriverRideStore.getState().activeRide || useDriverRideStore.getState().incomingRequest) return;
      const potential = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Ride))
        .filter(ride => {
          const alreadyOffered = !!ride.offeredTo;
          const alreadyRejected = rejectedRideIds.includes(ride.id) || ride.rejectedBy?.some(ref => ref.id === driver.id);
          return !alreadyOffered && !alreadyRejected;
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
          tx.update(rideRef, { offeredTo: doc(db, 'drivers', driver.id) });
        });
        const passengerSnap = await getDoc(rideToOffer.passenger);
        if (passengerSnap.exists()) {
          const passengerData = passengerSnap.data() as User;
          const { passenger: _p, ...rest } = rideToOffer;
          const newRequest = { ...rest, passenger: passengerData };
          
          // Usar setTimeout para evitar actualizaciones de estado durante render
          setTimeout(async () => {
            console.log('🚖 MOBILE: Nueva solicitud detectada:', newRequest);
            setIncomingRequest(newRequest);
            
            // Reproducir sonido de notificación
            if (playNotificationSound) {
              try {
                console.log('🔊 MOBILE: Reproduciendo sonido de notificación...');
                const soundResult = await playNotificationSound();
                console.log('🔊 MOBILE: Sonido reproducido:', soundResult);
              } catch (error) {
                console.error('❌ MOBILE: Error playing notification sound:', error);
              }
            } else {
              console.log('⚠️ MOBILE: playNotificationSound no disponible');
            }
            
            // Mostrar toast inmediatamente para dispositivos móviles
            if (toast) {
              console.log('📱 MOBILE: Mostrando toast...');
              toast({
                title: '🚖 Nueva solicitud de viaje',
                description: `Recogida: ${newRequest.pickup}`,
                duration: 10000,
                className: 'border-l-4 border-l-[#2E4CA6] bg-gradient-to-r from-blue-50 to-white',
              });
            } else {
              console.log('⚠️ MOBILE: toast no disponible');
            }
          }, 0);
        }
      } catch (e) {
        console.log('Could not secure ride offer:', (e as Error).message);
      }
    });
    return () => unsubscribe();
  }, [driver, isAvailable, activeRide, incomingRequest, rejectedRideIds, setIncomingRequest]);

  // Listener para cambios en el viaje actual (cancelación, etc.)
  useEffect(() => {
    if (!incomingRequest) return;

    console.log('👁️ [RIDE-LISTENER] Iniciando listener para ride:', incomingRequest.id);
    const rideRef = doc(db, 'rides', incomingRequest.id);
    const requestId = incomingRequest.id; // Capturar ID al momento de crear el listener
    
    const unsubscribe = onSnapshot(rideRef, (snapshot) => {
      // Verificar que el incomingRequest actual sigue siendo el mismo
      const currentRequest = useDriverRideStore.getState().incomingRequest;
      if (!currentRequest || currentRequest.id !== requestId) {
        console.log('👁️ [RIDE-LISTENER] Request ya no es actual, ignorando snapshot');
        return;
      }

      if (!snapshot.exists()) {
        console.log('🗑️ [RIDE-LISTENER] Ride eliminado, cerrando sheet');
        setIncomingRequest(null);
        setIsCountering(false);
        return;
      }

      const rideData = snapshot.data();
      console.log('📊 [RIDE-LISTENER] Estado del ride:', rideData.status, 'para request:', requestId);
      
      // Si el viaje fue cancelado o aceptado por otro conductor, cerrar el sheet
      if (rideData.status === 'cancelled') {
        console.log('🚫 [RIDE-LISTENER] Viaje cancelado, cerrando sheet');
        
        // Mostrar notificación de cancelación
        if (toast) {
          toast({
            title: '🚫 Viaje Cancelado',
            description: 'El pasajero canceló la solicitud de viaje.',
            duration: 4000,
            variant: 'destructive',
          });
        }

        // Reproducir sonido de notificación
        if (playNotificationSound) {
          try {
            playNotificationSound();
          } catch (error) {
            console.log('🔊 [RIDE-LISTENER] No se pudo reproducir sonido de cancelación');
          }
        }
        
        setIncomingRequest(null);
        setIsCountering(false);
      } else if (rideData.status === 'accepted' && rideData.driver?.id !== driver?.id) {
        console.log('👥 [RIDE-LISTENER] Viaje tomado por otro conductor, cerrando sheet');
        
        // Mostrar notificación de viaje tomado
        if (toast) {
          toast({
            title: '👥 Viaje Tomado',
            description: 'Otro conductor aceptó esta solicitud.',
            duration: 4000,
            className: 'border-l-4 border-l-blue-500',
          });
        }

        // Reproducir sonido de notificación
        if (playNotificationSound) {
          try {
            playNotificationSound();
          } catch (error) {
            console.log('🔊 [RIDE-LISTENER] No se pudo reproducir sonido de viaje tomado');
          }
        }
        
        setIncomingRequest(null);
        setIsCountering(false);
      }
    });

    return () => {
      console.log('🗑️ [RIDE-LISTENER] Cleanup listener para ride:', requestId);
      unsubscribe();
    };
  }, [incomingRequest?.id, driver, setIncomingRequest, setIsCountering, toast, playNotificationSound]);

  // Countdown / auto reject
  const autoRejectRequest = useCallback(async (requestId: string) => {
    console.log('⏰ [AUTO-REJECT] Iniciando auto-reject para request:', requestId);
    if (!driver) {
      console.log('⏰ [AUTO-REJECT] No hay driver, cancelando');
      return;
    }
    
    // Verificar que la solicitud actual aún sea la misma antes de proceder
    const currentRequest = useDriverRideStore.getState().incomingRequest;
    if (!currentRequest || currentRequest.id !== requestId) {
      console.log('⏰ [AUTO-REJECT] Solicitud ya no es actual, cancelando auto-reject');
      return;
    }
    
    // Mostrar notificación de tiempo agotado ANTES de limpiar
    if (toast) {
      toast({
        title: '⏰ Tiempo Agotado',
        description: 'La solicitud de viaje ha expirado.',
        duration: 4000,
        className: 'border-l-4 border-l-yellow-500',
      });
    }

    // Reproducir sonido de notificación si está disponible
    if (playNotificationSound) {
      try {
        await playNotificationSound();
        console.log('🔊 [AUTO-REJECT] Sonido de timeout reproducido');
      } catch (error) {
        console.log('🔊 [AUTO-REJECT] No se pudo reproducir sonido:', error);
      }
    }
    
    // Check if the ride is still in a state that can be auto-rejected
    const rideRef = doc(db, 'rides', requestId);
    try {
      const rideSnap = await getDoc(rideRef);
      if (!rideSnap.exists()) {
        console.log('📋 [AUTO-REJECT] Ride no longer exists, solo limpiando UI');
        // Solo limpiar UI si el viaje ya no existe
        setIncomingRequest(null);
        setIsCountering(false);
        setRejectedRideIds(prevIds => [...prevIds, requestId]);
        return;
      }
      
      const rideData = rideSnap.data();
      if (rideData.status === 'counter-offered') {
        console.log('💰 [AUTO-REJECT] Ride is in counter-offered state, skipping DB update');
        setIncomingRequest(null);
        setIsCountering(false);
        return;
      }
      
      if (!['searching'].includes(rideData.status)) {
        console.log('📋 [AUTO-REJECT] Ride status changed to', rideData.status, 'skipping DB update');
        setIncomingRequest(null);
        setIsCountering(false);
        return;
      }
      
      console.log('✅ [AUTO-REJECT] Actualizando base de datos...');
      await updateDoc(rideRef, { 
        rejectedBy: arrayUnion(doc(db, 'drivers', driver.id)), 
        offeredTo: null 
      });
      console.log('✅ [AUTO-REJECT] Base de datos actualizada correctamente');
    } catch (err) {
      console.error('❌ [AUTO-REJECT] Error updating database:', err);
    }
    
    // Limpiar el store DESPUÉS de mostrar notificaciones
    console.log('🧹 [AUTO-REJECT] Limpiando incomingRequest del store...');
    setIncomingRequest(null);
    setIsCountering(false);
    setRejectedRideIds(prevIds => [...prevIds, requestId]);
    
    console.log('✅ [AUTO-REJECT] Auto-reject completado para:', requestId);
  }, [driver, setIncomingRequest, setRejectedRideIds, toast, playNotificationSound]);

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
      console.log('⏱️ [TIMER] Timer ya activo para request:', incomingRequest.id);
      return;
    }
    
    console.log('⏱️ [TIMER] Iniciando timer para request:', incomingRequest.id);
    setActiveTimerId(incomingRequest.id);
    setRequestTimeLeft(30);
    
    const requestId = incomingRequest.id; // Capturar ID al momento de crear el timer
    let timeLeft = 30;
    
    const timer = setInterval(() => {
      timeLeft -= 1;
      console.log('⏱️ [TIMER] Tiempo restante:', timeLeft, 'para request:', requestId);
      
      setRequestTimeLeft(timeLeft);
      
      if (timeLeft <= 0) {
        console.log('⏰ [TIMER] Tiempo agotado para request:', requestId);
        clearInterval(timer);
        
        // Verificar que la solicitud aún sea la actual antes de ejecutar auto-reject
        const current = useDriverRideStore.getState().incomingRequest;
        if (current && current.id === requestId && driver) {
          console.log('⏰ [TIMER] Ejecutando auto-reject...');
          setTimeout(() => autoRejectRequest(requestId), 0);
        } else {
          console.log('⏰ [TIMER] Solicitud ya no es actual, cancelando auto-reject');
        }
      }
    }, 1000);
    
    return () => {
      console.log('🗙️ [TIMER] Limpiando timer para request:', requestId);
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
        console.log('🔍 [Accept Request] Estado actual del viaje:', rideData.status);
        
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
      console.error('❌ Error accepting request:', e);
      
      // Si el viaje fue cancelado, mostrar mensaje específico y cerrar sheet
      if (e.message?.includes('cancelado') || e.message?.includes('cancelled')) {
        if (toast) {
          toast({ 
            variant: 'destructive', 
            title: '🚫 Viaje Cancelado', 
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
          console.log('🔄 Conductor cancela su propia contraoferta, regresando a búsqueda');
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
    
    console.log('🚛 Submitting counter offer:', {
      rideId: incomingRequest.id,
      driverId: driver.id,
      counterOfferAmount,
      originalFare: incomingRequest.fare
    });
    
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
        console.log('🔍 [Counter Offer] Estado actual del viaje:', rideData.status);
        
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
        
        console.log('📤 Updating ride with data:', updateData);
        tx.update(rideRef, updateData);
      });
      
      console.log('✅ Counter offer submitted successfully');
      
      // Clear the incoming request immediately to prevent auto-reject
      setIncomingRequest(null);
      setIsCountering(false);
      
      if (toast) {
        toast({ title: 'Contraoferta Enviada', description: `Has propuesto una tarifa de S/${parseFloat(counterOfferAmount).toFixed(2)}` });
      }
    } catch (e: any) {
      console.error('❌ Error submitting counter offer:', e);
      
      // Si el viaje fue cancelado, mostrar mensaje específico y cerrar sheet
      if (e.message?.includes('cancelado') || e.message?.includes('cancelled')) {
        if (toast) {
          toast({ 
            variant: 'destructive', 
            title: '🚫 Viaje Cancelado', 
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
