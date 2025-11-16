"use client";

import { useState, useCallback, useEffect } from "react";
import { useDriverRideStore } from "@/store/driver-ride-store";
import { useDriverActiveRide } from "@/hooks/driver/use-driver-active-ride";
import { useIncomingRideRequests } from "@/hooks/driver/use-incoming-ride-requests";
import { useDriverChat } from "@/hooks/driver/use-driver-chat";
import { useDriverNotificationsSafe } from "@/hooks/use-driver-notifications-safe";
import { useDriverRideHistory } from "@/hooks/driver/use-driver-ride-history";
import type { Driver, EnrichedDriver } from "@/lib/types";

/**
 * Configuración de notificaciones del conductor
 */
export interface NotificationSettings {
  enableSounds: boolean;
  enableVibration: boolean;
}

/**
 * Hook headless (sin UI) que centraliza toda la lógica de negocio del driver
 *
 * Combina:
 * - Estado de disponibilidad
 * - Solicitudes entrantes
 * - Viaje activo
 * - Historial de viajes
 * - Chat
 * - Notificaciones
 *
 * Este hook NO contiene ninguna lógica de UI, solo lógica de negocio.
 * Puede ser usado tanto en mobile como en desktop.
 *
 * @example
 * ```tsx
 * // En componente Mobile
 * function MobileDashboard() {
 *   const logic = useDriverRideLogic({ driver });
 *   return <MobileUI {...logic} />;
 * }
 *
 * // En componente Desktop
 * function DesktopDashboard() {
 *   const logic = useDriverRideLogic({ driver });
 *   return <DesktopUI {...logic} />;
 * }
 * ```
 */
