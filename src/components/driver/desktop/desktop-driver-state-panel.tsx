"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Car, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Chat from '@/components/chat';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DesktopIncomingRequest } from './components/desktop-incoming-request';
import { DesktopActiveRide } from './components/desktop-active-ride';
import { DesktopRatingModal } from './components/desktop-rating-modal';
import type { User } from '@/lib/types';
import type { EnrichedRide } from '@/hooks/driver/use-driver-active-ride';

interface DesktopDriverStatePanelProps {
  incomingRequest: any | null;
  requestTimeLeft: number;
  isCountering: boolean;
  counterOfferAmount: string;
  setCounterOfferAmount: (n: string) => void;
  acceptRequest: () => void;
  rejectRequest: () => void;
  startCounterMode: () => void;
  submitCounterOffer: () => void;
  activeRide: EnrichedRide | null;
  updateRideStatus: (status: 'arrived' | 'in-progress' | 'completed') => void;
  isCompletingRide: boolean;
  completedRideForRating: EnrichedRide | null;
  onRatingSubmit: (id: string, rating: number, comment: string) => void;
  isRatingSubmitting: boolean;
  isDriverChatOpen: boolean;
  setIsDriverChatOpen: (o: boolean) => void;
  chatMessages: any[];
  onSendMessage: (text: string) => void;
  passengerNameForChat?: string;
}

export function DesktopDriverStatePanel(props: DesktopDriverStatePanelProps) {
  const {
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
    updateRideStatus,
    isCompletingRide,
    completedRideForRating,
    onRatingSubmit,
    isRatingSubmitting,
    isDriverChatOpen,
    setIsDriverChatOpen,
    chatMessages,
    onSendMessage,
    passengerNameForChat,
  } = props;

  // Mapear el estado del activeRide a los estados del componente desktop
  const mapRideStatusToDesktopStatus = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'en_camino' as const;
      case 'arrived':
        return 'esperando' as const;
      case 'in-progress':
        return 'viajando' as const;
      default:
        return 'en_camino' as const;
    }
  };

  // Renderizar solicitud entrante
  if (incomingRequest) {
    return (
      <div className="space-y-4">
        <DesktopIncomingRequest
          passenger={incomingRequest.passenger}
          pickup={incomingRequest.pickup}
          dropoff={incomingRequest.dropoff}
          fare={incomingRequest.fare}
          requestTimeLeft={requestTimeLeft}
          isCountering={isCountering}
          counterOfferAmount={counterOfferAmount}
          onCounterOfferChange={setCounterOfferAmount}
          onAccept={acceptRequest}
          onReject={rejectRequest}
          onStartCounterOffer={startCounterMode}
          onSubmitCounterOffer={submitCounterOffer}
          onCancelCounterOffer={() => setCounterOfferAmount('0')}
        />
      </div>
    );
  }

  // Renderizar viaje activo
  if (activeRide) {
    return (
      <>
        <div className="space-y-4">
          <DesktopActiveRide
            passenger={activeRide.passenger}
            pickup={activeRide.pickup}
            dropoff={activeRide.dropoff}
            fare={activeRide.fare}
            status={mapRideStatusToDesktopStatus(activeRide.status)}
            onCompleteRide={() => updateRideStatus('completed')}
            onCallPassenger={() => {
              // Implementar lógica de llamada
              console.log('Calling passenger');
            }}
            onMessagePassenger={() => setIsDriverChatOpen(true)}
            onNavigate={() => {
              // Implementar lógica de navegación
              console.log('Navigate to destination');
            }}
          />
        </div>

        {/* Chat flotante */}
        <Sheet open={isDriverChatOpen} onOpenChange={setIsDriverChatOpen}>
          <SheetTrigger asChild>
            <Button 
              size="icon" 
              className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
            >
              <MessageCircle className="h-7 w-7" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-sm p-0">
            <SheetHeader className="p-4 border-b text-left">
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span>Chat con {passengerNameForChat}</span>
              </SheetTitle>
            </SheetHeader>
            <Chat messages={chatMessages} onSendMessage={onSendMessage} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <>
      {/* Estado de espera */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <span>Esperando Solicitudes</span>
          </CardTitle>
        </CardHeader>
        <CardDescription className="px-6 pb-6">
          <Alert>
            <Car className="h-4 w-4" />
            <AlertTitle>No hay solicitudes pendientes</AlertTitle>
            <AlertDescription>
              Cuando un pasajero solicite un viaje, aparecerá aquí. Asegúrate de que tu estado esté en "Disponible" para recibir solicitudes.
            </AlertDescription>
          </Alert>
        </CardDescription>
      </Card>

      {/* Modal de calificación */}
      <DesktopRatingModal
        isOpen={!!completedRideForRating}
        passenger={completedRideForRating?.passenger || {} as User}
        fare={completedRideForRating?.fare || 0}
        onClose={() => {
          // Esta función debería ser pasada como prop para limpiar el completedRideForRating
          console.log('Closing rating modal');
        }}
        onSubmitRating={(rating, comment) => {
          if (completedRideForRating) {
            onRatingSubmit(completedRideForRating.passenger.id, rating, comment);
          }
        }}
      />
    </>
  );
}