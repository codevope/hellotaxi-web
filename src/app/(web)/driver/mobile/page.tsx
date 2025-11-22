import { Metadata, Viewport } from 'next';
import MobileDriverContainer from './components/mobile-driver-container';

export const metadata: Metadata = {
  title: 'Conductor Móvil | HelloTaxi',
  description: 'Dashboard móvil optimizado para conductores de HelloTaxi',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HelloTaxi Driver',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#10B981',
  colorScheme: 'light',
  viewportFit: 'cover',
};

/**
 * PÁGINA PRINCIPAL DEL CONDUCTOR MÓVIL
 * 
 * Dashboard completo optimizado para móvil con todas las funcionalidades:
 * ✅ Gestión de disponibilidad en tiempo real
 * ✅ Solicitudes entrantes con contraofertas
 * ✅ Viajes activos con navegación integrada
 * ✅ Chat en tiempo real con pasajeros
 * ✅ Sistema de notificaciones push
 * ✅ Mapa a pantalla completa
 * ✅ Perfil y estadísticas detalladas
 * ✅ Historial con filtros avanzados
 * ✅ Configuración completa
 */
export default function DriverMobilePage() {
  return <MobileDriverContainer />;
}