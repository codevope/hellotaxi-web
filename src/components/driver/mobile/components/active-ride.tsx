"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, MapPin, DollarSign, Navigation, Clock, CheckCircle } from 'lucide-react';
import { ScreenConfig } from '../hooks/use-mobile-dimensions';

interface ActiveRideProps {
  isExpanded: boolean;
  activeRide: any;
  isCompletingRide: boolean;
  screenConfig: ScreenConfig;
  handleRideAction: () => void;
  getActionLabel: () => string;
}

export function ActiveRide({
  isExpanded,
  activeRide,
  isCompletingRide,
  screenConfig,
  handleRideAction,
  getActionLabel
}: ActiveRideProps) {
  
  // Configuración del estado del viaje
  const getRideStatus = () => {
    if (!activeRide) return null;
    
    const statusConfig = {
      accepted: { 
        label: "Dirigirse al pasajero", 
        color: "#3b82f6",
        icon: <Navigation style={{ width: screenConfig.iconSize, height: screenConfig.iconSize }} />
      },
      arrived: { 
        label: "Esperando pasajero", 
        color: "#eab308",
        icon: <Clock style={{ width: screenConfig.iconSize, height: screenConfig.iconSize }} />
      },
      "in-progress": { 
        label: "En viaje", 
        color: "#10b981",
        icon: <Navigation style={{ width: screenConfig.iconSize, height: screenConfig.iconSize }} />
      },
      completed: { 
        label: "Viaje completado", 
        color: "#6b7280",
        icon: <CheckCircle style={{ width: screenConfig.iconSize, height: screenConfig.iconSize }} />
      }
    };

    return statusConfig[activeRide.status as keyof typeof statusConfig] || null;
  };

  const rideStatus = getRideStatus();
  
  if (isExpanded) {
    // Vista expandida completa
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: screenConfig.spacing }}>
        <Card style={{
          background: 'linear-gradient(135deg, white, rgba(242, 242, 242, 0.2), white)',
          border: '2px solid rgba(5, 199, 242, 0.3)',
          boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent style={{ padding: screenConfig.cardPadding }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: screenConfig.spacing
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #2E4CA6, #0477BF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                🚗 Viaje Actual
              </h3>
              {rideStatus && (
                <Badge style={{
                  background: rideStatus.color,
                  color: 'white',
                  fontSize: screenConfig.buttonFontSize,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {rideStatus.icon}
                  <span>{rideStatus.label}</span>
                </Badge>
              )}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: screenConfig.spacing,
              marginBottom: screenConfig.cardPadding
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: screenConfig.spacing }}>
                <User style={{ width: screenConfig.iconSize, height: screenConfig.iconSize }} />
                <span style={{ fontSize: screenConfig.buttonFontSize, fontWeight: 'bold' }}>
                  {activeRide.passenger?.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: screenConfig.spacing }}>
                <MapPin style={{ width: screenConfig.iconSize, height: screenConfig.iconSize, color: '#10b981' }} />
                <span style={{ fontSize: screenConfig.buttonFontSize }}>{activeRide.pickup}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: screenConfig.spacing }}>
                <MapPin style={{ width: screenConfig.iconSize, height: screenConfig.iconSize, color: '#ef4444' }} />
                <span style={{ fontSize: screenConfig.buttonFontSize }}>{activeRide.dropoff}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: screenConfig.spacing }}>
                <DollarSign style={{ width: screenConfig.iconSize, height: screenConfig.iconSize, color: '#059669' }} />
                <span style={{ fontSize: screenConfig.buttonFontSize, fontWeight: 'bold' }}>
                  S/ {activeRide.fare?.toFixed(2)}
                </span>
              </div>
            </div>

            {activeRide.status !== 'completed' && (
              <Button 
                onClick={handleRideAction} 
                disabled={isCompletingRide}
                style={{
                  width: '100%',
                  height: screenConfig.buttonHeight,
                  fontSize: screenConfig.buttonFontSize,
                  background: 'linear-gradient(to right, #05C7F2, #049DD9)',
                  color: 'white',
                  border: 'none'
                }}
              >
                {isCompletingRide ? '⏳ Procesando...' : `🚀 ${getActionLabel()}`}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista minimizada compacta
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: screenConfig.spacing }}>
      {/* Estado del viaje */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: screenConfig.spacing }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: rideStatus?.color || '#10b981'
          }}></div>
          <span style={{ fontSize: screenConfig.buttonFontSize, fontWeight: 'bold' }}>
            Viaje en curso
          </span>
        </div>
        <Badge style={{
          background: rideStatus?.color || '#10b981',
          color: 'white',
          fontSize: '10px'
        }}>
          {activeRide.status === 'accepted' ? 'Dirigirse' : 
           activeRide.status === 'arrived' ? 'Esperando' :
           activeRide.status === 'in-progress' ? 'En viaje' : 'Activo'}
        </Badge>
      </div>

      {/* Información básica del viaje */}
      <div style={{
        background: '#f9fafb',
        borderRadius: '8px',
        padding: screenConfig.spacing,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px'
        }}>
          <span style={{ color: '#6b7280' }}>Pasajero:</span>
          <span style={{ fontWeight: 'bold', color: '#374151' }}>
            {activeRide.passenger?.name}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px'
        }}>
          <span style={{ color: '#6b7280' }}>Tarifa:</span>
          <span style={{ fontWeight: 'bold', color: '#059669' }}>
            S/ {activeRide.fare?.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Botón de acción compacto */}
      {activeRide.status !== 'completed' && (
        <Button 
          onClick={handleRideAction} 
          disabled={isCompletingRide}
          style={{
            width: '100%',
            height: '32px',
            fontSize: '10px',
            background: 'linear-gradient(to right, #05C7F2, #049DD9)',
            color: 'white',
            border: 'none'
          }}
        >
          {isCompletingRide ? '⏳' : `🚀 ${getActionLabel()}`}
        </Button>
      )}
    </div>
  );
}