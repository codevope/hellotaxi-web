
'use client';

import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { Driver, Vehicle, User, EnrichedDriver } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, DocumentReference } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { DataTable } from '../ui/data-table';
import { driversColumns } from './drivers-table-columns';

async function getDrivers(): Promise<EnrichedDriver[]> {
    const driversCol = collection(db, 'drivers');
    const driverSnapshot = await getDocs(driversCol);
    const driverList = driverSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Driver);
    
    const enrichedDrivers: EnrichedDriver[] = [];
    for(const driver of driverList) {
        // Obtener datos del usuario (nombre, email, avatar, etc.)
        const userSnap = await getDoc(doc(db, 'users', driver.userId));
        if (!userSnap.exists()) {
            console.warn(`Usuario ${driver.userId} no encontrado para conductor ${driver.id}`);
            continue;
        }
        const user = { id: userSnap.id, ...userSnap.data() } as User;
        
        // Obtener vehículo si existe
        let vehicle: Vehicle | null = null;
        if(driver.vehicle && driver.vehicle instanceof DocumentReference) {
            const vehicleSnap = await getDoc(driver.vehicle);
            if(vehicleSnap.exists()){
                vehicle = { id: vehicleSnap.id, ...vehicleSnap.data() } as Vehicle;
            }
        }
        
        // Combinar Driver + User + Vehicle
        enrichedDrivers.push({ 
            ...driver, 
            vehicle,
            user,
            // Helpers de acceso directo
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            phone: user.phone,
            rating: user.rating,
        });
    }
    return enrichedDrivers;
}

export default function DriversTable() {
    const [drivers, setDrivers] = useState<EnrichedDriver[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDrivers() {
            try {
                const fetchedDrivers = await getDrivers();
                setDrivers(fetchedDrivers);
            } catch (error) {
                console.error("Error fetching drivers:", error);
            } finally {
                setLoading(false);
            }
        }
        loadDrivers();
    }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Conductores</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            columns={driversColumns}
            data={drivers}
            searchKey="conductor"
            searchPlaceholder="Buscar por nombre de conductor..."
            pageSize={10}
            entityName="conductor"
          />
        )}
      </CardContent>
    </Card>
  );
}
