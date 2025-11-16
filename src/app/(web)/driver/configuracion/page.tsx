"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Settings,
  ShieldAlert,
  MessageCircle,
  Volume2,
  Loader2,
  User,
  Wifi,
  WifiOff
} from "lucide-react";
import { useDriverAuth } from '@/hooks/auth/use-driver-auth';
import { useDriverNotificationsSafe } from "@/hooks/use-driver-notifications-safe";

export default function ConfiguracionPage() {
  const { driver, setDriver, loading } = useDriverAuth();
  const { toast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Hook: notificaciones con sonido SEGURO
  const { 
    hasPermission, 
    audioEnabled, 
    audioPermissionGranted, 
    hasTriedReactivation, 
    enableAudio, 
    tryReenableAudio, 
    requestNotificationPermission, 
    updateNotificationPermissions, 
    shouldAttemptReactivation, 
    testNotification, 
    isLoaded, 
    playSound, 
    isSecureContext, 
    canUseNotifications 
  } = useDriverNotificationsSafe(driver);

  // Estado para controlar si ya se intentó reactivar el audio
  const [hasAttemptedAutoReactivation, setHasAttemptedAutoReactivation] = useState(false);

  // Efecto para solicitar permisos de notificación cuando el conductor se conecta por primera vez
  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      if (driver && isLoaded && hasPermission === false) {
        const granted = await requestNotificationPermission();
        
        await updateNotificationPermissions();
        
        if (granted) {
          toast({
            title: 'Notificaciones habilitadas',
            description: 'Ahora puedes habilitar el sonido para recibir alertas de audio.',
            duration: 8000,
            className: 'border-l-4 border-l-[#2E4CA6]',
          });
        } else {
          toast({
            title: 'Notificaciones desactivadas',
            description: 'Puedes habilitarlas desde la configuración de tu navegador.',
            duration: 8000,
            variant: 'destructive',
          });
        }
      }
    };

    checkAndRequestPermissions();
  }, [driver, isLoaded, hasPermission, requestNotificationPermission, updateNotificationPermissions, toast]);

  // Efecto para intentar reactivar automáticamente el audio basado en preferencias de BD
  useEffect(() => {
    const attemptAutoReactivation = async () => {
      const shouldTryDB = shouldAttemptReactivation();
      const shouldTryLocal = audioPermissionGranted && !audioEnabled;
      
      if (driver && isLoaded && (shouldTryDB || shouldTryLocal) && !hasAttemptedAutoReactivation && !hasTriedReactivation) {
        setHasAttemptedAutoReactivation(true);
        console.log('🔄 Intentando reactivar audio automáticamente...', { 
          fromDB: shouldTryDB, 
          fromLocal: shouldTryLocal 
        });
        
        const reactivated = await tryReenableAudio();
        if (reactivated) {
          toast({
            title: 'Sonido reactivado',
            description: 'Las alertas de audio están funcionando nuevamente.',
            duration: 3000,
            className: 'border-l-4 border-l-[#05C7F2]',
          });
        } else {
          toast({
            title: 'Sonido disponible',
            description: 'Haz clic en "Reactivar Sonido" para volver a habilitar las alertas de audio.',
            duration: 8000,
            className: 'border-l-4 border-l-[#049DD9]',
          });
        }
      }
    };

    if (!hasAttemptedAutoReactivation && !hasTriedReactivation) {
      const timer = setTimeout(attemptAutoReactivation, 1500);
      return () => clearTimeout(timer);
    }
  }, [driver, isLoaded, audioPermissionGranted, audioEnabled, hasAttemptedAutoReactivation, hasTriedReactivation, shouldAttemptReactivation, tryReenableAudio, toast]);

  const handleAvailabilityChange = async (available: boolean) => {
    if (!driver) return;

    setIsUpdatingStatus(true);
    const newStatus = available ? "available" : "unavailable";
    const driverRef = doc(db, "drivers", driver.id);

    try {
      await updateDoc(driverRef, { status: newStatus });
      setDriver({ ...driver, status: newStatus });

      toast({
        title: `Estado actualizado: ${
          available ? "Disponible" : "No Disponible"
        }`,
        description: available
          ? "Ahora recibirás solicitudes de viaje."
          : "Has dejado de recibir solicitudes.",
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar tu estado.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading || !driver) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isApproved = driver.documentsStatus === "approved";
  const isAvailable = driver.status === "available";

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Configuración del Conductor
            </CardTitle>
            <CardDescription>
              Gestiona tu disponibilidad, notificaciones y configuración de la aplicación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Alertas de estado */}
            {!isSecureContext && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Conexión No Segura</AlertTitle>
                <AlertDescription>
                  Esta aplicación requiere HTTPS para funcionar completamente. 
                  Las notificaciones y geolocalización precisa no estarán disponibles en HTTP.
                </AlertDescription>
              </Alert>
            )}
            
            {!isApproved && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Acción Requerida</AlertTitle>
                <AlertDescription>
                  Tus documentos no están aprobados. No puedes recibir
                  viajes. Revisa la pestaña "Documentos".
                </AlertDescription>
              </Alert>
            )}

            {/* Información del conductor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={driver.avatarUrl || ''} alt={driver.name} />
                    <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{driver.name}</h3>
                    <p className="text-muted-foreground">Conductor profesional</p>
                    <p className="text-sm text-gray-600">
                      {driver.vehicle?.brand} {driver.vehicle?.model} - {driver.vehicle?.licensePlate}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado de disponibilidad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isAvailable ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-gray-500" />}
                  Estado de Disponibilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="availability-switch" className="text-base font-medium">
                      Recibir solicitudes de viaje
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isAvailable 
                        ? "Estás disponible para recibir solicitudes de viaje"
                        : "No recibirás solicitudes mientras estés desconectado"
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="availability-switch"
                      checked={isAvailable}
                      onCheckedChange={handleAvailabilityChange}
                      disabled={!isApproved || isUpdatingStatus}
                      aria-label="Estado de disponibilidad"
                    />
                    <Badge variant={isAvailable ? "default" : "secondary"} className="min-w-[100px] justify-center">
                      {isUpdatingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        isAvailable ? "Disponible" : "No Disponible"
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de notificaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">
                      Notificaciones del Navegador
                      {!isSecureContext && (
                        <Badge variant="outline" className="ml-2 text-xs">HTTPS Requerido</Badge>
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones cuando lleguen nuevas solicitudes de viaje
                    </p>
                  </div>
                  <Badge variant={canUseNotifications && hasPermission ? "default" : "secondary"}>
                    {canUseNotifications ? 
                      (hasPermission ? "Habilitadas" : "Deshabilitadas") : 
                      "No Disponible"
                    }
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="flex items-center gap-2 text-base font-medium">
                      <Volume2 className="h-4 w-4 text-[#0477BF]" />
                      Sonido de Alertas
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Reproduce un sonido cuando llegue una nueva solicitud de viaje
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={audioEnabled ? "default" : (audioPermissionGranted ? "outline" : "secondary")}>
                      {audioEnabled ? "Activo" : (audioPermissionGranted ? "Disponible" : "Inactivo")}
                    </Badge>
                    {!audioEnabled && isLoaded && canUseNotifications && (
                      <Button 
                        size="sm" 
                        variant={audioPermissionGranted ? "default" : "outline"}
                        onClick={async () => {
                          const enabled = await enableAudio();
                          if (enabled) {
                            toast({
                              title: 'Sonido habilitado',
                              description: audioPermissionGranted ? 
                                'Sonido reactivado correctamente.' : 
                                'Ahora recibirás alertas de audio cuando lleguen nuevas solicitudes.',
                              duration: 5000,
                              className: 'border-l-4 border-l-[#05C7F2]',
                            });
                          }
                        }}
                      >
                        {audioPermissionGranted ? "Reactivar Sonido" : "Habilitar Sonido"}
                      </Button>
                    )}
                    {audioEnabled && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          playSound({ volume: 0.8 });
                          toast({
                            title: 'Prueba de sonido',
                            description: '¡El sonido de notificación está funcionando!',
                            duration: 3000,
                          });
                        }}
                      >
                        Probar Sonido
                      </Button>
                    )}
                    {!canUseNotifications && (
                      <Badge variant="destructive" className="text-xs">
                        Requiere HTTPS
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}