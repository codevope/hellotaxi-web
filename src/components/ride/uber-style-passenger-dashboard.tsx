"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MapView from '@/components/maps/map-view';
import RideRequestForm from '@/components/forms/ride-request-form';
import { 
  MessageCircle, 
  Siren,
  Star,
  Phone,
  Navigation,
  Clock,
  DollarSign,
  User,
  ChevronUp,
  ChevronDown,
  Home,
  Building2,
  Car,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { Ride, DriverWithVehicleInfo, User as UserType } from '@/lib/types';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Chat from '@/components/chat/chat';
import RatingForm from '@/components/forms/rating-form';


interface UberStylePassengerDashboardProps {
  user: UserType;
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
  isPassengerChatOpen: boolean;
  setIsPassengerChatOpen: (open: boolean) => void;

  completedRideForRating: any;
  onRatingSubmit: (rating: number, comment: string) => void;
  isRatingSubmitting: boolean;
}

export function UberStylePassengerDashboard(props: UberStylePassengerDashboardProps) {
  const {
    currentRide,
    assignedDriver,
    counterOffer,
    isSearching,
    pickupLocation,
    dropoffLocation,
    rideLocation,
    chatMessages,
    onSendMessage,
    onCancelRide,
    onAcceptCounterOffer,
    onRejectCounterOffer,
    isPassengerChatOpen,
    setIsPassengerChatOpen,
    completedRideForRating,
    onRatingSubmit,
    isRatingSubmitting,
  } = props;

  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(true);

  // Debug para verificar estado del chat
  useEffect(() => {
    console.log('🔍 UberStylePassengerDashboard props:', {
      assignedDriver: !!assignedDriver,
      assignedDriverName: assignedDriver?.name,
      currentRideStatus: currentRide?.status,
      shouldShowChat: assignedDriver && ['accepted', 'arrived', 'in-progress'].includes(currentRide?.status || ''),
      allValidStatuses: ['accepted', 'arrived', 'in-progress'],
      statusIncludes: currentRide?.status ? ['accepted', 'arrived', 'in-progress'].includes(currentRide.status) : false
    });
  }, [assignedDriver, currentRide?.status]);

  // Auto-expand bottom sheet when no ride is active, but allow manual control
  useEffect(() => {
    if (!currentRide) {
      setIsBottomSheetExpanded(true);
    }
  }, [currentRide]);

  const getRideStatus = () => {
    if (!currentRide) return null;
    
    const statusConfig = {
      searching: { 
        label: "Buscando conductor cercano...", 
        color: "bg-blue-500",
        bgColor: "bg-gradient-to-r from-gray-50 to-white",
        textColor: "text-[#2E4CA6]",
        icon: <Clock className="h-4 w-4" />
      },
      accepted: { 
        label: "Conductor en camino", 
        color: "bg-[#2E4CA6]",
        bgColor: "bg-gradient-to-r from-blue-50 to-white", 
        textColor: "text-[#2E4CA6]",
        icon: <Car className="h-4 w-4" />
      },
      arrived: { 
        label: "Tu conductor ha llegado", 
        color: "bg-[#0477BF]",
        bgColor: "bg-gradient-to-r from-cyan-50 to-white",
        textColor: "text-[#0477BF]", 
        icon: <CheckCircle className="h-4 w-4" />
      },
      "in-progress": { 
        label: "En viaje", 
        color: "bg-[#049DD9]",
        bgColor: "bg-gradient-to-r from-sky-50 to-white",
        textColor: "text-[#049DD9]",
        icon: <Navigation className="h-4 w-4" />
      },
      "counter-offered": { 
        label: "Contraoferta recibida", 
        color: "bg-[#05C7F2]",
        bgColor: "bg-gradient-to-r from-cyan-50 to-white",
        textColor: "text-[#05C7F2]",
        icon: <DollarSign className="h-4 w-4" />
      }
    };

    return statusConfig[currentRide.status as keyof typeof statusConfig] || null;
  };

  const rideStatus = getRideStatus();

  // Show rating form if ride is completed and needs rating
  if (completedRideForRating) {
    return (
      <div className="flex flex-col h-full bg-gray-50 relative">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <RatingForm
              userToRate={completedRideForRating}
              isDriver={true}
              onSubmit={onRatingSubmit}
              isSubmitting={isRatingSubmitting}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gray-100 pt-16 pb-20">
      {/* Map Background */}
      <div className="absolute inset-0 pt-16 pb-20">
        <MapView
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          driverLocation={rideLocation}
          interactive={true}
          className="h-full w-full map-container"
        />
      </div>

      {/* Status Bar */}
      {rideStatus && (
        <div className={`absolute top-20 left-4 right-4 ${rideStatus.bgColor} rounded-xl p-4 shadow-lg backdrop-blur-sm bg-opacity-95 z-10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`${rideStatus.color} text-white rounded-full w-10 h-10 flex items-center justify-center text-lg`}>
                {rideStatus.icon}
              </div>
              <div>
                <p className={`font-semibold ${rideStatus.textColor}`}>{rideStatus.label}</p>
                {currentRide?.status === 'searching' && (
                  <p className="text-sm text-gray-600">Te conectaremos pronto...</p>
                )}
                {assignedDriver && (
                  <p className="text-sm text-gray-600">
                    {assignedDriver.name} • {assignedDriver.vehicleBrand} {assignedDriver.vehicleModel}
                  </p>
                )}
              </div>
            </div>
            {currentRide?.status === 'searching' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCancelRide}
                className="bg-white hover:bg-gray-50"
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}



      {/* Bottom Sheet */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 z-30 ${
        isBottomSheetExpanded ? 'h-2/3' : 'h-36'
      }`}>
        {/* Drag Indicator */}
        <div 
          className={`flex justify-center cursor-pointer ${isBottomSheetExpanded ? 'pt-3 pb-2' : 'pt-2 pb-1'}`}
          onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <div className={`px-3 ${isBottomSheetExpanded ? 'pb-3' : 'pb-2'}`}>
          {/* Header with minimize/maximize button */}
          <div className={`flex items-center justify-between ${isBottomSheetExpanded ? 'mb-2' : 'mb-1'}`}>
            <h2 className={`font-bold ${isBottomSheetExpanded ? 'text-base' : 'text-sm'}`}>
              {!currentRide ? '¿A dónde vamos?' : 
               isSearching ? 'Buscando conductor...' : 
               currentRide?.status === 'counter-offered' ? 'Contraoferta recibida' :
               'Tu viaje'}
            </h2>
            <Button 
              variant="ghost" 
              size={isBottomSheetExpanded ? "icon" : "sm"}
              className={isBottomSheetExpanded ? "" : "h-7 w-7"}
              onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
            >
              {isBottomSheetExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>

          {/* Content - Only show when expanded */}
          {isBottomSheetExpanded && (
            <>
              {/* No Active Ride - Show Request Form */}
              {!currentRide && (
                <div className="space-y-2">
                  <RideRequestForm onRideCreated={() => setIsBottomSheetExpanded(false)} />
                </div>
              )}

              {/* Searching State */}
              {isSearching && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold">Buscando tu conductor ideal</h3>
                <p className="text-gray-600">Esto puede tomar unos segundos...</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Desde</span>
                  <Home className="h-4 w-4 text-gray-400" />
                </div>
                <p className="font-medium">{pickupLocation?.address || 'Tu ubicación'}</p>
                <div className="flex justify-between items-center mt-3 mb-2">
                  <span className="text-sm text-gray-600">Hasta</span>
                  <Building2 className="h-4 w-4 text-gray-400" />
                </div>
                <p className="font-medium">{dropoffLocation?.address || 'Destino'}</p>
              </div>
            </div>
          )}

          {/* Counter Offer */}
          {currentRide?.status === 'counter-offered' && counterOffer && (
            <div className="space-y-4 py-4">
              <h3 className="text-lg font-semibold text-center">Nueva Propuesta del Conductor</h3>
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 mb-2">Precio propuesto</p>
                  <p className="text-3xl font-bold text-orange-600">
                    S/ {counterOffer.amount?.toFixed(2) || 0}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button onClick={onAcceptCounterOffer} className="flex-1 bg-green-600 hover:bg-green-700">
                    Aceptar Propuesta
                  </Button>
                  <Button variant="outline" onClick={onRejectCounterOffer} className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
                    Rechazar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Driver */}
          {assignedDriver && ['accepted', 'arrived', 'in-progress'].includes(currentRide?.status || '') && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tu Conductor</h3>
                <Badge variant="outline" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  S/ {currentRide?.fare.toFixed(2)}
                </Badge>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{assignedDriver.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{assignedDriver.rating?.toFixed(1) || '5.0'}</span>
                      <span>•</span>
                      <span>{assignedDriver.vehicleBrand} {assignedDriver.vehicleModel}</span>
                    </div>
                    <p className="text-sm font-mono bg-white px-2 py-1 rounded mt-1 inline-block">
                      {assignedDriver.licensePlate}
                    </p>
                  </div>
                </div>

                {/* Trip Progress */}
                {currentRide?.status === 'in-progress' && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progreso del viaje</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        En curso
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">{currentRide?.pickup}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">{currentRide?.dropoff}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPassengerChatOpen(true)}
                    className="flex-1 flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Mensaje
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Llamar
                  </Button>
                  {currentRide?.status === 'accepted' && (
                    <Button variant="outline" onClick={onCancelRide} className="flex-1">
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}