"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDeviceType, type DeviceType } from "./use-device-type";

/**
 * Configuración para redirección por plataforma
 */
export interface PlatformRedirectConfig {
  /** Ruta base (ej: '/driver') */
  basePath: string;
  /** Ruta para mobile (ej: '/driver/mobile/dashboard') */
  mobilePath: string;
  /** Ruta para desktop (ej: '/driver/desktop/dashboard') */
  desktopPath: string;
  /** Ruta para tablet (opcional, por defecto usa desktop) */
  tabletPath?: string;
  /** Deshabilitar redirección automática */
  disabled?: boolean;
  /** Callback cuando se hace redirect */
  onRedirect?: (from: string, to: string, deviceType: DeviceType) => void;
}

/**
 * Hook para redirección automática basada en tipo de dispositivo
 *
 * Redirige automáticamente a la ruta correcta según el dispositivo detectado.
 * Previene loops de redirección y maneja cambios de orientación.
 *
 * @param config - Configuración de rutas
 *
 * @example
 * ```tsx
 * function DriverPage() {
 *   const { isRedirecting } = usePlatformRedirect({
 *     basePath: '/driver',
 *     mobilePath: '/driver/mobile/dashboard',
 *     desktopPath: '/driver/desktop/dashboard'
 *   });
 *
 *   if (isRedirecting) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   return null;
 * }
 * ```
 */
export function usePlatformRedirect(config: PlatformRedirectConfig) {
  const router = useRouter();
  const pathname = usePathname();
  const { deviceType, hasManualPreference } = useDeviceType();
  const hasRedirected = useRef(false);
  const previousDeviceType = useRef<DeviceType | null>(null);

  useEffect(() => {
    // No redirigir si está deshabilitado
    if (config.disabled) return;

    // Determinar ruta objetivo
    let targetPath: string;

    switch (deviceType) {
      case "mobile":
        targetPath = config.mobilePath;
        break;
      case "tablet":
        targetPath = config.tabletPath || config.desktopPath;
        break;
      case "desktop":
        targetPath = config.desktopPath;
        break;
      default:
        targetPath = config.desktopPath;
    }

    // Normalizar paths para comparación (quitar trailing slash)
    const normalizedPathname = pathname?.replace(/\/$/, "") || "";
    const normalizedTarget = targetPath.replace(/\/$/, "");
    const normalizedBase = config.basePath.replace(/\/$/, "");

    // No redirigir si ya estamos en la ruta correcta
    if (normalizedPathname === normalizedTarget) {
      hasRedirected.current = false;
      previousDeviceType.current = deviceType;
      return;
    }

    // Solo redirigir si estamos en la ruta base o en una ruta incorrecta de la plataforma
    const isOnBasePath = normalizedPathname === normalizedBase;
    const isOnMobilePath = normalizedPathname.startsWith(config.mobilePath);
    const isOnDesktopPath = normalizedPathname.startsWith(config.desktopPath);
    const isOnPlatformPath = isOnMobilePath || isOnDesktopPath;

    // Detectar cambio de tipo de dispositivo (ej: rotación de tablet)
    const deviceTypeChanged =
      previousDeviceType.current !== null &&
      previousDeviceType.current !== deviceType;

    // Redirigir si:
    // 1. Estamos en la ruta base, O
    // 2. Estamos en una ruta de plataforma incorrecta, O
    // 3. El tipo de dispositivo cambió y hay preferencia manual
    const shouldRedirect =
      isOnBasePath ||
      (isOnPlatformPath && normalizedPathname !== normalizedTarget) ||
      (deviceTypeChanged && hasManualPreference);

    if (shouldRedirect && !hasRedirected.current) {
      hasRedirected.current = true;
      previousDeviceType.current = deviceType;

      // Callback opcional
      if (config.onRedirect) {
        config.onRedirect(normalizedPathname, normalizedTarget, deviceType);
      }

      // Realizar redirección
      router.push(targetPath);
    }
  }, [
    deviceType,
    pathname,
    router,
    config,
    hasManualPreference,
  ]);

  return {
    isRedirecting: hasRedirected.current,
    currentDeviceType: deviceType,
    targetPath:
      deviceType === "mobile"
        ? config.mobilePath
        : config.tabletPath || config.desktopPath,
  };
}

/**
 * Genera rutas de plataforma automáticamente desde una ruta base
 *
 * @example
 * ```tsx
 * const routes = generatePlatformRoutes('/driver', 'dashboard');
 * // Retorna:
 * // {
 * //   basePath: '/driver',
 * //   mobilePath: '/driver/mobile/dashboard',
 * //   desktopPath: '/driver/desktop/dashboard'
 * // }
 * ```
 */
export function generatePlatformRoutes(
  basePath: string,
  defaultPage: string = "dashboard"
): Omit<PlatformRedirectConfig, "disabled" | "onRedirect"> {
  const normalizedBase = basePath.replace(/\/$/, "");

  return {
    basePath: normalizedBase,
    mobilePath: `${normalizedBase}/mobile/${defaultPage}`,
    desktopPath: `${normalizedBase}/desktop/${defaultPage}`,
  };
}

/**
 * Hook para verificar si la ruta actual pertenece a una plataforma específica
 */
export function useIsOnPlatform(
  platform: "mobile" | "desktop" | "tablet"
): boolean {
  const pathname = usePathname();

  if (!pathname) return false;

  if (platform === "mobile") {
    return pathname.includes("/mobile/");
  } else if (platform === "desktop") {
    return pathname.includes("/desktop/");
  }

  return false;
}
