"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Navigation, 
  MapPin, 
  Target, 
  User, 
  Phone, 
  MessageCircle, 
  CheckCircle,
  Clock,
  DollarSign,
  Star,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriverRideLogic } from '@/hooks/driver/use-driver-ride-logic';

interface MobileActiveRideProps {
  ride: any;
  logic: ReturnType<typeof useDriverRideLogic>;
  onChatOpen: () => void;
  isExpanded: boolean;
}

/**
 * Componente móvil para viajes activos
 *
 * Características:
 * - Estados visuales claros (accepted, arrived, in-progress, completed)
 * - Progreso del viaje con indicadores
 * - Botones de acción grandes y táctiles
 * - Información del pasajero
 * - Controles de navegación
 * - Chat integrado
 * - Actualizaciones de estado fluidas
 */
export function MobileActiveRide({
  ride,
  logic,
  onChatOpen,
  isExpanded
}: MobileActiveRideProps) {

  // Configuración de estados
  const getStatusConfig = () => {
    switch (ride.status) {
      case 'accepted':
        return {
          label: 'Dirigirse al Pasajero',
          color: 'bg-blue-500',
          progress: 25,
          nextAction: { 
            label: 'He llegado', 
            action: () => logic.updateRideStatus?.(ride, 'arrived'),
            variant: 'default' as const
          }
        };
      case 'arrived':
        return {
          label: 'Esperando Pasajero',
          color: 'bg-yellow-500',
          progress: 50,
          nextAction: { 
            label: 'Iniciar Viaje', 
            action: () => logic.updateRideStatus?.(ride, 'in-progress'),
            variant: 'default' as const
          }
        };
      case 'in-progress':
        return {
          label: 'Viaje en Progreso',
          color: 'bg-green-500',
          progress: 75,
          nextAction: { 
            label: 'Finalizar Viaje', 
            action: () => logic.updateRideStatus?.(ride, 'completed'),
            variant: 'default' as const
          }
        };
      default:
        return {
          label: 'Estado Desconocido',
          color: 'bg-gray-500',
          progress: 0,
          nextAction: null
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Vista compacta
  if (!isExpanded) {
    return (
      <div className="p-4 space-y-3">
        {/* Status y progreso */}
        <div className="flex items-center justify-between">
          <Badge className={cn("text-white", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
          <span className="text-lg font-bold text-green-600">
            S/{ride.fare.toFixed(2)}
          </span>
        </div>

        <Progress value={statusConfig.progress} className="h-2" />

        {/* Info básica */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{ride.passenger.name}</p>
            <p className="text-xs text-gray-600 truncate">
              {ride.status === 'accepted' ? ride.pickup : ride.dropoff}
            </p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={onChatOpen}>
              <MessageCircle className="h-4 w-4" />
            </Button>
            {statusConfig.nextAction && (
              <Button 
                size="sm" 
                onClick={statusConfig.nextAction.action}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista expandida
  return (
    <div className="p-4 space-y-4">
      {/* Header con estado */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">Viaje Activo</h4>
        <Badge className={cn("text-white px-3 py-1", statusConfig.color)}>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Progreso del viaje */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progreso del viaje</span>
          <span>{statusConfig.progress}%</span>
        </div>
        <Progress value={statusConfig.progress} className="h-3" />
        
        {/* Indicadores de etapas */}
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span className={ride.status !== 'accepted' ? "text-green-600 font-medium" : ""}>
            Aceptado
          </span>
          <span className={['arrived', 'in-progress'].includes(ride.status) ? "text-green-600 font-medium" : ""}>
            Llegada
          </span>
          <span className={ride.status === 'in-progress' ? "text-green-600 font-medium" : ""}>
            En Curso
          </span>
          <span className={ride.status === 'completed' ? "text-green-600 font-medium" : ""}>
            Finalizado
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
              <h5 className="font-semibold text-lg">{ride.passenger.name}</h5>
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-600">
                  {ride.passenger.rating?.toFixed(1) || '5.0'} • {ride.passenger.totalRides || 0} viajes
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Phone className="h-3 w-3 mr-1" />
                  Llamar
                </Button>
                <Button variant="outline" size="sm" onClick={onChatOpen}>
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Chat
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ruta del viaje */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Pickup */}
          <div className="flex items-start gap-3">
            <div className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center mt-0.5",
              ride.status === 'accepted' ? "bg-blue-500" : "bg-green-500"
            )}>
              {ride.status === 'accepted' ? (
                <Navigation className="h-3 w-3 text-white" />
              ) : (
                <CheckCircle className="h-3 w-3 text-white" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                {ride.status === 'accepted' ? 'Ir a recoger:' : 'Recogida completada:'}
              </p>
              <p className="text-sm">{ride.pickup}</p>
            </div>
          </div>

          {/* Línea conectora */}
          <div className="ml-3 border-l-2 border-dashed border-gray-300 h-4" />

          {/* Dropoff */}
          <div className="flex items-start gap-3">
            <div className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center mt-0.5",
              ride.status === 'in-progress' ? "bg-red-500" : "bg-gray-300"
            )}>
              <Target className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Destino:</p>
              <p className="text-sm">{ride.dropoff}</p>
            </div>
          </div>

          <Separator />

          {/* Información de tarifa */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Tarifa total:</span>
            </div>
            <span className="text-xl font-bold text-green-600">
              S/{ride.fare.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Botón de acción principal */}
      {statusConfig.nextAction && (
        <Button
          onClick={statusConfig.nextAction.action}
          className="w-full py-4 text-lg font-semibold"
          size="lg"
        >
          <CheckCircle className="h-5 w-5 mr-3" />
          {statusConfig.nextAction.label}
        </Button>
      )}

      {/* Botones de navegación */}
      {ride.status !== 'completed' && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg">
            <Navigation className="h-4 w-4 mr-2" />
            Google Maps
          </Button>
          
          <Button variant="outline" size="lg" onClick={onChatOpen}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat Pasajero
          </Button>
        </div>
      )}
    </div>
  );
}