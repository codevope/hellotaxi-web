
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Car,
  CircleDollarSign,
  Loader2,
  MapPin,
  MessageSquare,
  Smile,
  Frown,
  Meh,
  Star,
  User as UserIcon,
  TrendingUp,
  Clock,
  Tag,
  Percent,
  CalendarPlus,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { Ride, Driver, User, Review, Vehicle, RideStatus } from '@/lib/types';
import { doc, getDoc, collection, getDocs, query, orderBy, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

type EnrichedRide = Omit<Ride, 'driver' | 'passenger' | 'vehicle'> & {
  driver: Driver & { name: string; avatarUrl: string; rating: number } | null;
  passenger: User;
  vehicle: Vehicle | null;
};

const rideStatusConfig: Record<RideStatus, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  completed: { label: 'Completado', variant: 'secondary' as const },
  'in-progress': { label: 'En Progreso', variant: 'default' as const },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const },
  searching: { label: 'Buscando', variant: 'default' as const },
  accepted: { label: 'Aceptado', variant: 'default' as const },
  arrived: { label: 'Ha llegado', variant: 'default' as const },
  'counter-offered': { label: 'Contraoferta', variant: 'default' as const }
};

const sentimentConfig = {
    positive: { label: 'Positivo', icon: <Smile className="h-4 w-4 text-green-500" />, color: 'text-green-600' },
    negative: { label: 'Negativo', icon: <Frown className="h-4 w-4 text-red-500" />, color: 'text-red-600' },
    neutral: { label: 'Neutral', icon: <Meh className="h-4 w-4 text-yellow-500" />, color: 'text-yellow-600' },
};

