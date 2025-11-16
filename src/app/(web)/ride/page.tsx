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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex flex-col items-center gap-4 p-8">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
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
 * Página principal de Passenger (Ride) con redirección automática
 *
 * Detecta el tipo de dispositivo y redirige automáticamente a:
 * - Mobile: /mobile/passenger (solicitar viaje mobile)
 * - Desktop/Tablet: /desktop/passenger (solicitar viaje desktop)
 *
 * ARQUITECTURA CON RUTAS SEPARADAS A NIVEL WEB:
 *
 * /mobile/
 * ├── passenger/              ← Rutas para pasajero en mobile
 * │   ├── layout.tsx          ← Layout con bottom navigation
 * │   ├── page.tsx            ← Solicitar viaje mobile
 * │   ├── history/page.tsx    → /mobile/passenger/history
 * │   └── settings/page.tsx   → /mobile/passenger/settings
 * │
 * /desktop/
 * └── passenger/              ← Rutas para pasajero en desktop
 *     ├── layout.tsx          ← Layout con sidebar
 *     ├── page.tsx            ← Solicitar viaje desktop
 *     ├── history/page.tsx    → /desktop/passenger/history
 *     └── settings/page.tsx   → /desktop/passenger/settings
 */
export default function RidePage() {
  const router = useRouter();
  const { isMobile, isDesktop } = useDevice();

  useEffect(() => {
    // Logging para debugging
    console.log("🔍 Ride Root - Redirecting based on device:", {
      isMobile,
      isDesktop,
    });

    // Redirigir según tipo de dispositivo
    if (isMobile) {
      console.log("📱 Redirecting to /mobile/passenger");
      router.replace("/mobile/passenger");
    } else {
      console.log("🖥️ Redirecting to /desktop/passenger");
      router.replace("/desktop/passenger");
    }
  }, [isMobile, isDesktop, router]);

  // Mostrar loader durante la redirección
  return <RedirectLoader targetPlatform={isMobile ? "móvil" : "escritorio"} />;
}
