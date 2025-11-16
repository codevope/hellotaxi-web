"use client";

import React, { createContext, useContext, ReactNode } from "react";
import {
  useDeviceType,
  useResponsiveConfig,
  type DeviceDetection,
  type DimensionConfig,
  type ResponsiveConfig,
  type DeviceType,
  type ScreenSize,
} from "@/hooks/device";

/**
 * Context para información de dispositivo y configuración responsive
 */
interface DeviceContextValue extends DeviceDetection {
  /** Configuración de dimensiones */
  dimensions: DimensionConfig;
  /** Espaciado según tamaño de pantalla */
  spacing: { sm: number; md: number; lg: number };
  /** Función para obtener valor responsive */
  getValue: <T>(config: ResponsiveConfig<T>) => T;
  /** Altura disponible del viewport */
  availableHeight: number;
  /** Ancho disponible (con max-width) */
  availableWidth: number;
  /** Función para calcular altura de bottom sheet */
  getBottomSheetHeight: (contentHeight: number, maxPercent?: number) => number;
  /** ¿Debe usar layout compacto? */
  isCompact: boolean;
  /** Función para calcular columnas de grid */
  getGridColumns: (minColumnWidth?: number) => number;
}

/**
 * Context de dispositivo
 */
const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

/**
 * Props del Provider
 */
interface DeviceProviderProps {
  children: ReactNode;
  /**
   * Tipo de dispositivo forzado (para testing o SSR)
   */
  forcedDeviceType?: DeviceType;
  /**
   * Configuración de dimensiones personalizada
   */
  customDimensions?: Partial<DimensionConfig>;
}

/**
 * Provider de configuración de dispositivo
 *
 * Proporciona información sobre el tipo de dispositivo, dimensiones y
 * configuración responsive a toda la aplicación.
 *
 * @example
 * ```tsx
 * // En app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <DeviceProvider>
 *           {children}
 *         </DeviceProvider>
 *       </body>
 *     </html>
 *   );
 * }
 *
 * // En cualquier componente
 * function MyComponent() {
 *   const { isMobile, dimensions } = useDevice();
 *
 *   return (
 *     <div style={{ padding: dimensions.paddingX }}>
 *       {isMobile ? <MobileView /> : <DesktopView />}
 *     </div>
 *   );
 * }
 * ```
 */
