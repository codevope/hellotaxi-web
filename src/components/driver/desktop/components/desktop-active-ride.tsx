"use client";

import React from 'react';
import { 
  Car, 
  Star, 
  DollarSign, 
  MapPin, 
  Clock, 
  Navigation,
  Phone,
  MessageSquare,
  User as UserIcon,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { User } from "@/lib/types";

interface DesktopActiveRideProps {
  passenger: User;
  pickup: string;
  dropoff: string;
  fare: number;
  status: 'en_camino' | 'esperando' | 'viajando' | 'llegando';
  arrivalTime?: string;
  estimatedDuration?: number;
  distanceRemaining?: number;
  onCompleteRide: () => void;
  onCallPassenger: () => void;
  onMessagePassenger: () => void;
  onNavigate: () => void;
}

export function DesktopActiveRide({
  passenger,
  pickup,
  dropoff,
  fare,
  status,
  arrivalTime,
  estimatedDuration,
  distanceRemaining,
  onCompleteRide,
  onCallPassenger,
  onMessagePassenger,
  onNavigate,
}: DesktopActiveRideProps) {
  
  const getStatusInfo = () => {
    switch (status) {
      case 'en_camino':
        return {
          title: '🚗 En camino al origen',
          description: 'Dirigiéndote hacia el pasajero',
          color: 'blue',
          progress: 25,
        };
      case 'esperando':
        return {
          title: '⏱️ Esperando al pasajero',
          description: 'Has llegado al punto de recogida',
          color: 'yellow',
          progress: 50,
        };
      case 'viajando':
        return {
          title: '🎯 Viaje en progreso',
          description: 'Llevando al pasajero a su destino',
          color: 'green',
          progress: 75,
        };
      case 'llegando':
        return {
          title: '🏁 Llegando al destino',
          description: 'Casi has llegado al destino',
          color: 'purple',
          progress: 95,
        };
      default:
        return {
          title: '🚗 Viaje activo',
          description: 'Viaje en progreso',
          color: 'gray',
          progress: 50,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="border-2 border-green-200 bg-green-50">
      <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 border-b border-green-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-green-800">{statusInfo.title}</span>
              <CardDescription className="text-green-700 mt-1">
                {statusInfo.description}
              </CardDescription>
            </div>
          </CardTitle>
          <Badge className={`text-lg font-semibold bg-${statusInfo.color}-600 hover:bg-${statusInfo.color}-700`}>
            <DollarSign className="h-4 w-4 mr-1" />
            S/ {fare.toFixed(2)}
          </Badge>
        </div>
        
        {/* Barra de progreso */}
        <div className="mt-4">
          <Progress value={statusInfo.progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Información del Pasajero */}
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-green-200">
          <Avatar className="w-16 h-16 border-2 border-green-300">
            <AvatarImage src={passenger.avatarUrl || undefined} />
            <AvatarFallback className="bg-green-100 text-green-700 text-lg font-semibold">
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
          
          {/* Botones de comunicación */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCallPassenger}
              className="border-green-300 hover:bg-green-50"
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onMessagePassenger}
              className="border-green-300 hover:bg-green-50"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Información de tiempo y distancia */}
        {(arrivalTime || estimatedDuration || distanceRemaining) && (
          <div className="grid grid-cols-3 gap-4">
            {arrivalTime && (
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Llegada estimada</p>
                <p className="font-semibold text-gray-900">{arrivalTime}</p>
              </div>
            )}
            {estimatedDuration && (
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <Navigation className="h-5 w-5 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Duración</p>
                <p className="font-semibold text-gray-900">{estimatedDuration} min</p>
              </div>
            )}
            {distanceRemaining && (
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <MapPin className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Distancia</p>
                <p className="font-semibold text-gray-900">{distanceRemaining.toFixed(1)} km</p>
              </div>
            )}
          </div>
        )}

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

        <Separator />

        {/* Acciones */}
        <div className="flex gap-4">
          <Button
            onClick={onNavigate}
            variant="outline"
            className="flex-1 border-2 border-blue-300 hover:bg-blue-50 py-6 text-lg font-semibold"
            size="lg"
          >
            <Navigation className="h-5 w-5 mr-2" />
            Navegar
          </Button>

          {status === 'viajando' || status === 'llegando' ? (
            <Button
              onClick={onCompleteRide}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Completar Viaje
            </Button>
          ) : (
            <Button
              disabled
              variant="outline"
              className="flex-1 py-6 text-lg font-semibold opacity-50"
              size="lg"
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              Esperando...
            </Button>
          )}
        </div>

        {/* Mensaje de estado específico */}
        {status === 'esperando' && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 font-medium">
                Has llegado al punto de recogida. El pasajero será notificado.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}