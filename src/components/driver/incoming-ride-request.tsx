"use client";

import { 
  Car, 
  Star, 
  DollarSign, 
  MapPin, 
  Clock, 
  User as UserIcon,
  CircleDollarSign,
  CheckCircle,
  X
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CounterOfferSelector } from "@/components/counter-offer-selector";
import type { User } from "@/lib/types";

interface IncomingRideRequestProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  passenger: User;
  pickup: string;
  dropoff: string;
  fare: number;
  requestTimeLeft: number;
  isCountering: boolean;
  counterOfferAmount: string;
  onCounterOfferChange: (amount: string) => void;
  onAccept: () => void;
  onReject: () => void;
  onStartCounterOffer: () => void;
  onSubmitCounterOffer: () => void;
  onCancelCounterOffer: () => void;
}

export function IncomingRideRequest({
  isOpen,
  onOpenChange,
  passenger,
  pickup,
  dropoff,
  fare,
  requestTimeLeft,
  isCountering,
  counterOfferAmount,
  onCounterOfferChange,
  onAccept,
  onReject,
  onStartCounterOffer,
  onSubmitCounterOffer,
  onCancelCounterOffer,
}: IncomingRideRequestProps) {
  const handleCounterOfferSubmit = () => {
    onSubmitCounterOffer();
  };

  const handleStartCounterOffer = () => {
    onStartCounterOffer();
  };

  // Debug log para verificar que el componente se renderiza
  console.log('🚗 IncomingRideRequest renderizado - Nuevo diseño aplicado');

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isCountering) onReject();
        onOpenChange(open);
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-0"
      >
        {/* Header con gradiente - Colores del logo HelloTaxi */}
        <div className="bg-gradient-to-r from-[#2E4CA6] via-[#0477BF] to-[#049DD9] p-8 text-white shadow-lg">
          <SheetHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-3 bg-white/30 rounded-xl shadow-lg">
                  <Car className="h-8 w-8" />
                </div>
                Nueva Solicitud
              </SheetTitle>
              <Badge 
                variant="secondary" 
                className={`px-3 py-1 text-lg font-bold ${
                  requestTimeLeft <= 10 
                    ? "bg-red-100 text-red-700 animate-pulse" 
                    : "bg-white/20 text-white"
                }`}
              >
                <Clock className="h-4 w-4 mr-1" />
                {requestTimeLeft}s
              </Badge>
            </div>
            <p className="text-[#05C7F2]">
              Revisa los detalles y toma una decisión rápida
            </p>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del Pasajero */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Pasajero</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-[#0477BF]">
                <AvatarImage src={passenger.avatarUrl} alt={passenger.name} />
                <AvatarFallback className="bg-[#0477BF] text-white font-semibold text-lg">
                  {passenger.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-lg">{passenger.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {passenger.rating?.toFixed(1) || "Nuevo"}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {passenger.totalRides || 0} viajes
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles del Viaje */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Detalles del Viaje
              </CardTitle>
              <CardDescription>
                Revisa la ruta y la tarifa propuesta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ruta visual */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-primary">Recogida</p>
                    <p className="text-sm text-muted-foreground mt-1">{pickup}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-green-500 mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-green-600">Destino</p>
                    <p className="text-sm text-muted-foreground mt-1">{dropoff}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Tarifa */}
              <div className="bg-gradient-to-r from-[#05C7F2]/10 to-[#049DD9]/10 rounded-lg p-4 border border-[#05C7F2]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="h-5 w-5 text-[#0477BF]" />
                    <span className="font-medium text-[#2E4CA6]">Tarifa Propuesta</span>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[#2E4CA6]">
                      S/{fare.toFixed(2)}
                    </p>
                    <p className="text-xs text-[#0477BF]">Precio sugerido</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isCountering ? "Hacer Contraoferta" : "¿Qué deseas hacer?"}
              </CardTitle>
              <CardDescription>
                {isCountering 
                  ? "Ingresa tu precio sugerido para este viaje" 
                  : "Elige una de las siguientes opciones"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCountering ? (
                <>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Ajusta tu contraoferta
                    </Label>
                    <CounterOfferSelector
                      originalFare={fare}
                      onPriceChange={(newPrice) => onCounterOfferChange(newPrice.toFixed(2))}
                      disabled={false}
                      maxIncrease={25}
                      maxDecrease={10}
                      step={0.50}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-[#0477BF] to-[#049DD9] hover:from-[#2E4CA6] hover:to-[#0477BF] text-white font-semibold py-3 flex items-center justify-center gap-2"
                      onClick={handleCounterOfferSubmit}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Enviar
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="py-3 flex items-center justify-center gap-2"
                      onClick={onCancelCounterOffer}
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-[#049DD9] to-[#05C7F2] hover:from-[#0477BF] hover:to-[#049DD9] text-white font-semibold py-4 text-base shadow-lg flex items-center justify-center gap-2"
                    onClick={onAccept}
                  >
                    <CheckCircle className="h-5 w-5" />
                    Aceptar Viaje - S/{fare.toFixed(2)}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full py-4 border-2 border-[#05C7F2] text-[#2E4CA6] hover:bg-[#05C7F2]/10 font-semibold flex items-center justify-center gap-2"
                    onClick={handleStartCounterOffer}
                  >
                    <DollarSign className="h-5 w-5" />
                    Negociar Precio
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full py-4 border-2 text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                    onClick={onReject}
                  >
                    <X className="h-5 w-5" />
                    Rechazar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información adicional */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tiempo de respuesta:</span>
              <span className="font-medium">{requestTimeLeft} segundos</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tipo de servicio:</span>
              <Badge variant="secondary">Estándar</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Star className="h-3 w-3 text-[#05C7F2]" />
              <span>Tip: Responder rápido mejora tu calificación como conductor</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