export function DeviceProvider({
  children,
  forcedDeviceType,
  customDimensions,
}: DeviceProviderProps) {
  const deviceDetection = useDeviceType();
  const responsiveConfig = useResponsiveConfig();

  // Aplicar tipo de dispositivo forzado si se proporciona
  const deviceType = forcedDeviceType || deviceDetection.deviceType;
  const isMobile = deviceType === "mobile";
  const isTablet = deviceType === "tablet";
  const isDesktop = deviceType === "desktop";

  // Merge custom dimensions con las dimensiones por defecto
  const dimensions = customDimensions
    ? { ...responsiveConfig.dimensions, ...customDimensions }
    : responsiveConfig.dimensions;

  const value: DeviceContextValue = {
    // Detección de dispositivo
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape: deviceDetection.isLandscape,
    screenSize: deviceDetection.screenSize,
    width: deviceDetection.width,
    height: deviceDetection.height,
    forceMobileView: deviceDetection.forceMobileView,
    forceDesktopView: deviceDetection.forceDesktopView,
    resetViewPreference: deviceDetection.resetViewPreference,
    hasManualPreference: deviceDetection.hasManualPreference,

    // Configuración responsive
    dimensions,
    spacing: responsiveConfig.spacing,
    getValue: responsiveConfig.getValue,
    availableHeight: responsiveConfig.availableHeight,
    availableWidth: responsiveConfig.availableWidth,
    getBottomSheetHeight: responsiveConfig.getBottomSheetHeight,
    isCompact: responsiveConfig.isCompact,
    getGridColumns: responsiveConfig.getGridColumns,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de dispositivo
 *
 * @throws Error si se usa fuera de un DeviceProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isMobile,
 *     dimensions,
 *     availableHeight,
 *     getValue
 *   } = useDevice();
 *
 *   const padding = getValue({
 *     mobile: 16,
 *     desktop: 24
 *   });
 *
 *   return <div style={{ padding }}>Content</div>;
 * }
 * ```
 */
export function useDevice(): DeviceContextValue {
  const context = useContext(DeviceContext);

  if (context === undefined) {
    throw new Error(
      "useDevice debe ser usado dentro de un DeviceProvider. " +
        "Asegúrate de envolver tu aplicación con <DeviceProvider>."
    );
  }

  return context;
}

/**
 * Hook para usar el dispositivo con un fallback seguro
 * Útil en componentes que pueden renderizarse fuera del provider
 */
export function useDeviceSafe(): DeviceContextValue | null {
  const context = useContext(DeviceContext);
  return context || null;
}

/**
 * HOC para inyectar props de dispositivo en un componente
 *
 * @example
 * ```tsx
 * interface MyComponentProps {
 *   title: string;
 *   device: DeviceContextValue;
 * }
 *
 * const MyComponent = withDevice<MyComponentProps>(({ title, device }) => {
 *   return (
 *     <div style={{ padding: device.dimensions.paddingX }}>
 *       <h1>{title}</h1>
 *     </div>
 *   );
 * });
 * ```
 */
export function withDevice<P extends { device: DeviceContextValue }>(
  Component: React.ComponentType<P>
) {
  return function WithDeviceComponent(
    props: Omit<P, "device">
  ): JSX.Element {
    const device = useDevice();

    return <Component {...(props as P)} device={device} />;
  };
}

/**
 * Componente para renderizado condicional por tipo de dispositivo
 *
 * @example
 * ```tsx
 * <DeviceSwitch
 *   mobile={<MobileComponent />}
 *   tablet={<TabletComponent />}
 *   desktop={<DesktopComponent />}
 * />
 *
 * // O con fallback
 * <DeviceSwitch
 *   mobile={<MobileView />}
 *   desktop={<DesktopView />}
 *   // Tablet usará Desktop por defecto
 * />
 * ```
 */
interface DeviceSwitchProps {
  mobile?: ReactNode;
  tablet?: ReactNode;
  desktop?: ReactNode;
  fallback?: ReactNode;
}

export function DeviceSwitch({
  mobile,
  tablet,
  desktop,
  fallback = null,
}: DeviceSwitchProps) {
  const { deviceType } = useDevice();

  switch (deviceType) {
    case "mobile":
      return <>{mobile ?? fallback}</>;
    case "tablet":
      return <>{tablet ?? desktop ?? fallback}</>;
    case "desktop":
      return <>{desktop ?? fallback}</>;
    default:
      return <>{fallback}</>;
  }
}

/**
 * Componente para renderizado condicional simple mobile/desktop
 *
 * @example
 * ```tsx
 * <ShowOn mobile>
 *   <MobileOnlyContent />
 * </ShowOn>
 *
 * <ShowOn desktop>
 *   <DesktopOnlyContent />
 * </ShowOn>
 *
 * <ShowOn mobile desktop>
 *   <MobileAndDesktopContent />
 * </ShowOn>
 * ```
 */
interface ShowOnProps {
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
  children: ReactNode;
}

export function ShowOn({
  mobile = false,
  tablet = false,
  desktop = false,
  children,
}: ShowOnProps) {
  const { deviceType } = useDevice();

  const shouldShow =
    (mobile && deviceType === "mobile") ||
    (tablet && deviceType === "tablet") ||
    (desktop && deviceType === "desktop");

  if (!shouldShow) return null;

  return <>{children}</>;
}

/**
 * Componente para ocultar en tipos de dispositivo específicos
 *
 * @example
 * ```tsx
 * <HideOn mobile>
 *   <DesktopOnlyFeature />
 * </HideOn>
 * ```
 */
export function HideOn(props: ShowOnProps) {
  const { deviceType } = useDevice();

  const shouldHide =
    (props.mobile && deviceType === "mobile") ||
    (props.tablet && deviceType === "tablet") ||
    (props.desktop && deviceType === "desktop");

  if (shouldHide) return null;

  return <>{props.children}</>;
}
