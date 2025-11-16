"use client";

/**
 * Vista Mobile Optimizada para Driver
 *
 * Características:
 * - Pantalla completa (sin header/footer web)
 * - Interfaz tipo app móvil
 * - Todas las funcionalidades: aceptar viajes, chat, notificaciones, SOS, mapa
 * - Bottom navigation integrado en el layout
 * - Dashboard optimizado para touch
 */

import { useEffect, useState } from "react";
import { useDriverAuth } from "@/hooks/use-driver-auth";
import { useDriverActiveRide } from "@/hooks/driver/use-driver-active-ride";
import { useIncomingRideRequests } from "@/hooks/driver/use-incoming-ride-requests";
import { useDriverChat } from "@/hooks/driver/use-driver-chat";
import { useDriverRideStore } from "@/store/driver-ride-store";
import { MobileDriverDashboard } from "@/components/driver/mobile-dashboard";
import { useToast } from "@/hooks/use-toast";
import { useDriverNotificationsSafe } from "@/hooks/use-driver-notifications-safe";
import { useCounterOffer } from "@/hooks/use-counter-offer";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { processRating } from "@/ai/flows/process-rating";
import type { Ride } from "@/lib/types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function MobileDriverContent() {
  const { user, driver, setDriver, loading: authLoading } = useDriverAuth();
  const { toast } = useToast();

  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

  const {
    isAvailable,
    incomingRequest: incomingRequestStore,
    activeRide: activeRideStore,
    isCountering: isCounteringStore,
    setAvailability,
    setIncomingRequest: setIncomingRequestStore,
    setActiveRide: setActiveRideStore,
    setIsCountering: setIsCounteringStore,
  } = useDriverRideStore();

  // Hook: activo y rating
  const {
    activeRide: activeRideHook,
    completedRideForRating,
    setCompletedRideForRating,
    updateRideStatus,
    isCompletingRide,
    driverLocation,
  } = useDriverActiveRide({ driver, setAvailability });

  // Hook: notificaciones con sonido SEGURO
  const {
    hasPermission,
    audioEnabled,
    audioPermissionGranted,
    hasTriedReactivation,
    enableAudio,
    tryReenableAudio,
    requestNotificationPermission,
    updateNotificationPermissions,
    shouldAttemptReactivation,
    testNotification,
    isLoaded,
    playSound,
    isSecureContext,
    canUseNotifications,
  } = useDriverNotificationsSafe(driver);

  // Hook: solicitudes entrantes
  const {
    incomingRequest: incomingRequestHook,
    requestTimeLeft,
    acceptRequest: acceptRequestHook,
    rejectRequest: rejectRequestHook,
  } = useIncomingRideRequests({
    driver,
    isAvailable,
    setAvailability,
    setActiveRide: setActiveRideStore,
    playNotificationSound: playSound,
  });

  // Hook: contraoferta
  const {
    isCountering: isCounteringHook,
    counterOfferAmount,
    setCounterOfferAmount,
    startCounterMode,
    submitCounterOffer,
  } = useCounterOffer({
    incomingRequest: incomingRequestHook,
    setIncomingRequest: setIncomingRequestStore,
    setIsCountering: setIsCounteringStore,
    setAvailability,
  });

  // Hook: chat
  const { chatMessages, sendMessage } = useDriverChat({
    activeRide: activeRideHook,
  });

  // Verificar si el conductor está aprobado
  const isApproved = driver?.approvalStatus === "approved";

  // Efecto para solicitar permisos de notificación cuando el conductor se conecta por primera vez
  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      if (driver && isLoaded && hasPermission === false) {
        const granted = await requestNotificationPermission();

        // Actualizar preferencias en BD
        await updateNotificationPermissions();

        if (granted) {
          toast({
            title: "Notificaciones habilitadas",
            description:
              "Ahora puedes habilitar el sonido para recibir alertas de audio.",
            duration: 8000,
            className: "border-l-4 border-l-[#2E4CA6]",
          });
        }
      }
    };

    checkAndRequestPermissions();
  }, [
    driver,
    isLoaded,
    hasPermission,
    requestNotificationPermission,
    updateNotificationPermissions,
    toast,
  ]);

  // Efecto para intentar reactivar audio después de desconexión
  useEffect(() => {
    if (driver && shouldAttemptReactivation && !hasTriedReactivation) {
      toast({
        title: "Reactivar Sonido",
        description: "Toca aquí para reactivar las alertas de audio",
        action: (
          <Button onClick={tryReenableAudio} size="sm" className="ml-auto">
            Reactivar
          </Button>
        ),
        duration: 10000,
      });
    }
  }, [
    driver,
    shouldAttemptReactivation,
    hasTriedReactivation,
    tryReenableAudio,
    toast,
  ]);

  const handleAvailabilityChange = async (checked: boolean) => {
    if (!driver) return;

    try {
      const driverRef = doc(db, "drivers", driver.id);
      await updateDoc(driverRef, {
        status: checked ? "available" : "unavailable",
      });
      setAvailability(checked);

      toast({
        title: checked ? "Ahora estás disponible" : "Ahora no estás disponible",
        description: checked
          ? "Podrás recibir solicitudes de viaje."
          : "No recibirás solicitudes hasta que te pongas disponible.",
      });
    } catch (error) {
      console.error("Error toggling availability:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cambiar tu disponibilidad.",
      });
    }
  };

  const acceptRequest = async () => {
    if (!incomingRequestHook) return;
    await acceptRequestHook();
  };

  const rejectRequest = async () => {
    if (!incomingRequestHook) return;
    await rejectRequestHook();
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!completedRideForRating) return;

    setIsRatingSubmitting(true);

    try {
      await processRating({
        ratedUserId: completedRideForRating.passengerId,
        isDriver: false,
        rating,
        comment,
      });

      const rideRef = doc(db, "rides", completedRideForRating.id);
      await updateDoc(rideRef, { isRatedByDriver: true });

      toast({
        title: "¡Gracias por tu calificación!",
        description: "Tu opinión ayuda a mantener la calidad de nuestra comunidad.",
      });

      setCompletedRideForRating(null);
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        variant: "destructive",
        title: "Error al Calificar",
        description:
          "No se pudo guardar tu calificación. Por favor, intenta de nuevo.",
      });
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full">
      <MobileDriverDashboard
        driver={driver!}
        isApproved={isApproved}
        hasPermission={hasPermission || false}
        audioEnabled={audioEnabled}
        isLoaded={isLoaded}
        audioPermissionGranted={audioPermissionGranted}
        enableAudio={enableAudio}
        rideLocation={driverLocation}
        activeRide={activeRideHook}
        incomingRequest={incomingRequestHook}
        requestTimeLeft={requestTimeLeft}
        isCountering={isCounteringHook}
        counterOfferAmount={counterOfferAmount}
        setCounterOfferAmount={setCounterOfferAmount}
        acceptRequest={acceptRequest}
        rejectRequest={rejectRequest}
        startCounterMode={startCounterMode}
        submitCounterOffer={submitCounterOffer}
        updateRideStatus={(
          status: "arrived" | "in-progress" | "completed"
        ) => activeRideHook && updateRideStatus(activeRideHook, status)}
        isCompletingRide={isCompletingRide}
        completedRideForRating={completedRideForRating}
        onRatingSubmit={handleRatingSubmit}
        isRatingSubmitting={isRatingSubmitting}
        isDriverChatOpen={isDriverChatOpen}
        setIsDriverChatOpen={setIsDriverChatOpen}
        chatMessages={chatMessages}
        onSendMessage={sendMessage}
        toast={toast}
        isAvailable={isAvailable}
        handleAvailabilityChange={handleAvailabilityChange}
      />
    </div>
  );
}

export default function MobileDriverPage() {
  const { user, driver, loading } = useDriverAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-screen text-center bg-gray-50">
        <Card className="max-w-md p-6">
          <CardHeader>
            <CardTitle>Inicia Sesión</CardTitle>
            <CardDescription>
              Debes iniciar sesión para acceder al panel de conductor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar Sesión
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-screen text-center bg-gray-50">
        <Card className="max-w-md p-6">
          <CardHeader>
            <CardTitle>No eres Conductor</CardTitle>
            <CardDescription>
              Esta sección es solo para conductores registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/driver/register">Registrarse como Conductor</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <MobileDriverContent />;
}
