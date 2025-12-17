"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Car,
  Star,
  UserCog,
  MessageCircle,
  LogIn,
  Siren,
  Volume2,
  UserIcon,
  FileText
} from "lucide-react";
import { useDriverAuth } from "@/hooks/auth/use-driver-auth";
import { useDriverAvailabilityLocation } from "@/hooks/driver/use-driver-availability-location";
import { useDriverRequestsContext } from "@/components/providers/driver-requests-provider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type {
  Ride,
  User,
  EnrichedDriver,
} from "@/lib/types";


import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { collection, doc, updateDoc, addDoc } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DriverDocuments from "@/components/driver/documents";
import { processRating } from "@/ai/flows/process-rating";
import MapView from "@/components/maps/map-view";
import { db } from "@/lib/firebase";
// simulación ahora gestionada dentro de useDriverActiveRide
import { useDriverActiveRideContext } from "@/components/providers/driver-active-ride-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import EnhancedChat from "@/components/chat/enhanced-chat";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDriverRideStore } from "@/store/driver-ride-store";
import { useDriverRideHistory } from "@/hooks/driver/use-driver-ride-history";
import { DriverStatePanel } from "@/components/driver/driver-state-panel";
import { useDriverChat } from "@/hooks/driver/use-driver-chat";
import { useDriverNotificationsSafe } from "@/hooks/use-driver-notifications";
import { useSearchParams, useRouter } from "next/navigation";
import { SSLWarningBanner } from "@/components/ssl-warning-banner";
import { AudioEnabler } from "@/components/pwa/audio-enabler";
import DriverSOSAlerts from "@/components/driver/sos-alerts";
import { useChatNotifications, ChatNotification } from "@/components/chat/chat-notification";


