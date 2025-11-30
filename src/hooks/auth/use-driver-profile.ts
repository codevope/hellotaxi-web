'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, Unsubscribe, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Driver, Vehicle, EnrichedDriver, User } from '@/lib/types';
import { useAuth } from './use-auth';
import { hasRole } from '@/lib/user-utils';

/**
 * Hook para gestionar el perfil de conductor del usuario autenticado
 * Combina datos de User (de use-auth) con Driver
 */
export function useDriverProfile() {
  const { user: firebaseUser, appUser, loading: authLoading } = useAuth();
  const [driverProfile, setDriverProfile] = useState<EnrichedDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDriver = hasRole(appUser, 'driver');

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const loadDriverProfile = async () => {
      if (!firebaseUser || !appUser || !isDriver) {
        setDriverProfile(null);
        setLoading(false);
        return;
      }

      try {
        const driverRef = doc(db, 'drivers', appUser.id);
        
        // Listener en tiempo real del perfil de conductor
        unsubscribe = onSnapshot(
          driverRef,
          async (profileSnap) => {
            if (profileSnap.exists()) {
              const profileData = { 
                id: profileSnap.id, 
                ...profileSnap.data() 
              } as Driver;
              
              // Expandir vehículo si existe
              let vehicleData: Vehicle | null = null;
              if (profileData.vehicle && profileData.vehicle instanceof DocumentReference) {
                const vehicleSnap = await getDoc(profileData.vehicle);
                if (vehicleSnap.exists()) {
                  vehicleData = { 
                    id: vehicleSnap.id, 
                    ...vehicleSnap.data() 
                  } as Vehicle;
                }
              }
              
              // Combinar Driver + User + Vehicle expandido
              setDriverProfile({
                ...profileData,
                vehicle: vehicleData,
                user: appUser,
                // Helpers de acceso rápido (evitar user.name)
                name: appUser.name,
                email: appUser.email,
                avatarUrl: appUser.avatarUrl,
                phone: appUser.phone,
                rating: appUser.rating,
              });
              setError(null);
            } else {
              // Usuario tiene rol driver pero no existe en drivers
              setDriverProfile(null);
              setError('Perfil de conductor no encontrado. Por favor, contacta al administrador.');
            }
            setLoading(false);
          },
          (err) => {
            console.error('Error listening to driver profile:', err);
            setError('Error al cargar perfil de conductor');
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Error loading driver profile:', err);
        setError('Error al cargar perfil de conductor');
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadDriverProfile();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [firebaseUser, appUser, isDriver, authLoading]);

  return {
    driverProfile,
    isDriver,
    loading: authLoading || loading,
    error,
    // Helpers para acceso rápido
    user: appUser,
    vehicle: driverProfile?.vehicle || null,
    status: driverProfile?.status || 'unavailable',
    documentsStatus: driverProfile?.documentsStatus || 'pending',
  };
}
