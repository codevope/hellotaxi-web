"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Volume2, Settings, TestTube } from 'lucide-react';
import { useDriverNotifications } from '@/hooks/use-driver-notifications';
import { useToast } from '@/hooks/use-toast';

export default function DriverNotificationSettings() {
  const { 
    hasPermission, 
    requestNotificationPermission, 
    testNotification, 
    isLoaded 
  } = useDriverNotifications();
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const { toast } = useToast();

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast({
        title: 'Notificaciones habilitadas',
        description: 'Ahora recibirás alertas de nuevos servicios.',
      });
    } else {
      toast({
        title: 'Permisos denegados',
        description: 'No podrás recibir notificaciones push.',
        variant: 'destructive',
      });
    }
  };

  const handleTestNotification = async () => {
    await testNotification();
    toast({
      title: 'Prueba enviada',
      description: 'Deberías haber escuchado el sonido de nueva solicitud.',
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Alertas
        </CardTitle>
        <CardDescription>
          Configura cómo quieres ser notificado de nuevos servicios
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Estado actual */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={isLoaded ? "default" : "secondary"}>
            {isLoaded ? "✓ Audio listo" : "Cargando..."}
          </Badge>
          <Badge variant={hasPermission ? "default" : "destructive"}>
            {hasPermission ? "✓ Notificaciones OK" : "Sin permisos"}
          </Badge>
        </div>

        {/* Configuraciones */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="text-sm font-medium">Sonido de alerta</span>
            </div>
            <Switch 
              checked={soundEnabled} 
              onCheckedChange={setSoundEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">Notificaciones push</span>
            </div>
            <Switch 
              checked={hasPermission || false} 
              onCheckedChange={handleEnableNotifications}
              disabled={hasPermission === true}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📳</span>
              <span className="text-sm font-medium">Vibración</span>
            </div>
            <Switch 
              checked={vibrationEnabled} 
              onCheckedChange={setVibrationEnabled}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-2 pt-2">
          {!hasPermission && (
            <Button 
              onClick={handleEnableNotifications}
              className="w-full"
              variant="outline"
            >
              <Bell className="h-4 w-4 mr-2" />
              Habilitar Notificaciones
            </Button>
          )}
          
          <Button 
            onClick={handleTestNotification}
            className="w-full"
            disabled={!isLoaded}
            variant="secondary"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Probar Alerta
          </Button>
        </div>

        {/* Información */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Las alertas suenan cuando hay nuevos servicios disponibles</p>
          <p>• Funciona mejor con la app instalada como PWA</p>
          <p>• Las notificaciones aparecen incluso en segundo plano</p>
        </div>
      </CardContent>
    </Card>
  );
}