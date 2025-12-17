

'use client';

import React, { useState, useEffect, Children, isValidElement } from 'react';
import { useGeolocation } from '@/hooks/geolocation/use-geolocation';
import type { Ride, Location, EnrichedDriver, Driver } from '@/lib/types';
import {
  GoogleMapsProvider,
  InteractiveMap,
  MapMarker,
  RouteDisplay,
} from '.';
import { GeocodingService } from '@/services/geocoding-service';
import { useToast } from '@/hooks/use-toast';
import { getSettings } from '@/services/settings-service';

interface MapViewProps {
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff') => void;
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  driverLocation?: Location | null;
  availableDrivers?: (EnrichedDriver | Driver)[];
  className?: string;
  height?: string;
  interactive?: boolean;
  children?: React.ReactNode;
  mapCenter?: Location;
}

const MapView: React.FC<MapViewProps> & { Marker: typeof MapMarker } = ({
  onLocationSelect,
  pickupLocation,
  dropoffLocation,
  driverLocation,
  availableDrivers = [],
  className = '',
  height = '100%',
  interactive = true,
  children,
  mapCenter: initialMapCenter
}) => {
  const { location: userLocation, requestLocation, loading } = useGeolocation();
  const { toast } = useToast();
  
  const [mapCenter, setMapCenter] = useState<Location>({ lat: -6.7713, lng: -79.8442 }); // Temporal default
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Cargar coordenadas desde Firebase
  useEffect(() => {
    const loadMapCenter = async () => {
      try {
        const settings = await getSettings();
        const defaultCenter = {
          lat: settings.mapCenterLat,
          lng: settings.mapCenterLng,
        };
        
        if (!initialMapCenter && !userLocation) {
          setMapCenter(defaultCenter);
        }
      } catch (error) {
        console.error('Error loading map center from settings:', error);
      }
    };
    
    loadMapCenter();
  }, []);

  useEffect(() => {
    // SOLO pedir ubicación si es interactivo y no tenemos ubicación del usuario
    // Para admin (non-interactive), usar mapCenter de Firebase settings
    if (initialMapCenter) {
      setMapCenter(initialMapCenter);
    } else if (interactive && !userLocation && !loading) {
      // Solo pedir ubicación si es un mapa interactivo (rider, driver, etc)
      requestLocation();
    } else if (userLocation) {
      setMapCenter({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });
    }
  }, [userLocation, loading, requestLocation, initialMapCenter, interactive]);

  useEffect(() => {
    if(pickupLocation && !dropoffLocation) {
        setMapCenter(pickupLocation);
    } else if (dropoffLocation) {
        setMapCenter(dropoffLocation);
    }
  }, [pickupLocation, dropoffLocation]);


  const userPos: Location | undefined = userLocation ? {
    lat: userLocation.latitude,
    lng: userLocation.longitude,
    address: 'Tu ubicación actual'
  } : undefined;

  const handleMapClick = async (location: Location) => {
    if (!interactive || !onLocationSelect) return;

    try {
        const geocodedAddress = await GeocodingService.reverseGeocode(location.lat, location.lng);
        const mapLocation = {
            lat: location.lat,
            lng: location.lng,
            address: geocodedAddress,
        };

        if (!pickupLocation) {
            onLocationSelect(mapLocation, 'pickup');
        } else if (!dropoffLocation) {
            onLocationSelect(mapLocation, 'dropoff');
        } else {
             onLocationSelect(mapLocation, 'pickup');
        }

    } catch (error) {
        console.error("Error en geocodificación inversa:", error);
        toast({
            variant: "destructive",
            title: "Error de ubicación",
            description: "No se pudo obtener la dirección para el punto seleccionado.",
        });
        
        const fallbackLocation = {
          lat: location.lat,
          lng: location.lng,
          address: `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
        };

        if (!pickupLocation) {
            onLocationSelect(fallbackLocation, 'pickup');
        } else if (!dropoffLocation) {
            onLocationSelect(fallbackLocation, 'dropoff');
        }
    }
  };

  const handleMarkerClick = (type: string) => {
    setSelectedMarker(selectedMarker === type ? null : type);
  };
  
  return (
    <GoogleMapsProvider>
      <div className={`relative ${className}`} style={{ minHeight: height }}>
        <InteractiveMap
          center={mapCenter}
          height={height}
          zoom={14}
          onMapClick={interactive ? handleMapClick : undefined}
        >
          {userPos && (
            <MapMarker
              position={userPos}
              type="user"
              showInfoWindow={selectedMarker === 'user'}
              onClick={() => handleMarkerClick('user')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

          {pickupLocation && (
            <MapMarker
              position={pickupLocation}
              type="pickup"
              showInfoWindow={selectedMarker === 'pickup'}
              onClick={() => handleMarkerClick('pickup')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

          {dropoffLocation && (
            <MapMarker
              position={dropoffLocation}
              type="dropoff"
              showInfoWindow={selectedMarker === 'dropoff'}
              onClick={() => handleMarkerClick('dropoff')}
              onInfoWindowClose={() => setSelectedMarker(null)}
            />
          )}

           {driverLocation && (
            <MapMarker
              position={driverLocation}
              type="driver"
              title="Conductor"
            />
          )}

          {/* 🚗 Mostrar conductores disponibles (solo si no hay conductor asignado) */}
          {!driverLocation && availableDrivers.map((driver) => {
            if (!driver.location) return null;
            const driverName = 'name' in driver ? driver.name : 'Conductor';
            return (
              <MapMarker
                key={driver.id}
                position={driver.location}
                type="available-driver"
                title={driverName}
              />
            );
          })}

          {pickupLocation && dropoffLocation && (
            <RouteDisplay
              origin={pickupLocation}
              destination={dropoffLocation}
            />
          )}

          {Children.map(children, (child) => {
              if (isValidElement(child)) {
                  // This allows passing Marker components as children
                  return React.cloneElement(child);
              }
              return null;
          })}

        </InteractiveMap>
      </div>
    </GoogleMapsProvider>
  );
};


MapView.Marker = MapMarker;

export default MapView;
