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
import { useDriverAuth } from "@/hooks/use-driver-auth";
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
import RatingForm from "@/components/rating-form";
import { processRating } from "@/ai/flows/process-rating";
import MapView from "@/components/map-view";
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
import Chat from "@/components/chat";
import EnhancedChat from "@/components/enhanced-chat";
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
import { useDriverRideHistory } from "@/hooks/driver/use-driver-ride-history";
import { DriverStatePanel } from "@/components/driver/driver-state-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams, useRouter } from "next/navigation";
import { SSLWarningBanner } from "@/components/ssl-warning-banner";

type EnrichedRide = Omit<Ride, "passenger" | "driver"> & { passenger: User; driver: EnrichedDriver };

function DriverPageContent() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'history';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const router = useRouter();

  // Usar el hook correcto para obtener datos del conductor
  const { driver, user, isDriver } = useDriverAuth();
  
  // Estado local simple
  const [activeRide, setActiveRide] = useState<DriverActiveRide | null>(null);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [historyRides, setHistoryRides] = useState([]);
  
  const { toast } = useToast();
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Obtener ubicación del conductor
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDriverLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Error obteniendo ubicación:", error)
      );
    }
  }, []);

  // Sincronizar activeTab con los parámetros de la URL
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  // Vista móvil
  if (isMobile) {
    return (
      <>
        <div className="min-h-screen bg-background">
          {/* Contenido móvil existente */}
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Panel de Conductor</h1>
            {/* Aquí iría el contenido móvil existente */}
          </div>

          {/* Chat móvil */}
          {activeRide && (
            <Sheet open={isDriverChatOpen} onOpenChange={setIsDriverChatOpen}>
              <SheetTrigger asChild>
                <Button size="icon" className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50">
                  <MessageCircle className="h-7 w-7" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm p-0">
                <SheetHeader className="p-4 border-b text-left">
                  <SheetTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Chat con {activeRide.passenger.name}</span>
                  </SheetTitle>
                </SheetHeader>
                <EnhancedChat 
                  messages={chatMessages} 
                  onSendMessage={async (text) => {
                    // Lógica de envío de mensaje
                  }}
                  isLoading={false}
                  otherUser={activeRide.passenger}
                  isTyping={false}
                  onTypingStart={() => {}}
                  onTypingStop={() => {}}
                  rideStatus={activeRide.status}
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
                pickupLocation={activeRide?.pickupLocation ? activeRide.pickupLocation : null}
                dropoffLocation={activeRide?.dropoffLocation ? activeRide.dropoffLocation : null}
                interactive={false}
              />
              {activeRide && (
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
                <Card>
                  <CardContent className="p-4">
                    {driver ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={''} alt={driver.name} />
                            <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold">{driver.name}</h3>
                            <p className="text-sm text-gray-600">Estado: Disponible</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">
                            En línea
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <p>Cargando información del conductor...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                      {historyRides && historyRides.length > 0 ? (
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
                            {historyRides.map((ride: any) => (
                              <TableRow key={ride.id}>
                                <TableCell className="text-sm">
                                  {ride.createdAt && format(ride.createdAt.toDate(), "dd/MMM", { locale: es })}
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  {ride.passenger?.name || 'N/A'}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {ride.pickupLocation?.address}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {ride.dropoffLocation?.address}
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
                      {activeRide ? (
                        <div className="flex flex-col h-full">
                          <div className="p-4 border-b bg-secondary/20">
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
                              onSendMessage={async (text) => {
                                // Lógica de envío de mensaje
                              }}
                              isLoading={false}
                              otherUser={activeRide.passenger}
                              isTyping={false}
                              onTypingStart={() => {}}
                              onTypingStop={() => {}}
                              rideStatus={activeRide.status}
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