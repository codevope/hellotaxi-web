"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useMobileDimensions } from '@/hooks/driver/use-mobile-dimensions';
import { ControlPanel } from './control-panel';
import { IncomingRequest } from './incoming-request';
import { ActiveRide } from './active-ride';

interface MobileBottomSheetProps {
  // Estado del bottom sheet
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  
  // Estado del conductor
  isAvailable: boolean;
  isApproved: boolean;
  audioEnabled: boolean;
  hasPermission: boolean;
  handleAvailabilityChange: (available: boolean) => void;
  enableAudio: () => Promise<boolean>;
  toast?: any;
  
  // Solicitud entrante
  incomingRequest?: any;
  requestTimeLeft: number;
  isCountering: boolean;
  counterOfferAmount: string;
  setCounterOfferAmount: (amount: string) => void;
  acceptRequest: () => void;
  rejectRequest: () => void;
  startCounterMode: () => void;
  submitCounterOffer: () => void;
  
  // Viaje activo
  activeRide?: any;
  isCompletingRide: boolean;
  handleRideAction: () => void;
  getActionLabel: () => string;
}

export function MobileBottomSheet(props: MobileBottomSheetProps) {
  const {
    isExpanded,
    setIsExpanded,
    isAvailable,
    isApproved,
    audioEnabled,
    hasPermission,
    handleAvailabilityChange,
    enableAudio,
    toast,
    incomingRequest,
    requestTimeLeft,
    isCountering,
    counterOfferAmount,
    setCounterOfferAmount,
    acceptRequest,
    rejectRequest,
    startCounterMode,
    submitCounterOffer,
    activeRide,
    isCompletingRide,
    handleRideAction,
    getActionLabel
  } = props;

  const { screenDimensions, screenConfig, getBottomSheetHeight } = useMobileDimensions();

  // Determinar el tipo de contenido actual
  const getContentType = (): 'panel' | 'request' | 'activeRide' => {
    if (incomingRequest) return 'request';
    if (activeRide) return 'activeRide';
    return 'panel';
  };

  const contentType = getContentType();
  const bottomSheetHeight = getBottomSheetHeight(isExpanded, contentType);

  // Obtener el título del header
  const getHeaderTitle = (): string => {
    if (incomingRequest) return 'Nueva Solicitud';
    if (activeRide) return 'Viaje en Curso';
    return 'Panel de Control';
  };

  // Calcular padding dinámico
  const getPadding = () => {
    const { width, height } = screenDimensions;
    const isExtraSmall = width <= 360 && height <= 640;
    const isSmall = width <= 375 && height <= 667;
    
    if (isExtraSmall) return '12px';
    if (isSmall) return '14px';
    return '16px';
  };

  // Calcular tamaño de fuente del título
  const getTitleFontSize = () => {
    const { width, height } = screenDimensions;
    const isExtraSmall = width <= 360 && height <= 640;
    const isSmall = width <= 375 && height <= 667;
    
    if (isExtraSmall) return isExpanded ? '16px' : '14px';
    if (isSmall) return isExpanded ? '17px' : '15px';
    return isExpanded ? '18px' : '16px';
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(to top, white, rgba(242, 242, 242, 0.3), white)',
      borderTopLeftRadius: '24px',
      borderTopRightRadius: '24px',
      boxShadow: '0 -8px 25px -5px rgba(0, 0, 0, 0.1), 0 -10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: 'all 0.3s ease-in-out',
      zIndex: 30,
      borderTop: '2px solid rgba(5, 199, 242, 0.2)',
      height: bottomSheetHeight
    }}>
      {/* Drag Indicator */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          cursor: 'pointer',
          paddingTop: isExpanded ? '12px' : '8px',
          paddingBottom: isExpanded ? '8px' : '4px'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{
          width: '40px',
          height: '4px',
          backgroundColor: '#d1d5db',
          borderRadius: '9999px'
        }}></div>
      </div>

      {/* Content Container */}
      <div style={{
        paddingLeft: getPadding(),
        paddingRight: getPadding(),
        paddingBottom: isExpanded ? '16px' : '8px',
        height: 'calc(100% - 40px)',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isExpanded ? '12px' : '8px'
        }}>
          <h2 style={{
            fontWeight: 'bold',
            fontSize: getTitleFontSize(),
            margin: 0
          }}>
            {getHeaderTitle()}
          </h2>
          
          {/* Botón de expansión */}
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Content based on current state */}
        {incomingRequest ? (
          <IncomingRequest
            isExpanded={isExpanded}
            incomingRequest={incomingRequest}
            requestTimeLeft={requestTimeLeft}
            isCountering={isCountering}
            counterOfferAmount={counterOfferAmount}
            screenConfig={screenConfig}
            setCounterOfferAmount={setCounterOfferAmount}
            acceptRequest={acceptRequest}
            rejectRequest={rejectRequest}
            startCounterMode={startCounterMode}
            submitCounterOffer={submitCounterOffer}
          />
        ) : activeRide ? (
          <ActiveRide
            isExpanded={isExpanded}
            activeRide={activeRide}
            isCompletingRide={isCompletingRide}
            screenConfig={screenConfig}
            handleRideAction={handleRideAction}
            getActionLabel={getActionLabel}
          />
        ) : (
          <ControlPanel
            isExpanded={isExpanded}
            isAvailable={isAvailable}
            isApproved={isApproved}
            audioEnabled={audioEnabled}
            hasPermission={hasPermission}
            screenConfig={screenConfig}
            handleAvailabilityChange={handleAvailabilityChange}
            enableAudio={enableAudio}
            toast={toast}
          />
        )}
      </div>
    </div>
  );
}