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
 * - Mobile: /driver/mobile (dashboard mobile)
 * - Desktop/Tablet: /driver/desktop (dashboard desktop)
 *
 * ARQUITECTURA CON RUTAS SEPARADAS:
 *
 * /driver/
 * ├── mobile/                 ← Rutas para mobile
 * │   ├── layout.tsx          ← Layout con bottom navigation
 * │   ├── page.tsx            ← Dashboard mobile
 * │   ├── profile/page.tsx    → /driver/mobile/profile
 * │   ├── vehicle/page.tsx    → /driver/mobile/vehicle
 * │   ├── documents/page.tsx  → /driver/mobile/documents
 * │   ├── configuracion/page.tsx → /driver/mobile/configuracion
 * │   └── historial/page.tsx  → /driver/mobile/historial
 * │
 * └── desktop/                ← Rutas para desktop
 *     ├── layout.tsx          ← Layout con sidebar
 *     ├── page.tsx            ← Dashboard desktop
 *     ├── profile/page.tsx    → /driver/desktop/profile
 *     ├── vehicle/page.tsx    → /driver/desktop/vehicle
 *     ├── documents/page.tsx  → /driver/desktop/documents
 *     ├── configuracion/page.tsx → /driver/desktop/configuracion
 *     └── historial/page.tsx  → /driver/desktop/historial
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
      console.log("📱 Redirecting to /driver/mobile");
      router.replace("/driver/mobile");
    } else {
      console.log("🖥️ Redirecting to /driver/desktop");
      router.replace("/driver/desktop");
    }
  }, [isMobile, isDesktop, router]);

  // Mostrar loader durante la redirección
  return <RedirectLoader targetPlatform={isMobile ? "móvil" : "escritorio"} />;
}
