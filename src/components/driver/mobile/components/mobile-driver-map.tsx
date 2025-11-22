"use client";

import { useState, useEffect } from 'react';
import MapView from '@/components/maps/map-view';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  MapPin, 
  Target, 
  Crosshair,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnrichedDriver } from '@/lib/types';

interface MobileDriverMapProps {
  driverLocation: any;
  pickupLocation?: any;
  dropoffLocation?: any;
  isAvailable: boolean;
  driver: EnrichedDriver;
}

/**
 * Componente de mapa optimizado para móvil
 *
 * Características:
 * - Mapa a pantalla completa
 * - Botones flotantes para controles
 * - Centrado automático en conductor
 * - Indicadores de pickup/dropoff
 * - Controles de navegación táctiles
 * - Vista adaptativa según el estado
 */
export function MobileDriverMap({
  driverLocation,
  pickupLocation,
  dropoffLocation,
  isAvailable,
  driver
}: MobileDriverMapProps) {
  const [mapCenter, setMapCenter] = useState(driverLocation);
  const [isFollowingDriver, setIsFollowingDriver] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);

  // Seguir la ubicación del conductor automáticamente
  useEffect(() => {
    if (isFollowingDriver && driverLocation) {
      setMapCenter(driverLocation);
    }
  }, [driverLocation, isFollowingDriver]);

  // Centrar mapa en conductor
  const handleCenterOnDriver = () => {
    if (driverLocation) {
      setMapCenter(driverLocation);
      setIsFollowingDriver(true);
    }
  };

  // Centrar en pickup location
  const handleCenterOnPickup = () => {
    if (pickupLocation) {
      setMapCenter(pickupLocation);
      setIsFollowingDriver(false);
    }
  };

  // Centrar en dropoff location
  const handleCenterOnDestination = () => {
    if (dropoffLocation) {
      setMapCenter(dropoffLocation);
      setIsFollowingDriver(false);
    }
  };

  return (
    <div className="mobile-driver-map relative h-full w-full">
      {/* Mapa principal */}
      <MapView
        center={mapCenter}
        driverLocation={driverLocation}
        pickupLocation={pickupLocation}
        dropoffLocation={dropoffLocation}
        interactive={true}
        showTraffic={showTraffic}
        className="h-full w-full"
        onMapMove={() => setIsFollowingDriver(false)}
      />

      {/* Estado del conductor en mapa */}
      <div className="absolute top-4 left-4 z-10">
        <Badge 
          variant={isAvailable ? "default" : "secondary"}
          className={cn(
            "flex items-center gap-2 px-3 py-2 shadow-lg",
            isAvailable 
              ? "bg-green-600 text-white" 
              : "bg-gray-600 text-white"
          )}
        >
          <div className={cn(
            "h-2 w-2 rounded-full",
            isAvailable ? "bg-green-300 animate-pulse" : "bg-gray-300"
          )} />
          {isAvailable ? "En línea" : "Desconectado"}
        </Badge>
      </div>

      {/* Controles flotantes del mapa */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        
        {/* Toggle de tráfico */}
        <Button
          variant={showTraffic ? "default" : "secondary"}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-white text-gray-700 hover:bg-gray-100"
          onClick={() => setShowTraffic(!showTraffic)}
        >
          {showTraffic ? (
            <Eye className="h-5 w-5" />
          ) : (
            <EyeOff className="h-5 w-5" />
          )}
        </Button>

        {/* Centrar en conductor */}
        <Button
          variant={isFollowingDriver ? "default" : "secondary"}
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full shadow-lg",
            isFollowingDriver 
              ? "bg-blue-600 text-white" 
              : "bg-white text-gray-700 hover:bg-gray-100"
          )}
          onClick={handleCenterOnDriver}
        >
          <Navigation className="h-5 w-5" />
        </Button>
      </div>

      {/* Controles de navegación de viaje */}
      {(pickupLocation || dropoffLocation) && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex justify-center gap-3">
            
            {/* Botón para centrar en pickup */}
            {pickupLocation && (
              <Button
                variant="outline"
                size="sm"
                className="bg-white/95 backdrop-blur-sm shadow-lg flex items-center gap-2"
                onClick={handleCenterOnPickup}
              >
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium">Recogida</span>
              </Button>
            )}

            {/* Botón para centrar en destino */}
            {dropoffLocation && (
              <Button
                variant="outline"
                size="sm"
                className="bg-white/95 backdrop-blur-sm shadow-lg flex items-center gap-2"
                onClick={handleCenterOnDestination}
              >
                <Target className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium">Destino</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Crosshair para ubicación exacta */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <Crosshair className="h-6 w-6 text-blue-600 drop-shadow-lg" />
      </div>
    </div>
  );
}