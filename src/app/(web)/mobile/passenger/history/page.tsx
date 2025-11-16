"use client";

/**
 * Historial de Viajes - Vista Mobile
 *
 * Muestra el historial de viajes del pasajero en formato mobile
 */

import RideHistory from "@/components/ride-history";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function MobilePassengerHistoryPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Viajes</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <RideHistory />
        </CardContent>
      </Card>
    </div>
  );
}