function DriverPageContent() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "config";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [isRideSheetOpen, setIsRideSheetOpen] = useState(false);
  const [hasUserClosedSheet, setHasUserClosedSheet] = useState(false);

  // Sincronizar activeTab con los parámetros de la URL
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const {
    isAvailable,
    incomingRequest,
    activeRide,
    isCountering,
    setAvailability,
    setActiveRide
  } = useDriverRideStore();

  const { user, driver, setDriver, loading } = useDriverAuth();
  const { toast } = useToast();

  // Hook para guardar ubicación del conductor en Firebase (para que aparezca en admin dashboard)
  useDriverAvailabilityLocation({ 
    driverId: driver?.id, 
    isAvailable: isAvailable && !activeRide 
  });

  // Historial usando el hook correcto
  const { rides: allRides } = useDriverRideHistory(driver, 25);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const isFirstChatLoad = useRef(true);
  const previousMessageCount = useRef(0);

  // Provider global: activo y rating
  const {
    activeRide: activeRideHook,
    completedRideForRating,
    setCompletedRideForRating,
    updateRideStatus,
    isCompletingRide,
    driverLocation,
  } = useDriverActiveRideContext();

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
    isLoaded,
    canUseNotifications,
  } = useDriverNotificationsSafe(driver);

  // Hook: notificaciones de chat
  const {
    notification: chatNotification,
    sender: notificationSender,
    isVisible: isNotificationVisible,
    showNotification,
    hideNotification
  } = useChatNotifications(!isDriverChatOpen);

  // Efecto para solicitar permisos de notificación cuando el conductor se conecta por primera vez
  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      if (driver && isLoaded && hasPermission === false) {
        const granted = await requestNotificationPermission();

        await updateNotificationPermissions();

        if (granted) {
          toast({
            title: "Notificaciones habilitadas",
            description:
              "Ahora puedes habilitar el sonido para recibir alertas de audio.",
            duration: 8000,
            className: "border-l-4 border-l-[#2E4CA6]",
          });
        } else {
          toast({
            title: "Notificaciones desactivadas",
            description:
              "Puedes habilitarlas desde la configuración de tu navegador.",
            duration: 8000,
            variant: "destructive",
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

  // Estado para controlar si ya se intentó reactivar el audio
  const [hasAttemptedAutoReactivation, setHasAttemptedAutoReactivation] =
    useState(false);

  // Efecto para intentar reactivar automáticamente el audio basado en preferencias de BD
  useEffect(() => {
    const attemptAutoReactivation = async () => {
      const shouldTryDB = shouldAttemptReactivation();
      const shouldTryLocal = audioPermissionGranted && !audioEnabled;

      if (
        driver &&
        isLoaded &&
        (shouldTryDB || shouldTryLocal) &&
        !hasAttemptedAutoReactivation &&
        !hasTriedReactivation
      ) {
        setHasAttemptedAutoReactivation(true);

        const reactivated = await tryReenableAudio();
        if (reactivated) {
          toast({
            title: "Sonido reactivado",
            description: "Las alertas de audio están funcionando nuevamente.",
            duration: 3000,
            className: "border-l-4 border-l-[#05C7F2]",
          });
        } else {
          toast({
            title: "Sonido disponible",
            description:
              'Haz clic en "Reactivar Sonido" para volver a habilitar las alertas de audio.',
            duration: 8000,
            className: "border-l-4 border-l-[#049DD9]",
          });
        }
      }
    };

    if (!hasAttemptedAutoReactivation && !hasTriedReactivation) {
      const timer = setTimeout(attemptAutoReactivation, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    driver,
    isLoaded,
    audioPermissionGranted,
    audioEnabled,
    hasAttemptedAutoReactivation,
    hasTriedReactivation,
    shouldAttemptReactivation,
    tryReenableAudio,
    toast,
  ]);

  // Chat usando el hook correcto
  const { messages: chatMessages, sendMessage } = useDriverChat({
    rideId: activeRideHook?.id,
    userId: user?.uid,
  });

  // Mantener compat con store hasta migración completa
  useEffect(() => {
    if (activeRideHook && !activeRide) {
      setActiveRide(activeRideHook);
    }
  }, [activeRideHook, activeRide, setActiveRide]);

  // NOTA: useIncomingRideRequests ahora está en DriverRequestsProvider (global)
  // Obtenemos las funciones y valores del contexto global
  const {
    requestTimeLeft,
    counterOfferAmount,
    setCounterOfferAmount,
    acceptRequest,
    rejectRequest,
    submitCounterOffer,
    startCounterMode,
  } = useDriverRequestsContext();

  // Sync driver availability status with local state
  useEffect(() => {
    if (driver) {
      const isDriverAvailable = driver.status === "available";
      setAvailability(isDriverAvailable);
    }
  }, [driver, setAvailability]);

  // Auto-abrir sheet cuando hay cambios importantes en el viaje
  useEffect(() => {
    // Siempre abrir cuando hay calificación pendiente (prioridad máxima)
    if (completedRideForRating) {
      setIsRideSheetOpen(true);
      setHasUserClosedSheet(false); // Resetear para forzar apertura de calificación
      return;
    }

    if (activeRideHook) {
      // Solo abrir automáticamente si el usuario no ha cerrado manualmente el sheet
      if (!hasUserClosedSheet && (
          activeRideHook.status === 'accepted' ||
          activeRideHook.status === 'arrived')) {
        setIsRideSheetOpen(true);
      }
    } else {
      // Cerrar el sheet y resetear el estado cuando no hay viaje activo Y no hay calificación pendiente
      if (!completedRideForRating) {
        setIsRideSheetOpen(false);
        setHasUserClosedSheet(false);
      }
    }
  }, [activeRideHook, completedRideForRating, hasUserClosedSheet]);

  // Listener para notificaciones de mensajes de chat
  useEffect(() => {
    if (!activeRideHook || !user?.uid || !activeRideHook.passenger) {
      isFirstChatLoad.current = true;
      previousMessageCount.current = 0;
      return;
    }

    // Detectar nuevos mensajes del pasajero
    if (!isFirstChatLoad.current && chatMessages.length > previousMessageCount.current) {
      const lastMessage = chatMessages[chatMessages.length - 1];
    
      
      // Si el último mensaje es del pasajero (no del conductor actual)
      if (lastMessage.userId !== user.uid) {
        
        // Solo mostrar notificación emergente si el chat está cerrado
        if (!isDriverChatOpen && activeRideHook.passenger) {
          showNotification(lastMessage, activeRideHook.passenger);
        } else {
          console.log('[Driver] Chat abierto, no se muestra notificación');
        }
      } else {
        console.log('[Driver] Mensaje propio, ignorando notificación');
      }
    }
    
    // Actualizar refs para la próxima vez
    isFirstChatLoad.current = false;
    previousMessageCount.current = chatMessages.length;
  }, [chatMessages, user?.uid, activeRideHook, isDriverChatOpen, showNotification]);

  const handleAvailabilityChange = async (available: boolean) => {
    if (!driver) return;

    // Verificar si los documentos están aprobados antes de permitir disponibilidad
    if (available && driver.documentsStatus !== 'approved') {
      toast({
        variant: "destructive",
        title: "Documentos pendientes",
        description: "Debes tener todos tus documentos aprobados antes de estar disponible.",
        duration: 5000,
      });
      return;
    }

    // Verificar si tiene un vehículo asignado
    if (available && !driver.vehicle) {
      toast({
        variant: "destructive",
        title: "Vehículo no asignado",
        description: "Debes tener un vehículo asignado antes de estar disponible. Ve a la pestaña de vehículo.",
        duration: 5000,
      });
      return;
    }

    setIsUpdatingStatus(true);
    const newStatus = available ? "available" : "unavailable";
    const driverRef = doc(db, "drivers", driver.id);

    try {
      await updateDoc(driverRef, { status: newStatus });
      setDriver({ ...driver, status: newStatus });
      setAvailability(available);

      toast({
        title: `Estado actualizado: ${
          available ? "Disponible" : "No Disponible"
        }`,
        description: available
          ? "Ahora recibirás solicitudes de viaje."
          : "Has dejado de recibir solicitudes.",
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar tu estado.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSosConfirm = async () => {
    if (!activeRideHook || !user || !driver) return;

    try {
      const newSosAlertRef = doc(collection(db, "sosAlerts"));
      await addDoc(collection(db, "sosAlerts"), {
        id: newSosAlertRef.id,
        rideId: activeRideHook.id,
        passenger: doc(db, "users", activeRideHook.passenger.id),
        driver: doc(db, "drivers", driver.id),
        date: new Date().toISOString(),
        status: "pending",
        triggeredBy: "driver",
      });
      toast({
        variant: "destructive",
        title: "¡Alerta de Pánico Activada!",
        description: "Se ha notificado a la central de seguridad.",
      });
    } catch (error) {
      console.error("Error creating SOS alert:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo activar la alerta de pánico.",
      });
    }
  };

  const handleRatingSubmit = async (
    passengerId: string,
    rating: number,
    comment: string
  ) => {
    if (!completedRideForRating) return;
    setIsRatingSubmitting(true);
    try {
      await processRating({
        ratedUserId: passengerId,
        isDriver: false,
        rating,
        comment,
      });
      
      // Guardar la calificación en el documento del viaje
      const rideRef = doc(db, "rides", completedRideForRating.id);
      await updateDoc(rideRef, {
        passengerRating: rating,
        passengerComment: comment || ''
      });
      
      toast({
        title: "Pasajero Calificado",
        description: `Has calificado al pasajero con ${rating} estrellas.`,
      });
      setCompletedRideForRating(null);
    } catch (error) {
      console.error("Error submitting passenger rating:", error);
      toast({
        variant: "destructive",
        title: "Error al Calificar",
        description: "No se pudo guardar la calificación. Inténtalo de nuevo.",
      });
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  if (loading || !driver) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isApproved = driver.documentsStatus === "approved";
  
  // Vista responsiva con nueva estructura
  return (
    <>
      <SSLWarningBanner />
      <AudioEnabler 
        onEnable={enableAudio}
        isEnabled={audioEnabled}
      />
      
      {/* Notificación de chat flotante */}
      <ChatNotification
        message={chatNotification}
        sender={notificationSender}
        isVisible={isNotificationVisible}
        onClose={hideNotification}
        onClick={() => {
          hideNotification();
          setIsDriverChatOpen(true);
        }}
        duration={5000}
      />
      
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-1 p-2 sm:p-4 lg:p-8 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 min-h-[calc(100vh-200px)]">
            {/* Panel Principal - Columna Izquierda */}
            <div className="lg:col-span-2 flex flex-col min-h-[50vh] lg:min-h-[60vh] rounded-xl overflow-hidden shadow-lg relative">
              <MapView
                driverLocation={activeRide ? driverLocation : null}
                pickupLocation={
                  activeRide?.pickupLocation ? activeRide.pickupLocation : null
                }
                dropoffLocation={
                  activeRide?.dropoffLocation
                    ? activeRide.dropoffLocation
                    : null
                }
                interactive={true}
              />
              {activeRide && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 h-12 w-12 sm:h-16 sm:w-16 rounded-full shadow-2xl animate-pulse"
                      >
                        <Siren className="h-8 w-8" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reportar Emergencia</AlertDialogTitle>
                        <AlertDialogDescription>
                          ¿Necesitas reportar una emergencia? Esta acción
                          alertará a las autoridades y al equipo de soporte.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            handleSosConfirm();
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Reportar Emergencia
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {/* Panel de estado del conductor - COMO SHEET DESLIZABLE */}
              {(activeRideHook || completedRideForRating) && (
                <>
                  {/* Botón flotante para abrir el sheet del viaje activo o calificación */}
                  <Button
                    onClick={() => {
                      setIsRideSheetOpen(true);
                      setHasUserClosedSheet(false); // Resetear cuando el usuario abre manualmente
                    }}
                    className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 h-14 sm:h-16 w-auto px-5 sm:px-6 bg-gradient-to-r from-[#2E4CA6] via-[#0477BF] to-[#05C7F2] hover:from-[#1e3a7a] hover:via-[#036aa0] hover:to-[#04a8d1] text-white shadow-2xl hover:shadow-blue-500/50 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold transition-all duration-3000 animate-pulse hover:animate-none border-2"
                  >
                    {completedRideForRating ? (
                      <>
                        <Star className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 fill-yellow-300 text-yellow-300" />
                        <span className="font-bold tracking-wide">Calificar Pasajero</span>
                        <Star className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6 fill-yellow-300 text-yellow-300" />
                      </>
                    ) : (
                      <>
                        <Car className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="font-bold tracking-wide">
                          Viaje {activeRideHook?.status === 'accepted' ? 'Aceptado' : 
                                 activeRideHook?.status === 'arrived' ? 'En Origen' : 
                                 activeRideHook?.status === 'in-progress' ? 'En Curso' : 
                                 activeRideHook?.status}
                        </span>
                        <MessageCircle className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
                      </>
                    )}
                  </Button>

                  {/* Sheet para el viaje activo */}
                  <Sheet 
                    open={isRideSheetOpen} 
                    onOpenChange={(open) => {
                      setIsRideSheetOpen(open);
                      if (!open) {
                        setHasUserClosedSheet(true); // Marcar que el usuario cerró manualmente
                      }
                    }}
                  >
                    <SheetContent 
                      side="left" 
                      className="w-full sm:w-[400px] p-0 rounded-r-none sm:rounded-r-2xl"
                    >
                      <SheetHeader className="p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
                        <SheetTitle className="flex items-center gap-2 text-blue-900">
                          {completedRideForRating ? (
                            <>
                              <Star className="h-5 w-5" />
                              Calificar Pasajero
                            </>
                          ) : (
                            <>
                              <Car className="h-5 w-5" />
                              Viaje en Curso
                            </>
                          )}
                        </SheetTitle>
                      </SheetHeader>
                      
                      <div className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
                        <DriverStatePanel
                          incomingRequest={null}
                          requestTimeLeft={0}
                          isCountering={false}
                          counterOfferAmount=""
                          setCounterOfferAmount={() => {}}
                          acceptRequest={() => {}}
                          rejectRequest={() => {}}
                          startCounterMode={() => {}}
                          submitCounterOffer={() => {}}
                          activeRide={activeRideHook}
                          updateRideStatus={(status) =>
                            activeRideHook && updateRideStatus(activeRideHook, status)
                          }
                          isCompletingRide={isCompletingRide}
                          completedRideForRating={completedRideForRating}
                          onRatingSubmit={handleRatingSubmit}
                          isRatingSubmitting={isRatingSubmitting}
                          isDriverChatOpen={isDriverChatOpen}
                          setIsDriverChatOpen={setIsDriverChatOpen}
                          chatMessages={chatMessages}
                          onSendMessage={sendMessage}
                          passengerNameForChat={activeRideHook?.passenger.name}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </>
              )}

              {/* Solo mostrar solicitudes entrantes como antes */}
              {incomingRequest && (
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t p-4">
                  <DriverStatePanel
                    incomingRequest={incomingRequest}
                    requestTimeLeft={requestTimeLeft}
                    isCountering={isCountering}
                    counterOfferAmount={counterOfferAmount}
                    setCounterOfferAmount={setCounterOfferAmount}
                    acceptRequest={acceptRequest}
                    rejectRequest={rejectRequest}
                    startCounterMode={startCounterMode}
                    submitCounterOffer={submitCounterOffer}
                    activeRide={null}
                    updateRideStatus={() => {}}
                    isCompletingRide={false}
                    completedRideForRating={null}
                    onRatingSubmit={() => {}}
                    isRatingSubmitting={false}
                    isDriverChatOpen={false}
                    setIsDriverChatOpen={() => {}}
                    chatMessages={[]}
                    onSendMessage={() => {}}
                    passengerNameForChat=""
                  />
                </div>
              )}
            </div>

            {/* Tabs de la derecha - Chat y Config */}
            <Card className="overflow-hidden rounded-xl lg:rounded-2xl shadow-lg lg:shadow-2xl">
              <CardContent className="p-0">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full h-full"
                >
                  <TabsList className="grid h-12 sm:h-14 w-full grid-cols-4 rounded-none bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] p-2 sm:p-3">
                    <TabsTrigger value="config" className="relative h-full rounded-lg text-xs sm:text-sm font-semibold text-white/70 transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E4CA6] data-[state=active]:shadow-lg">
                      <UserCog className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Config</span>
                      <span className="sm:hidden">Config</span>
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="relative h-full rounded-lg text-xs sm:text-sm font-semibold text-white/70 transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E4CA6] data-[state=active]:shadow-lg">
                      <MessageCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Chat</span>
                      <span className="sm:hidden">Chat</span>
                    </TabsTrigger>
                    <TabsTrigger value="documentos" className="relative h-full rounded-lg text-xs sm:text-sm font-semibold text-white/70 transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E4CA6] data-[state=active]:shadow-lg">
                      <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Docs</span>
                      <span className="sm:hidden">Docs</span>
                    </TabsTrigger>
                    <TabsTrigger value="vehiculo" className="relative h-full rounded-lg text-xs sm:text-sm font-semibold text-white/70 transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E4CA6] data-[state=active]:shadow-lg">
                      <Car className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Vehículo</span>
                      <span className="sm:hidden">Vehí.</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="config" className="mt-0 p-0">
                    <div className="p-4 sm:p-6 h-[calc(100vh-300px)] overflow-y-auto space-y-4">
                      {/* Estado de disponibilidad */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${driver?.status === 'available' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                              <div>
                                <h4 className="text-sm font-medium">Estado</h4>
                                <p className="text-sm text-muted-foreground">
                                  {driver?.status === 'available' ? 'Disponible' : 'No disponible'}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={driver?.status === 'available'}
                              onCheckedChange={handleAvailabilityChange}
                              disabled={isUpdatingStatus || driver?.documentsStatus !== 'approved' || !driver?.vehicle}
                            />
                          </div>
                          {(driver?.documentsStatus !== 'approved' || !driver?.vehicle) && (
                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                              <p className="text-xs text-yellow-800">
                                {driver?.documentsStatus !== 'approved' 
                                  ? 'Debes subir y aprobar tus documentos para estar disponible.' 
                                  : 'Debes tener un vehículo asignado para estar disponible.'}
                                {driver?.documentsStatus !== 'approved' && ' Ve a la pestaña de documentos.'}
                                {!driver?.vehicle && ' Ve a la pestaña de vehículo.'}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Notificaciones y Sonido */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            Notificaciones y Sonido
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h4 className="text-sm font-medium">Sonido de notificaciones</h4>
                              <p className="text-xs text-muted-foreground">
                                Reproduce sonido cuando llegue una solicitud
                              </p>
                            </div>
                            <Switch
                              checked={audioEnabled}
                              onCheckedChange={async (checked) => {
                                if (checked) {
                                  await enableAudio();
                                }
                              }}
                              disabled={!canUseNotifications}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h4 className="text-sm font-medium">Notificaciones push</h4>
                              <p className="text-xs text-muted-foreground">
                                Recibir notificaciones del navegador
                              </p>
                            </div>
                            <Switch
                              checked={hasPermission === true}
                              onCheckedChange={async (checked) => {
                                if (checked) {
                                  await requestNotificationPermission();
                                }
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Información del conductor */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Información Personal
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={driver?.avatarUrl} alt={driver?.name} />
                              <AvatarFallback className="bg-blue-500 text-white">
                                {driver?.name?.charAt(0) || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{driver?.name}</p>
                              <p className="text-xs text-muted-foreground">Conductor</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <span>ID: {driver?.id?.slice(0, 8)}...</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Información del vehículo */}
                      {driver?.vehicle && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              Vehículo
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Marca:</span>
                              <span className="font-medium">{driver.vehicle.brand}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Modelo:</span>
                              <span className="font-medium">{driver.vehicle.model}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Año:</span>
                              <span className="font-medium">{driver.vehicle.year}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Placa:</span>
                              <span className="font-medium font-mono bg-gray-100 px-2 py-1 rounded">
                                {driver.vehicle.licensePlate}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Estadísticas rápidas */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Estadísticas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Calificación:</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">
                                {driver?.rating?.toFixed(1) || '5.0'}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Viajes totales:</span>
                            <span className="font-medium">{allRides?.length || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Estado:</span>
                            <Badge 
                              variant={driver?.status === 'available' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {driver?.status === 'available' ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="chat" className="mt-0 p-0">
                    <div className="h-[calc(100vh-300px)]">
                      {activeRide ? (
                        <div className="flex flex-col h-full">
                          <div className="p-3 sm:p-4 border-b bg-secondary/20">
                            <h3 className="text-lg font-semibold">
                              Chat con {activeRide.passenger.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {activeRide.pickupLocation?.address}
                            </p>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <EnhancedChat
                              messages={chatMessages}
                              onSendMessage={sendMessage}
                              otherUser={activeRideHook?.passenger}
                              rideStatus={activeRideHook?.status}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 sm:py-8 text-gray-500 p-3 sm:p-4">
                          <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-semibold mb-2">
                            No hay viaje activo
                          </h3>
                          <p>
                            El chat estará disponible cuando tengas un viaje
                            asignado.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="documentos" className="mt-0 p-0">
                    <div className="h-[calc(100vh-300px)] overflow-y-auto">
                      <div className="p-4 sm:p-6 space-y-4">
                        {/* Estado General de Documentos */}
                        <Card className="border-2">
                          <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Estado de Documentos
                              </CardTitle>
                              <Badge 
                                variant={
                                  driver.documentsStatus === 'approved' ? 'default' : 
                                  driver.documentsStatus === 'pending' ? 'outline' : 
                                  'destructive'
                                }
                                className="text-xs w-fit"
                              >
                                {driver.documentsStatus === 'approved' ? 'Aprobado' : 
                                 driver.documentsStatus === 'pending' ? 'Pendiente' : 
                                 'Rechazado'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <CardDescription className="text-xs">
                              {driver.documentsStatus === 'approved' 
                                ? 'Todos tus documentos han sido aprobados. Puedes comenzar a recibir viajes.'
                                : driver.documentsStatus === 'pending'
                                ? 'Tus documentos están en revisión. Recibirás una notificación cuando sean aprobados.'
                                : 'Algunos documentos fueron rechazados. Por favor, revisa y vuelve a subirlos.'}
                            </CardDescription>
                          </CardContent>
                        </Card>

                        {/* Componente de Documentos */}
                        <DriverDocuments driver={driver} onUpdate={(updatedDriver) => setDriver(updatedDriver)} />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="vehiculo" className="mt-0 p-0">
                    <div className="h-[calc(100vh-300px)] overflow-y-auto">
                      <div className="p-4 sm:p-6">
                      
                      {driver?.vehicle ? (
                        <div className="space-y-4">
                          {/* Información Básica */}
                          <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-blue-600" />
                                Información del Vehículo
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">Marca</span>
                                  <p className="text-sm font-semibold">{driver.vehicle.brand ? driver.vehicle.brand : 'No Asignada'}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">Modelo</span>
                                  <p className="text-sm font-semibold">{driver.vehicle.model ? driver.vehicle.model : 'No Asignado'}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">Año</span>
                                  <p className="text-sm font-semibold">{driver.vehicle.year ? driver.vehicle.year : 'No Asignado'}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">Color</span>
                                  <p className="text-sm font-semibold">{driver.vehicle.color ? driver.vehicle.color : 'No Asignado'}</p>
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Placa</span>
                                  <span className="text-sm font-bold font-mono bg-blue-100 text-blue-900 px-3 py-1.5 rounded">
                                    {driver.vehicle.licensePlate ? driver.vehicle.licensePlate : 'No Asignada'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-xs text-muted-foreground">Tipo de Servicio</span>
                                <Badge variant="outline" className="text-xs">
                                  {driver.vehicle.serviceType === 'economy' ? 'Económico' : 
                                   driver.vehicle.serviceType === 'comfort' ? 'Confort' : 
                                   driver.vehicle.serviceType === 'exclusive' ? 'Exclusivo' : driver.vehicle.serviceType == null ? 'No Asignado' : driver.vehicle.serviceType}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-xs text-muted-foreground">Estado</span>
                                <Badge variant={driver.vehicle.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                  {driver.vehicle.status === 'active' ? 'Activo' : 
                                   driver.vehicle.status === 'in_review' ? 'En revisión' : 
                                   driver.vehicle.status === 'inactive' ? 'Inactivo' : driver.vehicle.status == null ? 'No Asignado' : driver.vehicle.status}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>

                          <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p>Para actualizar la información del vehículo, contacta al administrador</p>
                          </div>
                        </div>
                      ) : (
                        <Card className="border-dashed border-2 border-gray-300">
                          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Car className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900">
                              Sin vehículo asignado
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground text-center mb-4 max-w-sm">
                              Necesitas un vehículo asignado para comenzar a recibir viajes
                            </p>
                            <div className="w-full max-w-sm">
                              <div className="text-xs sm:text-sm bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                                <p className="font-medium text-yellow-900">Acción requerida</p>
                                <p className="text-yellow-800 mt-1">Contacta al administrador para que te asigne un vehículo</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            <div className="lg:col-span-1 space-y-4">
              <DriverSOSAlerts />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default function DriverPage() {
  const { user, loading: authLoading } = useDriverAuth();
  const { isDriver, loading: driverAuthLoading } = useDriverAuth();

  if (authLoading || driverAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center text-center p-4 py-16 md:py-24">
        <Card className="max-w-md p-8">
          <CardHeader>
            <CardTitle>Acceso de Conductores</CardTitle>
            <CardDescription>
              Inicia sesión para acceder a tu panel de control.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/login">
                <LogIn className="mr-2" />
                Ir a Iniciar Sesión
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!isDriver) {
    return (
      <div className="flex flex-col items-center justify-center text-center flex-1 p-8">
        <Card className="max-w-md p-8">
          <CardHeader>
            <CardTitle>No eres un conductor</CardTitle>
            <CardDescription>
              Esta sección es solo para conductores registrados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/drive">¡Regístrate como Conductor!</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <DriverPageContent />;
}
