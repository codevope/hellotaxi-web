"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth/use-auth";
import {
  Home,
  User,
  History,
  Settings,
  LogOut,
  MapPin,
} from "lucide-react";
import "@/styles/desktop/passenger-desktop.css";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

/**
 * Layout Desktop para rutas de Passenger (Pasajero)
 *
 * Características:
 * - Sidebar de navegación lateral
 * - Header con perfil del pasajero
 * - Diseño de 2 columnas (sidebar + contenido)
 * - Acceso rápido a funciones principales
 *
 * Rutas que usan este layout:
 * - /desktop/passenger - Solicitar viaje
 * - /desktop/passenger/history - Historial de viajes
 * - /desktop/passenger/settings - Configuración
 */
export default function DesktopPassengerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Determinar ruta activa
  const getActiveRoute = () => {
    if (pathname === "/desktop/passenger") return "home";
    if (pathname?.includes("/history")) return "history";
    if (pathname?.includes("/settings")) return "settings";
    return "home";
  };

  const activeRoute = getActiveRoute();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="passenger-desktop-sidebar w-72 flex-shrink-0">
        {/* Header con perfil */}
        <div className="passenger-desktop-header">
          <div className="passenger-profile-card">
            <Avatar className="w-20 h-20 border-4 border-white/30">
              <AvatarImage src={user?.avatarUrl} alt={user?.name} />
              <AvatarFallback className="bg-blue-200 text-blue-800 text-2xl font-bold">
                {user?.name?.charAt(0) || "P"}
              </AvatarFallback>
            </Avatar>
            <h1 className="passenger-name">{user?.name || "Pasajero"}</h1>
            <p className="passenger-email text-sm text-white/70">
              {user?.email || ""}
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="passenger-desktop-nav">
          <Link
            href="/desktop/passenger"
            className={`passenger-nav-link ${activeRoute === "home" ? "active" : ""}`}
          >
            <Home className="icon" />
            <span>Solicitar Viaje</span>
          </Link>

          <Link
            href="/desktop/passenger/history"
            className={`passenger-nav-link ${activeRoute === "history" ? "active" : ""}`}
          >
            <History className="icon" />
            <span>Mis Viajes</span>
          </Link>

          <Link
            href="/profile"
            className="passenger-nav-link"
          >
            <User className="icon" />
            <span>Mi Perfil</span>
          </Link>

          <Link
            href="/desktop/passenger/settings"
            className={`passenger-nav-link ${activeRoute === "settings" ? "active" : ""}`}
          >
            <Settings className="icon" />
            <span>Configuración</span>
          </Link>
        </nav>

        {/* Footer del sidebar */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <button className="passenger-nav-link w-full text-red-600 hover:bg-red-50">
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
