"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Bell, Settings } from 'lucide-react';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useToast } from '@/hooks/use-toast';

export default function NotificationTester() {
  const {
    playSound,
    stopSound,
    notifyNewService,
    isLoaded,
    isPlaying,
    hasPermission,
    requestNotificationPermission,
  } = useNotificationSound();
  
  const [volume, setVolume] = useState(0.7);
  const { toast } = useToast();

  const handleTestSound = async () => {
    const success = await playSound({ volume });
    if (!success) {
      toast({
        title: 'No se pudo reproducir',
        description: 'Interactúa con la página primero para habilitar el audio.',
        variant: 'destructive',
      });
    }
  };

  const handleTestNotification = async () => {
    if (!hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast({
          title: 'Permisos denegados',
          description: 'Habilita las notificaciones en tu navegador para la mejor experiencia.',
          variant: 'destructive',
        });
        return;
      }
    }

    await notifyNewService({
      pickup: 'Av. Larco 1234, Miraflores',
      destination: 'Aeropuerto Jorge Chávez',
      fare: 35,
      distance: '18.5 km'
    });
  };

  const handleRequestPermissions = async () => {
    await requestNotificationPermission();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones con Sonido
          </CardTitle>
          <CardDescription>
            Sistema de alertas para nuevos servicios de taxi con sonido personalizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado del sistema */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={isLoaded ? "default" : "secondary"}>
              {isLoaded ? "Audio cargado" : "Cargando audio..."}
            </Badge>
            <Badge variant={hasPermission ? "default" : "destructive"}>
              {hasPermission === null ? "Sin verificar" : hasPermission ? "Notificaciones permitidas" : "Sin permisos"}
            </Badge>
            {isPlaying && (
              <Badge variant="outline">
                Reproduciendo...
              </Badge>
            )}
          </div>

          {/* Controles de volumen */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Volumen: {Math.round(volume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Botones de prueba */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleTestSound}
              disabled={!isLoaded}
              className="flex items-center gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Probar Sonido
            </Button>

            <Button
              onClick={stopSound}
              disabled={!isPlaying}
              variant="outline"
              className="flex items-center gap-2"
            >
              <VolumeX className="h-4 w-4" />
              Detener
            </Button>

            <Button
              onClick={handleTestNotification}
              disabled={!isLoaded}
              variant="secondary"
              className="flex items-center gap-2 md:col-span-2"
            >
              <Bell className="h-4 w-4" />
              Probar Notificación Completa
            </Button>
          </div>

          {/* Permisos */}
          {!hasPermission && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-amber-800">Permisos requeridos</h4>
                  <p className="text-sm text-amber-700 mb-3">
                    Para recibir notificaciones de nuevos servicios, necesitas habilitar las notificaciones.
                  </p>
                  <Button
                    onClick={handleRequestPermissions}
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    Habilitar Notificaciones
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Información */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">¿Cómo funciona?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• El sonido se reproduce cuando hay un nuevo servicio disponible</li>
              <li>• Las notificaciones aparecen incluso cuando la app está en segundo plano</li>
              <li>• Funciona mejor cuando la app está instalada como PWA</li>
              <li>• Compatible con todos los navegadores modernos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}