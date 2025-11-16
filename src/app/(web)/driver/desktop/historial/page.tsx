"use client";

import { useDriverAuth } from "@/hooks/use-driver-auth";
import { useDriverRideHistory } from "@/hooks/driver/use-driver-ride-history";
import { Card } from "@/components/ui/card";
import RideHistory from "@/components/ride-history";
import { Loader2 } from "lucide-react";

/**
 * Historial de Viajes - Vista Desktop
 *
 * Ruta: /driver/(desktop)/historial
 */
export default function DesktopDriverHistory() {
  const { driver, loading: authLoading } = useDriverAuth();
  const { rides, isLoading: ridesLoading } = useDriverRideHistory(driver, 50);

  if (authLoading || ridesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Historial de Viajes</h1>
          <p className="text-gray-600 mt-2">
            {rides?.length || 0} viajes realizados en total
          </p>
        </div>

        <Card className="border-0 shadow-md p-6">
          <RideHistory driver={driver} />
        </Card>
      </div>
    </div>
  );
}
