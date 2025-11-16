"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Car,
  ShieldAlert,
  FileText,
  Star,
  UserCog,
  Wallet,
  History,
  MessageCircle,
  LogIn,
  Siren,
  CircleDollarSign,
  Save,
  CreditCard,
  CalendarCheck,
  Volume2,
} from "lucide-react";
import { useDriverAuth } from '@/hooks/auth/use-driver-auth';
import { useCounterOffer } from "@/hooks/use-counter-offer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type {
  Ride,
  User,
  Driver,
  ChatMessage,
  EnrichedDriver,
  PaymentModel,
} from "@/lib/types";

// Import the type from the store file
type DriverActiveRide = Omit<Ride, "passenger" | "driver"> & {
  passenger: User;
  driver: EnrichedDriver;
};
import { useEffect, useState, useCallback } from "react";
import { collection, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import RatingForm from '@/components/forms/rating-form';
import { processRating } from "@/ai/flows/process-rating";
import MapView from '@/components/maps/map-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DriverDocuments from "@/components/driver/documents";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
// simulación ahora gestionada dentro de useDriverActiveRide
import { useDriverActiveRide } from "@/hooks/driver/use-driver-active-ride";
import { useIncomingRideRequests } from "@/hooks/driver/use-incoming-ride-requests";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Chat from '@/components/chat/chat';
import EnhancedChat from '@/components/chat/enhanced-chat';
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
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDriverRideStore } from "@/store/driver-ride-store";
import DriverVehicle from "@/components/driver/vehicle";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DataTable } from "@/components/ui/data-table";
import { columns as rideHistoryColumns } from "@/components/driver/ride-history-columns";
import { IncomingRideRequest } from "@/components/driver/incoming-ride-request";
import { ActiveRideCard } from "@/components/driver/active-ride-card";
import { DriverMapView } from "@/components/driver/driver-map-view";
import { DriverProfileCard } from "@/components/driver/driver-profile-card";
import { useDriverChat } from "@/hooks/driver/use-driver-chat";
import { useDriverRideHistory } from "@/hooks/driver/use-driver-ride-history";
import { useDriverPaymentPlan } from "@/hooks/driver/use-driver-payment-plan";
import { DriverStatePanel } from "@/components/driver/driver-state-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { MobileHeader } from '@/components/layout/mobile-header';
import { MobileDriverDashboard } from "@/components/driver/mobile-dashboard";
import { useDriverNotificationsSafe } from "@/hooks/use-driver-notifications-safe";
import { useSearchParams, useRouter } from "next/navigation";
import { SSLWarningBanner } from "@/components/ssl-warning-banner";

const statusConfig: Record<
  Driver["status"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  available: { label: "Disponible", variant: "default" },
  unavailable: { label: "No Disponible", variant: "secondary" },
  "on-ride": { label: "En Viaje", variant: "outline" },
};

const rideStatusConfig: Record<
  Ride["status"],
  { label: string; variant: "secondary" | "default" | "destructive" }
