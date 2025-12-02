'use client';

import { createContext, useContext, useEffect } from 'react';
import { useDriverAuth } from '@/hooks/auth/use-driver-auth';
import { useIncomingRideRequests } from '@/hooks/driver/use-incoming-ride-requests';
import { useDriverRideStore } from '@/store/driver-ride-store';
import { useToast } from '@/hooks/use-toast';
import { useDriverNotificationsSafe } from '@/hooks/use-driver-notifications';
import { useState } from 'react';

interface DriverRequestsContextValue {
  requestTimeLeft: number;
  counterOfferAmount: string;
  setCounterOfferAmount: (value: string) => void;
  acceptRequest: () => Promise<void>;
  rejectRequest: () => Promise<void>;
  submitCounterOffer: () => Promise<void>;
  startCounterMode: () => void;
}

const DriverRequestsContext = createContext<DriverRequestsContextValue | null>(null);

export function useDriverRequestsContext() {
  const context = useContext(DriverRequestsContext);
  if (!context) {
    throw new Error('useDriverRequestsContext debe usarse dentro de DriverRequestsProvider');
  }
  return context;
}

export function DriverRequestsProvider({ children }: { children: React.ReactNode }) {
  const { driver, loading } = useDriverAuth();
  const { toast } = useToast();
  const { isAvailable, setAvailability } = useDriverRideStore();
  const [rejectedRideIds, setRejectedRideIds] = useState<string[]>([]);
  
  // 💾 Guardar datos del conductor en localStorage cuando cambien
  useEffect(() => {
    if (driver?.id) {
      const driverData = {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('hellotaxi-driver-data', JSON.stringify(driverData));
    }
  }, [driver]);
  
  // 🔄 Sincronizar estado de disponibilidad con Firestore cuando el conductor se carga
  useEffect(() => {
    if (driver && driver.status) {
      const driverIsAvailable = driver.status === 'available';

      // Solo actualizar si es diferente para evitar re-renders innecesarios
      if (isAvailable !== driverIsAvailable) {
       setAvailability(driverIsAvailable);
      }
    }
  }, [driver?.status, driver?.id, isAvailable, setAvailability]);
  
  // Log cuando cambia el estado de driver
  useEffect(() => {
   
  }, [driver, loading]);
  
  // Hook de notificaciones
  const { playSound, playNotificationSound: playNotificationSoundHook } = useDriverNotificationsSafe(driver);
  
  // Hook que escucha solicitudes entrantes GLOBALMENTE
  const {
    incomingRequest,
    requestTimeLeft,
    isCountering,
    counterOfferAmount,
    setCounterOfferAmount,
    acceptRequest,
    rejectRequest,
    submitCounterOffer,
    startCounterMode,
  } = useIncomingRideRequests({
    driver,
    isAvailable,
    rejectedRideIds,
    setRejectedRideIds,
    toast,
    playNotificationSound: async (options) => {

      // Usar playNotificationSound del hook que soporta soundFile
      const result = await playNotificationSoundHook(options);
      return result;
    },
  });

  // Log para debugging
  useEffect(() => {

  }, [driver, isAvailable, rejectedRideIds.length, incomingRequest]);

  const value: DriverRequestsContextValue = {
    requestTimeLeft,
    counterOfferAmount,
    setCounterOfferAmount,
    acceptRequest,
    rejectRequest,
    submitCounterOffer,
    startCounterMode,
  };

  return (
    <DriverRequestsContext.Provider value={value}>
      {children}
    </DriverRequestsContext.Provider>
  );
}
