"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Car, FileText, Settings, Clock } from "lucide-react";
import "@/styles/mobile/driver-mobile.css";

/**
 * Layout Mobile para rutas de Driver
 *
 * Características:
 * - Bottom navigation bar (navegación inferior)
 * - Safe area insets (soporte para notch)
 * - Diseño optimizado para touch
 * - Sin header superior (maximiza espacio)
 *
 * Rutas que usan este layout:
 * - /mobile/driver - Dashboard
 * - /mobile/driver/profile - Perfil
 * - /mobile/driver/vehicle - Vehículo
 * - /mobile/driver/documents - Documentos
 * - /mobile/driver/configuracion - Configuración
 * - /mobile/driver/historial - Historial
 */
export default function MobileDriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determinar ruta activa
  const getActiveRoute = () => {
    if (pathname === "/mobile/driver") return "dashboard";
    if (pathname?.includes("/profile")) return "profile";
    if (pathname?.includes("/vehicle")) return "vehicle";
    if (pathname?.includes("/documents")) return "documents";
    if (pathname?.includes("/configuracion")) return "configuracion";
    if (pathname?.includes("/historial")) return "historial";
    return "dashboard";
  };

  const activeRoute = getActiveRoute();

  return (
    <div className="driver-mobile-layout">
      {/* Contenido principal con padding para bottom nav */}
      <main className="driver-mobile-content flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="driver-bottom-nav">
        <Link
          href="/mobile/driver"
          className={`driver-nav-item ${activeRoute === "dashboard" ? "active" : ""}`}
        >
          <Home size={20} />
          <span>Inicio</span>
        </Link>

        <Link
          href="/mobile/driver/profile"
          className={`driver-nav-item ${activeRoute === "profile" ? "active" : ""}`}
        >
          <User size={20} />
          <span>Perfil</span>
        </Link>

        <Link
          href="/mobile/driver/vehicle"
          className={`driver-nav-item ${activeRoute === "vehicle" ? "active" : ""}`}
        >
          <Car size={20} />
          <span>Vehículo</span>
        </Link>

        <Link
          href="/mobile/driver/historial"
          className={`driver-nav-item ${activeRoute === "historial" ? "active" : ""}`}
        >
          <Clock size={20} />
          <span>Historial</span>
        </Link>

        <Link
          href="/mobile/driver/configuracion"
          className={`driver-nav-item ${activeRoute === "configuracion" ? "active" : ""}`}
        >
          <Settings size={20} />
          <span>Config</span>
        </Link>
      </nav>
    </div>
  );
}
