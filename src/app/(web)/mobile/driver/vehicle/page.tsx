"use client";

import { useDriverAuth } from "@/hooks/use-driver-auth";
import DriverVehicle from "@/components/driver/vehicle";
import { Loader2 } from "lucide-react";

/**
 * Vehículo del Conductor - Vista Mobile
 *
 * Ruta: /driver/(mobile)/vehicle
 */
export default function MobileDriverVehicle() {
  const { driver, loading } = useDriverAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <DriverVehicle driver={driver} />
    </div>
  );
}
