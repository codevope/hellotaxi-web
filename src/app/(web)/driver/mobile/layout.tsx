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
 * - /driver/(mobile) - Dashboard
 * - /driver/(mobile)/profile - Perfil
 * - /driver/(mobile)/vehicle - Vehículo
 * - /driver/(mobile)/documents - Documentos
 * - /driver/(mobile)/configuracion - Configuración
 * - /driver/(mobile)/historial - Historial
 */
export default function MobileDriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determinar ruta activa (sin el prefijo /driver/)
  const getActiveRoute = () => {
    if (pathname === "/driver" || pathname === "/driver/mobile") return "dashboard";
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
          href="/driver/mobile"
          className={`driver-nav-item ${activeRoute === "dashboard" ? "active" : ""}`}
        >
          <Home size={20} />
          <span>Inicio</span>
        </Link>

        <Link
          href="/driver/mobile/profile"
          className={`driver-nav-item ${activeRoute === "profile" ? "active" : ""}`}
        >
          <User size={20} />
          <span>Perfil</span>
        </Link>

        <Link
          href="/driver/mobile/vehicle"
          className={`driver-nav-item ${activeRoute === "vehicle" ? "active" : ""}`}
        >
          <Car size={20} />
          <span>Vehículo</span>
        </Link>

        <Link
          href="/driver/mobile/historial"
          className={`driver-nav-item ${activeRoute === "historial" ? "active" : ""}`}
        >
          <Clock size={20} />
          <span>Historial</span>
        </Link>

        <Link
          href="/driver/mobile/configuracion"
          className={`driver-nav-item ${activeRoute === "configuracion" ? "active" : ""}`}
        >
          <Settings size={20} />
          <span>Config</span>
        </Link>
      </nav>
    </div>
  );
}
