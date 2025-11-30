"use client";

import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { DataTable } from "@/components/ui/data-table";
import type { Ride, Driver, User as AppUser } from "@/lib/types";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  DocumentReference,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import {
  cancellationsColumns,
  type EnrichedCancellation,
} from "./cancellations-columns";

async function getCancelledRides(): Promise<EnrichedCancellation[]> {
  const ridesCol = collection(db, "rides");
  const q = query(ridesCol, where("status", "==", "cancelled"));
  const rideSnapshot = await getDocs(q);
  const ridesList = rideSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Ride)
  );

  const enrichedRides: EnrichedCancellation[] = [];

  for (const ride of ridesList) {
    let enrichedDriver: (Driver & { name: string; avatarUrl: string }) | null = null;
    let passenger: AppUser | null = null;

    if (ride.driver && ride.driver instanceof DocumentReference) {
      const driverSnap = await getDoc(ride.driver);
      if (driverSnap.exists()) {
        const driverData = { id: driverSnap.id, ...driverSnap.data() } as Driver;
        // Cargar datos del usuario del conductor
        const driverUserSnap = await getDoc(doc(db, 'users', driverData.userId));
        if (driverUserSnap.exists()) {
          const driverUser = driverUserSnap.data() as AppUser;
          enrichedDriver = {
            ...driverData,
            name: driverUser.name,
            avatarUrl: driverUser.avatarUrl,
          };
        }
      }
    }

    if (ride.passenger && ride.passenger instanceof DocumentReference) {
      const passengerSnap = await getDoc(ride.passenger);
      if (passengerSnap.exists()) {
        passenger = { id: passengerSnap.id, ...passengerSnap.data() } as AppUser;
      }
    }

    if (enrichedDriver && passenger) {
      enrichedRides.push({ ...ride, driver: enrichedDriver, passenger });
    }
  }

  return enrichedRides.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export default function CancellationsTable() {
  const [rides, setRides] = useState<EnrichedCancellation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRides() {
      try {
        const fetchedRides = await getCancelledRides();
        setRides(fetchedRides);
      } catch (error) {
        console.error("Error fetching cancelled rides:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRides();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Viajes Cancelados</CardTitle>
          <CardDescription>
            Un registro de todos los viajes que fueron cancelados por pasajeros o
            conductores.
          </CardDescription>
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
        <CardTitle>Historial de Viajes Cancelados</CardTitle>
        <CardDescription>
          Un registro de todos los viajes que fueron cancelados por pasajeros o
          conductores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={cancellationsColumns}
          data={rides}
          searchKey="passenger"
          searchPlaceholder="Buscar por pasajero, conductor o motivo..."
          pageSize={10}
          entityName="cancelación"
        />
      </CardContent>
    </Card>
  );
}
