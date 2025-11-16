"use client";

import { useState } from "react";
import { useDriverAuth } from "@/hooks/use-driver-auth";
import { useDriverRideLogic } from "@/components/driver/shared/logic";
import { MobileDriverDashboard } from "./mobile-dashboard";
import { useToast } from "@/hooks/use-toast";
import { useCounterOffer } from "@/hooks/use-counter-offer";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import "@/styles/mobile/driver-mobile.css";

/**
 * Wrapper para MobileDriverDashboard que usa el nuevo hook de lógica compartida
 *
 * Este componente actúa como adaptador entre:
 * - La nueva arquitectura (useDriverRideLogic)
 * - El componente mobile existente (MobileDriverDashboard)
 *
 * Permite migración gradual sin romper el código existente.
 */
export default function MobileDriverDashboardWrapper() {
  const { user, driver, loading: authLoading } = useDriverAuth();
  const { toast } = useToast();
  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);

  // Hook con toda la lógica de negocio (headless)
  const logic = useDriverRideLogic({
    driver,
    initialHistoryLimit: 25,
  });

  // Counter offer logic (mantener por compatibilidad)
  const {
    isCountering,
    counterOfferAmount,
    setCounterOfferAmount,
    startCounterMode,
    submitCounterOffer,
    requestTimeLeft,
  } = useCounterOffer({
    incomingRequest: logic.incomingRequest,
    onAccept: logic.acceptRequest,
    onReject: logic.rejectRequest,
  });

  // ============================================================
  // ESTADOS DE CARGA Y ERROR
  // ============================================================

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="flex flex-col items-center gap-4 p-8">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Cargando información del conductor...
          </h2>
        </div>
      </div>
    );
  }

  if (!user || !driver) {
    return (
      <div className="p-4 min-h-screen bg-gray-50">
        <Alert variant="destructive" className="mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            Debes iniciar sesión como conductor para acceder a este panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================
  // HANDLERS ADAPTADORES
  // ============================================================

  const handleRatingSubmit = async (
    passengerId: string,
    rating: number,
    comment: string
  ) => {
    try {
      await logic.submitRating(rating, comment);
      toast({
        title: "Calificación enviada",
        description: "Gracias por calificar al pasajero",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la calificación",
        variant: "destructive",
      });
    }
  };

  const handleAvailabilityChange = async (available: boolean) => {
    try {
      await logic.toggleAvailability(available);
      toast({
        title: available ? "Disponible" : "No disponible",
        description: available
          ? "Ahora puedes recibir solicitudes de viaje"
          : "No recibirás nuevas solicitudes",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar la disponibilidad",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRideStatus = async (
    status: "arrived" | "in-progress" | "completed"
  ) => {
    try {
      await logic.updateRideStatus(
        status === "in-progress" ? "in_progress" : status
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del viaje",
        variant: "destructive",
      });
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  // Mapear props del nuevo hook al componente existente
  return (
    <MobileDriverDashboard
      driver={driver as any}
      isApproved={driver.documentsStatus === "approved"}
      hasPermission={logic.hasNotificationPermission || false}
      audioEnabled={logic.audioEnabled}
      isLoaded={true}
      audioPermissionGranted={logic.audioPermissionGranted}
      enableAudio={logic.enableAudio}
      rideLocation={logic.driverLocation}
      activeRide={logic.activeRide}
      incomingRequest={logic.incomingRequest}
      requestTimeLeft={requestTimeLeft}
      isCountering={isCountering}
      counterOfferAmount={counterOfferAmount}
      setCounterOfferAmount={setCounterOfferAmount}
      acceptRequest={() => {
        if (logic.incomingRequest) {
          logic.acceptRequest(logic.incomingRequest.id);
        }
      }}
      rejectRequest={() => {
        if (logic.incomingRequest) {
          logic.rejectRequest(logic.incomingRequest.id);
        }
      }}
      startCounterMode={startCounterMode}
      submitCounterOffer={submitCounterOffer}
      updateRideStatus={handleUpdateRideStatus}
      isCompletingRide={logic.isCompletingRide}
      completedRideForRating={logic.completedRideForRating}
      onRatingSubmit={handleRatingSubmit}
      isRatingSubmitting={logic.isRatingSubmitting}
      isDriverChatOpen={isDriverChatOpen}
      setIsDriverChatOpen={setIsDriverChatOpen}
      chatMessages={logic.chatMessages || []}
      onSendMessage={logic.sendMessage}
      toast={toast}
      isAvailable={logic.isAvailable}
      handleAvailabilityChange={handleAvailabilityChange}
    />
  );
}
