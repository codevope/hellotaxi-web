"use client";

import { useEffect, useState } from 'react';
import { getBrowserCapabilities } from '@/lib/browser-capabilities';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useToast } from '@/hooks/use-toast';
import type { Driver, EnrichedDriver } from '@/lib/types';

export const useDriverNotificationsSafe = (driver?: Driver | EnrichedDriver | null) => {
  const [capabilities] = useState(getBrowserCapabilities());
  const { toast } = useToast();

  // Solo usar el hook de sonido si es seguro
  const soundHook = capabilities.canUseNotifications ? 
    useNotificationSound() : 
    {
      hasPermission: false,
      audioEnabled: false,
      audioPermissionGranted: false,
      hasTriedReactivation: false,
      isLoaded: true,
      playSound: async () => false,
      enableAudio: async () => false,
      tryReenableAudio: async () => false,
      requestNotificationPermission: async () => false,
      notifyNewService: async () => {},
    };

  const { 
    hasPermission, 
    audioEnabled,
    audioPermissionGranted,
    hasTriedReactivation,
    enableAudio,
    tryReenableAudio,
    requestNotificationPermission,
    notifyNewService,
    isLoaded,
    playSound
  } = soundHook;

  // Mostrar advertencia de SSL una sola vez
  useEffect(() => {
    if (!capabilities.isSecureContext && capabilities.isProduction && driver) {
      const hasShownWarning = sessionStorage.getItem('ssl-warning-shown');
      if (!hasShownWarning) {
        toast({
          title: 'Funcionalidad Limitada',
          description: 'Esta aplicación requiere HTTPS. Las notificaciones y geolocalización no estarán disponibles.',
          duration: 10000,
          variant: 'destructive',
        });
        sessionStorage.setItem('ssl-warning-shown', 'true');
      }
    }
  }, [capabilities, driver, toast]);

  // Versión segura de las funciones
  const safeEnableAudio = async (): Promise<boolean> => {
    if (!capabilities.canUseNotifications) {
      toast({
        title: 'HTTPS Requerido',
        description: 'Las notificaciones requieren una conexión segura (HTTPS).',
        variant: 'destructive',
      });
      return false;
    }
    return enableAudio();
  };

  const safeRequestNotificationPermission = async (): Promise<boolean> => {
    if (!capabilities.canUseNotifications) {
      return false;
    }
    return requestNotificationPermission();
  };

  const safePlaySound = async (options?: any) => {
    if (!capabilities.canUseNotifications) {
      return false;
    }
    return playSound(options);
  };

  // Función de prueba que funciona sin SSL
  const testNotification = async () => {
    if (capabilities.canUseNotifications) {
      const mockRequest = {
        id: 'test-123',
        pickupLocation: 'Av. Larco 1234, Miraflores',
        destinationLocation: 'Centro Comercial Larcomar',
        initialFare: 25,
      };
      await notifyNewService({
        pickup: mockRequest.pickupLocation,
        destination: mockRequest.destinationLocation,
        fare: mockRequest.initialFare,
      });
    } else {
      toast({
        title: 'Modo de Prueba',
        description: 'Nueva solicitud: Av. Larco 1234, Miraflores → Centro Comercial Larcomar (S/ 25)',
        duration: 8000,
        className: 'border-l-4 border-l-[#2E4CA6]',
      });
    }
  };

  return {
    // Capacidades del navegador
    isSecureContext: capabilities.isSecureContext,
    canUseNotifications: capabilities.canUseNotifications,
    
    // Estados originales (seguros)
    hasPermission: capabilities.canUseNotifications ? hasPermission : false,
    audioEnabled: capabilities.canUseNotifications ? audioEnabled : false,
    audioPermissionGranted: capabilities.canUseNotifications ? audioPermissionGranted : false,
    hasTriedReactivation,
    isLoaded,
    
    // Funciones seguras
    enableAudio: safeEnableAudio,
    tryReenableAudio: capabilities.canUseNotifications ? tryReenableAudio : async () => false,
    requestNotificationPermission: safeRequestNotificationPermission,
    updateNotificationPermissions: async () => {}, // Stub para compatibilidad
    shouldAttemptReactivation: () => false, // Deshabilitado en HTTP
    testNotification,
    playSound: safePlaySound,
  };
};