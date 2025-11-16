"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, User, Settings } from "lucide-react";
import "@/styles/mobile/passenger-mobile.css";

/**
 * Layout Mobile para rutas de Passenger (Pasajero)
 *
 * Características:
 * - Bottom navigation bar (navegación inferior)
 * - Safe area insets (soporte para notch)
 * - Diseño optimizado para touch
 * - Sin header superior (maximiza espacio)
 *
 * Rutas que usan este layout:
 * - /mobile/passenger - Solicitar viaje
 * - /mobile/passenger/history - Historial de viajes
 * - /mobile/passenger/settings - Configuración
 */
export default function MobilePassengerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determinar ruta activa
  const getActiveRoute = () => {
    if (pathname === "/mobile/passenger") return "home";
    if (pathname?.includes("/history")) return "history";
    if (pathname?.includes("/settings")) return "settings";
    return "home";
  };

  const activeRoute = getActiveRoute();

  return (
    <div className="passenger-mobile-layout">
      {/* Contenido principal con padding para bottom nav */}
      <main className="passenger-mobile-content flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="passenger-bottom-nav">
        <Link
          href="/mobile/passenger"
          className={`passenger-nav-item ${activeRoute === "home" ? "active" : ""}`}
        >
          <Home size={20} />
          <span>Inicio</span>
        </Link>

        <Link
          href="/mobile/passenger/history"
          className={`passenger-nav-item ${activeRoute === "history" ? "active" : ""}`}
        >
          <History size={20} />
          <span>Historial</span>
        </Link>

        <Link
          href="/profile"
          className={`passenger-nav-item ${activeRoute === "profile" ? "active" : ""}`}
        >
          <User size={20} />
          <span>Perfil</span>
        </Link>

        <Link
          href="/mobile/passenger/settings"
          className={`passenger-nav-item ${activeRoute === "settings" ? "active" : ""}`}
        >
          <Settings size={20} />
          <span>Config</span>
        </Link>
      </nav>
    </div>
  );
}
