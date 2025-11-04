/**
 * Utilitario para detectar capacidades del navegador y SSL
 * Previene bucles en producción HTTP
 */

export interface BrowserCapabilities {
  isSecureContext: boolean;
  hasGeolocation: boolean;
  hasNotifications: boolean;
  isProduction: boolean;
  canUseNotifications: boolean;
  canUseGeolocation: boolean;
}

export function getBrowserCapabilities(): BrowserCapabilities {
  // Detectar si estamos en un contexto seguro (HTTPS o localhost)
  const isSecureContext = typeof window !== 'undefined' && 
    (window.isSecureContext || 
     window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');

  // Detectar geolocalización
  const hasGeolocation = typeof window !== 'undefined' && 'geolocation' in navigator;

  // Detectar notificaciones
  const hasNotifications = typeof window !== 'undefined' && 'Notification' in window;

  // Detectar si estamos en producción
  const isProduction = process.env.NODE_ENV === 'production';

  // Determinar si podemos usar las funciones
  const canUseNotifications = hasNotifications && (isSecureContext || !isProduction);
  const canUseGeolocation = hasGeolocation && (isSecureContext || !isProduction);

  return {
    isSecureContext,
    hasGeolocation,
    hasNotifications,
    isProduction,
    canUseNotifications,
    canUseGeolocation,
  };
}

export function shouldShowSSLWarning(): boolean {
  const capabilities = getBrowserCapabilities();
  return capabilities.isProduction && !capabilities.isSecureContext;
}

export function getSecurityMessage(): string {
  const capabilities = getBrowserCapabilities();
  
  if (!capabilities.isSecureContext && capabilities.isProduction) {
    return 'Esta aplicación requiere HTTPS para funcionar completamente. Algunas funciones como geolocalización y notificaciones no estarán disponibles.';
  }
  
  return '';
}