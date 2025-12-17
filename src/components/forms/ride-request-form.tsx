'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Loader2,
  Car,
  X,
  MapPin,
  Rocket,
  CarFront,
  Sparkles,
  ChevronRight,
  Ticket,
  Tag,
} from 'lucide-react';
import type {
  Ride,
  PaymentMethod,
  ServiceType,
  Settings,
  FareBreakdown,
  Location,
} from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSettings } from '@/services/settings-service';
import { useAuth } from '@/hooks/auth/use-auth';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useETACalculator } from '@/hooks/use-eta-calculator';
import { LocationPicker } from '@/components/maps';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRideStore } from '@/store/ride-store';
import { PriceSelector } from '@/components/forms/price-selector';

const formSchema = z.object({
  pickup: z.string().min(5, 'Por favor, introduce una ubicación de recojo válida.'),
  dropoff: z.string().min(5, 'Por favor, introduce una ubicación de destino válida.'),
  serviceType: z.enum(['economy', 'comfort', 'exclusive'], { required_error: 'Debes seleccionar un tipo de servicio.' }).default('economy'),
  paymentMethod: z.enum(['cash', 'yape', 'plin'], { required_error: 'Debes seleccionar un método de pago.' }).default('cash'),
  couponCode: z.string().optional(),
});

const paymentMethodIcons: Record<Exclude<PaymentMethod, 'card'>, React.ReactNode> = {
  cash: <Image src="/img/cash.webp" alt="Efectivo" width={50} height={50} className="object-contain" />,
  yape: <Image src="/img/yape.png" alt="Yape" width={50} height={50} className="object-contain" />,
  plin: <Image src="/img/plin.png" alt="Plin" width={50} height={50} className="object-contain" />,
}

const serviceTypeIcons: Record<ServiceType, React.ReactNode> = {
  economy: <Car className="h-8 w-8 text-[#2E4CA6]" />,
  comfort: <CarFront className="h-8 w-8 text-[#0477BF]" />,
  exclusive: <Rocket className="h-8 w-8 text-[#049DD9]" />,
};

const serviceTypeDetails: Record<ServiceType, { passengers: string; features: string[] }> = {
  economy: {
    passengers: '4 pasajeros',
    features: ['Económico', 'Rápido', 'Ideal para cortas distancias']
  },
  comfort: {
    passengers: '4 pasajeros',
    features: ['Confortable', 'Elegante', 'Perfecto para ciudad']
  },
  exclusive: {
    passengers: '6 pasajeros',
    features: ['Amplio espacio', 'Aire acondicionado', 'Lujoso']
  }
};

interface RideRequestFormProps {
  onRideCreated: (ride: Ride) => void;
}

