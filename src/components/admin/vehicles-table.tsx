
'use client';

import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { Vehicle, Driver, User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { vehiclesColumns, type EnrichedVehicle } from './vehicles-columns';

async function getVehicles(): Promise<EnrichedVehicle[]> {
  const vehiclesCol = collection(db, 'vehicles');
  const vehicleSnapshot = await getDocs(vehiclesCol);
  const vehicleList = vehicleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));

  const enrichedVehicles: EnrichedVehicle[] = [];

  for (const vehicle of vehicleList) {
    let driverUser: User | undefined = undefined;
    if (vehicle.driverId) {
      const driverRef = doc(db, 'drivers', vehicle.driverId);
      const driverSnap = await getDoc(driverRef);
      if (driverSnap.exists()) {
        const driverData = driverSnap.data() as Driver;
        // Cargar el usuario del conductor
        if (driverData.userId) {
          const userRef = doc(db, 'users', driverData.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            driverUser = { id: userSnap.id, ...userSnap.data() } as User;
          }
        }
      }
    }
    enrichedVehicles.push({ ...vehicle, driver: driverUser });
  }

  return enrichedVehicles;
}

export default function VehiclesTable() {
  const [vehicles, setVehicles] = useState<EnrichedVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVehicles() {
        try {
            const fetchedVehicles = await getVehicles();
            setVehicles(fetchedVehicles);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        } finally {
            setLoading(false);
        }
    }
    loadVehicles();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Todos los Vehículos</CardTitle>
          <CardDescription>Un registro de todos los vehículos en la plataforma y sus conductores asignados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Vehículos</CardTitle>
        <CardDescription>Un registro de todos los vehículos en la plataforma y sus conductores asignados.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={vehiclesColumns}
          data={vehicles}
          searchKey="brand"
          searchPlaceholder="Buscar por marca, modelo o conductor..."
          pageSize={10}
          entityName="vehículo"
        />
      </CardContent>
    </Card>
  );
}
