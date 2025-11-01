"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Power, Volume2, VolumeX, Bell } from 'lucide-react';
import { ScreenConfig } from '../hooks/use-mobile-dimensions';

interface ControlPanelProps {
  isExpanded: boolean;
  isAvailable: boolean;
  isApproved: boolean;
  audioEnabled: boolean;
  hasPermission: boolean;
  screenConfig: ScreenConfig;
  handleAvailabilityChange: (available: boolean) => void;
  enableAudio: () => Promise<boolean>;
  toast?: any;
}

export function ControlPanel({
  isExpanded,
  isAvailable,
  isApproved,
  audioEnabled,
  hasPermission,
  screenConfig,
  handleAvailabilityChange,
  enableAudio,
  toast
}: ControlPanelProps) {
  
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
                🚗 Estado del Conductor
              </h3>
              <Badge style={{
                background: isAvailable && isApproved 
                  ? 'linear-gradient(to right, #05C7F2, #049DD9)' 
                  : '#e5e7eb',
                color: isAvailable && isApproved ? 'white' : '#6b7280',
                fontSize: screenConfig.buttonFontSize
              }}>
                {isAvailable && isApproved ? 'En línea' : 'Fuera de línea'}
              </Badge>
            </div>

            {/* Status Display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: screenConfig.spacing,
              marginBottom: screenConfig.spacing,
              padding: screenConfig.cardPadding,
              background: 'linear-gradient(to right, #f9fafb, #f3f4f6)',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                width: screenConfig.iconSize,
                height: screenConfig.iconSize,
                borderRadius: '50%',
                background: isAvailable && isApproved 
                  ? 'linear-gradient(to right, #05C7F2, #049DD9)' 
                  : '#9ca3af'
              }}></div>
              <span style={{
                fontWeight: 'bold',
                color: '#2E4CA6',
                fontSize: screenConfig.buttonFontSize
              }}>
                {isAvailable && isApproved ? 'Disponible para solicitudes' : 
                 !isApproved ? 'Documentos pendientes' : 'No disponible'}
              </span>
            </div>

            {/* Controls */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: screenConfig.spacing
            }}>
              {/* Availability Toggle */}
              <Button
                variant={isAvailable ? "default" : "outline"}
                onClick={() => handleAvailabilityChange(!isAvailable)}
                disabled={!isApproved}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  height: `calc(${screenConfig.buttonHeight} * 1.8)`,
                  fontSize: screenConfig.buttonFontSize,
                  background: !isApproved 
                    ? '#d1d5db' 
                    : isAvailable 
                    ? 'linear-gradient(135deg, #2E4CA6, #0477BF, #049DD9)' 
                    : 'linear-gradient(135deg, white, #F2F2F2)',
                  color: !isApproved 
                    ? '#6b7280' 
                    : isAvailable 
                    ? 'white' 
                    : '#2E4CA6',
                  border: isAvailable ? 'none' : '2px solid #F2F2F2',
                  cursor: !isApproved ? 'not-allowed' : 'pointer'
                }}
              >
                <div style={{
                  width: `calc(${screenConfig.iconSize} * 1.5)`,
                  height: `calc(${screenConfig.iconSize} * 1.5)`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isAvailable ? 'rgba(255, 255, 255, 0.2)' : 'linear-gradient(135deg, #F2F2F2, white)'
                }}>
                  <Power style={{ width: screenConfig.iconSize, height: screenConfig.iconSize }} />
                </div>
                <span style={{ fontSize: screenConfig.buttonFontSize, fontWeight: 'bold' }}>
                  {isAvailable ? 'En línea' : 'Conectar'}
                </span>
              </Button>

              {/* Sound Toggle */}
              <Button
                variant={audioEnabled ? "default" : "outline"}
                onClick={async () => {
                  const enabled = await enableAudio();
                  if (enabled && toast) {
                    toast({
                      title: 'Sonido habilitado',
                      description: 'Ahora recibirás alertas de audio.',
                      duration: 3000,
                      className: 'border-l-4 border-l-[#05C7F2]',
                    });
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  height: `calc(${screenConfig.buttonHeight} * 1.8)`,
                  fontSize: screenConfig.buttonFontSize,
                  background: audioEnabled 
                    ? 'linear-gradient(135deg, #0477BF, #049DD9, #05C7F2)' 
                    : 'linear-gradient(135deg, white, #F2F2F2)',
                  color: audioEnabled ? 'white' : '#2E4CA6',
                  border: audioEnabled ? 'none' : '2px solid #F2F2F2'
                }}
              >
                <div style={{
                  width: `calc(${screenConfig.iconSize} * 1.5)`,
                  height: `calc(${screenConfig.iconSize} * 1.5)`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: audioEnabled ? 'rgba(255, 255, 255, 0.2)' : 'linear-gradient(135deg, #F2F2F2, white)'
                }}>
                  {audioEnabled ? (
                    <Volume2 style={{ width: screenConfig.iconSize, height: screenConfig.iconSize }} />
                  ) : (
                    <VolumeX style={{ width: screenConfig.iconSize, height: screenConfig.iconSize }} />
                  )}
                </div>
                <span style={{ fontSize: screenConfig.buttonFontSize, fontWeight: 'bold' }}>
                  {audioEnabled ? 'Activo' : 'Sonido'}
                </span>
              </Button>

              {/* Notifications */}
              <Button
                variant={hasPermission ? "default" : "outline"}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  height: `calc(${screenConfig.buttonHeight} * 1.8)`,
                  fontSize: screenConfig.buttonFontSize,
                  background: hasPermission 
                    ? 'linear-gradient(135deg, #049DD9, #05C7F2, white)' 
                    : 'linear-gradient(135deg, white, #F2F2F2)',
                  color: hasPermission ? 'white' : '#2E4CA6',
                  border: hasPermission ? 'none' : '2px solid #F2F2F2'
                }}
              >
                <div style={{
                  width: `calc(${screenConfig.iconSize} * 1.5)`,
                  height: `calc(${screenConfig.iconSize} * 1.5)`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: hasPermission ? 'rgba(255, 255, 255, 0.2)' : 'linear-gradient(135deg, #F2F2F2, white)'
                }}>
                  <Bell style={{ width: screenConfig.iconSize, height: screenConfig.iconSize }} />
                </div>
                <span style={{ fontSize: screenConfig.buttonFontSize, fontWeight: 'bold' }}>
                  {hasPermission ? 'Activas' : 'Alertas'}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista minimizada compacta
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: screenConfig.spacing }}>
      {/* Estado básico */}
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
            background: isAvailable && isApproved ? '#05C7F2' : '#9ca3af'
          }}></div>
          <span style={{ fontSize: screenConfig.buttonFontSize, fontWeight: 'bold' }}>
            {isAvailable && isApproved ? 'Disponible' : 'No Disponible'}
          </span>
        </div>
        <Badge style={{
          fontSize: screenConfig.buttonFontSize,
          background: isAvailable && isApproved 
            ? 'linear-gradient(to right, #05C7F2, #049DD9)' 
            : '#e5e7eb',
          color: isAvailable && isApproved ? 'white' : '#6b7280'
        }}>
          {isAvailable && isApproved ? 'En línea' : 'Fuera de línea'}
        </Badge>
      </div>

      {/* Controles básicos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px'
      }}>
        <Button
          variant={isAvailable ? "default" : "outline"}
          onClick={() => handleAvailabilityChange(!isAvailable)}
          disabled={!isApproved}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            height: screenConfig.buttonHeight,
            fontSize: screenConfig.buttonFontSize,
            background: !isApproved 
              ? '#d1d5db' 
              : isAvailable 
              ? 'linear-gradient(135deg, #2E4CA6, #0477BF, #049DD9)' 
              : 'white',
            color: !isApproved 
              ? '#6b7280' 
              : isAvailable 
              ? 'white' 
              : '#2E4CA6',
            border: isAvailable ? 'none' : '2px solid #F2F2F2'
          }}
        >
          <Power style={{ width: '12px', height: '12px' }} />
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>
            {isAvailable ? 'ON' : 'OFF'}
          </span>
        </Button>
        
        <Button
          variant={audioEnabled ? "default" : "outline"}
          onClick={enableAudio}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            height: screenConfig.buttonHeight,
            fontSize: screenConfig.buttonFontSize,
            background: audioEnabled 
              ? 'linear-gradient(135deg, #0477BF, #049DD9, #05C7F2)' 
              : 'white',
            color: audioEnabled ? 'white' : '#2E4CA6',
            border: audioEnabled ? 'none' : '2px solid #F2F2F2'
          }}
        >
          {audioEnabled ? (
            <Volume2 style={{ width: '12px', height: '12px' }} />
          ) : (
            <VolumeX style={{ width: '12px', height: '12px' }} />
          )}
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>
            {audioEnabled ? 'ON' : 'OFF'}
          </span>
        </Button>

        <Button
          variant={hasPermission ? "default" : "outline"}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            height: screenConfig.buttonHeight,
            fontSize: screenConfig.buttonFontSize,
            background: hasPermission 
              ? 'linear-gradient(135deg, #049DD9, #05C7F2, white)' 
              : 'white',
            color: hasPermission ? 'white' : '#2E4CA6',
            border: hasPermission ? 'none' : '2px solid #F2F2F2'
          }}
        >
          <Bell style={{ width: '12px', height: '12px' }} />
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>
            {hasPermission ? 'ON' : 'OFF'}
          </span>
        </Button>
      </div>
    </div>
  );
}