/**
 * Hooks de detección de dispositivo y configuración responsive
 * @module hooks/device
 */

// Detección de dispositivo
export {
  useDeviceType,
  useIsMobileDevice,
  useDeviceTypeOnly,
  type DeviceType,
  type ScreenSize,
  type DeviceDetection,
} from "./use-device-type";

// Redirección por plataforma
export {
  usePlatformRedirect,
  generatePlatformRoutes,
  useIsOnPlatform,
  type PlatformRedirectConfig,
} from "./use-platform-redirect";

// Configuración responsive
export {
  useResponsiveConfig,
  useDimensions,
  useResponsiveClasses,
  responsive,
  type ResponsiveConfig,
  type DimensionConfig,
} from "./use-responsive-config";
