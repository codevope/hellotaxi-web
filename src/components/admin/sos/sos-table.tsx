"use client";

import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../ui/card";
import { DataTable } from "@/components/ui/data-table";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  DocumentReference,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import type { SOSAlert, Driver, User as AppUser } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { sosAlertsColumns, type EnrichedSOSAlert } from "./sos-columns";

async function getSosAlerts(): Promise<EnrichedSOSAlert[]> {
  const alertsCol = collection(db, "sosAlerts");
  const alertSnapshot = await getDocs(alertsCol);
  const alertsList = alertSnapshot.docs.map(
    (docSnap) => {
      const data = docSnap.data();
      const { id: _, ...cleanData } = data as any;
      const result = { id: docSnap.id, ...cleanData } as SOSAlert;
      return result;
    }
  );

  const enrichedAlerts: EnrichedSOSAlert[] = [];

  for (const alert of alertsList) {
    let driverUser: AppUser | null = null;
    let passenger: AppUser | null = null;

    // Obtener datos del conductor
    if (alert.driver && alert.driver instanceof DocumentReference) {
      const driverSnap = await getDoc(alert.driver);
      if (driverSnap.exists()) {
        const driverData = driverSnap.data() as Driver;
        // Cargar el usuario del conductor usando userId
        if (driverData.userId) {
          const userSnap = await getDoc(doc(db, 'users', driverData.userId));
          if (userSnap.exists()) {
            driverUser = { id: userSnap.id, ...userSnap.data() } as AppUser;
          }
        }
      }
    }

    // Obtener datos del pasajero
    if (alert.passenger && alert.passenger instanceof DocumentReference) {
      const passengerSnap = await getDoc(alert.passenger);
      if (passengerSnap.exists()) {
        passenger = {
          id: passengerSnap.id,
          ...passengerSnap.data(),
        } as AppUser;
      }
    }

    if (driverUser && passenger) {
      // Construir el objeto sin el campo id interno
      const enrichedAlert: EnrichedSOSAlert = {
        id: alert.id, // ID del documento de Firestore
        date: alert.date,
        status: alert.status,
        triggeredBy: alert.triggeredBy,
        rideId: alert.rideId,
        driver: driverUser,
        passenger: passenger,
      };
      enrichedAlerts.push(enrichedAlert);
    }
  }

  return enrichedAlerts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export default function SosTable() {
  const [alerts, setAlerts] = useState<EnrichedSOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Cargar alertas iniciales
  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      const fetchedAlerts = await getSosAlerts();
      setAlerts(fetchedAlerts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching SOS alerts:", error);
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (alertId: string) => {


    setUpdatingId(alertId);
    try {
      const alertRef = doc(db, "sosAlerts", alertId);
      await updateDoc(alertRef, { status: "attended" });
      
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert.id === alertId ? { ...alert, status: "attended" } : alert
        )
      );
      
      toast({
        title: "Alerta Atendida",
        description: "El estado de la alerta ha sido actualizado.",
      });
    } catch (error: any) {
      console.error("Error al actualizar alerta:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado de la alerta.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Alertas SOS</CardTitle>
          <CardDescription>
            Registro de todas las alertas de emergencia activadas durante los
            viajes.
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
        <CardTitle>Historial de Alertas SOS</CardTitle>
        <CardDescription>
          Registro de todas las alertas de emergencia activadas durante los
          viajes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={sosAlertsColumns(handleUpdateStatus, updatingId)}
          data={alerts}
          searchKey="triggeredBy"
          searchPlaceholder="Buscar por pasajero, conductor o ID de viaje..."
          pageSize={10}
          entityName="alerta"
        />
      </CardContent>
    </Card>
  );
}
