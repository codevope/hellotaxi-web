"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronUp, 
  ChevronDown, 
  User, 
  MapPin, 
  Clock, 
  DollarSign,
  Phone,
  MessageCircle,
  CheckCircle,
  X,
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileIncomingRequest } from './mobile-incoming-request';
import { MobileActiveRide } from './mobile-active-ride';
import { useDriverRideLogic } from '@/hooks/driver/use-driver-ride-logic';
import type { EnrichedDriver } from '@/lib/types';

interface MobileDriverBottomSheetProps {
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  driver: EnrichedDriver;
  logic: ReturnType<typeof useDriverRideLogic>;
  onChatOpen: () => void;
}

/**
 * Bottom Sheet móvil inteligente para conductores
 *
 * Características:
 * - Altura adaptativa (colapsado/expandido/completo)
 * - Contenido dinámico según el estado
 * - Swipe gestures para expandir/colapsar
 * - Solicitudes entrantes con controles táctiles
 * - Viajes activos con navegación
 * - Estado de disponibilidad
 * - Chat integrado
 */
export function MobileDriverBottomSheet({
  isExpanded,
  onExpandedChange,
  driver,
  logic,
  onChatOpen
}: MobileDriverBottomSheetProps) {
  const [dragStartY, setDragStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Determinar qué mostrar en el bottom sheet
  const getSheetContent = () => {
    console.log('🔍 [BOTTOM-SHEET] Determinando contenido:', {
      hasIncomingRequest: !!logic.incomingRequest,
      hasActiveRide: !!logic.activeRide,
      isAvailable: logic.isAvailable
    });
    
    // Prioridad 1: Solicitud entrante
    if (logic.incomingRequest) {
      return {
        type: 'incoming-request',
        title: 'Nueva Solicitud de Viaje',
        priority: 'high'
      };
    }

    // Prioridad 2: Viaje activo
    if (logic.activeRide) {
      return {
        type: 'active-ride', 
        title: 'Viaje en Curso',
        priority: 'high'
      };
    }

    // Prioridad 3: Estado disponible
    if (logic.isAvailable) {
      return {
        type: 'available',
        title: 'Disponible para Viajes',
        priority: 'normal'
      };
    }

    // Estado offline
    return {
      type: 'offline',
      title: 'Desconectado',
      priority: 'low'
    };
  };

  const sheetContent = getSheetContent();

  // Altura del bottom sheet según el contenido
  const getSheetHeight = () => {
    if (!isExpanded) {
      return sheetContent.priority === 'high' ? '140px' : '80px';
    }

    switch (sheetContent.type) {
      case 'incoming-request':
      case 'active-ride':
        return '70vh';
      case 'available':
        return '30vh';
      case 'offline':
        return '20vh';
      default:
        return '30vh';
    }
  };

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const diffY = dragStartY - currentY;

    // Swipe hacia arriba para expandir
    if (diffY > 50 && !isExpanded) {
      onExpandedChange(true);
      setIsDragging(false);
    }
    // Swipe hacia abajo para colapsar
    else if (diffY < -50 && isExpanded) {
      onExpandedChange(false);
      setIsDragging(false);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Renderizar contenido según el tipo
  const renderContent = () => {
    switch (sheetContent.type) {
      case 'incoming-request':
        return (
          <MobileIncomingRequest
            request={logic.incomingRequest!}
            logic={logic}
            isExpanded={isExpanded}
          />
        );

      case 'active-ride':
        return (
          <MobileActiveRide
            ride={logic.activeRide!}
            logic={logic}
            onChatOpen={onChatOpen}
            isExpanded={isExpanded}
          />
        );

      case 'available':
        return (
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-semibold text-green-700">En línea y disponible</span>
            </div>
            <p className="text-sm text-gray-600">
              Buscando pasajeros cerca de tu ubicación...
            </p>
            
            {isExpanded && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rating:</span>
                    <Badge variant="secondary">
                      ⭐ {driver.rating?.toFixed(1) || '5.0'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Viajes hoy:</span>
                    <span className="text-sm text-gray-600">
                      {logic.rideHistory?.filter(ride => {
                        const today = new Date().toDateString();
                        return new Date(ride.createdAt.toDate()).toDateString() === today;
                      }).length || 0}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'offline':
        return (
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-3 w-3 bg-gray-400 rounded-full" />
              <span className="font-semibold text-gray-700">Desconectado</span>
            </div>
            <p className="text-sm text-gray-600">
              Activa tu disponibilidad para recibir viajes
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "mobile-driver-bottom-sheet fixed bottom-0 left-0 right-0 z-40",
        "bg-white rounded-t-xl shadow-lg border-t transition-all duration-300",
        sheetContent.priority === 'high' && "border-t-2 border-t-blue-500"
      )}
      style={{ height: getSheetHeight() }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag handle */}
      <div 
        className="flex items-center justify-center py-2 cursor-pointer"
        onClick={() => onExpandedChange(!isExpanded)}
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full" />
      </div>

      {/* Header con título */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="font-semibold text-gray-900">
          {sheetContent.title}
        </h3>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onExpandedChange(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}