"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDeviceType } from "@/hooks/device";
import { Loader2 } from "lucide-react";

/**
 * Componente de carga durante la redirección
 */
function RedirectLoader({ targetPlatform }: { targetPlatform: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="flex flex-col items-center gap-4 p-8">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
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
 * Página principal de Profile con redirección automática
 *
 * Detecta el tipo de dispositivo y redirige automáticamente a:
 * - Mobile: /mobile/profile (perfil mobile)
 * - Desktop/Tablet: /desktop/profile (perfil desktop)
 *
 * ARQUITECTURA CON RUTAS SEPARADAS A NIVEL WEB:
 *
 * /mobile/
 * └── profile/                ← Perfil en mobile
 *     └── page.tsx            ← Vista mobile del perfil
 *
 * /desktop/
 * └── profile/                ← Perfil en desktop
 *     └── page.tsx            ← Vista desktop del perfil
 */
export default function ProfilePage() {
  const router = useRouter();
  const { isMobile, isDesktop } = useDeviceType();

  useEffect(() => {
    // Logging para debugging
    console.log("🔍 Profile Root - Redirecting based on device:", {
      isMobile,
      isDesktop,
    });

    // Redirigir según tipo de dispositivo
    if (isMobile) {
      console.log("📱 Redirecting to /mobile/profile");
      router.replace("/mobile/profile");
    } else {
      console.log("🖥️ Redirecting to /desktop/profile");
      router.replace("/desktop/profile");
    }
  }, [isMobile, isDesktop, router]);

  // Mostrar loader durante la redirección
  return <RedirectLoader targetPlatform={isMobile ? "móvil" : "escritorio"} />;
}
