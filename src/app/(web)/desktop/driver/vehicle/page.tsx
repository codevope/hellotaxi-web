"use client";

import { useDriverAuth } from '@/hooks/auth/use-driver-auth';
import DriverVehicle from "@/components/driver/vehicle";
import { Loader2 } from "lucide-react";

/**
 * Vehículo del Conductor - Vista Desktop
 *
 * Ruta: /driver/(desktop)/vehicle
 */
export default function DesktopDriverVehicle() {
  const { driver, loading } = useDriverAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Mi Vehículo</h1>
        <DriverVehicle driver={driver} />
      </div>
    </div>
  );
}
