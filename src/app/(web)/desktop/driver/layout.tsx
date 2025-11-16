"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDriverAuth } from "@/hooks/use-driver-auth";
import {
  Home,
  User,
  Car,
  FileText,
  Settings,
  Clock,
  LogOut,
  Star,
  DollarSign,
} from "lucide-react";
import "@/styles/desktop/driver-desktop.css";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

/**
 * Layout Desktop para rutas de Driver
 *
 * Características:
 * - Sidebar de navegación lateral
 * - Header con perfil del conductor
 * - Diseño de 2 columnas (sidebar + contenido)
 * - Stats del conductor
 *
 * Rutas que usan este layout:
 * - /desktop/driver - Dashboard
 * - /desktop/driver/profile - Perfil
 * - /desktop/driver/vehicle - Vehículo
 * - /desktop/driver/documents - Documentos
 * - /desktop/driver/configuracion - Configuración
 * - /desktop/driver/historial - Historial
 */
export default function DesktopDriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { driver } = useDriverAuth();

  // Determinar ruta activa
  const getActiveRoute = () => {
    if (pathname === "/desktop/driver") return "dashboard";
    if (pathname?.includes("/profile")) return "profile";
    if (pathname?.includes("/vehicle")) return "vehicle";
    if (pathname?.includes("/documents")) return "documents";
    if (pathname?.includes("/configuracion")) return "configuracion";
    if (pathname?.includes("/historial")) return "historial";
    return "dashboard";
  };

  const activeRoute = getActiveRoute();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="driver-desktop-sidebar w-72 flex-shrink-0">
        {/* Header con perfil */}
        <div className="driver-desktop-header">
          <div className="driver-profile-card">
            <Avatar className="w-20 h-20 border-4 border-white/30">
              <AvatarImage src={driver?.avatarUrl} alt={driver?.name} />
              <AvatarFallback className="bg-amber-200 text-amber-800 text-2xl font-bold">
                {driver?.name?.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>
            <h1 className="driver-name">{driver?.name || "Conductor"}</h1>
            <div className="driver-rating">
              <Star className="w-5 h-5 fill-current" />
              <span>{driver?.rating?.toFixed(1) || "5.0"}</span>
            </div>
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="driver-stats">
          <div className="driver-stat-card">
            <div className="driver-stat-value">0</div>
            <div className="driver-stat-label">Viajes Hoy</div>
          </div>
          <div className="driver-stat-card">
            <DollarSign className="w-4 h-4 mx-auto mb-1 text-green-600" />
            <div className="driver-stat-value">$0.00</div>
            <div className="driver-stat-label">Ganancias</div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="driver-desktop-nav">
          <Link
            href="/desktop/driver"
            className={`driver-nav-link ${activeRoute === "dashboard" ? "active" : ""}`}
          >
            <Home className="icon" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/desktop/driver/profile"
            className={`driver-nav-link ${activeRoute === "profile" ? "active" : ""}`}
          >
            <User className="icon" />
            <span>Mi Perfil</span>
          </Link>

          <Link
            href="/desktop/driver/vehicle"
            className={`driver-nav-link ${activeRoute === "vehicle" ? "active" : ""}`}
          >
            <Car className="icon" />
            <span>Mi Vehículo</span>
          </Link>

          <Link
            href="/desktop/driver/documents"
            className={`driver-nav-link ${activeRoute === "documents" ? "active" : ""}`}
          >
            <FileText className="icon" />
            <span>Documentos</span>
          </Link>

          <Link
            href="/desktop/driver/historial"
            className={`driver-nav-link ${activeRoute === "historial" ? "active" : ""}`}
          >
            <Clock className="icon" />
            <span>Historial</span>
          </Link>

          <Link
            href="/desktop/driver/configuracion"
            className={`driver-nav-link ${activeRoute === "configuracion" ? "active" : ""}`}
          >
            <Settings className="icon" />
            <span>Configuración</span>
          </Link>
        </nav>

        {/* Footer del sidebar */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <button className="driver-nav-link w-full text-red-600 hover:bg-red-50">
            <LogOut className="icon" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
