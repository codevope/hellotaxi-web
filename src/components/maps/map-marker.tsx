
'use client';

import React from 'react';
import { AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';
import { cn } from '@/lib/utils';
import { Car } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

type MarkerType = 'user' | 'pickup' | 'dropoff' | 'driver' | 'available-driver' | 'custom';

interface MapMarkerProps {
  position: Location;
  type?: MarkerType;
  title?: string;
  showInfoWindow?: boolean;
  onClick?: () => void;
  onInfoWindowClose?: () => void;
  customIcon?: string;
}

const MarkerConfig = {
  user: { color: 'bg-blue-500', borderColor: 'border-blue-700', label: 'Tu ubicación' },
  pickup: { color: 'bg-green-500', borderColor: 'border-green-700', label: 'Punto de recogida' },
  dropoff: { color: 'bg-red-500', borderColor: 'border-red-700', label: 'Destino' },
  driver: { color: 'bg-gray-800', borderColor: 'border-black', label: 'Conductor' },
  'available-driver': { color: 'bg-blue-500', borderColor: 'border-blue-700', label: 'Conductor disponible' },
  custom: { color: 'bg-gray-500', borderColor: 'border-gray-700', label: 'Ubicación' }
};

const MapMarker: React.FC<MapMarkerProps> = ({
  position,
  type = 'custom',
  title,
  showInfoWindow = false,
  onClick,
  onInfoWindowClose,
}) => {
  const config = MarkerConfig[type];
  const shouldAnimate = type === 'user' || type === 'pickup' || type === 'dropoff';

  // Conductor asignado (gris oscuro)
  if (type === 'driver') {
    return (
      <AdvancedMarker
        position={position}
        title={title || config.label}
      >
        <div className="p-1 bg-gray-800 rounded-full shadow-lg border-2 border-white">
          <Car className="w-5 h-5 text-white" />
        </div>
      </AdvancedMarker>
    );
  }

  // Conductores disponibles (azul con animación de pulso)
  if (type === 'available-driver') {
    return (
      <AdvancedMarker
        position={position}
        title={title || config.label}
      >
        <div className="relative">
          {/* Animación de pulso con zoom */}
          <style jsx>{`
            @keyframes pulse-zoom {
              0%, 100% {
                transform: scale(1);
                opacity: 1;
              }
              50% {
                transform: scale(1.3);
                opacity: 0.8;
              }
            }
            .animate-pulse-zoom {
              animation: pulse-zoom 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          `}</style>
          <div className="p-1.5 bg-blue-500 rounded-full shadow-lg border-2 border-white animate-pulse-zoom">
            <Car className="w-4 h-4 text-white" />
          </div>
        </div>
      </AdvancedMarker>
    );
  }

  return (
    <>
      <AdvancedMarker
        position={position}
        onClick={onClick}
        title={title}
      >
        <div className={cn(
            'w-4 h-4 rounded-full border-2',
             config.color,
             config.borderColor,
             shouldAnimate && 'animate-pulse'
        )}>
             <div className="w-full h-full rounded-full bg-white/50 transform scale-[0.4]"></div>
        </div>
      </AdvancedMarker>
      
      {showInfoWindow && (
        <InfoWindow
          position={position}
          onCloseClick={onInfoWindowClose}
          pixelOffset={[0, -20]}
        >
          <div className="p-2 min-w-[200px] text-black">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className={cn('w-3 h-3 rounded-full', config.color)}
              ></div>
              <span className="font-medium text-sm">
                {title || config.label}
              </span>
            </div>
            
            {position.address ? (
              <p className="text-sm text-gray-600">{position.address}</p>
            ) : (
              <p className="text-xs text-gray-500">
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default MapMarker;
