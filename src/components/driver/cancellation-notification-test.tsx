"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDriverNotifications } from "@/hooks/use-driver-notifications";
import { useDriverAuth } from "@/hooks/auth/use-driver-auth";
import { useAuth } from "@/hooks/auth/use-auth";
import { Bell, BellOff, Volume2, VolumeX, TestTube } from "lucide-react";

export default function CancellationNotificationTest() {
  const { appUser } = useAuth();
  const { driver } = useDriverAuth();
  const {
    hasPermission,
    audioEnabled,
    enableAudio,
    requestNotificationPermission,
    testCancellationNotification,
    isLoaded
  } = useDriverNotifications(driver);

  if (!driver) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Solo disponible para conductores
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Prueba de Notificaciones de Cancelación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado actual */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Estado Actual:</h4>
          <div className="flex gap-2">
            <Badge variant={hasPermission ? "default" : "secondary"}>
              {hasPermission ? (
                <>
                  <Bell className="h-3 w-3 mr-1" />
                  Notificaciones ON
                </>
              ) : (
                <>
                  <BellOff className="h-3 w-3 mr-1" />
                  Notificaciones OFF
                </>
              )}
            </Badge>
            <Badge variant={audioEnabled ? "default" : "secondary"}>
              {audioEnabled ? (
                <>
                  <Volume2 className="h-3 w-3 mr-1" />
                  Audio ON
                </>
              ) : (
                <>
                  <VolumeX className="h-3 w-3 mr-1" />
                  Audio OFF
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Controles */}
        <div className="space-y-2">
          {!hasPermission && (
            <Button 
              onClick={requestNotificationPermission}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Habilitar Notificaciones
            </Button>
          )}
          
          {!audioEnabled && (
            <Button 
              onClick={enableAudio}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Habilitar Audio
            </Button>
          )}
        </div>

        {/* Botón de prueba */}
        <Button
          onClick={testCancellationNotification}
          disabled={!isLoaded}
          className="w-full"
          variant="destructive"
        >
          <TestTube className="h-4 w-4 mr-2" />
          Probar Notificación de Cancelación
        </Button>

        {/* Información */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• La prueba simula una cancelación de pasajero</p>
          <p>• Se reproducirá sonido y mostrará notificación</p>
          <p>• Conductor: {driver.name} ({driver.id})</p>
        </div>
      </CardContent>
    </Card>
  );
}