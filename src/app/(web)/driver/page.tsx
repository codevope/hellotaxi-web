"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDevice } from "@/components/providers";
import { Loader2 } from "lucide-react";

/**
 * Componente de carga durante la redirección
 */
function RedirectLoader({ targetPlatform }: { targetPlatform: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="flex flex-col items-center gap-4 p-8">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Redirigiendo a vista {targetPlatform}...
        </h2>
        <p className="text-sm text-gray-600 text-center max-w-xs">
          Optimizando la experiencia para tu dispositivo
        </p>
      </div>
    </div>
  );
}

/**
 * Página principal de Driver con redirección automática
 *
 * Detecta el tipo de dispositivo y redirige automáticamente a:
 * - Mobile: /mobile/driver (dashboard mobile)
 * - Desktop/Tablet: /desktop/driver (dashboard desktop)
 *
 * ARQUITECTURA CON RUTAS SEPARADAS A NIVEL WEB:
 *
 * /mobile/
 * ├── driver/                 ← Rutas para driver en mobile
 * │   ├── layout.tsx          ← Layout con bottom navigation
 * │   ├── page.tsx            ← Dashboard mobile
 * │   ├── profile/page.tsx    → /mobile/driver/profile
 * │   ├── vehicle/page.tsx    → /mobile/driver/vehicle
 * │   ├── documents/page.tsx  → /mobile/driver/documents
 * │   ├── configuracion/page.tsx → /mobile/driver/configuracion
 * │   └── historial/page.tsx  → /mobile/driver/historial
 * │
 * /desktop/
 * └── driver/                 ← Rutas para driver en desktop
 *     ├── layout.tsx          ← Layout con sidebar
 *     ├── page.tsx            ← Dashboard desktop
 *     ├── profile/page.tsx    → /desktop/driver/profile
 *     ├── vehicle/page.tsx    → /desktop/driver/vehicle
 *     ├── documents/page.tsx  → /desktop/driver/documents
 *     ├── configuracion/page.tsx → /desktop/driver/configuracion
 *     └── historial/page.tsx  → /desktop/driver/historial
 */
export default function DriverPage() {
  const router = useRouter();
  const { isMobile, isDesktop } = useDevice();

  useEffect(() => {
    // Logging para debugging
    console.log("🔍 Driver Root - Redirecting based on device:", {
      isMobile,
      isDesktop,
    });

    // Redirigir según tipo de dispositivo
    if (isMobile) {
      console.log("📱 Redirecting to /mobile/driver");
      router.replace("/mobile/driver");
    } else {
      console.log("🖥️ Redirecting to /desktop/driver");
      router.replace("/desktop/driver");
    }
  }, [isMobile, isDesktop, router]);

  // Mostrar loader durante la redirección
  return <RedirectLoader targetPlatform={isMobile ? "móvil" : "escritorio"} />;
}
