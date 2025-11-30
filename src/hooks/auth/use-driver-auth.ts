
'use client';

/**
 * @deprecated Este hook está obsoleto. Usa useDriverProfile() en su lugar.
 * 
 * El nuevo sistema separa datos personales (User) de datos de conductor (Driver).
 * useDriverProfile() combina ambos correctamente y soporta el sistema de roles.
 * 
 * @see use-driver-profile.ts
 */

import { useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { AuthContext } from '@/components/providers/auth-provider';
import { doc, getDoc, onSnapshot, Unsubscribe, DocumentReference } from 'firebase/firestore';
import type { Driver, Vehicle, EnrichedDriver, User } from '@/lib/types';
import { useAuth as useBaseAuth } from './use-auth';
import { hasRole } from '@/lib/user-utils';

export function useDriverAuth() {
  const baseAuth = useBaseAuth();
  const { appUser } = baseAuth;
  const [driver, setDriver] = useState<EnrichedDriver | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const checkDriverRole = async () => {
      if (appUser && hasRole(appUser, 'driver')) {
        setIsDriver(true);
        const driverDocRef = doc(db, 'drivers', appUser.id);
        
        unsubscribe = onSnapshot(driverDocRef, async (driverSnap) => {
          if (driverSnap.exists()) {
            const driverData = { id: driverSnap.id, ...driverSnap.data() } as Driver;
            
            let vehicleData: Vehicle | null = null;
            if(driverData.vehicle && driverData.vehicle instanceof DocumentReference) {
                const vehicleSnap = await getDoc(driverData.vehicle);
                if (vehicleSnap.exists()) {
                    vehicleData = {id: vehicleSnap.id, ...vehicleSnap.data()} as Vehicle;
                }
            }
            
            // EnrichedDriver necesita user + helpers
            const enrichedDriver: EnrichedDriver = {
              ...driverData,
              vehicle: vehicleData,
              user: appUser,
              name: appUser.name,
              email: appUser.email,
              avatarUrl: appUser.avatarUrl,
              phone: appUser.phone,
              rating: appUser.rating,
            };
            setDriver(enrichedDriver);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to driver document:", error);
          setLoading(false);
        });

      } else {
        setIsDriver(false);
        setDriver(null);
        setLoading(false);
      }
    };

    if (!baseAuth.loading) {
       checkDriverRole();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
   
  }, [appUser, baseAuth.loading]);

  return {
    ...baseAuth,
    driver,
    setDriver,
    isDriver,
    loading: baseAuth.loading || loading,
  };
}

    