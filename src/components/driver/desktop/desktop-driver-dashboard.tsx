"use client";

import { useDriverAuth } from '@/hooks/auth/use-driver-auth';
import { useDriverRideLogic } from '@/hooks/driver/use-driver-ride-logic';
import { DesktopDriverStatePanel } from "./desktop-driver-state-panel";
import MapView from '@/components/maps/map-view';
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import "@/styles/desktop/driver-desktop.css";

/**
 * Dashboard Desktop para conductores
 *
 * Layout de 3 columnas:
 * - Sidebar izquierdo: Perfil y estado del conductor
 * - Centro: Mapa con ubicación en tiempo real
 * - Panel derecho: Solicitudes y viaje activo
 *
 * Usa el hook useDriverRideLogic para toda la lógica de negocio,
 * permitiendo que este componente solo se enfoque en la presentación.
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
      <div className="driver-desktop-layout">
        <div className="driver-desktop-loading">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
          <p className="mt-4 text-gray-600">Cargando información del conductor...</p>
        </div>
      </div>
    );
  }

  if (!user || !driver) {
    return (
      <div className="driver-desktop-layout">
        <div className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acceso Denegado</AlertTitle>
            <AlertDescription>
              Debes iniciar sesión como conductor para acceder a este panel.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="driver-desktop-layout">
      {/* Sidebar Izquierdo - Perfil y Estado */}
      <aside className="driver-desktop-sidebar">
        <DesktopDriverSidebar driver={driver} logic={logic} />
      </aside>

      {/* Mapa Central */}
      <main className="driver-desktop-map">
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
        />
      </main>

      {/* Panel Derecho - Solicitudes y Viaje Activo */}
      <aside className="driver-desktop-panel">
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

/**
 * Sidebar Desktop con perfil y navegación
 */
function DesktopDriverSidebar({
  driver,
  logic,
}: {
  driver: any;
  logic: ReturnType<typeof useDriverRideLogic>;
}) {
  return (
    <>
      {/* Header con perfil */}
      <div className="driver-desktop-header">
        <div className="driver-profile-card">
          <img
            src={driver.avatarUrl || "/img/default-avatar.png"}
            alt={driver.name}
            className="driver-avatar-large"
          />
          <h1 className="driver-name">{driver.name}</h1>
          <div className="driver-rating">
            <span>⭐</span>
            <span>{driver.rating?.toFixed(1) || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Toggle de disponibilidad */}
      <div className="driver-availability-section">
        <div
          className={`driver-availability-toggle ${
            logic.isAvailable ? "available" : "busy"
          }`}
        >
          <div>
            <p className="text-sm font-medium text-gray-700">Estado</p>
            <p
              className={`text-lg font-bold ${
                logic.isAvailable ? "text-green-700" : "text-red-700"
              }`}
            >
              {logic.isAvailable ? "Disponible" : "No Disponible"}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={logic.isAvailable}
              onChange={(e) => logic.toggleAvailability(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="driver-stats">
        <div className="driver-stat-card">
          <div className="driver-stat-value">
            {logic.rideHistory?.length || 0}
          </div>
          <div className="driver-stat-label">Viajes</div>
        </div>
        <div className="driver-stat-card">
          <div className="driver-stat-value">${"0.00"}</div>
          <div className="driver-stat-label">Ganancias</div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="driver-desktop-nav">
        <a href="/driver" className="driver-nav-link active">
          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Dashboard</span>
        </a>
        <a href="/driver/profile" className="driver-nav-link">
          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>Perfil</span>
        </a>
        <a href="/driver/vehicle" className="driver-nav-link">
          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          <span>Vehículo</span>
        </a>
        <a href="/driver/historial" className="driver-nav-link">
          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Historial</span>
        </a>
        <a href="/driver/configuracion" className="driver-nav-link">
          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>Configuración</span>
        </a>
      </nav>
    </>
  );
}
