"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Tipos de dispositivos soportados
 */
export type DeviceType = "mobile" | "tablet" | "desktop";

/**
 * Tamaños de pantalla específicos
 */
export type ScreenSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

/**
 * Configuración de breakpoints (en píxeles)
 */
const BREAKPOINTS = {
  xs: 0, // 0-640px
  sm: 640, // 640-768px
  md: 768, // 768-1024px (principal mobile breakpoint)
  lg: 1024, // 1024-1280px
  xl: 1280, // 1280-1536px
  "2xl": 1536, // 1536px+
} as const;

/**
 * Breakpoints para tipos de dispositivo
 */
const DEVICE_BREAKPOINTS = {
  mobile: 768, // < 768px
  tablet: 1024, // 768px - 1024px
  desktop: 1024, // >= 1024px
} as const;

/**
 * Clave para localStorage
 */
const STORAGE_KEY = "hellotaxi-device-preference";

/**
 * Interface para el resultado del hook
 */
export interface DeviceDetection {
  /** Tipo de dispositivo detectado */
  deviceType: DeviceType;
  /** Es un dispositivo móvil (< 768px) */
  isMobile: boolean;
  /** Es una tablet (768px - 1024px) */
  isTablet: boolean;
  /** Es desktop (>= 1024px) */
  isDesktop: boolean;
  /** Está en orientación landscape */
  isLandscape: boolean;
  /** Tamaño específico de pantalla */
  screenSize: ScreenSize;
  /** Ancho de la ventana */
  width: number;
  /** Alto de la ventana */
  height: number;
  /** Forzar vista mobile */
  forceMobileView: () => void;
  /** Forzar vista desktop */
  forceDesktopView: () => void;
  /** Resetear a detección automática */
  resetViewPreference: () => void;
  /** ¿Hay una preferencia manual del usuario? */
  hasManualPreference: boolean;
}

/**
 * Interface para preferencias guardadas
 */
interface DevicePreference {
  type: DeviceType;
  timestamp: number;
}

/**
 * Detecta el tipo de dispositivo basándose en el ancho de pantalla
 */
function getDeviceType(width: number): DeviceType {
  if (width < DEVICE_BREAKPOINTS.mobile) {
    return "mobile";
  } else if (width < DEVICE_BREAKPOINTS.tablet) {
    return "tablet";
  } else {
    return "desktop";
  }
}

/**
 * Detecta el tamaño de pantalla específico
 */
function getScreenSize(width: number): ScreenSize {
  if (width < BREAKPOINTS.sm) return "xs";
  if (width < BREAKPOINTS.md) return "sm";
  if (width < BREAKPOINTS.lg) return "md";
  if (width < BREAKPOINTS.xl) return "lg";
  if (width < BREAKPOINTS["2xl"]) return "xl";
  return "2xl";
}

/**
 * Carga la preferencia del usuario desde localStorage
 */
function loadDevicePreference(): DevicePreference | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const preference = JSON.parse(stored) as DevicePreference;

    // Expirar preferencias después de 7 días
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - preference.timestamp > SEVEN_DAYS;

    if (isExpired) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return preference;
  } catch (error) {
    console.error("Error loading device preference:", error);
    return null;
  }
}

/**
 * Guarda la preferencia del usuario en localStorage
 */
function saveDevicePreference(type: DeviceType): void {
  if (typeof window === "undefined") return;

  try {
    const preference: DevicePreference = {
      type,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
  } catch (error) {
    console.error("Error saving device preference:", error);
  }
}

/**
 * Hook principal para detección de dispositivo con persistencia
 *
 * Combina:
 * - Media queries (breakpoint 768px)
 * - Detección de orientación
 * - Persistencia en localStorage
 * - Forzado manual de vista
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { deviceType, isMobile, forceMobileView } = useDeviceType();
 *
 *   if (isMobile) {
 *     return <MobileView />;
 *   }
 *   return <DesktopView />;
 * }
 * ```
 */
export function useDeviceType(): DeviceDetection {
  // Estado inicial con valores por defecto
  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const [height, setHeight] = useState<number>(
    typeof window !== "undefined" ? window.innerHeight : 768
  );
  const [manualPreference, setManualPreference] = useState<DeviceType | null>(null);

  // Cargar preferencia guardada al montar
  useEffect(() => {
    const preference = loadDevicePreference();
    if (preference) {
      setManualPreference(preference.type);
    }
  }, []);

  // Actualizar dimensiones de ventana
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    // Listeners para resize y orientación
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  // Calcular valores derivados
  const autoDetectedType = getDeviceType(width);
  const deviceType = manualPreference || autoDetectedType;
  const screenSize = getScreenSize(width);
  const isLandscape = width > height;

  // Funciones para forzar vista
  const forceMobileView = useCallback(() => {
    setManualPreference("mobile");
    saveDevicePreference("mobile");
  }, []);

  const forceDesktopView = useCallback(() => {
    setManualPreference("desktop");
    saveDevicePreference("desktop");
  }, []);

  const resetViewPreference = useCallback(() => {
    setManualPreference(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    deviceType,
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    isLandscape,
    screenSize,
    width,
    height,
    forceMobileView,
    forceDesktopView,
    resetViewPreference,
    hasManualPreference: manualPreference !== null,
  };
}

/**
 * Hook simple para solo saber si es mobile
 * Útil cuando solo necesitas un booleano
 */
export function useIsMobileDevice(): boolean {
  const { isMobile } = useDeviceType();
  return isMobile;
}

/**
 * Hook para obtener solo el tipo de dispositivo
 * Más ligero que useDeviceType completo
 */
export function useDeviceTypeOnly(): DeviceType {
  const { deviceType } = useDeviceType();
  return deviceType;
}
