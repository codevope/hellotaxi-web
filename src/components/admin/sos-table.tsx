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
  setDoc,
  DocumentReference,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import type { SOSAlert, Driver, User as AppUser } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { sosAlertsColumns, type EnrichedSOSAlert } from "./sos-columns";
import { useNotificationSound } from "@/hooks/use-notification-sound";

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
  const [notifiedAlerts, setNotifiedAlerts] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { playSound } = useNotificationSound('/sounds/notification.mp3');
  const notificationIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const notificationCountsRef = useRef<Map<string, number>>(new Map());

  // Función para mostrar notificación del navegador
  const showBrowserNotification = (alert: EnrichedSOSAlert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🚨 ALERTA SOS', {
        body: `${alert.triggeredBy === 'driver' ? 'Conductor' : 'Pasajero'} activó alerta SOS en el viaje ${alert.rideId || 'desconocido'}`,
        icon: '/icons/android/android-launchericon-192-192.png',
        badge: '/icons/android/android-launchericon-96-96.png',
        tag: alert.id,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  // Función para iniciar notificaciones repetitivas
  const startRepeatingNotification = (alert: EnrichedSOSAlert) => {
    // Si ya existe un intervalo para esta alerta, no crear otro
    if (notificationIntervalsRef.current.has(alert.id)) {
      return;
    }

    // Inicializar contador
    notificationCountsRef.current.set(alert.id, 0);

    // Notificación inmediata
    playSound({ volume: 1.0 });
    showBrowserNotification(alert);
    toast({
      variant: 'destructive',
      title: '🚨 ALERTA SOS',
      description: `${alert.triggeredBy === 'driver' ? 'Conductor' : 'Pasajero'} activó alerta SOS`,
      duration: 10000,
    });

    // Configurar repetición cada 1 minuto
    const interval = setInterval(() => {
      const currentCount = notificationCountsRef.current.get(alert.id) || 0;
      
      if (currentCount >= 4) { // 5 notificaciones en total (0-4)
        clearInterval(interval);
        notificationIntervalsRef.current.delete(alert.id);
        notificationCountsRef.current.delete(alert.id);
        return;
      }

      playSound({ volume: 1.0 });
      showBrowserNotification(alert);
      toast({
        variant: 'destructive',
        title: '🚨 ALERTA SOS (Recordatorio)',
        description: `Alerta SOS sin atender - ${alert.triggeredBy === 'driver' ? 'Conductor' : 'Pasajero'}`,
        duration: 10000,
      });

      notificationCountsRef.current.set(alert.id, currentCount + 1);
    }, 60000); // 60000ms = 1 minuto

    notificationIntervalsRef.current.set(alert.id, interval);
  };

  // Función para detener notificaciones repetitivas
  const stopRepeatingNotification = (alertId: string) => {
    const interval = notificationIntervalsRef.current.get(alertId);
    if (interval) {
      clearInterval(interval);
      notificationIntervalsRef.current.delete(alertId);
      notificationCountsRef.current.delete(alertId);
    }
  };

  // Solicitar permisos de notificación al montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Escuchar cambios en tiempo real para alertas nuevas
  useEffect(() => {
    const alertsCol = collection(db, "sosAlerts");
    const q = query(alertsCol, where("status", "==", "pending"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const newAlerts: SOSAlert[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const { id: _, ...cleanData } = data as any;
        const alert = { id: docSnap.id, ...cleanData } as SOSAlert;
        
        // Si es una alerta nueva que no hemos notificado
        if (!notifiedAlerts.has(alert.id)) {
          newAlerts.push(alert);
          setNotifiedAlerts(prev => new Set(prev).add(alert.id));
        }
      });

      // Enriquecer y notificar alertas nuevas
      for (const alert of newAlerts) {
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
            passenger = { id: passengerSnap.id, ...passengerSnap.data() } as AppUser;
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
          startRepeatingNotification(enrichedAlert);
        }
      }

      // Recargar todas las alertas
      loadAlerts();
    });

    return () => unsubscribe();
  }, [notifiedAlerts]);

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

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      notificationIntervalsRef.current.forEach((interval) => {
        clearInterval(interval);
      });
    };
  }, []);

  const handleUpdateStatus = async (alertId: string) => {
    console.log('🔍 Intentando actualizar alerta con ID:', alertId);
    console.log('📋 Alertas actuales:', alerts.map(a => ({ id: a.id, rideId: a.rideId })));
    
    setUpdatingId(alertId);
    try {
      const alertRef = doc(db, "sosAlerts", alertId);
      console.log('📄 Referencia del documento:', alertRef.path);
      await updateDoc(alertRef, { status: "attended" });
      
      stopRepeatingNotification(alertId);
      
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
