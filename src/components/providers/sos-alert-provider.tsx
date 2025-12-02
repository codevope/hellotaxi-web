"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, doc, getDoc, DocumentReference } from "firebase/firestore";
import type { SOSAlert, Driver, User as AppUser } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSound } from "@/hooks/use-notification-sound";

export function SOSAlertProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const { audioEnabled, playNotificationSound } = useNotificationSound('/sounds/error.mp3');
  const notifiedAlerts = useRef<Set<string>>(new Set());
  const notificationIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const notificationCountsRef = useRef<Map<string, number>>(new Map());
  
  // Verificar si estamos en una ruta de admin
  const isAdminRoute = pathname?.startsWith('/admin');

  // Función para mostrar notificación del navegador
  const showBrowserNotification = (alert: SOSAlert, triggeredByText: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🚨 ALERTA SOS', {
        body: `${triggeredByText} activó alerta SOS en el viaje ${alert.rideId || 'desconocido'}`,
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
  const startRepeatingNotification = (alert: SOSAlert, triggeredByText: string) => {
    // Si ya existe un intervalo para esta alerta, no crear otro
    if (notificationIntervalsRef.current.has(alert.id)) {
      return;
    }

    // Inicializar contador
    notificationCountsRef.current.set(alert.id, 0);

    // Notificación inmediata
    // Reproducir sonido solo si está habilitado
    if (audioEnabled) {
      playNotificationSound({ 
        volume: 1.0,
        soundFile: 'error'
      });
    } else {
      console.log('[SOS Alert] Audio no habilitado, omitiendo sonido');
    }
    
    showBrowserNotification(alert, triggeredByText);
    toast({
      variant: 'destructive',
      title: '🚨 ALERTA SOS',
      description: `${triggeredByText} activó alerta SOS`,
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

      // Reproducir sonido solo si está habilitado
      if (audioEnabled) {
        playNotificationSound({ 
          volume: 1.0,
          soundFile: 'error'
        });
      } else {
        console.log('[SOS Alert] Audio no habilitado, omitiendo sonido de recordatorio');
      }
      
      showBrowserNotification(alert, triggeredByText);
      toast({
        variant: 'destructive',
        title: '🚨 ALERTA SOS (Recordatorio)',
        description: `Alerta SOS sin atender - ${triggeredByText}`,
        duration: 10000,
      });

      notificationCountsRef.current.set(alert.id, currentCount + 1);
    }, 60000); // 1 minuto

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

  // Habilitar audio en primera interacción del usuario (solo en rutas admin y si no hay permiso previo)
  useEffect(() => {
    if (!isAdminRoute) return;
    
    // Solo agregar listeners si el audio NO está habilitado y NO hay permiso previo
    const hasPermission = localStorage.getItem('hellotaxi-audio-permission') === 'granted';
    
    if (!audioEnabled && !hasPermission) {
      
      const handleFirstInteraction = () => {
        // El hook de notification sound ya maneja la habilitación automáticamente
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
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
  }, [isAdminRoute]); // Solo re-ejecutar si cambia la ruta

  useEffect(() => {
    // Solo activar alertas en rutas de admin
    if (!isAdminRoute) {
      console.log('SOS Alert Provider: No está en ruta admin, alertas desactivadas');
      return;
    }

    
    // Solicitar permiso para notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Escuchar alertas SOS activas en tiempo real
    const alertsQuery = query(
      collection(db, "sosAlerts"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(alertsQuery, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const alertData = { id: change.doc.id, ...change.doc.data() } as SOSAlert;
        const alertId = change.doc.id;

        // Si la alerta fue removida o cambió su estado a algo diferente de 'pending', detener notificaciones
        if (change.type === 'removed' || alertData.status !== 'pending') {
          stopRepeatingNotification(alertId);
          notifiedAlerts.current.delete(alertId);
          continue; // Saltar al siguiente cambio
        }
        
        // Si la alerta está 'pending' y es nueva (added o modified pero no notificada aún)
        if ((change.type === 'added' || change.type === 'modified') && alertData.status === 'pending') {
          // Solo notificar si es una alerta nueva que no hemos notificado
          if (!notifiedAlerts.current.has(alertId)) {
            notifiedAlerts.current.add(alertId);

            // Obtener información del usuario que activó la alerta
            let triggeredByText = alertData.triggeredBy === 'driver' ? 'Conductor' : 'Pasajero';
            
            // Intentar obtener el nombre del usuario
            try {
              if (alertData.triggeredBy === 'driver' && alertData.driver instanceof DocumentReference) {
                const driverSnap = await getDoc(alertData.driver);
                if (driverSnap.exists()) {
                  const driverData = driverSnap.data() as Driver;
                  if (driverData.userId) {
                    const userSnap = await getDoc(doc(db, 'users', driverData.userId));
                    if (userSnap.exists()) {
                      const userData = userSnap.data() as AppUser;
                      triggeredByText = `Conductor ${userData.name}`;
                    }
                  }
                }
              } else if (alertData.triggeredBy === 'passenger' && alertData.passenger instanceof DocumentReference) {
                const passengerSnap = await getDoc(alertData.passenger);
                if (passengerSnap.exists()) {
                  const passengerData = passengerSnap.data() as AppUser;
                  triggeredByText = `Pasajero ${passengerData.name}`;
                }
              }
            } catch (error) {
              console.error("Error obteniendo información del usuario:", error);
            }

            // Iniciar notificaciones repetitivas
            startRepeatingNotification(alertData, triggeredByText);
          }
        }
      }
    });

    // Limpiar intervalos al desmontar
    return () => {
      unsubscribe();
      notificationIntervalsRef.current.forEach((interval) => clearInterval(interval));
      notificationIntervalsRef.current.clear();
      notificationCountsRef.current.clear();
    };
  }, [isAdminRoute]); 

  return <>{children}</>;
}
