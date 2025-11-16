"use client";

/**
 * Dashboard Mobile de Pasajero
 *
 * Vista optimizada para móvil con:
 * - Interfaz táctil
 * - Formulario de solicitud de viaje
 * - Mapa en pantalla completa
 * - Bottom sheets para información
 */

import { UberStylePassengerDashboard } from "@/components/ride/uber-style-passenger-dashboard";

export default function MobilePassengerPage() {
  return (
    <div className="h-full w-full">
      <UberStylePassengerDashboard />
    </div>
  );
}
