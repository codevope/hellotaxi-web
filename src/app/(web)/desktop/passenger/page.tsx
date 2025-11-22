"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MapView from "@/components/maps/map-view";
import RideRequestForm from "@/components/forms/ride-request-form";
import RideHistory from "@/components/ride-history";
import { SearchingRideStatus } from "@/components/ride/searching-ride-status";
import { AssignedDriverCard } from "@/components/ride/assigned-driver-card";
import { CounterOfferCard } from "@/components/ride/counter-offer-card";
import StartNow from "@/components/ride/start-now";
import type {
  Ride,
  Driver,
  ChatMessage,
  CancellationReason,
  User,
} from "@/lib/types";
import {
  History,
  Car,
  Siren,
  LayoutDashboard,
  MessageCircle,
  Bot,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import SupportChat from "@/components/chat/support-chat";
import { Loader2 } from "lucide-react";
import { useDriverAuth } from "@/hooks/auth/use-driver-auth";
import Link from "next/link";
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
import { useMobileOptimized } from "@/hooks/use-mobile-optimized";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { UberStylePassengerDashboard } from "@/components/ride/uber-style-passenger-dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSettings } from "@/services/settings-service";
import EnhancedChat from "@/components/chat/enhanced-chat";
import { useEnhancedChat, useChatTyping } from "@/hooks/use-enhanced-chat";
import { ChatNotification, useChatNotifications } from "@/components/chat/chat-notification";
import { Shield, Clock, Star, Wallet, ArrowRight } from "lucide-react";
import RatingForm from "@/components/forms/rating-form";
import { processRating } from "@/ai/flows/process-rating";
import { useRideStore } from "@/store/ride-store";
import type { Vehicle, DriverWithVehicleInfo } from "@/lib/types";
import { useRouter } from "next/navigation";

// Helper function to enrich driver with vehicle information
async function enrichDriverWithVehicle(
  driver: Driver
): Promise<DriverWithVehicleInfo> {
  try {
    const vehicleSnap = await getDoc(driver.vehicle);
    if (vehicleSnap.exists()) {
      const vehicleData = vehicleSnap.data() as Vehicle;
      return {
        ...driver,
        vehicleBrand: vehicleData.brand,
        vehicleModel: vehicleData.model,
        licensePlate: vehicleData.licensePlate,
        vehicleColor: vehicleData.color,
        vehicleYear: vehicleData.year,
      };
    }
  } catch (error) {
    console.error("Error loading vehicle data:", error);
  }

  // Fallback if vehicle data can't be loaded
  return {
    ...driver,
    vehicleBrand: "N/A",
    vehicleModel: "N/A",
    licensePlate: "N/A",
  };
}

function RidePageContent() {
  const { isMobile } = useMobileOptimized();
  const { appUser } = useAuth();
  
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
  const [isCancelReasonDialogOpen, setIsCancelReasonDialogOpen] =
    useState(false);
  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<Awaited<
    ReturnType<typeof getSettings>
  > | null>(null);
  const [isRatingSubmitting, setIsSubmittingRating] = useState(false);

  const { user } = useAuth();
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
  } = useChatNotifications(!isDriverChatOpen); // Solo mostrar notificación si el chat está cerrado

  useEffect(() => {
    getSettings().then(setAppSettings);
  }, []);

  // Mostrar notificación cuando lleguen mensajes nuevos (solo si el chat está cerrado)
  useEffect(() => {
    if (enhancedChatMessages.length === 0) return;
    
    const lastMessage = enhancedChatMessages[enhancedChatMessages.length - 1];
    
    // Solo mostrar notificación si:
    // 1. El mensaje no es mío
    // 2. El chat está cerrado
    // 3. Hay un conductor asignado
    if (
      lastMessage.userId !== user?.uid && 
      !isDriverChatOpen && 
      assignedDriver
    ) {
      showNotification(lastMessage, assignedDriver);
    }
  }, [enhancedChatMessages, user?.uid, isDriverChatOpen, assignedDriver, showNotification]);

  // MASTER useEffect to listen for ride document changes and update UI state
  useEffect(() => {
    if (!user?.uid) {
      if (useRideStore.getState().status !== "idle") {
        resetRide();
      }
      return;
    }

    // This query finds any ride for the user that isn't in a final state.
    const q = query(
      collection(db, "rides"),
      where("passenger", "==", doc(db, "users", user.uid))
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log("📡 Snapshot received, docs count:", snapshot.docs.length);

      const activeRides = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Ride))
        .filter(
          (ride) =>
            !["completed", "cancelled"].includes(ride.status) ||
            (ride.status === "completed" && !ride.isRatedByPassenger)
        );

      console.log("🔍 Active rides found:", activeRides.length);

      if (activeRides.length === 0) {
        // Only reset if we are not in the middle of rating a just-completed ride.
        if (useRideStore.getState().status !== "rating") {
          console.log("🔄 No active rides, resetting");
          resetRide();
        }
        return;
      }

      const rideData = activeRides[0]; // Assuming user has only one active ride
      console.log("🚗 Processing ride:", {
        id: rideData.id,
        status: rideData.status,
      });

      setActiveRide(rideData);

      switch (rideData.status) {
        case "searching":
          console.log("🔍 Setting status to searching");
          setStatus("searching");
          break;

        case "counter-offered":
          console.log("💰 Counter offer received:", rideData.fare);
          console.log("📋 Ride data offeredTo:", rideData.offeredTo);
          if (useRideStore.getState().counterOfferValue !== rideData.fare) {
            setCounterOffer(rideData.fare);
          }
          break;

        case "accepted":
        case "arrived":
        case "in-progress":
          console.log("👨‍💼 Driver assigned, status:", rideData.status);
          setStatus("assigned");
          if (rideData.driver) {
            const driverSnap = await getDoc(rideData.driver);
            if (driverSnap.exists()) {
              const driverData = {
                id: driverSnap.id,
                ...driverSnap.data(),
              } as Driver;
              const enrichedDriver = await enrichDriverWithVehicle(driverData);
              assignDriver(enrichedDriver);
              if (driverData.location) {
                setDriverLocation(driverData.location);
              }
            }
          }
          break;

        case "completed":
          console.log("✅ Ride completed");
          if (!rideData.isRatedByPassenger) {
            if (rideData.driver) {
              const driverSnap = await getDoc(rideData.driver);
              if (driverSnap.exists()) {
                const driverData = {
                  id: driverSnap.id,
                  ...driverSnap.data(),
                } as Driver;
                const enrichedDriver = await enrichDriverWithVehicle(
                  driverData
                );
                completeRideForRating(enrichedDriver);
              }
            }
          }
          break;

        default:
          console.log("⚠️ Unknown ride status:", rideData.status);
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

  // Listener for chat messages
  useEffect(() => {
    if (!activeRide || status !== "assigned") return;

    const chatQuery = query(
      collection(db, "rides", activeRide.id, "chatMessages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(chatQuery, (querySnapshot) => {
      const messages = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ChatMessage)
      );
      setChatMessages(messages);
    });

    return () => unsubscribe();
  }, [activeRide, status, setChatMessages]);

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
        description:
          "Se ha notificado a la central de seguridad. Mantén la calma, la ayuda está en camino.",
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
      await updateDoc(rideRef, {
        status: "cancelled",
        cancellationReason: reason,
        cancelledBy: "passenger",
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

      console.log("🔄 Current activeRide state:", {
        id: activeRide.id,
        status: activeRide.status,
        offeredTo: activeRide.offeredTo,
        fare: activeRide.fare
      });

      // Always fetch fresh data for counter-offers to ensure we have the latest state
      console.log("🔍 Fetching fresh ride data to ensure accuracy...");
      const currentRideDoc = await getDoc(rideRef);
      if (!currentRideDoc.exists()) {
        throw new Error("Ride not found");
      }

      const currentRideData = currentRideDoc.data();
      console.log("📋 Fresh ride data:", {
        status: currentRideData.status,
        offeredTo: currentRideData.offeredTo,
        fare: currentRideData.fare
      });

      // Verify this is still a counter-offered ride
      if (currentRideData.status !== 'counter-offered') {
        throw new Error(`Ride is no longer in counter-offered state. Current status: ${currentRideData.status}`);
      }
      
      const driverRef = currentRideData.offeredTo;

      if (!driverRef) {
        throw new Error("Driver reference not found in counter-offered ride");
      }

      console.log(
        "🎯 Accepting counter-offer and assigning driver:",
        driverRef.id || driverRef
      );

      const counterOfferAmount = useRideStore.getState().counterOfferValue;

      await updateDoc(rideRef, {
        status: "accepted",
        fare: counterOfferAmount,
        driver: driverRef, // Assign the driver to the ride
        offeredTo: null,
      });

      setCounterOffer(null);
      setStatus("assigned");

      toast({
        title: "Contraoferta aceptada",
        description: `Has aceptado la tarifa de S/${counterOfferAmount?.toFixed(
          2
        )}`,
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
      await updateDoc(rideRef, { isRatedByPassenger: true });

      toast({
        title: "¡Gracias por tu calificación!",
        description:
          "Tu opinión ayuda a mantener la calidad de nuestra comunidad.",
      });
      completeRideForRating(currentDriver);
      resetAll();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        variant: "destructive",
        title: "Error al Calificar",
        description:
          "No se pudo guardar tu calificación. Por favor, intenta de nuevo.",
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Vista móvil optimizada
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <MobileHeader
          type="passenger"
          userName={appUser?.name || 'Usuario'}
        />
        
        <div className="flex-1 relative">
          {activeTab === 'dashboard' && (
            <UberStylePassengerDashboard
              user={appUser!}
              currentRide={activeRide}
              assignedDriver={assignedDriver}
              counterOffer={counterOfferValue ? { amount: counterOfferValue, originalFare: originalFare } : null}
              isSearching={status === 'searching'}
              searchStartTime={null}
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              rideLocation={driverLocation}
              chatMessages={enhancedChatMessages}
              onSendMessage={sendMessage}
              onCancelRide={() => handleCancelRide({ code: 'user_cancelled', reason: 'Cancelado por el usuario' })}
              onAcceptCounterOffer={handleAcceptCounterOffer}
              onRejectCounterOffer={() => handleCancelRide({ code: 'counter_offer_rejected', reason: 'Contraoferta rechazada' })}
              isPassengerChatOpen={isDriverChatOpen}
              setIsPassengerChatOpen={setIsDriverChatOpen}
              completedRideForRating={status === 'rating' ? assignedDriver : null}
              onRatingSubmit={handleRatingSubmit}
              isRatingSubmitting={isRatingSubmitting}
            />
          )}
          
          {activeTab === 'history' && (
            <div className="p-4">
              <RideHistory />
            </div>
          )}
          
          {activeTab === 'chat' && assignedDriver && (
            <div className="p-4 h-full flex flex-col">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat con {assignedDriver.name}
                </h3>
              </div>
              <div className="flex-1">
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
          )}
          
          {activeTab === 'support' && (
            <div className="p-4">
              <SupportChat />
            </div>
          )}
        </div>
        
        {/* Botón SOS Flotante - Solo durante viaje activo */}
        {(status === 'assigned' || status === 'searching') && (
          <Button
            variant="destructive"
            size="icon"
            className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
            onClick={handleSosConfirm}
          >
            <Siren className="h-6 w-6" />
          </Button>
        )}

        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          type="passenger"
          hasActiveRide={!!activeRide}
        />
      </div>
    );
  }

  // Vista desktop original
  return (
    <div className="p-4 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col min-h-[60vh] rounded-xl overflow-hidden shadow-lg relative">
          <MapView
            driverLocation={driverLocation}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
          />

          <Sheet open={isSupportChatOpen} onOpenChange={toggleSupportChat}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 left-4 h-14 w-14 rounded-full shadow-lg border-2 border-primary/50 bg-background"
              >
                <Bot className="h-7 w-7 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-sm p-0">
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
                    className="absolute top-4 right-4 h-16 w-16 rounded-full shadow-2xl animate-pulse"
                  >
                    <Siren className="h-8 w-8" />
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

              {/* Chat Sheet - Sin botón trigger directo, se abre desde UberStylePassengerDashboard */}
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
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid h-14 w-full grid-cols-3 rounded-none bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] p-4">
                <TabsTrigger
                  value="book"
                  className="relative h-full rounded-lg font-semibold text-white/70 transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E4CA6] data-[state=active]:shadow-lg"
                >
                  <Car className="mr-2 h-4 w-4" /> Pedir Viaje
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="relative h-full rounded-lg font-semibold text-white/70 transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E4CA6] data-[state=active]:shadow-lg"
                >
                  <History className="mr-2 h-4 w-4" /> Historial
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  className="relative h-full rounded-lg font-semibold text-white/70 transition-all data-[state=active]:bg-white data-[state=active]:text-[#2E4CA6] data-[state=active]:shadow-lg"
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="book" className="p-4 sm:p-6">
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
                {status === "counter-offered" &&
                  useRideStore.getState().counterOfferValue &&
                  activeRide && (
                    <CounterOfferCard
                      counterOfferValue={
                        useRideStore.getState().counterOfferValue!
                      }
                      onAcceptCounterOffer={handleAcceptCounterOffer}
                      onRejectCounterOffer={handleCancelRide}
                    />
                  )}
                {(status === "idle" ||
                  status === "calculating" ||
                  status === "calculated" ||
                  status === "confirmed") && (
                  <RideRequestForm
                    onRideCreated={(ride) => {
                      console.log("🚗 Ride created:", ride);
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

                {/* Fallback for unexpected states */}
                {![
                  "searching",
                  "assigned",
                  "rating",
                  "counter-offered",
                  "idle",
                  "calculating",
                  "calculated",
                  "confirmed",
                ].includes(status) && (
                  <div className="text-center p-8">
                    <p className="text-muted-foreground">
                      Estado inesperado: {status}
                    </p>
                    <Button
                      onClick={() => {
                        console.log("🔄 Resetting ride state");
                        resetRide();
                      }}
                    >
                      Reiniciar
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="history" className="p-4 sm:p-6">
                <RideHistory />
              </TabsContent>
              <TabsContent value="chat" className="p-0">
                {assignedDriver ? (
                  <div className="h-[600px] flex flex-col overflow-hidden">
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
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isCancelReasonDialogOpen}
        onOpenChange={setIsCancelReasonDialogOpen}
      >
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
  );
}

export default function RidePage() {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();
  const { isDriver, loading: driverLoading } = useDriverAuth();

  if (loading || driverLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <StartNow />;
  }

  // Check if user has complete profile (Google + Password + Phone)
  const providerIds = user.providerData.map((p) => p.providerId);
  const hasGoogle = providerIds.includes("google.com");
  const hasPassword = providerIds.includes("password");
  const hasPhoneInProfile = appUser?.phone && appUser.phone.trim().length > 0;
  const isProfileComplete = hasGoogle && hasPassword && hasPhoneInProfile;

  if (!isProfileComplete) {
    return (
      <div className="flex flex-col items-center justify-center p-4 py-16 text-center md:py-24">
        <Card className="max-w-md p-8">
          <CardHeader>
            <div className="flex flex-col items-center gap-4">
              <Shield className="h-16 w-16 text-amber-500" />
              <CardTitle>Perfil Incompleto</CardTitle>
            </div>
            <CardDescription>
              Para pedir un viaje necesitas completar tu perfil de seguridad:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {hasGoogle ? (
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span
                  className={hasGoogle ? "text-green-700" : "text-gray-500"}
                >
                  Cuenta Google vinculada
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {hasPassword ? (
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span
                  className={hasPassword ? "text-green-700" : "text-gray-500"}
                >
                  Contraseña configurada
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {hasPhoneInProfile ? (
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span
                  className={
                    hasPhoneInProfile ? "text-green-700" : "text-gray-500"
                  }
                >
                  Teléfono registrado
                </span>
              </div>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href="/profile">
                <Shield className="mr-2 h-4 w-4" />
                Completar mi Perfil
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDriver) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center md:py-24">
        <Card className="max-w-md p-8">
          <CardHeader>
            <CardTitle>Función solo para Pasajeros</CardTitle>
            <CardDescription>
              Estás en tu rol de conductor. Para pedir un viaje, necesitas
              volver a tu rol de pasajero desde tu perfil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/driver">
                <LayoutDashboard className="mr-2" />
                Ir a mi Panel de Conductor
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <RidePageContent />;
}
