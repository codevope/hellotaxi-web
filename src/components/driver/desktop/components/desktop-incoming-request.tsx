"use client";

import React from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/lib/types";

interface DesktopIncomingRequestProps {
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

export function DesktopIncomingRequest({
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
}: DesktopIncomingRequestProps) {
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-2 border-orange-200 bg-orange-50 animate-pulse">
      <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100 border-b border-orange-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-orange-800">🚗 Nueva Solicitud de Viaje</span>
          </CardTitle>
          <Badge 
            variant="destructive" 
            className="text-lg font-mono bg-red-600 hover:bg-red-700 animate-pulse"
          >
            <Clock className="h-4 w-4 mr-1" />
            {formatTime(requestTimeLeft)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Información del Pasajero */}
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-orange-200">
          <Avatar className="w-16 h-16 border-2 border-orange-300">
            <AvatarImage src={passenger.avatarUrl || undefined} />
            <AvatarFallback className="bg-orange-100 text-orange-700 text-lg font-semibold">
              {passenger.name?.charAt(0) || <UserIcon className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{passenger.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600">
                {passenger.rating ? `${passenger.rating.toFixed(1)} estrellas` : 'Sin calificaciones'}
              </span>
            </div>
          </div>
        </div>

        {/* Detalles del Viaje */}
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
            <MapPin className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 mb-1">Origen</p>
              <p className="text-gray-900">{pickup}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
            <MapPin className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700 mb-1">Destino</p>
              <p className="text-gray-900">{dropoff}</p>
            </div>
          </div>
        </div>

        {/* Tarifa */}
        <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
          <DollarSign className="h-6 w-6 text-green-600 mr-2" />
          <span className="text-2xl font-bold text-green-700">S/ {fare.toFixed(2)}</span>
        </div>

        <Separator />

        {/* Acciones */}
        <div className="space-y-4">
          {isCountering ? (
            // Modo contraoferta
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label htmlFor="counter-offer" className="text-sm font-medium text-blue-800 mb-2 block">
                Ingresa tu contraoferta
              </Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    id="counter-offer"
                    type="number"
                    step="0.50"
                    min="0"
                    placeholder="Ejemplo: 15.00"
                    value={counterOfferAmount || ''}
                    onChange={(e) => onCounterOfferChange(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <Button 
                  onClick={onSubmitCounterOffer}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                  disabled={!counterOfferAmount || parseFloat(counterOfferAmount) <= 0}
                >
                  <CircleDollarSign className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
                <Button 
                  variant="outline"
                  onClick={onCancelCounterOffer}
                  className="border-blue-300"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            // Botones de acción normales
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={onAccept}
                className="bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Aceptar
              </Button>
              
              <Button
                onClick={onStartCounterOffer}
                variant="outline"
                className="border-2 border-blue-300 hover:bg-blue-50 py-6 text-lg font-semibold"
                size="lg"
              >
                <CircleDollarSign className="h-5 w-5 mr-2" />
                Contraoferta
              </Button>
              
              <Button
                onClick={onReject}
                variant="destructive"
                className="py-6 text-lg font-semibold"
                size="lg"
              >
                <X className="h-5 w-5 mr-2" />
                Rechazar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}