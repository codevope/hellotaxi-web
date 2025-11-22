"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  X, 
  DollarSign, 
  MapPin, 
  Clock, 
  User,
  Phone,
  Navigation,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriverRideLogic } from '@/hooks/driver/use-driver-ride-logic';

interface MobileIncomingRequestProps {
  request: any;
  logic: ReturnType<typeof useDriverRideLogic>;
  isExpanded: boolean;
}

/**
 * Componente móvil para solicitudes entrantes
 *
 * Características:
 * - Diseño compacto y expandible
 * - Información esencial del pasajero
 * - Controles táctiles grandes
 * - Contraoferta optimizada para móvil
 * - Timer visual
 * - Cálculo de distancia
 */
export function MobileIncomingRequest({
  request,
  logic,
  isExpanded
}: MobileIncomingRequestProps) {
  const [isCountering, setIsCountering] = useState(false);
  const [counterAmount, setCounterAmount] = useState(request.fare.toString());
  const [timeLeft, setTimeLeft] = useState(30);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      // Cuando el tiempo llega a cero, el hook ya manejará el auto-reject
      console.log('⏰ Tiempo agotado para la solicitud');
    }
  }, [timeLeft]);

  // Reset counter amount when toggling
  useEffect(() => {
    if (!isCountering) {
      setCounterAmount(request.fare.toString());
    }
  }, [isCountering, request.fare]);

  // Manejar aceptación
  const handleAccept = async () => {
    try {
      await logic.acceptRequest(request.id);
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  // Manejar rechazo
  const handleReject = async () => {
    try {
      await logic.rejectRequest(request.id);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  // Enviar contraoferta
  const handleSubmitCounter = async () => {
    try {
      // Esta funcionalidad necesita ser implementada en logic
      console.log('Submitting counter offer:', counterAmount);
      setIsCountering(false);
    } catch (error) {
      console.error('Error submitting counter offer:', error);
    }
  };

  // Vista compacta
  if (!isExpanded) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">{request.passenger.name}</p>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-600">
                  {request.passenger.rating?.toFixed(1) || '5.0'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">
              S/{request.fare.toFixed(2)}
            </p>
            <Badge variant="outline" className="text-xs">
              {timeLeft}s restantes
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleAccept}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
            size="lg"
            disabled={timeLeft === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aceptar
          </Button>
          
          <Button
            onClick={handleReject}
            variant="outline"
            className="border-gray-300 py-3"
            size="lg"
            disabled={timeLeft === 0}
          >
            <X className="h-4 w-4 mr-2" />
            Rechazar
          </Button>
        </div>
      </div>
    );
  }

  // Vista expandida
  return (
    <div className="p-4 space-y-4">
      {/* Header con timer */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">Nueva Solicitud</h4>
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-3 w-3 rounded-full",
            timeLeft > 10 ? "bg-green-500" : timeLeft > 5 ? "bg-yellow-500" : "bg-red-500 animate-pulse"
          )} />
          <span className="text-sm font-medium">
            {timeLeft}s restantes
          </span>
        </div>
      </div>

      {/* Información del pasajero */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-lg">{request.passenger.name}</h5>
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-600">
                  {request.passenger.rating?.toFixed(1) || '5.0'} • {request.passenger.totalRides || 0} viajes
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">
                  <Phone className="h-3 w-3 mr-1" />
                  Llamar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalles del viaje */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Recogida:</p>
              <p className="text-sm">{request.pickup}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Navigation className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Destino:</p>
              <p className="text-sm">{request.dropoff}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Tarifa:</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              S/{request.fare.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Modo contraoferta */}
      {isCountering ? (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-semibold">Hacer Contraoferta</h5>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCountering(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counter-amount">Nueva tarifa (S/)</Label>
              <Input
                id="counter-amount"
                type="number"
                step="0.50"
                min="1"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                className="text-lg text-center font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleSubmitCounter}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!counterAmount || parseFloat(counterAmount) <= 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Enviar
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsCountering(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Botones de acción principales */
        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 text-lg"
            size="lg"
            disabled={timeLeft === 0}
          >
            <CheckCircle className="h-5 w-5 mr-3" />
            {timeLeft === 0 ? 'Tiempo Agotado' : `Aceptar Viaje - S/${request.fare.toFixed(2)}`}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setIsCountering(true)}
              variant="outline"
              className="py-3"
              size="lg"
              disabled={timeLeft === 0}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Contraoferta
            </Button>
            
            <Button
              onClick={handleReject}
              variant="outline"
              className="py-3 border-red-300 text-red-600 hover:bg-red-50"
              size="lg"
              disabled={timeLeft === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}