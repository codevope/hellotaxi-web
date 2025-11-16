"use client";

import { useMemo } from "react";
import { useDeviceType, type DeviceType, type ScreenSize } from "./use-device-type";

/**
 * Configuración responsive para componentes
 * Permite definir valores diferentes según el tipo de dispositivo
 */
export interface ResponsiveConfig<T = any> {
  /** Valor para mobile */
  mobile: T;
  /** Valor para tablet (opcional, usa mobile por defecto) */
  tablet?: T;
  /** Valor para desktop */
  desktop: T;
}

/**
 * Configuración de dimensiones por pantalla
 */
export interface DimensionConfig {
  /** Altura del header */
  headerHeight: number;
  /** Altura del footer/bottom nav */
  footerHeight: number;
  /** Padding horizontal */
  paddingX: number;
  /** Padding vertical */
  paddingY: number;
  /** Gap entre elementos */
  gap: number;
  /** Radio de bordes */
  borderRadius: number;
  /** Tamaño de fuente base */
  fontSize: number;
  /** Tamaño de iconos */
  iconSize: number;
  /** Altura mínima de botones (touch-friendly) */
  minButtonHeight: number;
  /** Máximo ancho de contenido */
  maxContentWidth: number;
}

/**
 * Configuraciones predefinidas por tipo de dispositivo
 */
const DIMENSION_CONFIGS: Record<DeviceType, DimensionConfig> = {
  mobile: {
    headerHeight: 56,
    footerHeight: 64,
    paddingX: 16,
    paddingY: 12,
    gap: 12,
    borderRadius: 12,
    fontSize: 14,
    iconSize: 20,
    minButtonHeight: 44, // Recomendación de Apple para touch targets
    maxContentWidth: 768,
  },
  tablet: {
    headerHeight: 64,
    footerHeight: 72,
    paddingX: 24,
    paddingY: 16,
    gap: 16,
    borderRadius: 16,
    fontSize: 15,
    iconSize: 22,
    minButtonHeight: 48,
    maxContentWidth: 1024,
  },
  desktop: {
    headerHeight: 72,
    footerHeight: 0, // Desktop no usa footer/bottom nav
    paddingX: 32,
    paddingY: 24,
    gap: 24,
    borderRadius: 16,
    fontSize: 16,
    iconSize: 24,
    minButtonHeight: 40,
    maxContentWidth: 1280,
  },
};

/**
 * Configuración de espaciado por tamaño de pantalla
 */
const SPACING_BY_SCREEN: Record<ScreenSize, { sm: number; md: number; lg: number }> = {
  xs: { sm: 8, md: 12, lg: 16 },
  sm: { sm: 12, md: 16, lg: 20 },
  md: { sm: 16, md: 20, lg: 24 },
  lg: { sm: 20, md: 24, lg: 32 },
  xl: { sm: 24, md: 32, lg: 40 },
  "2xl": { sm: 32, md: 40, lg: 48 },
};

