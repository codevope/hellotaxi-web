"use client";

/**
 * Configuración de Pasajero - Vista Desktop
 */

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, MapPin, CreditCard, Shield } from "lucide-react";

export default function DesktopPassengerSettingsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-gray-600 mt-1">Personaliza tu experiencia</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <CardTitle>Notificaciones</CardTitle>
            </div>
            <CardDescription>Gestiona cómo recibes notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notif-desktop">Notificaciones Push</Label>
              <Switch id="push-notif-desktop" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notif-desktop">Email</Label>
              <Switch id="email-notif-desktop" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notif">SMS</Label>
              <Switch id="sms-notif" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <CardTitle>Ubicación</CardTitle>
            </div>
            <CardDescription>Permisos de ubicación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="location-desktop">Compartir ubicación</Label>
              <Switch id="location-desktop" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="save-locations">Guardar ubicaciones frecuentes</Label>
              <Switch id="save-locations" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <CardTitle>Privacidad</CardTitle>
            </div>
            <CardDescription>Controla tu información</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="share-trip-desktop">Compartir viaje</Label>
              <Switch id="share-trip-desktop" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="analytics">Estadísticas de uso</Label>
              <Switch id="analytics" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <CardTitle>Pagos</CardTitle>
            </div>
            <CardDescription>Métodos de pago</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="save-card">Guardar tarjeta</Label>
              <Switch id="save-card" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-pay">Pago automático</Label>
              <Switch id="auto-pay" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
