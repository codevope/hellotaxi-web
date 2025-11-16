"use client";

/**
 * Historial de Viajes - Vista Desktop
 *
 * Muestra el historial de viajes del pasajero en formato desktop
 */

import RideHistory from "@/components/ride-history";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DesktopPassengerHistoryPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historial de Viajes</h1>
          <p className="text-gray-600 mt-1">Revisa todos tus viajes anteriores</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Viajes</CardTitle>
        </CardHeader>
        <CardContent>
          <RideHistory />
        </CardContent>
      </Card>
    </div>
  );
}
