"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Bell, 
  Volume2, 
  Shield, 
  HelpCircle, 
  LogOut,
  Phone,
  MessageCircle,
  Star,
  DollarSign,
  MapPin,
  Clock,
  Car,
  FileText,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriverRideLogic } from '@/hooks/driver/use-driver-ride-logic';
import type { EnrichedDriver } from '@/lib/types';

interface MobileDriverSettingsProps {
  driver: EnrichedDriver;
  logic: ReturnType<typeof useDriverRideLogic>;
}

/**
 * Configuración móvil completa del conductor
 *
 * Características:
 * - Configuraciones de notificaciones
 * - Preferencias de audio
 * - Configuraciones de privacidad
 * - Ayuda y soporte
 * - Información de la cuenta
 * - Logout
 */
export function MobileDriverSettings({
  driver,
  logic
}: MobileDriverSettingsProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(logic.audioEnabled);
  const [locationSharing, setLocationSharing] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);

  const handleAudioToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await logic.enableAudio();
      setSoundEnabled(success);
    } else {
      setSoundEnabled(false);
    }
  };

  const settingsSections = [
    {
      title: 'Notificaciones',
      icon: Bell,
      items: [
        {
          label: 'Notificaciones push',
          description: 'Recibir notificaciones de nuevos viajes',
          value: notificationsEnabled,
          onChange: setNotificationsEnabled
        },
        {
          label: 'Sonidos de alerta',
          description: 'Reproducir sonidos para nuevas solicitudes',
          value: soundEnabled,
          onChange: handleAudioToggle
        }
      ]
    },
    {
      title: 'Viajes',
      icon: Car,
      items: [
        {
          label: 'Compartir ubicación',
          description: 'Permitir que pasajeros vean tu ubicación',
          value: locationSharing,
          onChange: setLocationSharing
        },
        {
          label: 'Aceptación automática',
          description: 'Aceptar viajes automáticamente (experimental)',
          value: autoAccept,
          onChange: setAutoAccept
        }
      ]
    }
  ];

  const accountActions = [
    {
      label: 'Perfil y documentos',
      description: 'Editar información personal',
      icon: User,
      action: () => console.log('Edit profile')
    },
    {
      label: 'Información del vehículo',
      description: 'Actualizar datos del vehículo',
      icon: Car,
      action: () => console.log('Edit vehicle')
    },
    {
      label: 'Documentos',
      description: 'Subir y verificar documentos',
      icon: FileText,
      action: () => console.log('Documents')
    },
    {
      label: 'Centro de ayuda',
      description: 'Preguntas frecuentes y soporte',
      icon: HelpCircle,
      action: () => console.log('Help center')
    },
    {
      label: 'Contactar soporte',
      description: 'Hablar con un representante',
      icon: MessageCircle,
      action: () => console.log('Contact support')
    }
  ];

  return (
    <div className="mobile-driver-settings p-4 space-y-4 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
            <p className="text-sm text-gray-600">
              Personaliza tu experiencia como conductor
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Resumen del conductor */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{driver.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {driver.rating?.toFixed(1) || '5.0'}
                  </span>
                </div>
                <Badge 
                  variant={driver.documentsStatus === 'approved' ? 'default' : 'secondary'}
                  className={cn(
                    "text-xs",
                    driver.documentsStatus === 'approved' && "bg-green-500"
                  )}
                >
                  {driver.documentsStatus === 'approved' ? 'Verificado' : 'Pendiente'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Estado</p>
              <Badge 
                variant={logic.isAvailable ? 'default' : 'secondary'}
                className={logic.isAvailable ? 'bg-green-500' : ''}
              >
                {logic.isAvailable ? 'En línea' : 'Desconectado'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuraciones por sección */}
      {settingsSections.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <section.icon className="h-5 w-5" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <Switch
                      checked={item.value}
                      onCheckedChange={item.onChange}
                    />
                  </div>
                  {itemIndex < section.items.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Acciones de la cuenta */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1">
            {accountActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-auto p-4"
                onClick={action.action}
              >
                <div className="flex items-center gap-3 w-full">
                  <action.icon className="h-5 w-5 text-gray-600" />
                  <div className="flex-1 text-left">
                    <p className="font-medium">{action.label}</p>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Estadísticas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {logic.rideHistory?.length || 0}
              </p>
              <p className="text-xs text-gray-600">Viajes totales</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                S/{logic.rideHistory?.reduce((sum, ride) => sum + (ride.fare || 0), 0).toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-gray-600">Ganancias totales</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de la app */}
      <Card>
        <CardContent className="p-4 text-center space-y-2">
          <p className="text-sm text-gray-600">HelloTaxi Driver</p>
          <p className="text-xs text-gray-500">Versión 1.0.0</p>
          <p className="text-xs text-gray-500">© 2024 HelloTaxi. Todos los derechos reservados.</p>
        </CardContent>
      </Card>

      {/* Logout button */}
      <Card>
        <CardContent className="p-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              // Implementar logout
              console.log('Logout');
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>

      {/* Espacio adicional para el bottom nav */}
      <div className="h-20" />
    </div>
  );
}