export default function RideRequestForm({ onRideCreated }: RideRequestFormProps) {
  const {
    status,
    pickupLocation,
    dropoffLocation,
    routeInfo,
    customFare,
    setPickupLocation,
    setDropoffLocation,
    setRouteInfo,
    setCustomFare,
    resetRide,
    setStatus,
  } = useRideStore();

  const [appSettings, setAppSettings] = useState<Settings | null>(null);
  const [locationPickerFor, setLocationPickerFor] = useState<'pickup' | 'dropoff' | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { calculateRoute, isCalculating, error: routeError } = useETACalculator();

  // 🔍 Verificar conductores disponibles
  const checkAvailableDrivers = async (): Promise<boolean> => {
    try {
      const driversQuery = query(
        collection(db, 'drivers'),
        where('status', '==', 'available')
      );
      const driversSnapshot = await getDocs(driversQuery);
      return !driversSnapshot.empty;
    } catch (error) {
      console.error(' Error checking available drivers:', error);
      return false;
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      pickup: '',
      dropoff: '',
      serviceType: 'economy',
      paymentMethod: 'cash',
      couponCode: '',
    },
  });

  useEffect(() => {
    if (pickupLocation?.address) form.setValue('pickup', pickupLocation.address);
    if (dropoffLocation?.address) form.setValue('dropoff', dropoffLocation.address);
  }, [pickupLocation, dropoffLocation, form]);

  useEffect(() => {
    async function fetchSettings() {
      const settings = await getSettings();
      setAppSettings(settings);
    }
    fetchSettings();
  }, []);

  const handleLocationSelected = (location: Location) => {
    if (locationPickerFor === 'pickup') setPickupLocation(location);
    else if (locationPickerFor === 'dropoff') setDropoffLocation(location);
    setLocationPickerFor(null);
  };

  const onSubmit = async () => {
    if (!pickupLocation || !dropoffLocation || !user) return;
    console.log('[FARE CALC] Iniciando cálculo de ruta:', {
      pickup: pickupLocation,
      dropoff: dropoffLocation,
      serviceType: form.getValues('serviceType'),
      couponCode: form.getValues('couponCode')
    });
    
    const route = await calculateRoute(
      pickupLocation,
      dropoffLocation,
      {
        serviceType: form.getValues('serviceType'),
        couponCode: form.getValues('couponCode') || undefined
      }
    );
    
    console.log('[FARE CALC] Resultado del cálculo:', {
      route,
      estimatedFare: route?.estimatedFare,
      fareBreakdown: route?.fareBreakdown
    });
    
    if (route && route.fareBreakdown) {
      setRouteInfo(route);
      setCustomFare(null); // Reset custom fare when recalculating
      setStatus('confirmed');
    } else {
      console.error('[FARE CALC] No se pudo calcular la ruta o falta fareBreakdown');
      toast({
        variant: 'destructive',
        title: 'Error al calcular ruta',
        description: 'No se pudo calcular la ruta del viaje. Por favor, verifica las ubicaciones.',
      });
    }
  };

  async function handleCreateRide(fare: number, breakdown: FareBreakdown) {
    if (!user) return;
    
    // Validar que la tarifa sea mayor a 0
    if (!fare || fare <= 0) {
      console.error('[FARE ERROR] Tarifa inválida:', { fare, breakdown });
      toast({
        variant: 'destructive',
        title: 'Error al calcular tarifa',
        description: 'No se pudo calcular la tarifa del viaje. Por favor, intenta de nuevo.',
      });
      return;
    }
    
    const hasAvailableDrivers = await checkAvailableDrivers();
    if (!hasAvailableDrivers) {
      toast({
        variant: 'destructive',
        title: 'No hay conductores disponibles',
        description: 'En este momento no hay conductores activos en tu zona. Por favor, intenta más tarde.',
      });
      return;
    }

    const passengerRef = doc(db, 'users', user.uid);
    const rideRef = doc(collection(db, 'rides'));
    const newRideData: Ride = {
      id: rideRef.id,
      pickup: form.getValues('pickup'),
      dropoff: form.getValues('dropoff'),
      pickupLocation: pickupLocation || undefined,
      dropoffLocation: dropoffLocation || undefined,
      date: new Date().toISOString(),
      fare,
      driver: null,
      passenger: passengerRef,
      vehicle: null,
      serviceType: form.getValues('serviceType'),
      paymentMethod: form.getValues('paymentMethod'),
      couponCode: form.getValues('couponCode') || '',
      fareBreakdown: breakdown,
      status: 'searching',
      offeredTo: null,
      rejectedBy: [],
      isRatedByPassenger: false,
    };

    await setDoc(rideRef, newRideData);
    onRideCreated(newRideData);

    setTimeout(async () => {
      const currentRideRef = doc(db, 'rides', newRideData.id);
      const currentRideDoc = await getDoc(currentRideRef);
      if (currentRideDoc.exists()) {
        const rideData = currentRideDoc.data() as Ride;
        if (rideData.status === 'searching') {
          await updateDoc(currentRideRef, {
            status: 'cancelled',
            cancellationReason: {
              code: 'NO_DRIVER_AVAILABLE',
              reason: 'No se encontró conductor disponible'
            },
            cancelledBy: 'system'
          });
          toast({
            variant: 'destructive',
            title: 'No se encontró conductor',
            description: 'No hay conductores disponibles en este momento. Intenta nuevamente.',
          });
        }
      }
    }, 180000); // 3 min
  }

  function resetForm() {
    resetRide();
    setCustomFare(null);
    form.reset();
  }

  if (!appSettings) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[#0477BF]" />
      </div>
    );
  }

  // === Confirmación de viaje ===
  if (status === 'confirmed' && routeInfo) {
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#2E4CA6] via-[#0477BF] to-[#05C7F2] py-1.5 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E4CA6]/90 via-[#0477BF]/80 to-[#05C7F2]/80"></div>
          <div className="relative z-10 text-center">
            <h2 className="text-lg font-bold">Confirmar tu viaje</h2>
           </div>
        </div>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-white">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex flex-col items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <div className="h-6 w-0.5 bg-gray-300"></div>
                <MapPin className="h-3.5 w-3.5 text-red-500" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-xs font-medium text-green-700">Recojo</p>
                  <p className="text-gray-900 text-xs">{pickupLocation?.address}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-700">Destino</p>
                  <p className="text-gray-900 text-xs">{dropoffLocation?.address}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center border-b pb-2">
              <div className="text-center">
                <p className="text-lg font-bold text-[#2E4CA6]">{routeInfo.distance.text}</p>
                <p className="text-[10px] text-gray-600 font-medium">Distancia</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#0477BF]">{routeInfo.duration.text}</p>
                <p className="text-[10px] text-gray-600 font-medium">Duración</p>
              </div>
            </div>

            {/* Selector de precio personalizable */}
            <div className="pt-2">
              <PriceSelector
                originalPrice={routeInfo.estimatedFare || 0}
                onPriceChange={setCustomFare}
                maxIncrease={appSettings?.negotiationRange || 15}
                maxDecrease={appSettings?.negotiationRange || 15}
                step={0.10}
              />
            </div>

            {/* Desglose de tarifa con cupón */}
            {(routeInfo.fareBreakdown?.couponDiscount || 0) > 0 && form.getValues('couponCode') && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Tarifa base:</span>
                  <span className="font-medium">S/ {((routeInfo.estimatedFare || 0) + (routeInfo.fareBreakdown?.couponDiscount || 0)).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Descuento ({form.getValues('couponCode')}):
                  </span>
                  <span className="font-medium">-S/ {(routeInfo.fareBreakdown?.couponDiscount || 0).toFixed(2)}</span>
                </div>
                <div className="border-t border-green-200 pt-1">
                  <div className="flex items-center justify-between text-sm font-bold text-green-700">
                    <span>Total sugerido:</span>
                    <span>S/ {(routeInfo.estimatedFare || 0).toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 text-center mt-1">
                  Puedes ajustar el precio arriba
                </p>
              </div>
            )}

            {routeInfo.duration && (
              <div className="rounded-lg shadow p-2 bg-gradient-to-br from-[#F2F2F2] via-white to-[#F2F2F2]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#2E4CA6] flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#05C7F2] animate-pulse" />
                    Tráfico en Tiempo Real
                  </p>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
                      routeInfo.trafficCondition === 'light' && "bg-[#05C7F2]/15 text-[#049DD9] border-[#049DD9]/40",
                      routeInfo.trafficCondition === 'moderate' && "bg-[#049DD9]/15 text-[#0477BF] border-[#0477BF]/40",
                      routeInfo.trafficCondition === 'heavy' && "bg-[#0477BF]/15 text-[#2E4CA6] border-[#2E4CA6]/40",
                      routeInfo.trafficCondition === 'unknown' && "bg-[#F2F2F2] text-[#2E4CA6] border-[#049DD9]/20"
                    )}
                  >
                    {routeInfo.trafficCondition === 'light' && 'Fluido'}
                    {routeInfo.trafficCondition === 'moderate' && 'Moderado'}
                    {routeInfo.trafficCondition === 'heavy' && 'Pesado'}
                    {routeInfo.trafficCondition === 'unknown' && 'Desconocido'}
                  </span>
                </div>
           
               </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button
            size="sm"
            className="w-full h-10 text-xs font-semibold bg-gradient-to-r from-[#2E4CA6] via-[#0477BF] to-[#05C7F2] text-white shadow-lg"
            onClick={async () => {
              if (routeInfo.fareBreakdown) {
                const finalFare = customFare || routeInfo.estimatedFare || 0;
                // Actualizar el fareBreakdown.total para que coincida con el precio final
                const updatedBreakdown = {
                  ...routeInfo.fareBreakdown,
                  total: finalFare
                };
                await handleCreateRide(finalFare, updatedBreakdown);
              }
            }}
          >
            <Car className="mr-1 h-3 w-3" />
            Buscar Conductor
            {customFare && customFare !== routeInfo.estimatedFare && (
              <span className="ml-1 text-[10px] bg-white/20 rounded px-1">
                S/ {customFare.toFixed(2)}
              </span>
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full h-10 border border-gray-300 text-xs"
            onClick={() => setStatus('idle')}
          >
            Volver a editar
          </Button>
        </div>
      </div>
    );
  }

  // === Form principal ===
  const isFormLocked = status !== 'idle';

  return (
    <>
      <Dialog open={!!locationPickerFor} onOpenChange={(open) => !open && setLocationPickerFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locationPickerFor === 'pickup' ? 'Seleccionar punto de recojo' : 'Seleccionar destino'}
            </DialogTitle>
          </DialogHeader>
          <LocationPicker
            onLocationSelect={handleLocationSelected}
            onCancel={() => setLocationPickerFor(null)}
            isPickup={locationPickerFor === 'pickup'}
            initialLocation={locationPickerFor === 'pickup' ? pickupLocation : dropoffLocation}
          />
        </DialogContent>
      </Dialog>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          {(status === 'idle' || isCalculating || status === 'calculated') && (
            <>
              {/* Pickup */}
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start h-10 rounded-lg transition text-xs"
                  onClick={() => setLocationPickerFor('pickup')}
                  disabled={isFormLocked}
                >
                  <MapPin className="mr-1.5 h-3 w-3 text-green-500" />
                  <span className="truncate">{pickupLocation ? pickupLocation.address : 'Tu ubicación'}</span>
                </Button>
                <FormMessage>{form.formState.errors.pickup?.message}</FormMessage>
              </div>

              {/* Dropoff */}
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start h-10 rounded-lg transition text-xs"
                  onClick={() => setLocationPickerFor('dropoff')}
                  disabled={isFormLocked}
                >
                  <MapPin className="mr-1.5 h-3 w-3 text-red-500" />
                  <span className="truncate">{dropoffLocation ? dropoffLocation.address : 'Seleccionar destino'}</span>
                </Button>
                <FormMessage>{form.formState.errors.dropoff?.message}</FormMessage>
              </div>

              {/* Tipo de Servicio */}
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                     <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-4">
                        {appSettings.serviceTypes.map((service) => {
                          const isSelected = field.value === service.id;
                          const details = serviceTypeDetails[service.id];
                          
                          return (
                            <FormItem key={service.id}>
                              <RadioGroupItem value={service.id} id={`service-${service.id}`} className="peer sr-only" />
                              <FormLabel
                                htmlFor={`service-${service.id}`}
                                className={cn(
                                  "block relative rounded-lg border shadow-sm cursor-pointer transition-all duration-500 overflow-hidden h-24",
                                  isSelected
                                    ? "border-[#0477BF] bg-[#05C7F2]/10"
                                    : "border-gray-200 bg-[#F2F2F2] hover:border-[#049DD9] hover:bg-white",
                                  isFormLocked && "cursor-not-allowed opacity-50"
                                )}
                                style={{
                                  perspective: '1000px',
                                  transformStyle: 'preserve-3d'
                                }}
                              >
                                <div
                                  className={cn(
                                    "absolute inset-0 transition-all duration-500",
                                    isSelected ? "opacity-0 invisible rotate-y-180" : "opacity-100 visible"
                                  )}
                                  style={{
                                    transform: isSelected ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    backfaceVisibility: 'hidden'
                                  }}
                                >
                                  <div className="flex flex-col items-center justify-center h-full p-2">
                                    <div className="scale-[0.8]">{serviceTypeIcons[service.id]}</div>
                                    <span className="font-medium text-[#2E4CA6] text-xs mt-1">{service.name}</span>
                                  </div>
                                </div>
                                
                                <div
                                  className={cn(
                                    "absolute inset-0 transition-all duration-500 bg-gradient-to-br from-[#2E4CA6] to-[#0477BF] text-white",
                                    isSelected ? "opacity-100 visible" : "opacity-0 invisible rotate-y-180"
                                  )}
                                  style={{
                                    transform: isSelected ? 'rotateY(0deg)' : 'rotateY(-180deg)',
                                    backfaceVisibility: 'hidden'
                                  }}
                                >
                                  <div className="flex flex-col justify-center h-full p-2 space-y-0.5">
                                    <p className="text-[9px] font-bold text-center text-yellow-300">{details.passengers}</p>
                                    {details.features.map((feature, idx) => (
                                      <p key={idx} className="text-[8px] text-center leading-tight">{feature}</p>
                                    ))}
                                  </div>
                                </div>
                              </FormLabel>
                            </FormItem>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Método de Pago */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-4">
                        {(Object.keys(paymentMethodIcons) as Array<keyof typeof paymentMethodIcons>).map((method) => (
                          <FormItem key={method}>
                            <RadioGroupItem value={method} id={`payment-${method}`} className="peer sr-only" />
                            <FormLabel
                              htmlFor={`payment-${method}`}
                              className={cn(
                                "flex flex-col items-center justify-center rounded-lg border cursor-pointer transition shadow-sm h-16",
                                field.value === method
                                  ? "border-[#0477BF] bg-[#05C7F2]/10"
                                  : "border-gray-200 bg-[#F2F2F2] hover:border-[#049DD9] hover:bg-white",
                                isFormLocked && "cursor-not-allowed opacity-50"
                              )}
                            >
                              <div className="scale-[0.8]">{paymentMethodIcons[method]}</div>
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Cupón */}
              <FormField
                control={form.control}
                name="couponCode"
                render={({ field }) => (
                  <FormItem>
                     <FormControl>
                      <div className="relative">
                        <Ticket className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-[#0477BF]" />
                        <Input
                          {...field}
                          placeholder="Código de descuento"
                          className="pl-6 mt-4 h-10 rounded-lg text-xs"
                          disabled={isFormLocked}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-0.5 pt-0.5">
                {status === 'idle' && (
                  <Button
                    type="submit"
                    className="w-full h-10 text-xs font-semibold bg-gradient-to-r from-[#2E4CA6] via-[#0477BF] to-[#05C7F2] text-white shadow-lg"
                    disabled={isCalculating || !pickupLocation || !dropoffLocation}
                  >
                    {isCalculating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                    {isCalculating ? 'Calculando...' : 'Pedir Ahora'}
                  </Button>
                )}
              </div>

              {status === 'calculated' && routeInfo && (
                <div className="space-y-1">
                  <Button
                    type="button"
                    className="w-full h-8 text-sm font-semibold bg-gradient-to-r from-[#2E4CA6] via-[#0477BF] to-[#05C7F2] text-white shadow-lg"
                    onClick={() => setStatus('confirmed')}
                  >
                    Confirmar Viaje
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full text-muted-foreground shadow h-7 text-xs"
                    onClick={resetForm}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Empezar de Nuevo
                  </Button>
                </div>
              )}
            </>
          )}
        </form>
      </Form>
    </>
  );
}
