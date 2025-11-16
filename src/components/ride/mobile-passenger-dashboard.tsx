"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MapView from '@/components/maps/map-view';
import RideRequestForm from '@/components/forms/ride-request-form';
import { SearchingRideStatus } from '@/components/ride/searching-ride-status';
import { AssignedDriverCard } from '@/components/ride/assigned-driver-card';
import { CounterOfferCard } from '@/components/ride/counter-offer-card';
import StartNow from '@/components/ride/start-now';
import { 
  MessageCircle, 
  Siren,
  Bot,
  Clock,
  Star,
  Shield
} from 'lucide-react';
import type { Ride, DriverWithVehicleInfo, User } from '@/lib/types';

interface MobilePassengerDashboardProps {
  user: User;
  currentRide: Ride | null;
  assignedDriver: DriverWithVehicleInfo | null;
  counterOffer: any;
  isSearching: boolean;
  searchStartTime: Date | null;
  pickupLocation: any;
  dropoffLocation: any;
  rideLocation: any;
  chatMessages: any[];
  onSendMessage: (text: string) => void;
  onCancelRide: () => void;
  onAcceptCounterOffer: () => void;
  onRejectCounterOffer: () => void;
  onSos: () => void;
  isPassengerChatOpen: boolean;
  setIsPassengerChatOpen: (open: boolean) => void;
  isSupportChatOpen: boolean;
  setIsSupportChatOpen: (open: boolean) => void;
  completedRideForRating: any;
  onRatingSubmit: (rating: number, comment: string) => void;
  isRatingSubmitting: boolean;
}

export function MobilePassengerDashboard(props: MobilePassengerDashboardProps) {
  const {
    user,
    currentRide,
    assignedDriver,
    counterOffer,
    isSearching,
    searchStartTime,
    pickupLocation,
    dropoffLocation,
    rideLocation,
    chatMessages,
    onSendMessage,
    onCancelRide,
    onAcceptCounterOffer,
    onRejectCounterOffer,
    onSos,
    isPassengerChatOpen,
    setIsPassengerChatOpen,
    isSupportChatOpen,
    setIsSupportChatOpen,
    completedRideForRating,
    onRatingSubmit,
    isRatingSubmitting
  } = props;

  const getRideStatus = () => {
    if (!currentRide) return null;
    
    const statusConfig = {
      searching: { label: "Buscando conductor", color: "bg-yellow-500" },
      accepted: { label: "Conductor asignado", color: "bg-blue-500" },
      arrived: { label: "Conductor ha llegado", color: "bg-green-500" },
      "in-progress": { label: "En viaje", color: "bg-purple-500" },
      completed: { label: "Viaje completado", color: "bg-gray-500" },
      cancelled: { label: "Viaje cancelado", color: "bg-red-500" },
      "counter-offered": { label: "Contraoferta recibida", color: "bg-orange-500" }
    };

    return statusConfig[currentRide.status] || null;
  };

  const rideStatus = getRideStatus();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Status Bar */}
      {rideStatus && (
        <div className={`${rideStatus.color} text-white px-4 py-3 text-center`}>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="font-medium text-sm">{rideStatus.label}</span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative flex-1 min-h-0">
        <MapView
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          driverLocation={rideLocation}
          interactive={true}
          className="h-full w-full"
        />
        
        {/* Floating Action Buttons */}
        {currentRide && (
          <>
            {/* SOS Button */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-4 right-4 h-12 w-12 rounded-full shadow-lg z-10"
              onClick={onSos}
            >
              <Siren className="h-6 w-6" />
            </Button>

            {/* Chat with Driver Button */}
            {assignedDriver && (
              <Button 
                size="icon" 
                className="absolute bottom-20 right-4 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-10"
                onClick={() => setIsPassengerChatOpen(true)}
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            )}

            {/* Support Chat Button */}
            <Button 
              size="icon" 
              variant="outline"
              className="absolute bottom-20 left-4 h-12 w-12 rounded-full shadow-lg bg-white z-10"
              onClick={() => setIsSupportChatOpen(true)}
            >
              <Bot className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Bottom Content Panel */}
      <div className="bg-white border-t shadow-lg max-h-80 overflow-y-auto">
        {!currentRide && (
          <div className="p-4">
            <RideRequestForm onRideCreated={() => {}} />
          </div>
        )}

        {isSearching && (
          <div className="p-4">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  <span>Buscando conductor...</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Estamos conectándote con el conductor más cercano
                </p>
                <Button variant="outline" onClick={onCancelRide} className="w-full">
                  Cancelar búsqueda
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {currentRide?.status === 'counter-offered' && counterOffer && (
          <div className="p-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Contraoferta recibida</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Precio original:</span>
                    <Badge variant="outline">S/ {currentRide.fare.toFixed(2)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Contraoferta:</span>
                    <Badge>S/ {counterOffer.amount?.toFixed(2) || 0}</Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={onAcceptCounterOffer} className="flex-1">
                      Aceptar
                    </Button>
                    <Button variant="outline" onClick={onRejectCounterOffer} className="flex-1">
                      Rechazar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {assignedDriver && ['accepted', 'arrived', 'in-progress'].includes(currentRide?.status || '') && (
          <div className="p-4">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {assignedDriver.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{assignedDriver.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{assignedDriver.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    S/ {currentRide?.fare.toFixed(2)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vehículo:</span>
                    <span>{assignedDriver.vehicleBrand} {assignedDriver.vehicleModel}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Placa:</span>
                    <span className="font-mono">{assignedDriver.licensePlate}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsPassengerChatOpen(true)}
                      className="flex-1"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                    <Button variant="outline" onClick={onCancelRide} className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentRide?.status === 'completed' && !completedRideForRating && (
          <div className="p-4 text-center">
            <div className="inline-flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
              <Shield className="h-5 w-5" />
              <span className="font-medium">¡Viaje completado con éxito!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}