export default function RideDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [ride, setRide] = useState<EnrichedRide | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const mapImageUrl = 'https://picsum.photos/seed/map/1200/800';


  useEffect(() => {
    if (typeof id !== 'string') return;

    async function fetchRideData() {
      try {
        const rideDocRef = doc(db, 'rides', id as string);
        const rideSnap = await getDoc(rideDocRef);

        if (rideSnap.exists()) {
            const rawData = rideSnap.data();
            const rideData = { id: rideSnap.id, ...rawData } as Ride;
            
            console.log('🔍 Raw ride data:', rawData);
            console.log('📋 Processed ride data:', rideData);
            
            try {
              // Verificar pasajero (requerido)
              if (!rideData.passenger) {
                console.error("❌ No passenger reference in ride");
                return;
              }
              
              const passengerSnap = await getDoc(rideData.passenger);
              if (!passengerSnap.exists()) {
                console.error("❌ Passenger document does not exist");
                return;
              }
              
              const passengerData = { id: passengerSnap.id, ...passengerSnap.data() } as User;
              console.log('👤 Passenger data loaded:', passengerData);

              // Verificar conductor (opcional)
              let enrichedDriver: (Driver & { name: string; avatarUrl: string; rating: number }) | null = null;
              if (rideData.driver) {
                const driverSnap = await getDoc(rideData.driver);
                if (driverSnap.exists()) {
                  const driverData = { id: driverSnap.id, ...driverSnap.data() } as Driver;
                  // Cargar datos del usuario del conductor
                  const driverUserSnap = await getDoc(doc(db, 'users', driverData.userId));
                  if (driverUserSnap.exists()) {
                    const driverUser = driverUserSnap.data() as User;
                    enrichedDriver = {
                      ...driverData,
                      name: driverUser.name,
                      avatarUrl: driverUser.avatarUrl,
                      rating: driverUser.rating,
                    };
                    console.log('🚗 Driver data loaded:', enrichedDriver);
                  } else {
                    console.warn("⚠️ Driver user data not found");
                  }
                } else {
                  console.warn("⚠️ Driver reference exists but document not found");
                }
              } else {
                console.log("ℹ️ No driver assigned to this ride");
              }

              // Verificar vehículo (opcional)
              let vehicleData: Vehicle | null = null;
              if (rideData.vehicle) {
                const vehicleSnap = await getDoc(rideData.vehicle);
                if (vehicleSnap.exists()) {
                  vehicleData = { id: vehicleSnap.id, ...vehicleSnap.data() } as Vehicle;
                  console.log('🚙 Vehicle data loaded:', vehicleData);
                } else {
                  console.warn("⚠️ Vehicle reference exists but document not found");
                }
              } else {
                console.log("ℹ️ No vehicle assigned to this ride");
              }
              
              // Crear el ride enriquecido
              const enrichedRide = { 
                ...rideData, 
                driver: enrichedDriver, 
                passenger: passengerData,
                vehicle: vehicleData
              } as EnrichedRide;
              
              setRide(enrichedRide);
              console.log('✅ Enriched ride set:', enrichedRide);

              // Cargar reviews del conductor si existe
              if (enrichedDriver) {
                try {
                  const reviewsQuery = query(collection(db, 'drivers', enrichedDriver.id, 'reviews'), orderBy('createdAt', 'desc'));
                  const reviewsSnapshot = await getDocs(reviewsQuery);
                  const driverReviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
                  setReviews(driverReviews);
                  console.log('⭐ Reviews loaded:', driverReviews.length);
                } catch (reviewError) {
                  console.warn("⚠️ Error loading reviews:", reviewError);
                }
              }
              
            } catch (dataError) {
              console.error("❌ Error processing ride data:", dataError);
            }
        } else {
          console.error("❌ Ride document does not exist with ID:", id);
        }
      } catch (error) {
        console.error("Error fetching ride data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRideData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="p-8">
        <h1 className="text-2xl">Viaje no encontrado.</h1>
      </div>
    );
  }

  const { driver, passenger, status, fareBreakdown, vehicle } = ride;
  const statusInfo = rideStatusConfig[status];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl font-headline">
              Detalles del Viaje
            </h1>
            <p className="text-muted-foreground">ID del Viaje: {ride.id}</p>
          </div>
        </div>
        <Badge variant={statusInfo.variant} className="text-base px-4 py-2">{statusInfo.label}</Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Resumen del Viaje</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-4">
                            <MapPin className="h-5 w-5 text-primary mt-1" />
                            <div>
                                <p className="font-semibold">Recojo</p>
                                <p className="text-muted-foreground">{ride.pickup}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <MapPin className="h-5 w-5 text-green-500 mt-1" />
                            <div>
                                <p className="font-semibold">Destino</p>
                                <p className="text-muted-foreground">{ride.dropoff}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-semibold">Fecha</p>
                                <p className="text-muted-foreground">{format(new Date(ride.date), "eeee, dd 'de' MMMM 'del' yyyy, HH:mm", { locale: es })}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-4">
                            <Car className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-semibold">Tipo de Servicio</p>
                                <p className="text-muted-foreground capitalize">{ride.serviceType}</p>
                            </div>
                        </div>
                        {ride.status === 'cancelled' && (
                            <div className="flex items-start gap-4 text-destructive">
                                <MessageSquare className="h-5 w-5 mt-1" />
                                <div>
                                    <p className="font-semibold">Motivo de Cancelación ({ride.cancelledBy})</p>
                                    <p>{ride.cancellationReason?.reason}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

             {fareBreakdown && (
                <Card>
                    <CardHeader>
                        <CardTitle>Desglose de Tarifa</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground flex items-center gap-2"><CircleDollarSign className="h-4 w-4" />Tarifa Base</p>
                            <p>S/{fareBreakdown.baseFare.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" />Costo por Distancia</p>
                            <p>S/{fareBreakdown.distanceCost.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />Costo por Duración</p>
                            <p>S/{fareBreakdown.durationCost.toFixed(2)}</p>
                        </div>
                         <div className="flex justify-between items-center">
                            <p className="text-muted-foreground flex items-center gap-2"><Percent className="h-4 w-4" />Tarifa de Servicio ({((fareBreakdown.serviceMultiplier - 1) * 100).toFixed(0)}%)</p>
                            <p>+ S/{fareBreakdown.serviceCost.toFixed(2)}</p>
                        </div>
                        <Separator />
                         <div className="flex justify-between items-center font-medium">
                            <p>Subtotal</p>
                            <p>S/{fareBreakdown.subtotal.toFixed(2)}</p>
                        </div>
                        <Separator />
                        {fareBreakdown.peakSurcharge > 0 && (
                            <div className="flex justify-between items-center text-orange-600">
                                <p className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Recargo por Hora Punta</p>
                                <p>+ S/{fareBreakdown.peakSurcharge.toFixed(2)}</p>
                            </div>
                        )}
                        {fareBreakdown.specialDaySurcharge > 0 && (
                            <div className="flex justify-between items-center text-orange-600">
                                <p className="flex items-center gap-2"><CalendarPlus className="h-4 w-4" />Recargo por Día Especial</p>
                                <p>+ S/{fareBreakdown.specialDaySurcharge.toFixed(2)}</p>
                            </div>
                        )}
                         {fareBreakdown.couponDiscount > 0 && (
                            <div className="flex justify-between items-center text-green-600">
                                <p className="flex items-center gap-2"><Tag className="h-4 w-4" />Descuento por Cupón</p>
                                <p>- S/{fareBreakdown.couponDiscount.toFixed(2)}</p>
                            </div>
                        )}
                        <Separator className="my-4" />
                        <div className="flex justify-between items-center text-lg font-bold">
                            <p>Total Final Pagado</p>
                            <p>S/{ride.fare.toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>
            )}


            {driver && (
                <Card>
                    <CardHeader>
                        <CardTitle>Comentarios sobre el Conductor</CardTitle>
                        <CardDescription>Calificaciones y comentarios que ha recibido {driver.name} en otros viajes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {reviews.length > 0 ? (
                            <ul className="space-y-4">
                                {reviews.map(review => (
                                    <li key={review.id} className="p-4 bg-muted rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={cn("h-5 w-5", i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
                                                ))}
                                            </div>
                                            <div className={cn("flex items-center text-sm font-medium", sentimentConfig[review.sentiment].color)}>
                                                {sentimentConfig[review.sentiment].icon}
                                                <span>{sentimentConfig[review.sentiment].label}</span>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground mt-2 italic">"{review.comment}"</p>
                                        <p className="text-xs text-right text-muted-foreground mt-2">{format(new Date(review.createdAt), "dd/MM/yyyy")}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">Este conductor aún no ha recibido ningún comentario.</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <UserIcon className="h-6 w-6 text-primary" />
                    <CardTitle>Pasajero</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center space-y-3">
                 <Avatar className="h-20 w-20">
                    <AvatarImage src={passenger.avatarUrl} alt={passenger.name} />
                    <AvatarFallback>{passenger.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{passenger.name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground justify-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{passenger.rating.toFixed(1)} de calificación</span>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={`/admin/users/${passenger.id}`}>
                    Ver perfil del pasajero
                  </a>
                </Button>
            </CardContent>
          </Card>

          {driver && (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Car className="h-6 w-6 text-primary" />
                        <CardTitle>Conductor</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center space-y-3">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={driver.avatarUrl} alt={driver.name} />
                        <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{driver.name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground justify-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{driver.rating.toFixed(1)} de calificación</span>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <a href={`/admin/drivers/${driver.id}`}>
                        Ver perfil del conductor
                      </a>
                    </Button>
                </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
