"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useDeviceType } from "@/hooks/device";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

/**
 * Componente de carga para mobile
 */
function MobileLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="flex flex-col items-center gap-4 p-8">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Cargando vista móvil...
        </h2>
        <p className="text-sm text-gray-600 text-center max-w-xs">
          Optimizando la experiencia para tu dispositivo
        </p>
      </div>
    </div>
  );
}

/**
 * Componente de carga para desktop
 */
function DesktopLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-6 p-12 bg-white rounded-2xl shadow-lg">
        <Loader2 className="w-16 h-16 animate-spin text-amber-600" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Cargando Dashboard
          </h2>
          <p className="text-gray-600">
            Preparando tu panel de conductor...
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy loading de componentes por plataforma
 * Solo se carga el componente necesario según el dispositivo
 */
const MobileDashboard = dynamic(
  () => import("@/components/driver/mobile-dashboard-wrapper"),
  {
    ssr: false,
    loading: () => <MobileLoader />,
  }
);

const DesktopDashboard = dynamic(
  () => import("@/components/driver/desktop/desktop-driver-dashboard").then(mod => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => <DesktopLoader />,
  }
);

/**
 * Página principal de Driver con routing condicional
 *
 * Responsabilidades:
 * 1. Detectar tipo de dispositivo
 * 2. Redirigir a la ruta específica de la plataforma
 *
 * Rutas:
 * - Mobile: /driver → carga MobileDashboard
 * - Desktop: /driver → carga DesktopDashboard
 * - Tablet: /driver → carga DesktopDashboard (por defecto)
 *
 * NOTA: Esta es una implementación simplificada que carga componentes directamente.
 * Para una separación más estricta, considera usar route groups:
 * - /driver/(mobile)/dashboard
 * - /driver/(desktop)/dashboard
 */
export default function DriverPage() {
  const router = useRouter();
  const { deviceType, isMobile, isDesktop, isTablet } = useDeviceType();

  // Logging para debugging (remover en producción)
  useEffect(() => {
    console.log("🔍 Driver Page - Device Detection:", {
      deviceType,
      isMobile,
      isTablet,
      isDesktop,
    });
  }, [deviceType, isMobile, isTablet, isDesktop]);

  // Renderizar componente según dispositivo
  // Tablet usa vista desktop por defecto
  if (isMobile) {
    return (
      <Suspense fallback={<MobileLoader />}>
        <MobileDashboard />
      </Suspense>
    );
  }

  // Desktop o Tablet
  return (
    <Suspense fallback={<DesktopLoader />}>
      <DesktopDashboard />
    </Suspense>
  );
}

/**
 * Metadata de la página
 * (Nota: metadata solo funciona en Server Components, esta es una Client Component)
 */

/**
 * NOTAS PARA FUTURAS MEJORAS:
 *
 * 1. ROUTE GROUPS (Recomendado para separación más estricta):
 *    Crear estructura:
 *    /driver/(mobile)/page.tsx  → MobileDashboard
 *    /driver/(desktop)/page.tsx → DesktopDashboard
 *    /driver/page.tsx           → Redirect según dispositivo
 *
 * 2. PARALLEL ROUTES (Para casos avanzados):
 *    Permitir renderizar diferentes vistas en paralelo
 *
 * 3. MIDDLEWARE:
 *    Implementar detección de dispositivo en middleware de Next.js
 *    para redirección antes del renderizado
 *
 * 4. PERSISTENCIA:
 *    Agregar opción para que el usuario pueda cambiar manualmente
 *    entre vista mobile y desktop (ya implementado en useDevice)
 */
