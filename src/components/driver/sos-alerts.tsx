"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, getDoc, DocumentReference } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Siren, MapPin, User as UserIcon, Phone, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { SOSAlert, Ride, Driver, User } from "@/lib/types";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type EnrichedSOSAlert = Omit<SOSAlert, 'driver' | 'passenger'> & {
  driver: User;
  passenger: User;
  ride?: Ride;
};

export default function DriverSOSAlerts() {
  const [alerts, setAlerts] = useState<EnrichedSOSAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { audioEnabled, playNotificationSound, enableAudio } = useNotificationSound('/sounds/error.mp3');

  // Habilitar audio en primera interacción del usuario (solo si no está ya habilitado)
  useEffect(() => {
    // Solo agregar listeners si el audio NO está habilitado y NO hay permiso previo
    const hasPermission = localStorage.getItem('hellotaxi-audio-permission') === 'granted';
    
    if (!audioEnabled && !hasPermission) {
   
      const handleFirstInteraction = async () => {
        const enabled = await enableAudio();
        if (enabled) {
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('touchstart', handleFirstInteraction);
          document.removeEventListener('keydown', handleFirstInteraction);
        }
      };

      document.addEventListener('click', handleFirstInteraction);
      document.addEventListener('touchstart', handleFirstInteraction);
      document.addEventListener('keydown', handleFirstInteraction);

      return () => {
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  useEffect(() => {
    // Escuchar alertas SOS activas de otros conductores
    const alertsQuery = query(
      collection(db, "sosAlerts"),
      where("status", "==", "pending"),
      where("triggeredBy", "==", "driver")
    );

    const unsubscribe = onSnapshot(alertsQuery, async (snapshot) => {
      const newAlerts: EnrichedSOSAlert[] = [];

      for (const docSnap of snapshot.docs) {
        const alertData = docSnap.data() as SOSAlert;

        try {
          // Obtener datos del conductor (desde Driver + User)
          const driverRef = alertData.driver as DocumentReference;
          const driverSnap = await getDoc(driverRef);
          if (!driverSnap.exists()) continue;

          const driverData = driverSnap.data() as Driver;
          const driverUserSnap = await getDoc(doc(db, "users", driverData.userId));
          const driverUser = driverUserSnap.exists() ? { id: driverUserSnap.id, ...driverUserSnap.data() } as User : null;

          if (!driverUser) continue;

          // Obtener datos del pasajero
          const passengerRef = alertData.passenger as DocumentReference;
          const passengerSnap = await getDoc(passengerRef);
          const passengerUser = passengerSnap.exists() ? { id: passengerSnap.id, ...passengerSnap.data() } as User : null;

          if (!passengerUser) continue;

          // Obtener datos del viaje
          let rideData: Ride | undefined;
          if (alertData.rideId) {
            const rideSnap = await getDoc(doc(db, "rides", alertData.rideId));
            if (rideSnap.exists()) {
              rideData = { id: rideSnap.id, ...rideSnap.data() } as Ride;
            }
          }

          newAlerts.push({
            id: docSnap.id,
            rideId: alertData.rideId,
            driver: driverUser,
            passenger: passengerUser,
            date: alertData.date,
            status: alertData.status,
            triggeredBy: alertData.triggeredBy,
            ride: rideData,
          });
        } catch (error) {
          console.error("Error loading SOS alert details:", error);
        }
      }

      // Reproducir sonido solo si hay nuevas alertas y el audio está habilitado
      if (newAlerts.length > alerts.length && alerts.length > 0) {
        if (audioEnabled) {
          playNotificationSound({ 
            volume: 1.0,
            soundFile: 'error'
          });
        } else {
          console.log('[Driver SOS] Audio no habilitado, omitiendo sonido');
        }
      }

      setAlerts(newAlerts);
      
      // Abrir automáticamente el sheet cuando hay nuevas alertas
      if (newAlerts.length > 0 && newAlerts.length > alerts.length) {
        setIsOpen(true);
      }
    });

    return () => unsubscribe();
  }, [alerts.length, audioEnabled, playNotificationSound]);

  if (alerts.length === 0) return null;

  return (
    <>
      {/* Botón flotante para reabrir el sheet si hay alertas */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          variant="destructive"
          size="lg"
          className="fixed bottom-4 right-4 z-50 animate-pulse shadow-lg"
        >
          <Siren className="h-5 w-5 mr-2" />
          {alerts.length} Emergencia{alerts.length > 1 ? "s" : ""}
        </Button>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-red-600">
              <Siren className="h-6 w-6 animate-pulse" />
              Alertas de Emergencia
            </SheetTitle>
            <SheetDescription>
              {alerts.length} conductor{alerts.length > 1 ? "es" : ""} en situación de emergencia
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <Alert variant="destructive" className="border-red-600 bg-red-50 dark:bg-red-950">
              <Siren className="h-5 w-5 animate-pulse" />
              <AlertDescription className="font-semibold">
                ¡Alerta! {alerts.length} conductor{alerts.length > 1 ? "es" : ""} necesita ayuda
              </AlertDescription>
            </Alert>

            {alerts.map((alert) => (
              <Card key={alert.id} className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Siren className="h-5 w-5 text-red-600 animate-pulse" />
                      Conductor en Emergencia
                    </CardTitle>
                    <Badge variant="destructive" className="animate-pulse">
                      ACTIVA
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(alert.date), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Conductor:</span>
                      <span>{alert.driver.name}</span>
                    </div>

                    {alert.driver.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Teléfono:</span>
                        <a href={`tel:${alert.driver.phone}`} className="text-blue-600 hover:underline">
                          {alert.driver.phone}
                        </a>
                      </div>
                    )}

                    {alert.ride && (
                      <>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="font-medium">Recojo:</span>
                            <p className="text-muted-foreground">{alert.ride.pickup}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="font-medium">Destino:</span>
                            <p className="text-muted-foreground">{alert.ride.dropoff}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Pasajero:</span>
                          <span>{alert.passenger.name}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Si estás cerca, considera prestar ayuda o contactar a las autoridades.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
