"use client";

/**
 * Dashboard Desktop de Pasajero
 *
 * Vista optimizada para escritorio con:
 * - Layout de 2 columnas
 * - Mapa amplio
 * - Panel lateral con formulario
 * - Información detallada del viaje
 */

import { UberStylePassengerDashboard } from "@/components/ride/uber-style-passenger-dashboard";

export default function DesktopPassengerPage() {
  return (
    <div className="h-full w-full">
      <UberStylePassengerDashboard />
    </div>
  );
}
