"use client";

import { Car, Star, Tag } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/forms/price-display";
import type { User, EnrichedDriver, FareBreakdown } from "@/lib/types";

interface ActiveRideCardProps {
  status: "accepted" | "arrived" | "in-progress";
  passenger: User;
  pickup: string;
  dropoff: string;
  fare: number;
  fareBreakdown?: FareBreakdown;
  couponCode?: string;
  isCompletingRide: boolean;
  onStatusUpdate: (newStatus: "arrived" | "in-progress" | "completed") => void;
}

export function ActiveRideCard({
  status,
  passenger,
  pickup,
  dropoff,
  fare,
  fareBreakdown,
  couponCode,
  isCompletingRide,
  onStatusUpdate,
}: ActiveRideCardProps) {
  const getStatusDescription = () => {
    switch (status) {
      case "accepted":
        return "Dirígete al punto de recojo del pasajero.";
      case "arrived":
        return "Esperando al pasajero.";
      case "in-progress":
        return "Llevando al pasajero a su destino.";
      default:
        return "";
    }
  };

  const getActionButton = () => {
    switch (status) {
      case "accepted":
        return (
          <Button
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-base py-6"
            onClick={() => onStatusUpdate("arrived")}
            disabled={isCompletingRide}
          >
            He Llegado
          </Button>
        );
      case "arrived":
        return (
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-base py-6"
            onClick={() => onStatusUpdate("in-progress")}
            disabled={isCompletingRide}
          >
            Iniciar Viaje
          </Button>
        );
      case "in-progress":
        return (
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-base py-6"
            onClick={() => onStatusUpdate("completed")}
            disabled={isCompletingRide}
          >
            Finalizar Viaje
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] text-white rounded-t-lg px-6 py-5">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Car className="h-6 w-6 flex-shrink-0" />
          <span>Viaje Activo</span>
        </CardTitle>
        <CardDescription className="text-white/90 mt-2 text-sm">
          {getStatusDescription()}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 py-8 space-y-8">
        {/* Información del pasajero */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-md border border-gray-200/50">
          <div className="flex items-start justify-between gap-8">
            {/* Datos del pasajero */}
            <div className="flex gap-5 min-w-0">
              <Avatar className="h-16 w-16 ring-3 ring-[#049DD9] flex-shrink-0">
                <AvatarImage src={passenger.avatarUrl} alt={passenger.name} />
                <AvatarFallback className="bg-gradient-to-br from-[#0477BF] to-[#049DD9] text-white font-bold text-lg">
                  {passenger.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-gray-900 flex items-center gap-2 flex-wrap">
                  {passenger.name}
                  {typeof passenger.rating === "number" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white px-3 py-1 rounded-full border border-[#049DD9]/20 text-[#0477BF] shadow-sm">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      {passenger.rating.toFixed(1)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2.5 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-gray-500 flex-shrink-0 mt-0.5">📍</span>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide">
                  Recojo
                </p>
                <p className="font-medium text-gray-900 leading-snug">
                  {pickup}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-gray-500 flex-shrink-0 mt-0.5">📍</span>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide">
                  Destino
                </p>
                <p className="font-medium text-gray-900 leading-snug">
                  {dropoff}
                </p>
              </div>
            </div>
          </div>

          {/* Tarifa */}
          <div className="mt-4 p-2 bg-gradient-to-tr from-blue-700 rounded-md to-sky-700 shadow">
            {fareBreakdown?.couponDiscount &&
            fareBreakdown.couponDiscount > 0 ? (
              <div className="space-y-3">
                <div className="text-sm flex text-gray-100 line-through justify-center">
                  S/ {(fare + fareBreakdown.couponDiscount).toFixed(2)}
                </div>
                <div className="flex items-center justify-center text-xs gap-2 text-green-400 font-medium">
                  <Tag className="h-4 w-4" />
                  <span>
                    {couponCode}: &nbsp; - S/ {fareBreakdown.couponDiscount.toFixed(2)}
                  </span>
                </div>
                <PriceDisplay
                  amount={fare}
                  label="Total"
                  size="xl"
                  variant="muted"
                />
              </div>
            ) : (
              <PriceDisplay
                amount={fare}
                label="Tarifa"
                size="xl"
                variant="muted"
              />
            )}
          </div>
        </div>

        {/* Botón de acción según el estado */}
        {getActionButton()}
      </CardContent>
    </Card>
  );
}
