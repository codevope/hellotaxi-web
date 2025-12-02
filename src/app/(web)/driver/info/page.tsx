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
import { useDriverNotificationsSafe } from "@/hooks/use-driver-notifications";

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
    testCancellationNotification,
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-3 sm:p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header para móvil */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-gray-900">
            <Settings className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
            Configuración
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestiona tu disponibilidad y notificaciones
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
            
            {/* Alertas de estado */}
            {!isSecureContext && (
              <Alert variant="destructive" className="border-l-4 border-l-red-600">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <AlertTitle className="text-sm sm:text-base">Conexión No Segura</AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm">
                    Requiere HTTPS para notificaciones y geolocalización.
                  </AlertDescription>
                </div>
              </Alert>
            )}
            
            {!isApproved && (
              <Alert variant="destructive" className="border-l-4 border-l-red-600">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <AlertTitle className="text-sm sm:text-base">Documentos Pendientes</AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm">
                    Aprueba tus documentos para recibir viajes.
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Información del conductor */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-blue-100">
                    <AvatarImage src={driver.avatarUrl || ''} alt={driver.name} />
                    <AvatarFallback className="bg-blue-500 text-white text-lg">{driver.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-xl font-semibold truncate">{driver.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Conductor profesional</p>
                    {driver.vehicle && (
                      <p className="text-xs sm:text-sm text-gray-600 truncate mt-1">
                        {driver.vehicle.brand} {driver.vehicle.model}
                        <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {driver.vehicle.licensePlate}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado de disponibilidad */}
            <Card className="shadow-sm border-l-4" style={{ borderLeftColor: isAvailable ? '#10b981' : '#6b7280' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  {isAvailable ? <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /> : <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />}
                  Disponibilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="availability-switch" className="text-sm sm:text-base font-medium">
                        Recibir solicitudes
                      </Label>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {isAvailable 
                          ? "Recibiendo solicitudes de viaje"
                          : "No recibirás solicitudes"
                        }
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
                      <Switch
                        id="availability-switch"
                        checked={isAvailable}
                        onCheckedChange={handleAvailabilityChange}
                        disabled={!isApproved || isUpdatingStatus}
                        aria-label="Estado de disponibilidad"
                      />
                      <Badge 
                        variant={isAvailable ? "default" : "secondary"} 
                        className="min-w-[80px] sm:min-w-[100px] justify-center text-xs sm:text-sm"
                      >
                        {isUpdatingStatus ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          isAvailable ? "Disponible" : "Inactivo"
                        )}
                      </Badge>
                    </div>
                  </div>
                  {!isApproved && (
                    <div className="text-xs sm:text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3">
                      Debes aprobar tus documentos y tener un vehículo asignado para estar disponible.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configuración de notificaciones */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Notificaciones del navegador */}
                <div className="p-3 sm:p-4 border rounded-lg bg-white">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm sm:text-base font-medium flex flex-wrap items-center gap-2">
                          Notificaciones Push
                          {!isSecureContext && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">HTTPS</Badge>
                          )}
                        </Label>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Alertas de nuevas solicitudes
                        </p>
                      </div>
                      <Badge 
                        variant={canUseNotifications && hasPermission ? "default" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {canUseNotifications ? 
                          (hasPermission ? "ON" : "OFF") : 
                          "N/A"
                        }
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Sonido de alertas */}
                <div className="p-3 sm:p-4 border rounded-lg bg-white">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Label className="flex items-center gap-2 text-sm sm:text-base font-medium">
                          <Volume2 className="h-4 w-4 text-[#0477BF]" />
                          Sonido de Alertas
                        </Label>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Sonido al recibir solicitud
                        </p>
                      </div>
                      <Badge 
                        variant={audioEnabled ? "default" : (audioPermissionGranted ? "outline" : "secondary")}
                        className="text-xs shrink-0"
                      >
                        {audioEnabled ? "ON" : "OFF"}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {!audioEnabled && isLoaded && canUseNotifications && (
                        <Button 
                          size="sm" 
                          variant={audioPermissionGranted ? "default" : "outline"}
                          className="text-xs sm:text-sm flex-1 sm:flex-initial"
                          onClick={async () => {
                            const enabled = await enableAudio();
                            if (enabled) {
                              toast({
                                title: 'Sonido habilitado',
                                description: audioPermissionGranted ? 
                                  'Sonido reactivado correctamente.' : 
                                  'Recibirás alertas de audio.',
                                duration: 5000,
                                className: 'border-l-4 border-l-[#05C7F2]',
                              });
                            }
                          }}
                        >
                          {audioPermissionGranted ? "Reactivar" : "Habilitar"}
                        </Button>
                      )}
                      {audioEnabled && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs sm:text-sm flex-1 sm:flex-initial"
                          onClick={() => {
                            playSound({ volume: 0.8 });
                            toast({
                              title: 'Prueba de sonido',
                              description: '¡Funcionando correctamente!',
                              duration: 3000,
                            });
                          }}
                        >
                          Probar Sonido
                        </Button>
                      )}
                      {!canUseNotifications && (
                        <Badge variant="destructive" className="text-[10px] sm:text-xs">
                          Requiere HTTPS
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    
  );

}