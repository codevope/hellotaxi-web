"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MapView from "@/components/maps/map-view";
import RideRequestForm from "@/components/forms/ride-request-form";
import RideHistory from "@/components/ride/ride-history";
import { SearchingRideStatus } from "@/components/ride/searching-ride-status";
import { AssignedDriverCard } from "@/components/ride/assigned-driver-card";
import { CounterOfferCard } from "@/components/ride/counter-offer-card";
import type {
  Ride,
  Driver,
  ChatMessage,
  CancellationReason,
} from "@/lib/types";
import type { RiderNotificationHook } from "@/hooks/use-rider-notifications";
import {
  History,
  Car,
  Siren,
  MessageCircle,
  Bot,
  Settings,
  Volume2,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import SupportChat from "@/components/chat/support-chat";
import {
  doc,
  onSnapshot,
  getDoc,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSettings } from "@/services/settings-service";
import EnhancedChat from "@/components/chat/enhanced-chat";
import { useEnhancedChat, useChatTyping } from "@/hooks/use-enhanced-chat";
import { useChatNotifications, ChatNotification } from "@/components/chat/chat-notification";
import RatingForm from "@/components/forms/rating-form";
import { processRating } from "@/ai/flows/process-rating";
import { useRideStore } from "@/store/ride-store";
import type { Vehicle, DriverWithVehicleInfo, User } from "@/lib/types";
import { AudioEnabler } from "@/components/pwa/audio-enabler";

// Helper function to enrich driver with vehicle and user information
async function enrichDriverWithVehicle(
  driver: Driver
): Promise<DriverWithVehicleInfo> {

  try {
    // Cargar datos del usuario
    const userSnap = await getDoc(doc(db, 'users', driver.userId));
    if (!userSnap.exists()) {
      throw new Error(`User not found for driver ${driver.id}`);
    }
    const userData = { id: userSnap.id, ...userSnap.data() } as User;

    // Cargar datos del vehículo
    if (!driver.vehicle) {
      throw new Error('Driver has no vehicle assigned');
    }
    const vehicleSnap = await getDoc(driver.vehicle);
    if (vehicleSnap.exists()) {
      const vehicleData = vehicleSnap.data() as Vehicle;
      const enrichedDriver: DriverWithVehicleInfo = {
        ...driver,
        // Datos del usuario
        name: userData.name,
        email: userData.email,
        avatarUrl: userData.avatarUrl,
        rating: userData.rating,
        phone: userData.phone,
        // Datos del vehículo
        vehicleBrand: vehicleData.brand,
        vehicleModel: vehicleData.model,
        licensePlate: vehicleData.licensePlate,
        vehicleColor: vehicleData.color,
        vehicleYear: vehicleData.year,
      };
      
      return enrichedDriver;
    } else {
      throw new Error('Vehicle data not found');
    }
  } catch (error) {
    console.error("Error loading driver data:", error);
    throw error;
  }
}

interface RiderDesktopViewProps {
  notifications: RiderNotificationHook;
}

export default function RiderDesktopView({ notifications }: RiderDesktopViewProps) {
  const { appUser, user } = useAuth();
  
  // Efecto para inicializar notificaciones del rider
  useEffect(() => {
    if (notifications && appUser?.id) {
      
      // Solicitar permisos automáticamente si no los tiene
      if (!notifications.hasPermission && notifications.canUseNotifications) {
        notifications.requestNotificationPermission();
      }
      
      // El audio se habilitará cuando el usuario interactúe con un botón específico
      // No se puede habilitar automáticamente por las políticas del navegador
    }
  }, [notifications, appUser?.id]);
  
  const {
    status,
    activeRide,
    assignedDriver,
    chatMessages,
    isSupportChatOpen,
    pickupLocation,
    dropoffLocation,
    driverLocation,
    counterOfferValue,
    originalFare,
    setActiveRide,
    setChatMessages,
    setDriverLocation,
    assignDriver,
    completeRideForRating,
    resetRide,
    resetAll,
    toggleSupportChat,
    setCounterOffer,
    setStatus,
  } = useRideStore();

  const [activeTab, setActiveTab] = useState("book");
  const [isCancelReasonDialogOpen, setIsCancelReasonDialogOpen] = useState(false);
  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<Awaited<ReturnType<typeof getSettings>> | null>(null);
  const [isRatingSubmitting, setIsSubmittingRating] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);

  const { toast } = useToast();

  // Chat mejorado
  const { messages: enhancedChatMessages, sendMessage, isLoading: isChatLoading } = useEnhancedChat({
    rideId: activeRide?.id,
    currentUserId: user?.uid,
  });

  const { isOtherUserTyping, startTyping, stopTyping } = useChatTyping({
    rideId: activeRide?.id,
    currentUserId: user?.uid,
    otherUserId: assignedDriver?.id,
  });

  const { 
    notification: chatNotification,
    sender: notificationSender,
    isVisible: isNotificationVisible,
    showNotification,
    hideNotification 
  } = useChatNotifications(!isDriverChatOpen);

  useEffect(() => {
    getSettings().then(setAppSettings);
  }, []);

  // 🚗 Listener para obtener todos los conductores disponibles
  useEffect(() => {
    const driversQuery = query(
      collection(db, 'drivers'),
      where('status', '==', 'available')
    );

    const unsubscribe = onSnapshot(driversQuery, (snapshot) => {
      const drivers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Driver));
      setAvailableDrivers(drivers);
    });

    return () => unsubscribe();
  }, []);

  // 📍 Actualizar ubicación del pasajero cada 60 segundos durante viaje activo
  useEffect(() => {
    if (!user?.uid || !activeRide || status === "idle" || status === "rating") {
      return;
    }

    const updatePassengerLocation = async () => {
      if (!navigator.geolocation) return;
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { location: newLocation });
          } catch (error) {
            console.error('[RIDER] Error actualizando ubicación:', error);
          }
        },
        (error) => {
          console.error('[RIDER] Error obteniendo geolocalización:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // Actualizar inmediatamente
    updatePassengerLocation();

    // Configurar intervalo de 60 segundos (1 minuto)
    const locationInterval = setInterval(updatePassengerLocation, 60000);

    return () => clearInterval(locationInterval);
  }, [user?.uid, activeRide, status]);

  // MASTER useEffect to listen for ride document changes and update UI state
  useEffect(() => {
    if (!user?.uid) {
      if (useRideStore.getState().status !== "idle") {
        resetRide();
      }
      return;
    }

    const q = query(
      collection(db, "rides"),
      where("passenger", "==", doc(db, "users", user.uid))
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const activeRides = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Ride))
        .filter(
          (ride) =>
            !["completed", "cancelled"].includes(ride.status) ||
            (ride.status === "completed" && !ride.isRatedByPassenger)
        );

      if (activeRides.length === 0) {
        // Solo resetear si no estamos en proceso de rating
        // Evita mostrar mensajes de cancelación después de completar el viaje
        if (useRideStore.getState().status !== "rating") {
          resetRide();
        }
        return;
      }

      const rideData = activeRides[0];
      setActiveRide(rideData);

      switch (rideData.status) {
        case "searching":
          setStatus("searching");
          break;

        case "counter-offered":
          if (useRideStore.getState().counterOfferValue !== rideData.fare) {
            setCounterOffer(rideData.fare);
          }
          break;

        case "accepted":
        case "arrived":
        case "in-progress":
          setStatus("assigned");
          if (rideData.driver) {
            const driverSnap = await getDoc(rideData.driver);
            if (driverSnap.exists()) {
              const driverData = { id: driverSnap.id, ...driverSnap.data() } as Driver;
              const enrichedDriver = await enrichDriverWithVehicle(driverData);
              assignDriver(enrichedDriver);
              if (driverData.location) {
                setDriverLocation(driverData.location);
              }
            }
          }
          break;

        case "completed":
          if (!rideData.isRatedByPassenger) {
            if (rideData.driver) {
              const driverSnap = await getDoc(rideData.driver);
              if (driverSnap.exists()) {
                const driverData = { id: driverSnap.id, ...driverSnap.data() } as Driver;
                const enrichedDriver = await enrichDriverWithVehicle(driverData);
                completeRideForRating(enrichedDriver);
              }
            }
          }
          break;

        case "cancelled":
          // Mostrar mensaje de cancelación y resetear
          toast({
            title: "Viaje Cancelado",
            description: "El viaje ha sido cancelado",
            variant: "destructive"
          });
          resetRide();
          break;
      }
    });

    return () => unsubscribe();
  }, [
    user?.uid,
    assignDriver,
    resetRide,
    setActiveRide,
    setCounterOffer,
    setDriverLocation,
    setStatus,
    completeRideForRating,
  ]);

  // 📍 Listener para actualizar ubicación del conductor en tiempo real
  useEffect(() => {
    if (!assignedDriver || status !== "assigned") return;

    const driverRef = doc(db, "drivers", assignedDriver.id);
    const unsubscribe = onSnapshot(driverRef, (snapshot) => {
      if (snapshot.exists()) {
        const driverData = snapshot.data();
        if (driverData.location) {
          setDriverLocation(driverData.location);
        }
      }
    });

    return () => unsubscribe();
  }, [assignedDriver, status, setDriverLocation]);

  // Listener for chat messages with notifications
  useEffect(() => {
    if (!activeRide || status !== "assigned" || !user?.uid || !assignedDriver) return;

    let isFirstLoad = true;
    const chatQuery = query(
      collection(db, "rides", activeRide.id, "chatMessages"),
      orderBy("timestamp", "asc")
    );
    
    const unsubscribe = onSnapshot(chatQuery, (querySnapshot) => {
      const messages = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ChatMessage)
      );
      
      // Detectar nuevos mensajes del conductor
      if (!isFirstLoad && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        
        // Si el último mensaje es del conductor (no del pasajero actual)
        if (lastMessage.userId !== user.uid && assignedDriver) {
          
          // Solo mostrar notificación emergente si el chat está cerrado
          if (!isDriverChatOpen) {
            showNotification(lastMessage, assignedDriver);
          }
        }
      }
      
      setChatMessages(messages);
      isFirstLoad = false;
    });

    return () => unsubscribe();
  }, [activeRide, status, user?.uid, assignedDriver, isDriverChatOpen, setChatMessages, showNotification]);

  const handleSosConfirm = async () => {
    if (!activeRide || !user || !assignedDriver) return;

    try {
      await addDoc(collection(db, "sosAlerts"), {
        rideId: activeRide.id,
        passenger: doc(db, "users", user.uid),
        driver: doc(db, "drivers", assignedDriver.id),
        date: new Date().toISOString(),
        status: "pending",
        triggeredBy: "passenger",
      });
      toast({
        variant: "destructive",
        title: "¡Alerta de Pánico Activada!",
        description: "Se ha notificado a la central de seguridad. Mantén la calma, la ayuda está en camino.",
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

  const handleCancelRide = async (reason: CancellationReason) => {
    const currentRide = useRideStore.getState().activeRide;
    if (!currentRide) return;

    const rideRef = doc(db, "rides", currentRide.id);

    try {
      // Actualizar el documento del viaje con información de cancelación
      await updateDoc(rideRef, {
        status: "cancelled",
        cancellationReason: reason,
        cancelledBy: "passenger",
        cancelledAt: new Date().toISOString(),
        // Campos adicionales para notificaciones más detalladas
        pickupLocation: pickupLocation,
        dropoffLocation: dropoffLocation,
      });

      toast({
        title: "Viaje Cancelado",
        description: `Motivo: ${reason.reason}.`,
      });
      resetRide();
      setActiveTab("book");
    } catch (error) {
      console.error("Error cancelling ride:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar el viaje.",
      });
    }
  };

  const handleAcceptCounterOffer = async () => {
    if (!activeRide) return;

    try {
      const rideRef = doc(db, "rides", activeRide.id);
      const currentRideDoc = await getDoc(rideRef);
      
      if (!currentRideDoc.exists()) {
        throw new Error("Ride not found");
      }

      const currentRideData = currentRideDoc.data();
      if (currentRideData.status !== 'counter-offered') {
        throw new Error(`Ride is no longer in counter-offered state. Current status: ${currentRideData.status}`);
      }
      
      const driverRef = currentRideData.offeredTo;
      if (!driverRef) {
        throw new Error("Driver reference not found in counter-offered ride");
      }

      const counterOfferAmount = useRideStore.getState().counterOfferValue;

      await updateDoc(rideRef, {
        status: "accepted",
        fare: counterOfferAmount,
        driver: driverRef,
        offeredTo: null,
      });

      setCounterOffer(null);
      setStatus("assigned");

      toast({
        title: "Contraoferta aceptada",
        description: `Has aceptado la tarifa de S/${counterOfferAmount?.toFixed(2)}`,
      });
    } catch (error) {
      console.error("Error accepting counter-offer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo aceptar la contraoferta.",
      });
    }
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    const currentRide = useRideStore.getState().activeRide;
    const currentDriver = useRideStore.getState().assignedDriver;
    if (!currentDriver || !currentRide) return;

    setIsSubmittingRating(true);

    try {
      await processRating({
        ratedUserId: currentDriver.id,
        isDriver: true,
        rating,
        comment,
      });

      const rideRef = doc(db, "rides", currentRide.id);
      await updateDoc(rideRef, { 
        isRatedByPassenger: true,
        driverRating: rating,
        driverComment: comment || ''
      });

      toast({
        title: "¡Gracias por tu calificación!",
        description: "Tu opinión ayuda a mantener la calidad de nuestra comunidad.",
      });
      completeRideForRating(currentDriver);
      resetAll();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        variant: "destructive",
        title: "Error al Calificar",
        description: "No se pudo guardar tu calificación. Por favor, intenta de nuevo.",
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <>
      <AudioEnabler 
        onEnable={notifications.enableAudio}
        isEnabled={notifications.audioEnabled}
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
      
      <div className="p-2 sm:p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        <div className="lg:col-span-2 flex flex-col min-h-[50vh] sm:min-h-[60vh] rounded-xl overflow-hidden shadow-lg relative">
          <MapView
            driverLocation={driverLocation}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            availableDrivers={status === 'searching' ? availableDrivers : []}
          />

          <Sheet open={isSupportChatOpen} onOpenChange={toggleSupportChat}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 left-2 sm:top-4 sm:left-4 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg border-2 border-primary/50 bg-background"
              >
                <Bot className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-sm p-0">
              <SheetTitle className="sr-only">Asistente de Soporte</SheetTitle>
              <SupportChat />
            </SheetContent>
          </Sheet>

          {status === "assigned" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 h-12 w-12 sm:h-16 sm:w-16 rounded-full shadow-2xl animate-pulse"
                  >
                    <Siren className="h-6 w-6 sm:h-8 sm:w-8" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      ¿Estás seguro de que quieres activar la alerta de pánico?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción notificará inmediatamente a nuestra central de
                      seguridad con tu ubicación actual y los detalles de tu
                      viaje. Úsalo solo en caso de una emergencia real.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={handleSosConfirm}
                    >
                      Sí, Activar Alerta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Sheet open={isDriverChatOpen} onOpenChange={setIsDriverChatOpen}>
                <SheetContent side="left" className="w-full max-w-sm p-0">
                  <SheetHeader className="p-4 border-b text-left">
                    <SheetTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>Chat con {assignedDriver?.name}</span>
                    </SheetTitle>
                  </SheetHeader>
                  <EnhancedChat
                    messages={enhancedChatMessages}
                    onSendMessage={sendMessage}
                    isLoading={isChatLoading}
                    otherUser={assignedDriver}
                    isTyping={isOtherUserTyping}
                    onTypingStart={startTyping}
                    onTypingStop={stopTyping}
                    rideStatus={activeRide?.status}
                  />
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>

        <Card className="overflow-hidden rounded-2xl shadow-2xl">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid h-12 sm:h-14 w-full grid-cols-4 rounded-none bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] p-2 sm:p-4">
                <TabsTrigger value="book" className="relative h-full rounded-lg text-xs sm:text-sm font-semibold text-white/70 transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E4CA6] data-[state=active]:shadow-lg">
                  <Car className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                  <span className="hidden sm:inline">Viaje</span>
                  <span className="sm:hidden">Viaje</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="relative h-full rounded-lg text-xs sm:text-sm font-semibold text-white/70 transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E4CA6] data-[state=active]:shadow-lg">
                  <History className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                  <span className="hidden sm:inline">Historial</span>
                  <span className="sm:hidden">Historial</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="relative h-full rounded-lg text-xs sm:text-sm font-semibold text-white/70 transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E4CA6] data-[state=active]:shadow-lg">
                  <MessageCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                  <span className="hidden sm:inline">Chat</span>
                  <span className="sm:hidden">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="config" className="relative h-full rounded-lg text-xs sm:text-sm font-semibold text-white/70 transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E4CA6] data-[state=active]:shadow-lg">
                  <Settings className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                  <span className="hidden sm:inline">Config</span>
                  <span className="sm:hidden">Config</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="book" className="p-3 sm:p-4 lg:p-6 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {status === "searching" && (
                  <SearchingRideStatus
                    activeRide={activeRide}
                    pickupLocation={pickupLocation}
                    dropoffLocation={dropoffLocation}
                    onCancelRide={handleCancelRide}
                  />
                )}
                {status === "assigned" && activeRide && assignedDriver && (
                  <AssignedDriverCard
                    activeRide={activeRide}
                    assignedDriver={assignedDriver}
                    onOpenCancelDialog={() => setIsCancelReasonDialogOpen(true)}
                  />
                )}
                {status === "counter-offered" && useRideStore.getState().counterOfferValue && activeRide && (
                  <CounterOfferCard
                    counterOfferValue={useRideStore.getState().counterOfferValue!}
                    onAcceptCounterOffer={handleAcceptCounterOffer}
                    onRejectCounterOffer={handleCancelRide}
                  />
                )}
                {(status === "idle" || status === "calculating" || status === "calculated" || status === "confirmed") && (
                  <RideRequestForm
                    onRideCreated={(ride) => {
                      setActiveRide(ride);
                      setStatus("searching");
                    }}
                  />
                )}
                {status === "rating" && assignedDriver && (
                  <RatingForm
                    userToRate={assignedDriver}
                    isDriver={true}
                    onSubmit={handleRatingSubmit}
                    isSubmitting={isRatingSubmitting}
                  />
                )}

                {!["searching", "assigned", "rating", "counter-offered", "idle", "calculating", "calculated", "confirmed"].includes(status) && (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground">Estado inesperado: {status}</p>
                    <Button onClick={() => resetRide()}>Reiniciar</Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="p-3 sm:p-4 lg:p-6 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <RideHistory />
              </TabsContent>
              
              <TabsContent value="chat" className="p-0 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {assignedDriver ? (
                  <div className="h-[400px] sm:h-[500px] lg:h-[600px] flex flex-col overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex-shrink-0">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Chat con {assignedDriver.name}
                      </h3>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <EnhancedChat 
                        messages={enhancedChatMessages} 
                        onSendMessage={sendMessage}
                        isLoading={isChatLoading}
                        otherUser={assignedDriver}
                        isTyping={isOtherUserTyping}
                        onTypingStart={startTyping}
                        onTypingStop={stopTyping}
                        rideStatus={activeRide?.status}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 p-4">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">No hay conductor asignado</h3>
                    <p>El chat estará disponible cuando se asigne un conductor a tu viaje.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="config" className="p-3 sm:p-4 lg:p-6 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="space-y-6">

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Volume2 className="h-5 w-5" />
                      Configuración de Notificaciones
                    </h3>
                    
                    {/* Paso 1: Control de permisos de notificación */}
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Paso 1</span>
                            <h4 className="text-sm font-medium">Permisos de notificación</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Permite que la app te envíe notificaciones
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {notifications.hasPermission ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-600 font-medium">✓ Activo</span>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          ) : (
                            <Button 
                              onClick={notifications.requestNotificationPermission}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              size="sm"
                            >
                              ✓ Activar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Paso 2: Control de sonido */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">Paso 2</span>
                            <h4 className="text-sm font-medium">Sonido de notificación</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Habilitación de sonidos para alertas
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {notifications.audioEnabled ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-600 font-medium">✓ Activo</span>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          ) : (
                            <Button 
                              onClick={notifications.enableAudio}
                              disabled={!notifications.hasPermission}
                              className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300"
                              size="sm"
                            >
                              🔊 Activar
                            </Button>
                          )}
                        </div>
                      </div>
                      {!notifications.hasPermission && !notifications.audioEnabled && (
                        <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          💡 Primero debes activar los permisos de notificación
                        </p>
                      )}
                    </div>
                    
                  </div>
                  
                  {/* Información del usuario */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      Mi Cuenta
                    </h3>
                    
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                          {appUser?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{appUser?.name || 'Usuario'}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>ID:</span>
                          <span className="font-mono">{appUser?.id?.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Teléfono:</span>
                          <span>{appUser?.phone || 'No registrado'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Información de la aplicación */}
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Contexto seguro:</span>
                      <span className={notifications.isSecureContext ? 'text-green-600' : 'text-red-600'}>
                        {notifications.isSecureContext ? '✓ HTTPS' : '✗ HTTP'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Notificaciones:</span>
                      <span className={notifications.canUseNotifications ? 'text-green-600' : 'text-red-600'}>
                        {notifications.canUseNotifications ? '✓ Disponible' : '✗ No disponible'}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </div>

        <Dialog open={isCancelReasonDialogOpen} onOpenChange={setIsCancelReasonDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Por qué estás cancelando?</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              {appSettings?.cancellationReasons.map((reason) => (
                <Button
                  key={reason.code}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => {
                    handleCancelRide(reason);
                    setIsCancelReasonDialogOpen(false);
                  }}
                >
                  {reason.reason}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}