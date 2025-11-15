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

  // Listener de viajes buscando (searching)
  useEffect(() => {
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

  // Countdown / auto reject
  const autoRejectRequest = useCallback(async (requestId: string) => {
    console.log('⏰ Auto-rejecting request due to timeout:', requestId);
    if (!driver) return;
    
    // Check if the ride is still in a state that can be auto-rejected
    const rideRef = doc(db, 'rides', requestId);
    try {
      const rideSnap = await getDoc(rideRef);
      if (!rideSnap.exists()) {
        console.log('📋 Ride no longer exists, skipping auto-reject');
        return;
      }
      
      const rideData = rideSnap.data();
      if (rideData.status === 'counter-offered') {
        console.log('💰 Ride is in counter-offered state, skipping auto-reject');
        return;
      }
      
      if (!['searching'].includes(rideData.status)) {
        console.log('📋 Ride status changed to', rideData.status, 'skipping auto-reject');
        return;
      }
      
      console.log('❌ Auto-rejecting ride:', requestId);
      await updateDoc(rideRef, { 
        rejectedBy: arrayUnion(doc(db, 'drivers', driver.id)), 
        offeredTo: null 
      });
    } catch (err) {
      console.error('❌ Auto-reject error', err);
    }
    
    setIncomingRequest(null);
    setRejectedRideIds(prevIds => [...prevIds, requestId]);
  }, [driver, setIncomingRequest, setRejectedRideIds]);

  useEffect(() => {
    if (!incomingRequest) { 
      setRequestTimeLeft(30); 
      return; 
    }
    
    setRequestTimeLeft(30);
    const timer = setInterval(() => {
      setRequestTimeLeft(prev => {
        if (prev <= 1) {
          const current = useDriverRideStore.getState().incomingRequest;
          if (current && driver) {
            // Usar setTimeout para evitar actualizaciones de estado durante render
            setTimeout(() => autoRejectRequest(current.id), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [incomingRequest, driver, autoRejectRequest]);

  const acceptRequest = useCallback(async () => {
    if (!incomingRequest || !driver) return;
    const rideRef = doc(db, 'rides', incomingRequest.id);
    setIncomingRequest(null);
    try {
      await runTransaction(db, async tx => {
        const snap = await tx.get(rideRef);
        if (!snap.exists() || !['searching','counter-offered'].includes(snap.data().status)) throw new Error('El viaje ya no está disponible.');
        tx.update(rideRef, { status: 'accepted', driver: doc(db, 'drivers', driver.id), offeredTo: null });
        tx.update(doc(db, 'drivers', driver.id), { status: 'on-ride' });
      });
    } catch (e: any) {
      if (toast) {
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'No se pudo aceptar el viaje.' });
      }
    }
  }, [incomingRequest, driver, setIncomingRequest, toast]);

  const rejectRequest = useCallback(async () => {
    if (!incomingRequest || !driver) return;
    const rideRef = doc(db, 'rides', incomingRequest.id);
    setIncomingRequest(null);
    setRejectedRideIds(prev => [...prev, incomingRequest.id]);
    await updateDoc(rideRef, { rejectedBy: arrayUnion(doc(db, 'drivers', driver.id)), offeredTo: null });
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
      const updateData = { 
        fare: parseFloat(counterOfferAmount), 
        status: 'counter-offered', 
        offeredTo: driverRef 
      };
      
      console.log('📤 Updating ride with data:', updateData);
      
      await updateDoc(rideRef, updateData);
      
      console.log('✅ Counter offer submitted successfully');
      
      // Clear the incoming request immediately to prevent auto-reject
      setIncomingRequest(null);
      setIsCountering(false);
      
      if (toast) {
        toast({ title: 'Contraoferta Enviada', description: `Has propuesto una tarifa de S/${parseFloat(counterOfferAmount).toFixed(2)}` });
      }
    } catch (e) {
      console.error('❌ Error submitting counter offer:', e);
      if (toast) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la contraoferta.' });
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
