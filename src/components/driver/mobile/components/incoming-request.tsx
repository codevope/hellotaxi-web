"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, DollarSign } from 'lucide-react';
import { CounterOfferSelector } from '@/components/forms/counter-offer-selector';
import { ScreenConfig } from '@/hooks/driver/use-mobile-dimensions';

interface IncomingRequestProps {
  isExpanded: boolean;
  incomingRequest: any;
  requestTimeLeft: number;
  isCountering: boolean;
  counterOfferAmount: string;
  screenConfig: ScreenConfig;
  setCounterOfferAmount: (amount: string) => void;
  acceptRequest: () => void;
  rejectRequest: () => void;
  startCounterMode: () => void;
  submitCounterOffer: () => void;
}

export function IncomingRequest({
  isExpanded,
  incomingRequest,
  requestTimeLeft,
  isCountering,
  counterOfferAmount,
  screenConfig,
  setCounterOfferAmount,
  acceptRequest,
  rejectRequest,
  startCounterMode,
  submitCounterOffer
}: IncomingRequestProps) {
  
  if (isExpanded) {
    // Vista expandida completa
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: screenConfig.spacing }}>
        <Card style={{
          border: '2px solid #05C7F2',
          animation: 'pulse 2s infinite',
          background: 'linear-gradient(to right, white, rgba(5, 199, 242, 0.05), white)',
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
                🚖 Nueva Solicitud
              </h3>
              <Badge style={{
                background: 'linear-gradient(to right, #ef4444, #dc2626)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: screenConfig.buttonFontSize
              }}>
                {Math.floor(requestTimeLeft / 60)}:{(requestTimeLeft % 60).toString().padStart(2, '0')}
              </Badge>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: screenConfig.spacing,
              marginBottom: screenConfig.cardPadding
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: screenConfig.spacing }}>
                <MapPin style={{ width: screenConfig.iconSize, height: screenConfig.iconSize, color: '#10b981' }} />
                <span style={{ fontSize: screenConfig.buttonFontSize }}>{incomingRequest.pickup}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: screenConfig.spacing }}>
                <MapPin style={{ width: screenConfig.iconSize, height: screenConfig.iconSize, color: '#ef4444' }} />
                <span style={{ fontSize: screenConfig.buttonFontSize }}>{incomingRequest.dropoff}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: screenConfig.spacing }}>
                <DollarSign style={{ width: screenConfig.iconSize, height: screenConfig.iconSize, color: '#059669' }} />
                <span style={{ fontSize: screenConfig.buttonFontSize, fontWeight: 'bold' }}>
                  S/ {incomingRequest.fare?.toFixed(2)}
                </span>
              </div>
            </div>

            {isCountering ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: screenConfig.spacing }}>
                <div style={{ marginBottom: screenConfig.spacing }}>
                  <CounterOfferSelector
                    originalFare={incomingRequest.fare}
                    onPriceChange={(newPrice) => setCounterOfferAmount(newPrice.toFixed(2))}
                    disabled={false}
                    maxIncrease={25}
                    maxDecrease={10}
                    step={0.50}
                  />
                </div>
                <div style={{ display: 'flex', gap: screenConfig.spacing }}>
                  <Button 
                    onClick={submitCounterOffer}
                    style={{
                      flex: 1,
                      height: screenConfig.buttonHeight,
                      fontSize: screenConfig.buttonFontSize,
                      background: 'linear-gradient(to right, #0477BF, #049DD9)',
                      color: 'white'
                    }}
                  >
                    Enviar Contraoferta
                  </Button>
                  <Button 
                    onClick={rejectRequest}
                    variant="outline"
                    style={{
                      height: screenConfig.buttonHeight,
                      fontSize: screenConfig.buttonFontSize
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: screenConfig.spacing }}>
                <Button 
                  onClick={acceptRequest}
                  style={{
                    flex: 1,
                    height: screenConfig.buttonHeight,
                    fontSize: screenConfig.buttonFontSize,
                    background: 'linear-gradient(to right, #059669, #047857)',
                    color: 'white'
                  }}
                >
                  ✅ Aceptar
                </Button>
                <Button 
                  onClick={startCounterMode}
                  style={{
                    height: screenConfig.buttonHeight,
                    fontSize: screenConfig.buttonFontSize,
                    background: 'linear-gradient(to right, #0477BF, #049DD9)',
                    color: 'white'
                  }}
                >
                  💰 Contraoferta
                </Button>
                <Button 
                  onClick={rejectRequest}
                  style={{
                    height: screenConfig.buttonHeight,
                    fontSize: screenConfig.buttonFontSize,
                    background: 'linear-gradient(to right, #dc2626, #b91c1c)',
                    color: 'white'
                  }}
                >
                  ❌ Rechazar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista minimizada compacta
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: screenConfig.spacing }}>
      {/* Estado de la solicitud */}
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
            background: '#05C7F2',
            animation: 'pulse 2s infinite'
          }}></div>
          <span style={{ fontSize: screenConfig.buttonFontSize, fontWeight: 'bold' }}>
            Nueva Solicitud
          </span>
        </div>
        <Badge style={{
          background: 'linear-gradient(to right, #ef4444, #dc2626)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '10px'
        }}>
          {Math.floor(requestTimeLeft / 60)}:{(requestTimeLeft % 60).toString().padStart(2, '0')}
        </Badge>
      </div>

      {/* Información básica de la solicitud */}
      <div style={{
        background: 'linear-gradient(to right, rgba(5, 199, 242, 0.05), white)',
        borderRadius: '8px',
        padding: screenConfig.spacing,
        border: '1px solid rgba(5, 199, 242, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          marginBottom: '4px'
        }}>
          <span style={{ color: '#6b7280' }}>Tarifa:</span>
          <span style={{ fontWeight: 'bold', color: '#059669' }}>
            S/ {incomingRequest.fare?.toFixed(2)}
          </span>
        </div>
        <div style={{
          fontSize: '10px',
          color: '#374151',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          📍 {incomingRequest.pickup}
        </div>
      </div>

      {/* Botones de acción compactos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px'
      }}>
        <Button 
          onClick={acceptRequest}
          style={{
            height: '32px',
            fontSize: '10px',
            background: 'linear-gradient(to right, #059669, #047857)',
            color: 'white',
            border: 'none'
          }}
        >
          ✅
        </Button>
        <Button 
          onClick={startCounterMode}
          style={{
            height: '32px',
            fontSize: '10px',
            background: 'linear-gradient(to right, #0477BF, #049DD9)',
            color: 'white',
            border: 'none'
          }}
        >
          💰
        </Button>
        <Button 
          onClick={rejectRequest}
          style={{
            height: '32px',
            fontSize: '10px',
            background: 'linear-gradient(to right, #dc2626, #b91c1c)',
            color: 'white',
            border: 'none'
          }}
        >
          ❌
        </Button>
      </div>
    </div>
  );
}