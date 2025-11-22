"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX, 
  Signal,
  SignalZero,
  User,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnrichedDriver } from '@/lib/types';

interface MobileDriverHeaderProps {
  driver: EnrichedDriver;
  isAvailable: boolean;
  onAvailabilityToggle: () => void;
  hasNotifications: boolean;
  audioEnabled: boolean;
  onEnableAudio: () => void;
}

/**
 * Header móvil optimizado para conductores
 *
 * Características:
 * - Switch de disponibilidad prominente
 * - Estado visual claro (online/offline)
 * - Control de notificaciones
 * - Control de audio
 * - Avatar del conductor
 * - Rating y estado de verificación
 */
export function MobileDriverHeader({
  driver,
  isAvailable,
  onAvailabilityToggle,
  hasNotifications,
  audioEnabled,
  onEnableAudio
}: MobileDriverHeaderProps) {
  
  const getStatusColor = () => {
    if (!isAvailable) return 'bg-gray-500';
    return hasNotifications ? 'bg-green-500 animate-pulse' : 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isAvailable) return 'Desconectado';
    if (hasNotifications) return 'Solicitud activa';
    return 'Disponible';
  };

  return (
    <header className="mobile-driver-header sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="flex items-center justify-between p-4">
        
        {/* Avatar y info del conductor */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-gray-200">
              <AvatarImage 
                src={driver.profileImage || '/images/default-driver.jpg'} 
                alt={driver.name} 
              />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            {/* Indicador de estado */}
            <div 
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                getStatusColor()
              )}
            />
          </div>
          
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-gray-900">
              {driver.name}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-600">
                  {driver.rating?.toFixed(1) || '5.0'}
                </span>
              </div>
              {driver.documentsStatus === 'approved' && (
                <Badge variant="secondary" className="text-xs py-0">
                  Verificado
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Controles principales */}
        <div className="flex items-center gap-3">
          
          {/* Control de audio */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={onEnableAudio}
          >
            {audioEnabled ? (
              <Volume2 className="h-5 w-5 text-green-600" />
            ) : (
              <VolumeX className="h-5 w-5 text-gray-400" />
            )}
          </Button>

          {/* Switch de disponibilidad */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-gray-700">
                {getStatusText()}
              </span>
              <div className="flex items-center gap-1">
                {isAvailable ? (
                  <Signal className="h-3 w-3 text-green-600" />
                ) : (
                  <SignalZero className="h-3 w-3 text-gray-400" />
                )}
                <Switch
                  checked={isAvailable}
                  onCheckedChange={onAvailabilityToggle}
                  className="scale-90"
                />
              </div>
            </div>
          </div>

          {/* Indicador de notificaciones */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 relative"
          >
            {hasNotifications ? (
              <>
                <Bell className="h-5 w-5 text-amber-600" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
              </>
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Barra de estado expandida cuando está disponible */}
      {isAvailable && (
        <div className={cn(
          "px-4 py-2 text-center text-sm font-medium",
          hasNotifications 
            ? "bg-green-50 text-green-800 border-t border-green-200" 
            : "bg-blue-50 text-blue-800 border-t border-blue-200"
        )}>
          {hasNotifications 
            ? "🚖 Tienes solicitudes pendientes" 
            : "🔍 Buscando pasajeros cercanos..."}
        </div>
      )}
    </header>
  );
}