> = {
  searching: { label: "Buscando", variant: "default" },
  accepted: { label: "Aceptado", variant: "default" },
  arrived: { label: "Ha llegado", variant: "default" },
  "in-progress": { label: "En Progreso", variant: "default" },
  completed: { label: "Completado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  "counter-offered": { label: "Contraoferta", variant: "default" },
};

type EnrichedRide = Omit<Ride, "passenger" | "driver"> & { passenger: User; driver: EnrichedDriver };

function DriverPageContent() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'history';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const router = useRouter();

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
    setIncomingRequest,
    setActiveRide,
    setIsCountering,
  } = useDriverRideStore();

  const { user, driver, setDriver, loading } = useDriverAuth();
  const { toast } = useToast();
  // Historial (reemplaza allRides + efecto manual)
  const { rides: allRides } = useDriverRideHistory(driver, 25);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  // Estado desplazado ahora en hook useDriverActiveRide
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [rejectedRideIds, setRejectedRideIds] = useState<string[]>([]);

  // Hook: activo y rating
  const { activeRide: activeRideHook, completedRideForRating, setCompletedRideForRating, updateRideStatus, isCompletingRide, driverLocation } = useDriverActiveRide({ driver, setAvailability });

  // Hook: notificaciones con sonido SEGURO - previene bucles en HTTP
  const { hasPermission, audioEnabled, audioPermissionGranted, hasTriedReactivation, enableAudio, tryReenableAudio, requestNotificationPermission, updateNotificationPermissions, shouldAttemptReactivation, testNotification, isLoaded, playSound, isSecureContext, canUseNotifications } = useDriverNotificationsSafe(driver);

  // Efecto para solicitar permisos de notificación cuando el conductor se conecta por primera vez
  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      if (driver && isLoaded && hasPermission === false) {
        const granted = await requestNotificationPermission();
        
        // Actualizar preferencias en BD (función sin argumentos en el hook seguro)
        await updateNotificationPermissions();
        
        if (granted) {
          toast({
            title: 'Notificaciones habilitadas',
            description: 'Ahora puedes habilitar el sonido para recibir alertas de audio.',
            duration: 8000,
            className: 'border-l-4 border-l-[#2E4CA6]',
          });
        } else {
          toast({
            title: 'Notificaciones desactivadas',
            description: 'Puedes habilitarlas desde la configuración de tu navegador.',
            duration: 8000,
            variant: 'destructive',
          });
        }
      }
    };

    checkAndRequestPermissions();
  }, [driver, isLoaded, hasPermission, requestNotificationPermission, updateNotificationPermissions, toast]);

  // Estado para controlar si ya se intentó reactivar el audio
  const [hasAttemptedAutoReactivation, setHasAttemptedAutoReactivation] = useState(false);

  // Efecto para intentar reactivar automáticamente el audio basado en preferencias de BD
  useEffect(() => {
    const attemptAutoReactivation = async () => {
      // Verificar tanto localStorage como BD
      const shouldTryDB = shouldAttemptReactivation();
      const shouldTryLocal = audioPermissionGranted && !audioEnabled;
      
      if (driver && isLoaded && (shouldTryDB || shouldTryLocal) && !hasAttemptedAutoReactivation && !hasTriedReactivation) {
        setHasAttemptedAutoReactivation(true);
        console.log('🔄 Intentando reactivar audio automáticamente...', { 
          fromDB: shouldTryDB, 
          fromLocal: shouldTryLocal 
        });
        
        const reactivated = await tryReenableAudio();
        if (reactivated) {
          toast({
            title: 'Sonido reactivado',
            description: 'Las alertas de audio están funcionando nuevamente.',
            duration: 3000,
            className: 'border-l-4 border-l-[#05C7F2]',
          });
        } else {
          toast({
            title: 'Sonido disponible',
            description: 'Haz clic en "Reactivar Sonido" para volver a habilitar las alertas de audio.',
            duration: 8000,
            className: 'border-l-4 border-l-[#049DD9]',
          });
        }
      }
    };

    // Solo ejecutar si no se ha intentado ya
    if (!hasAttemptedAutoReactivation && !hasTriedReactivation) {
      const timer = setTimeout(attemptAutoReactivation, 1500);
      return () => clearTimeout(timer);
    }
  }, [driver, isLoaded, audioPermissionGranted, audioEnabled, hasAttemptedAutoReactivation, hasTriedReactivation, shouldAttemptReactivation, tryReenableAudio, toast]);

  // Chat (reemplaza chatMessages + listener manual) - debe ir después de obtener activeRideHook
  const { messages: chatMessages, sendMessage } = useDriverChat({ rideId: activeRideHook?.id, userId: user?.uid });

  // Mantener compat con store hasta migración completa
  useEffect(() => {
    if (activeRideHook && !activeRide) {
      setActiveRide(activeRideHook);
    }
  }, [activeRideHook, activeRide, setActiveRide]);

  // Hook: solicitudes entrantes
  const {
    incomingRequest: incomingRequestHook,
    requestTimeLeft,
    isCountering: isCounteringHook,
    counterOfferAmount,
    setCounterOfferAmount,
    acceptRequest,
    rejectRequest,
    submitCounterOffer,
    startCounterMode,
  } = useIncomingRideRequests({ 
    driver, 
    isAvailable, 
    rejectedRideIds, 
    setRejectedRideIds, 
    toast,
    playNotificationSound: () => playSound({ volume: 0.8 })
  });

  useEffect(() => {
    if (incomingRequestHook !== incomingRequest) {
      setIncomingRequest(incomingRequestHook);
    }
  }, [incomingRequestHook, incomingRequest, setIncomingRequest]);

  // Counter-offer hook
  const { isListening: isCounterOfferListening, error: counterOfferError } =
    useCounterOffer(driver, activeRide);

  // Plan de pago (hook)
  const { selectedPaymentModel, setSelectedPaymentModel, save: handleSavePaymentPlan, isSavingPlan, membershipStatus } = useDriverPaymentPlan(driver, setDriver);

  // Sync driver availability status with local state
  useEffect(() => {
    if (driver) {
      const isDriverAvailable = driver.status === "available";
      setAvailability(isDriverAvailable);
    }
  }, [driver, setAvailability]);

  // 30-second countdown timer for incoming ride requests
  // Countdown movido a useIncomingRideRequests

  // MASTER useEffect for driver's active ride
  // Active ride listener movido a useDriverActiveRide

  // MASTER useEffect for new ride requests
  // Incoming ride listener movido a useIncomingRideRequests

  // Listener de chat movido a useDriverChat

  // Note: Counter-offer acceptance is now handled by the useCounterOffer hook
  // This listener has been removed to avoid duplication and toast issues

  // Historial movido a useDriverRideHistory

  const handleAvailabilityChange = async (available: boolean) => {
    if (!driver) return;

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

  // Reemplazado por acceptRequest / rejectRequest hooks

  // Contraoferta movida a hook (submitCounterOffer / startCounterMode)

  // Actualización de estado movida al hook updateRideStatus

  const handleSosConfirm = async () => {
    if (!activeRide || !user || !driver) return;

    try {
      const newSosAlertRef = doc(collection(db, "sosAlerts"));
      await addDoc(collection(db, "sosAlerts"), {
        id: newSosAlertRef.id,
        rideId: activeRide.id,
        passenger: doc(db, "users", activeRide.passenger.id),
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

  // Envío de mensajes movido a useDriverChat (sendMessage)

  if (loading || !driver) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isApproved = driver.documentsStatus === "approved";
  // membershipStatus lo provee hook de plan de pago

  // Vista móvil optimizada
  if (isMobile) {
    return (
      <>
        <SSLWarningBanner />
        <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 relative w-full h-full">
          {activeTab === 'dashboard' && (
            <MobileDriverDashboard
              driver={driver}
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
              updateRideStatus={(status: "arrived" | "in-progress" | "completed") => activeRideHook && updateRideStatus(activeRideHook, status)}
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
          )}
          
          {activeTab === 'history' && (
            <div className="p-4 pt-4 pb-24">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Viajes</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={rideHistoryColumns}
                    data={allRides}
                    searchKey="passenger"
                    searchPlaceholder="Buscar por pasajero..."
                  />
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === 'documents' && (
            <div className="p-4 pt-4 pb-24">
              <DriverDocuments driver={driver} onUpdate={setDriver} />
            </div>
          )}
          
          {activeTab === 'vehicle' && (
            <div className="p-4 pt-4 pb-24">
              <DriverVehicle driver={driver} onUpdate={setDriver} />
            </div>
          )}
          
          {activeTab === 'profile' && (
            <div className="p-4 pt-4 pb-24 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mi Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={driver.avatarUrl} alt={driver.name} />
                      <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xl font-bold">{driver.name}</p>
                      <p className="text-muted-foreground">
                        {driver.vehicle.brand} {driver.vehicle.model}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">
                        {allRides.filter(r => r.status === "completed").length}
                      </p>
                      <p className="text-sm text-muted-foreground">Viajes</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold flex items-center justify-center gap-1">
                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        {(driver.rating || 0).toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Plan de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedPaymentModel}
                    onValueChange={(value) => setSelectedPaymentModel(value as PaymentModel)}
                  >
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50">
                        <RadioGroupItem value="commission" />
                        <div>
                          <div className="font-medium">Comisión por Viaje</div>
                          <div className="text-sm text-muted-foreground">
                            Ideal para conductores a tiempo parcial
                          </div>
                        </div>
                      </Label>
                      <Label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50">
                        <RadioGroupItem value="membership" />
                        <div>
                          <div className="font-medium">Membresía Mensual</div>
                          <div className="text-sm text-muted-foreground">
                            Ideal para conductores a tiempo completo
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  <Button 
                    onClick={handleSavePaymentPlan} 
                    disabled={isSavingPlan || selectedPaymentModel === driver.paymentModel}
                    className="w-full mt-4"
                  >
                    {isSavingPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
        {/* Botón SOS Flotante - Solo durante viaje activo */}
        {(activeRideHook || incomingRequestHook) && (
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
          onTabChange={(tab) => {
            if (tab === 'dashboard') {
              router.push('/driver');
            } else {
              router.push(`/driver?tab=${tab}`);
            }
          }}
          type="driver"
          hasActiveRide={!!activeRideHook}
          hasIncomingRequest={!!incomingRequestHook}
        />
        
        {/* Botón flotante de chat - Vista MÓVIL */}
        {activeRideHook && (
          <Sheet open={isDriverChatOpen} onOpenChange={setIsDriverChatOpen}>
            <SheetTrigger asChild>
              <Button size="icon" className="fixed bottom-20 left-4 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50">
                <MessageCircle className="h-7 w-7" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-sm p-0">
              <SheetHeader className="p-4 border-b text-left">
                <SheetTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Chat con {activeRideHook?.passenger.name}</span>
                </SheetTitle>
              </SheetHeader>
              <EnhancedChat 
                messages={chatMessages} 
                onSendMessage={sendMessage}
                otherUser={activeRideHook?.passenger}
                rideStatus={activeRideHook?.status}
              />
            </SheetContent>
          </Sheet>
        )}
        
        </div>
      </>
    );
  }

  // Vista desktop con nueva estructura
  return (
    <>
      <SSLWarningBanner />
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-1 p-4 lg:p-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[calc(100vh-200px)]">
          
          {/* Panel Principal - Columna Izquierda */}
          <div className="lg:col-span-2 flex flex-col min-h-[60vh] rounded-xl overflow-hidden shadow-lg relative">
            <MapView
              driverLocation={driverLocation}
              pickupLocation={activeRideHook?.pickupLocation ? activeRideHook.pickupLocation : null}
              dropoffLocation={activeRideHook?.dropoffLocation ? activeRideHook.dropoffLocation : null}
              interactive={false}
            />
            {activeRideHook && (
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
                        Reportar Emergencia
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Necesitas reportar una emergencia? Esta acción alertará a las autoridades y al equipo de soporte.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          // Aquí iría la lógica de emergencia
                          toast({ title: "Emergencia reportada", description: "Las autoridades han sido notificadas." });
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

            {/* Panel de estado del conductor */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t p-4">
              <DriverStatePanel 
                isAvailable={isAvailable}
                setAvailability={setAvailability}
                incomingRequest={incomingRequestHook}
                setIncomingRequest={setIncomingRequest}
                activeRide={activeRideHook}
                isCountering={isCountering}
                counterPrice={counterPrice}
                setCounterPrice={setCounterPrice}
                handleCounterOffer={handleCounterOffer}
                driverAuth={driver}
                startSimulation={startSimulation}
              />
            </div>
          </div>

          {/* Tabs de la derecha - Historial y Chat */}
          <Card className="overflow-hidden rounded-2xl shadow-2xl">
            <CardContent className="p-0">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full h-full"
              >
                <div className="bg-secondary/50 px-1 py-1">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="history" className="text-sm">
                      <History className="mr-2 h-4 w-4" />
                      Historial
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="text-sm">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="history" className="mt-0 p-0">
                  <div className="p-6 h-[calc(100vh-300px)] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Historial de Viajes</h3>
                    {rideHistory.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Pasajero</TableHead>
                            <TableHead>Origen</TableHead>
                            <TableHead>Destino</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rideHistory.map((ride) => (
                            <TableRow key={ride.id}>
                              <TableCell className="text-sm">
                                {format(ride.createdAt.toDate(), "dd/MMM", { locale: es })}
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {ride.passenger.name}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {ride.pickupLocation.address}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {ride.dropoffLocation.address}
                              </TableCell>
                              <TableCell className="text-sm font-semibold">
                                ${ride.agreedPrice?.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant={ride.status === "completed" ? "default" : "secondary"}>
                                  {ride.status === "completed" ? "Completado" : ride.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <History className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2">Sin historial</h3>
                        <p>No tienes viajes completados aún.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="mt-0 p-0">
                  <div className="h-[calc(100vh-300px)]">
                    {activeRideHook ? (
                      <div className="flex flex-col h-full">
                        <div className="p-4 border-b bg-secondary/20">
                          <h3 className="text-lg font-semibold">
                            Chat con {activeRideHook.passenger.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {activeRideHook.pickupLocation.address}
                          </p>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <EnhancedChat 
                            messages={enhancedChatMessages} 
                            onSendMessage={sendMessage}
                            isLoading={isChatLoading}
                            otherUser={activeRideHook.passenger}
                            isTyping={isOtherUserTyping}
                            onTypingStart={startTyping}
                            onTypingStop={stopTyping}
                            rideStatus={activeRideHook.status}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 p-4">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2">No hay viaje activo</h3>
                        <p>El chat estará disponible cuando tengas un viaje asignado.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        </main>
      </div>
    </>
  );
}
              <div className="lg:col-span-2 flex flex-col min-h-[60vh] rounded-xl overflow-hidden shadow-lg relative">
                <MapView
                  driverLocation={driverLocation}
                  pickupLocation={activeRideHook?.pickupLocation ? activeRideHook.pickupLocation : null}
                  dropoffLocation={activeRideHook?.dropoffLocation ? activeRideHook.dropoffLocation : null}
                  interactive={false}
                />
                {activeRideHook && (
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
                            ¿Estás seguro de que quieres activar la alerta de
                            pánico?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción notificará inmediatamente a nuestra
                            central de seguridad. Úsalo solo en caso de una
                            emergencia real.
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
                  </>
                )}
              </div>
              <div className="flex flex-col gap-8">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl font-headline">
                          Panel Principal
                        </CardTitle>
                        <CardDescription>
                          Gestiona tu estado y tus viajes.
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="availability-switch"
                          checked={isAvailable}
                          onCheckedChange={handleAvailabilityChange}
                          disabled={!isApproved || !!activeRideHook || isUpdatingStatus}
                          aria-label="Estado de disponibilidad"
                        />
                        <Label htmlFor="availability-switch">
                          <Badge variant={statusConfig[driver.status].variant}>
                            {isUpdatingStatus ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              statusConfig[driver.status].label
                            )}
                          </Badge>
                        </Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!isSecureContext && (
                      <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Conexión No Segura</AlertTitle>
                        <AlertDescription>
                          Esta aplicación requiere HTTPS para funcionar completamente. 
                          Las notificaciones y geolocalización precisa no estarán disponibles en HTTP.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {!isApproved && (
                      <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>Acción Requerida</AlertTitle>
                        <AlertDescription>
                          Tus documentos no están aprobados. No puedes recibir
                          viajes. Revisa la pestaña "Documentos".
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Control de notificaciones de sonido */}
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Notificaciones
                          {!isSecureContext && (
                            <Badge variant="outline" className="text-xs">HTTPS Requerido</Badge>
                          )}
                        </Label>
                        <Badge variant={canUseNotifications && hasPermission ? "default" : "secondary"}>
                          {canUseNotifications ? 
                            (hasPermission ? "Habilitadas" : "Deshabilitadas") : 
                            "No Disponible"
                          }
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-[#0477BF]" />
                          Sonido de Alertas
                        </Label>
                        <div className="flex items-center gap-2">
                          <Badge variant={audioEnabled ? "default" : (audioPermissionGranted ? "outline" : "secondary")}>
                            {audioEnabled ? "Activo" : (audioPermissionGranted ? "Reactivar" : "Inactivo")}
                          </Badge>
                          {!audioEnabled && isLoaded && canUseNotifications && (
                            <Button 
                              size="sm" 
                              variant={audioPermissionGranted ? "default" : "outline"}
                              onClick={async () => {
                                const enabled = audioPermissionGranted ? 
                                  await enableAudio() : 
                                  await enableAudio();
                                if (enabled) {
                                  toast({
                                    title: 'Sonido habilitado',
                                    description: audioPermissionGranted ? 
                                      'Sonido reactivado correctamente.' : 
                                      'Ahora recibirás alertas de audio cuando lleguen nuevas solicitudes.',
                                    duration: 5000,
                                    className: 'border-l-4 border-l-[#05C7F2]',
                                  });
                                }
                              }}
                            >
                              {audioPermissionGranted ? "Reactivar Sonido" : "Habilitar Sonido"}
                            </Button>
                          )}
                          {!canUseNotifications && (
                            <Badge variant="destructive" className="text-xs">
                              Requiere HTTPS
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <DriverStatePanel
                  incomingRequest={incomingRequestHook}
                  requestTimeLeft={requestTimeLeft}
                  isCountering={isCounteringHook}
                  counterOfferAmount={counterOfferAmount}
                  setCounterOfferAmount={setCounterOfferAmount}
                  acceptRequest={acceptRequest}
                  rejectRequest={rejectRequest}
                  startCounterMode={startCounterMode}
                  submitCounterOffer={submitCounterOffer}
                  activeRide={activeRideHook}
                  updateRideStatus={(status) => activeRideHook && updateRideStatus(activeRideHook, status)}
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
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="mb-16 space-x-4 w-full max-w-5xl mx-auto pb-8">
              <DriverDocuments driver={driver} onUpdate={setDriver} />
            </div>
          </TabsContent>

          <TabsContent value="vehicle">
            <div className="mb-16 space-x-4 w-full max-w-5xl mx-auto pb-8">
              <DriverVehicle driver={driver} onUpdate={setDriver} />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="mb-16 w-full max-w-5xl mx-auto pb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Viajes</CardTitle>
                  <CardDescription>
                    Últimos 25 viajes realizados. Usa la búsqueda para filtrar por nombre de pasajero.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={rideHistoryColumns}
                    data={allRides}
                    searchKey="passenger"
                    searchPlaceholder="Buscar por nombre de pasajero..."
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="mb-16 space-x-4 w-full max-w-5xl mx-auto pb-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Mi Perfil y Estadísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        Información del Conductor
                      </h3>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage
                            src={driver.avatarUrl}
                            alt={driver.name}
                          />
                          <AvatarFallback>
                            {driver.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-2xl font-bold">{driver.name}</p>
                          <p className="text-muted-foreground capitalize">
                            {driver.vehicle.serviceType}
                          </p>
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mt-6">Vehículo</h3>
                      <p>
                        {driver.vehicle.brand} {driver.vehicle.model}
                      </p>
                      <p className="font-mono bg-muted p-2 rounded-md inline-block">
                        {driver.vehicle.licensePlate}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Estadísticas</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-4xl font-bold">
                            {
                              allRides.filter((r) => r.status === "completed")
                                .length
                            }
                          </p>
                          <p className="text-muted-foreground">
                            Viajes Completados
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-4xl font-bold flex items-center justify-center gap-1">
                            <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                            {(driver.rating || 0).toFixed(1)}
                          </p>
                          <p className="text-muted-foreground">
                            Tu Calificación
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard />
                      Mi Plan de Pago
                    </CardTitle>
                    <CardDescription>
                      Elige cómo quieres ganar dinero con Hello Taxi.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={selectedPaymentModel}
                      onValueChange={(value) =>
                        setSelectedPaymentModel(value as PaymentModel)
                      }
                    >
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Label
                          htmlFor="payment-commission"
                          className="flex flex-col p-4 border rounded-lg cursor-pointer hover:bg-accent/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary"
                        >
                          <RadioGroupItem
                            value="commission"
                            id="payment-commission"
                            className="sr-only"
                          />
                          <span className="font-semibold text-lg">
                            Comisión por Viaje
                          </span>
                          <span className="text-sm text-muted-foreground mt-1">
                            Gana un porcentaje de cada viaje. Ideal para
                            conductores a tiempo parcial.
                          </span>
                        </Label>
                        <Label
                          htmlFor="payment-membership"
                          className="flex flex-col p-4 border rounded-lg cursor-pointer hover:bg-accent/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary"
                        >
                          <RadioGroupItem
                            value="membership"
                            id="payment-membership"
                            className="sr-only"
                          />
                          <span className="font-semibold text-lg">
                            Membresía Mensual
                          </span>
                          <span className="text-sm text-muted-foreground mt-1">
                            Paga una cuota fija y quédate con casi toda la
                            tarifa. Ideal para conductores a tiempo completo.
                          </span>
                        </Label>
                      </div>
                    </RadioGroup>
                    {selectedPaymentModel === "membership" && (
                      <div className="mt-4 p-4 border rounded-lg bg-secondary/50">
                        <h4 className="font-semibold flex items-center gap-2">
                          <CalendarCheck /> Estado de tu Membresía
                        </h4>
                        <div className="mt-2 flex justify-between items-center">
                          <Badge variant={membershipStatus.variant}>
                            {membershipStatus.label}
                          </Badge>
                          {driver.membershipExpiryDate && (
                            <span className="text-sm text-muted-foreground">
                              Vence el:{" "}
                              {format(
                                new Date(driver.membershipExpiryDate),
                                "dd 'de' MMMM, yyyy"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleSavePaymentPlan} disabled={isSavingPlan || selectedPaymentModel === driver.paymentModel}>
                      {isSavingPlan && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2" /> Guardar Cambios
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Botón flotante de chat - Vista DESKTOP */}
      {/* Temporalmente visible siempre para debug */}
      {true && (
        <Sheet open={isDriverChatOpen} onOpenChange={setIsDriverChatOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="fixed bottom-4 left-4 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50">
              <MessageCircle className="h-7 w-7" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-sm p-0">
            <SheetHeader className="p-4 border-b text-left">
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span>
                  {activeRideHook ? 
                    `Chat con ${activeRideHook?.passenger.name}` : 
                    'Chat (No hay viaje activo)'
                  }
                </span>
              </SheetTitle>
            </SheetHeader>
            {activeRideHook ? (
              <EnhancedChat 
                messages={chatMessages} 
                onSendMessage={sendMessage}
                otherUser={activeRideHook?.passenger}
                rideStatus={activeRideHook?.status}
              />
            ) : (
              <div className="p-4 text-center text-gray-500">
                No hay viaje activo para chatear
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
      
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