export function useDriverRideLogic({
  driver,
  initialHistoryLimit = 25,
}: {
  driver: Driver | EnrichedDriver | null;
  initialHistoryLimit?: number;
}) {
  // ============================================================
  // ESTADO LOCAL
  // ============================================================

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      enableSounds: true,
      enableVibration: true,
    });

  const [rejectedRideIds, setRejectedRideIds] = useState<string[]>([]);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

  // ============================================================
  // ZUSTAND STORE
  // ============================================================

  const {
    isAvailable,
    incomingRequest,
    activeRide,
    isCountering,
    setAvailability,
    setIncomingRequest,
    setActiveRide,
    setIsCountering,
  } = useDriverRideStore();

  // ============================================================
  // HOOKS DE DATOS
  // ============================================================

  // Viaje activo y rating
  const {
    activeRide: activeRideHook,
    completedRideForRating,
    setCompletedRideForRating,
    updateRideStatus,
    isCompletingRide,
    driverLocation,
  } = useDriverActiveRide({ driver, setAvailability });

  // Notificaciones
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

  // Solicitudes entrantes
  const {
    incomingRequests,
    currentRequest,
    acceptRequest,
    rejectRequest,
    isProcessing,
  } = useIncomingRideRequests(driver, rejectedRideIds);

  // Historial de viajes
  const { rides: rideHistory, isLoading: isLoadingHistory } =
    useDriverRideHistory(driver, initialHistoryLimit);

  // Chat
  const {
    messages: chatMessages,
    sendMessage: sendChatMessage,
    isLoading: isChatLoading,
  } = useDriverChat(activeRide?.id);

  // ============================================================
  // EFECTOS
  // ============================================================

  // Sincronizar incoming request del hook con el store
  useEffect(() => {
    if (currentRequest && currentRequest.id !== incomingRequest?.id) {
      setIncomingRequest(currentRequest);
    }
  }, [currentRequest, incomingRequest, setIncomingRequest]);

  // Sincronizar active ride del hook con el store
  useEffect(() => {
    if (activeRideHook && activeRideHook.id !== activeRide?.id) {
      setActiveRide(activeRideHook);
    }
  }, [activeRideHook, activeRide, setActiveRide]);

  // Solicitar permisos de notificación cuando el conductor se conecta
  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      if (driver && isLoaded && hasPermission === false) {
        await requestNotificationPermission();
        await updateNotificationPermissions();
      }
    };

    checkAndRequestPermissions();
  }, [
    driver,
    isLoaded,
    hasPermission,
    requestNotificationPermission,
    updateNotificationPermissions,
  ]);

  // ============================================================
  // HANDLERS
  // ============================================================

  /**
   * Cambia la disponibilidad del conductor
   */
  const handleToggleAvailability = useCallback(
    async (available: boolean) => {
      setAvailability(available);

      // Aquí podrías sincronizar con Firebase si es necesario
      // await updateDoc(doc(db, "drivers", driver.id), { isAvailable: available });
    },
    [setAvailability]
  );

  /**
   * Acepta una solicitud de viaje
   */
  const handleAcceptRequest = useCallback(
    async (requestId: string) => {
      if (!driver) return;

      try {
        await acceptRequest(requestId);
        // La solicitud aceptada se convertirá en activeRide automáticamente
        // mediante el hook useDriverActiveRide
      } catch (error) {
        console.error("Error accepting request:", error);
        throw error;
      }
    },
    [driver, acceptRequest]
  );

  /**
   * Rechaza una solicitud de viaje
   */
  const handleRejectRequest = useCallback(
    async (requestId: string) => {
      if (!driver) return;

      try {
        await rejectRequest(requestId);
        setRejectedRideIds((prev) => [...prev, requestId]);
        setIncomingRequest(null);
      } catch (error) {
        console.error("Error rejecting request:", error);
        throw error;
      }
    },
    [driver, rejectRequest, setIncomingRequest]
  );

  /**
   * Actualiza el estado del viaje activo
   */
  const handleUpdateRideStatus = useCallback(
    async (
      status:
        | "accepted"
        | "on_the_way"
        | "arrived"
        | "in_progress"
        | "completed"
        | "cancelled"
    ) => {
      if (!activeRide) return;

      try {
        await updateRideStatus(activeRide.id, status);
      } catch (error) {
        console.error("Error updating ride status:", error);
        throw error;
      }
    },
    [activeRide, updateRideStatus]
  );

  /**
   * Completa el viaje actual
   */
  const handleCompleteRide = useCallback(async () => {
    if (!activeRide) return;

    try {
      await handleUpdateRideStatus("completed");
      // El hook useDriverActiveRide manejará automáticamente
      // la transición a completedRideForRating
    } catch (error) {
      console.error("Error completing ride:", error);
      throw error;
    }
  }, [activeRide, handleUpdateRideStatus]);

  /**
   * Envía un rating para el viaje completado
   */
  const handleSubmitRating = useCallback(
    async (rating: number, comment?: string) => {
      if (!completedRideForRating) return;

      setIsRatingSubmitting(true);

      try {
        // Aquí iría la lógica para guardar el rating
        // await submitRating(completedRideForRating.id, rating, comment);

        setCompletedRideForRating(null);
      } catch (error) {
        console.error("Error submitting rating:", error);
        throw error;
      } finally {
        setIsRatingSubmitting(false);
      }
    },
    [completedRideForRating, setCompletedRideForRating]
  );

  /**
   * Actualiza configuración de notificaciones
   */
  const handleUpdateNotificationSettings = useCallback(
    (settings: Partial<NotificationSettings>) => {
      setNotificationSettings((prev) => ({ ...prev, ...settings }));
    },
    []
  );

  /**
   * Envía un mensaje en el chat
   */
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!driver || !activeRide) return;

      try {
        await sendChatMessage(message, driver.id);
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    },
    [driver, activeRide, sendChatMessage]
  );

  // ============================================================
  // VALORES DERIVADOS
  // ============================================================

  const hasActiveRide = !!activeRide;
  const hasIncomingRequest = !!incomingRequest;
  const hasPendingRating = !!completedRideForRating;
  const canAcceptRides = isAvailable && !hasActiveRide && !hasIncomingRequest;
  const unreadChatCount = chatMessages?.filter((m) => !m.read).length || 0;

  // ============================================================
  // RETORNO
  // ============================================================

  return {
    // Estado
    driver,
    isAvailable,
    incomingRequest,
    activeRide,
    completedRideForRating,
    rideHistory,
    driverLocation,
    notificationSettings,
    rejectedRideIds,

    // Estados de carga
    isProcessing,
    isCompletingRide,
    isRatingSubmitting,
    isLoadingHistory,

    // Chat
    chatMessages,
    unreadChatCount,
    isChatLoading,

    // Notificaciones
    hasNotificationPermission: hasPermission,
    audioEnabled,
    audioPermissionGranted,
    canUseNotifications,
    isSecureContext,

    // Handlers
    toggleAvailability: handleToggleAvailability,
    acceptRequest: handleAcceptRequest,
    rejectRequest: handleRejectRequest,
    updateRideStatus: handleUpdateRideStatus,
    completeRide: handleCompleteRide,
    submitRating: handleSubmitRating,
    updateNotificationSettings: handleUpdateNotificationSettings,
    sendMessage: handleSendMessage,
    requestNotificationPermission,
    enableAudio,
    tryReenableAudio,
    testNotification,
    playSound,

    // Valores derivados
    hasActiveRide,
    hasIncomingRequest,
    hasPendingRating,
    canAcceptRides,

    // Zustand actions (por si se necesitan directamente)
    setIsCountering,
  };
}

/**
 * Tipo exportado para usar en componentes
 */
export type DriverRideLogic = ReturnType<typeof useDriverRideLogic>;
