"use client";

import { useDriverAuth } from "@/hooks/use-driver-auth";
import { useDriverRideHistory } from "@/hooks/driver/use-driver-ride-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Historial de Viajes - Vista Mobile
 *
 * Ruta: /driver/(mobile)/historial
 */
export default function MobileDriverHistory() {
  const { driver, loading: authLoading } = useDriverAuth();
  const { rides, isLoading: ridesLoading } = useDriverRideHistory(driver, 25);

  if (authLoading || ridesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historial de Viajes</h1>
        <p className="text-gray-600 mt-1">
          {rides?.length || 0} viajes realizados
        </p>
      </div>

      {/* Lista de viajes */}
      {rides && rides.length > 0 ? (
        <div className="space-y-3">
          {rides.map((ride) => (
            <Card key={ride.id} className="border-0 shadow-md">
              <CardContent className="p-4">
                {/* Header con fecha y estado */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {ride.startTime
                        ? format(ride.startTime.toDate(), "dd MMM yyyy, HH:mm", {
                            locale: es,
                          })
                        : "Fecha desconocida"}
                    </span>
                  </div>
                  <Badge
                    variant={
                      ride.status === "completed"
                        ? "default"
                        : ride.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {ride.status === "completed"
                      ? "Completado"
                      : ride.status === "cancelled"
                      ? "Cancelado"
                      : ride.status}
                  </Badge>
                </div>

                {/* Ubicaciones */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 line-clamp-1">
                      {ride.pickupLocation?.address || "Origen desconocido"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 line-clamp-1">
                      {ride.dropoffLocation?.address || "Destino desconocido"}
                    </span>
                  </div>
                </div>

                {/* Footer con tarifa y duración */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    {ride.fare && (
                      <div className="flex items-center gap-1 text-green-700 font-semibold">
                        <DollarSign className="w-4 h-4" />
                        <span>${ride.fare.toFixed(2)}</span>
                      </div>
                    )}
                    {ride.startTime && ride.endTime && (
                      <div className="flex items-center gap-1 text-gray-600 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>
                          {Math.round(
                            (ride.endTime.toDate().getTime() -
                              ride.startTime.toDate().getTime()) /
                              60000
                          )}{" "}
                          min
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sin viajes aún
            </h3>
            <p className="text-gray-600">
              Tus viajes completados aparecerán aquí
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
