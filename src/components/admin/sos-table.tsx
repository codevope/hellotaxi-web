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
    (doc) => ({ id: doc.id, ...doc.data() } as SOSAlert)
  );

  const enrichedAlerts: EnrichedSOSAlert[] = [];

  for (const alert of alertsList) {
    let driver: Driver | null = null;
    let passenger: AppUser | null = null;

    if (alert.driver && alert.driver instanceof DocumentReference) {
      const driverSnap = await getDoc(alert.driver);
      if (driverSnap.exists()) {
        driver = { id: driverSnap.id, ...driverSnap.data() } as Driver;
      }
    }

    if (alert.passenger && alert.passenger instanceof DocumentReference) {
      const passengerSnap = await getDoc(alert.passenger);
      if (passengerSnap.exists()) {
        passenger = {
          id: passengerSnap.id,
          ...passengerSnap.data(),
        } as AppUser;
      }
    }

    if (driver && passenger) {
      enrichedAlerts.push({ ...alert, driver, passenger });
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

  useEffect(() => {
    async function loadAlerts() {
      try {
        const fetchedAlerts = await getSosAlerts();
        setAlerts(fetchedAlerts);
      } catch (error) {
        console.error("Error fetching SOS alerts:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  const handleUpdateStatus = async (alertId: string) => {
    setUpdatingId(alertId);
    const alertRef = doc(db, "sosAlerts", alertId);
    try {
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
    } catch (error) {
      console.error("Error updating alert status:", error);
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