/**
 * Hook para obtener configuración responsive basada en el dispositivo
 *
 * Proporciona valores de dimensiones y espaciado optimizados según el tipo
 * de dispositivo y tamaño de pantalla.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { dimensions, spacing, getValue } = useResponsiveConfig();
 *
 *   return (
 *     <div style={{
 *       padding: dimensions.paddingX,
 *       gap: dimensions.gap,
 *       borderRadius: dimensions.borderRadius
 *     }}>
 *       <Button style={{ minHeight: dimensions.minButtonHeight }}>
 *         Click me
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useResponsiveConfig() {
  const { deviceType, screenSize, width, height } = useDeviceType();

  // Dimensiones según tipo de dispositivo
  const dimensions = useMemo(
    () => DIMENSION_CONFIGS[deviceType],
    [deviceType]
  );

  // Espaciado según tamaño de pantalla
  const spacing = useMemo(
    () => SPACING_BY_SCREEN[screenSize],
    [screenSize]
  );

  /**
   * Obtiene un valor responsive de una configuración
   */
  const getValue = useMemo(
    () =>
      <T,>(config: ResponsiveConfig<T>): T => {
        switch (deviceType) {
          case "mobile":
            return config.mobile;
          case "tablet":
            return config.tablet ?? config.mobile;
          case "desktop":
            return config.desktop;
          default:
            return config.desktop;
        }
      },
    [deviceType]
  );

  /**
   * Calcula altura disponible del viewport (descontando header/footer)
   */
  const availableHeight = useMemo(
    () => height - dimensions.headerHeight - dimensions.footerHeight,
    [height, dimensions.headerHeight, dimensions.footerHeight]
  );

  /**
   * Calcula ancho disponible (considerando padding)
   */
  const availableWidth = useMemo(
    () => Math.min(width - dimensions.paddingX * 2, dimensions.maxContentWidth),
    [width, dimensions.paddingX, dimensions.maxContentWidth]
  );

  /**
   * Calcula altura para bottom sheet según el contenido
   */
  const getBottomSheetHeight = useMemo(
    () => (contentHeight: number, maxPercent: number = 0.9) => {
      const maxHeight = availableHeight * maxPercent;
      return Math.min(contentHeight, maxHeight);
    },
    [availableHeight]
  );

  /**
   * Determina si debe usar layout compacto
   */
  const isCompact = useMemo(
    () => deviceType === "mobile" || (deviceType === "tablet" && width < 900),
    [deviceType, width]
  );

  /**
   * Determina cuántas columnas usar en un grid
   */
  const getGridColumns = useMemo(
    () => (minColumnWidth: number = 200): number => {
      const columns = Math.floor(availableWidth / minColumnWidth);
      return Math.max(1, Math.min(columns, deviceType === "mobile" ? 2 : 4));
    },
    [availableWidth, deviceType]
  );

  return {
    /** Configuración de dimensiones del dispositivo actual */
    dimensions,
    /** Espaciado según tamaño de pantalla */
    spacing,
    /** Función para obtener valor responsive */
    getValue,
    /** Altura disponible del viewport */
    availableHeight,
    /** Ancho disponible (con max-width) */
    availableWidth,
    /** Función para calcular altura de bottom sheet */
    getBottomSheetHeight,
    /** ¿Debe usar layout compacto? */
    isCompact,
    /** Función para calcular columnas de grid */
    getGridColumns,
    /** Tipo de dispositivo actual */
    deviceType,
    /** Tamaño de pantalla actual */
    screenSize,
  };
}

/**
 * Hook simple para obtener solo las dimensiones
 */
export function useDimensions(): DimensionConfig {
  const { dimensions } = useResponsiveConfig();
  return dimensions;
}

/**
 * Hook para crear clases CSS responsive
 */
export function useResponsiveClasses() {
  const { deviceType, screenSize, isCompact } = useResponsiveConfig();

  const baseClasses = useMemo(() => {
    const classes: string[] = [];

    // Clases por tipo de dispositivo
    classes.push(`device-${deviceType}`);

    // Clases por tamaño de pantalla
    classes.push(`screen-${screenSize}`);

    // Clase compacto
    if (isCompact) {
      classes.push("layout-compact");
    }

    return classes.join(" ");
  }, [deviceType, screenSize, isCompact]);

  return {
    baseClasses,
    deviceType,
    isCompact,
  };
}

/**
 * Helper para crear valores responsive inline
 *
 * @example
 * ```tsx
 * const padding = responsive({ mobile: 8, desktop: 16 });
 * // En mobile: 8, en desktop: 16
 * ```
 */
export function responsive<T>(config: ResponsiveConfig<T>): T {
  // Este helper solo funciona dentro de un componente
  // Para uso fuera de componentes, usar directamente la configuración
  throw new Error(
    "responsive() debe ser usado dentro de un componente con useResponsiveConfig()"
  );
}
