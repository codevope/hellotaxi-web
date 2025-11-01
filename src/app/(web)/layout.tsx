"use client";

import AppHeader from "@/components/app-header";
import AppFooter from "@/components/app-footer";
import { useMobileOptimized } from "@/hooks/use-mobile-optimized";
import { usePathname } from "next/navigation";

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile } = useMobileOptimized();
  const pathname = usePathname();
  
  // Rutas que NO necesitan header/footer (como login que tiene su propio diseño completo)
  const fullScreenRoutes = ['/login'];
  // Rutas que NO necesitan footer en móvil pero sí header
  const noFooterMobileRoutes = ['/driver'];
  
  const shouldUseFullScreen = isMobile && fullScreenRoutes.includes(pathname);
  const shouldHideFooter = isMobile && noFooterMobileRoutes.includes(pathname);

  if (shouldUseFullScreen) {
    // Vista móvil sin header/footer del layout (login maneja su propio diseño)
    return <>{children}</>;
  }

  // Vista desktop normal O móvil con header/footer
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1">{children}</main>
      {/* Solo mostrar footer si no está en la lista de rutas sin footer en móvil */}
      {!shouldHideFooter && <AppFooter />}
    </div>
  );
}
