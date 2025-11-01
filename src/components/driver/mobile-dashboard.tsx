"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Star } from 'lucide-react';
import MapView from '@/components/map-view';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Chat from '@/components/chat';
import RatingForm from '@/components/rating-form';
import { MobileBottomSheet, useMobileDimensions } from './mobile';
import type { Ride, User as UserType, EnrichedDriver } from '@/lib/types';

interface MobileDriverDashboardProps {
  driver: EnrichedDriver;
  isApproved: boolean;
  hasPermission: boolean;
  audioEnabled: boolean;
  isLoaded: boolean;
  audioPermissionGranted: boolean;
  enableAudio: () => Promise<boolean>;
  rideLocation: any;
  activeRide: any;
  incomingRequest: any;
  requestTimeLeft: number;
  isCountering: boolean;
  counterOfferAmount: string;
  setCounterOfferAmount: (amount: string) => void;
  acceptRequest: () => void;
  rejectRequest: () => void;
  startCounterMode: () => void;
  submitCounterOffer: () => void;
  updateRideStatus: (status: "arrived" | "in-progress" | "completed") => void;
  isCompletingRide: boolean;
  completedRideForRating: any;
  onRatingSubmit: (passengerId: string, rating: number, comment: string) => void;
  isRatingSubmitting: boolean;
  isDriverChatOpen: boolean;
  setIsDriverChatOpen: (open: boolean) => void;
  chatMessages: any[];
  onSendMessage: (message: string) => void;
  toast: any;
  isAvailable: boolean;
  handleAvailabilityChange: (available: boolean) => void;
}

export function MobileDriverDashboard(props: MobileDriverDashboardProps) {
  const {
    driver,
    isApproved,
    rideLocation,
    activeRide,
    incomingRequest,
    requestTimeLeft,
    isCountering,
    counterOfferAmount,
    setCounterOfferAmount,
    acceptRequest,
    rejectRequest,
    startCounterMode,
    submitCounterOffer,
    updateRideStatus,
    isCompletingRide,
    completedRideForRating,
    onRatingSubmit,
    isRatingSubmitting,
    isDriverChatOpen,
    setIsDriverChatOpen,
    chatMessages,
    onSendMessage,
    toast,
    isAvailable,
    handleAvailabilityChange,
    hasPermission,
    audioEnabled,
    enableAudio,
  } = props;

  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const { screenDimensions, getBottomSheetHeight, getMapHeight } = useMobileDimensions();

  // Auto-expandir solo cuando llega una nueva solicitud
  useEffect(() => {
    if (incomingRequest) {
      setIsBottomSheetExpanded(true);
    }
  }, [incomingRequest]);

  // Funciones auxiliares para el manejo de viajes
  const getRideStatus = () => {
    if (!activeRide) return null;
    
    const statusConfig = {
      accepted: { 
        label: "Dirigirse al pasajero", 
        color: "bg-blue-500"
      },
      arrived: { 
        label: "Esperando pasajero", 
        color: "bg-yellow-500"
      },
      "in-progress": { 
        label: "En viaje", 
        color: "bg-green-500"
      },
      completed: { 
        label: "Viaje completado", 
        color: "bg-gray-500"
      }
    };

    return statusConfig[activeRide.status as keyof typeof statusConfig] || null;
  };

  const handleRideAction = () => {
    if (activeRide?.status === 'accepted') {
      updateRideStatus('arrived');
    } else if (activeRide?.status === 'arrived') {
      updateRideStatus('in-progress');
    } else if (activeRide?.status === 'in-progress') {
      updateRideStatus('completed');
    }
  };

  const getActionLabel = () => {
    if (activeRide?.status === 'accepted') return "Confirmar llegada";
    if (activeRide?.status === 'arrived') return "Iniciar viaje";
    if (activeRide?.status === 'in-progress') return "Finalizar viaje";
    return "";
  };

  // Determinar tipo de contenido para calcular alturas
  const getContentType = (): 'panel' | 'request' | 'activeRide' => {
    if (incomingRequest) return 'request';
    if (activeRide) return 'activeRide';
    return 'panel';
  };

  const contentType = getContentType();
  const bottomSheetHeight = getBottomSheetHeight(isBottomSheetExpanded, contentType);
  const mapHeight = getMapHeight(bottomSheetHeight);

  // Estilos dinámicos para el contenedor principal
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f3f4f6',
    overflow: 'hidden'
  };

  const mapContainerStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: mapHeight
  };

  return (
    <div style={containerStyle}>
      {/* Map Container */}
      <div style={mapContainerStyle}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <MapView
            driverLocation={rideLocation}
            pickupLocation={activeRide?.pickupLocation || null}
            dropoffLocation={activeRide?.dropoffLocation || null}
            interactive={false}
            className="w-full h-full"
          />
        </div>
        
        {/* Chat Button (solo si hay viaje activo) */}
        {activeRide && (
          <Sheet open={isDriverChatOpen} onOpenChange={setIsDriverChatOpen}>
            <SheetTrigger asChild>
              <Button 
                size="icon" 
                className="absolute top-20 right-4 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-sm p-0">
              <SheetHeader className="p-4 border-b text-left">
                <SheetTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Chat con {activeRide?.passenger?.name}</span>
                </SheetTitle>
              </SheetHeader>
              <Chat messages={chatMessages} onSendMessage={onSendMessage} />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      <MobileBottomSheet
        isExpanded={isBottomSheetExpanded}
        setIsExpanded={setIsBottomSheetExpanded}
        isAvailable={isAvailable}
        isApproved={isApproved}
        audioEnabled={audioEnabled}
        hasPermission={hasPermission}
        handleAvailabilityChange={handleAvailabilityChange}
        enableAudio={enableAudio}
        toast={toast}
        incomingRequest={incomingRequest}
        requestTimeLeft={requestTimeLeft}
        isCountering={isCountering}
        counterOfferAmount={counterOfferAmount}
        setCounterOfferAmount={setCounterOfferAmount}
        acceptRequest={acceptRequest}
        rejectRequest={rejectRequest}
        startCounterMode={startCounterMode}
        submitCounterOffer={submitCounterOffer}
        activeRide={activeRide}
        isCompletingRide={isCompletingRide}
        handleRideAction={handleRideAction}
        getActionLabel={getActionLabel}
      />

      {/* Rating Modal - Separado del panel principal */}
      {completedRideForRating && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
          padding: '16px'
        }}>
          <Card style={{
            width: '100%',
            maxWidth: '384px',
            background: 'linear-gradient(135deg, white, rgba(242, 242, 242, 0.3), white)',
            border: '2px solid #fbbf24',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <CardContent style={{ padding: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <Star style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #2E4CA6, #0477BF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  Califica al Pasajero
                </h3>
              </div>
              <div style={{
                marginBottom: '16px',
                padding: '16px',
                background: 'linear-gradient(to right, #f9fafb, #f3f4f6)',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  Viaje completado con:
                </p>
                <p style={{ fontWeight: 'bold', color: '#2E4CA6', margin: 0 }}>
                  {completedRideForRating.passenger?.name}
                </p>
              </div>
              <RatingForm
                userToRate={completedRideForRating.passenger}
                isDriver={false}
                onSubmit={(rating, comment) => 
                  onRatingSubmit(completedRideForRating.passenger.id, rating, comment)
                }
                isSubmitting={isRatingSubmitting}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}