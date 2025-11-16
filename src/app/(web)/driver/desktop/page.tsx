"use client";

import { useDriverAuth } from "@/hooks/use-driver-auth";
import { useDriverRideLogic } from "@/components/driver/shared/logic";
import { DesktopDriverStatePanel } from "@/components/driver/desktop/desktop-driver-state-panel";
import MapView from "@/components/map-view";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/**
 * Dashboard Desktop del Conductor
 *
 * Ruta: /driver/(desktop)
 *
 * Características:
 * - Layout de 2 columnas (mapa + panel de solicitudes)
 * - Sidebar de navegación (del layout)
 * - Panel de estado en tiempo real
 * - Mapa con ubicación del conductor
 */
export default function DesktopDriverDashboard() {
  const { user, driver, loading: authLoading } = useDriverAuth();

  // Hook con toda la lógica de negocio (headless)
  const logic = useDriverRideLogic({
    driver,
    initialHistoryLimit: 25,
  });

  // ============================================================
  // ESTADOS DE CARGA Y ERROR
  // ============================================================

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
          <p className="text-gray-600">Cargando información del conductor...</p>
        </div>
      </div>
    );
  }

  if (!user || !driver) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            Debes iniciar sesión como conductor para acceder a este panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mapa Central - Ocupa 60% del ancho */}
      <div className="flex-1 relative">
        {/* Control de disponibilidad flotante */}
        <Card className="absolute top-4 left-4 right-4 z-10 shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="availability" className="text-base font-semibold">
                  Estado de Disponibilidad
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  {logic.isAvailable
                    ? "Recibiendo solicitudes de viaje"
                    : "No recibirás nuevas solicitudes"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-semibold ${
                    logic.isAvailable ? "text-green-700" : "text-gray-600"
                  }`}
                >
                  {logic.isAvailable ? "Disponible" : "No Disponible"}
                </span>
                <Switch
                  id="availability"
                  checked={logic.isAvailable}
                  onCheckedChange={(checked) => logic.toggleAvailability(checked)}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mapa */}
        <MapView
          center={
            logic.driverLocation
              ? {
                  lat: logic.driverLocation.latitude,
                  lng: logic.driverLocation.longitude,
                }
              : undefined
          }
          markers={
            logic.driverLocation
              ? [
                  {
                    position: {
                      lat: logic.driverLocation.latitude,
                      lng: logic.driverLocation.longitude,
                    },
                    label: "Tu ubicación",
                    type: "driver",
                  },
                ]
              : []
          }
          zoom={15}
          className="w-full h-full"
        />
      </div>

      {/* Panel Derecho - Solicitudes y Viaje Activo - 40% del ancho */}
      <aside className="w-[480px] bg-white border-l border-gray-200 overflow-y-auto">
        <DesktopDriverStatePanel
          driver={driver}
          incomingRequest={logic.incomingRequest}
          activeRide={logic.activeRide}
          isAvailable={logic.isAvailable}
          onAcceptRequest={logic.acceptRequest}
          onRejectRequest={logic.rejectRequest}
          onUpdateRideStatus={logic.updateRideStatus}
          onCompleteRide={logic.completeRide}
          isProcessing={logic.isProcessing}
        />
      </aside>
    </div>
  );
}
