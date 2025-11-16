"use client";

/**
 * Configuración de Pasajero - Vista Mobile
 */

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, MapPin, CreditCard, Shield } from "lucide-react";

export default function MobilePassengerSettingsPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle className="text-lg">Notificaciones</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notif">Notificaciones Push</Label>
            <Switch id="push-notif" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notif">Email</Label>
            <Switch id="email-notif" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <CardTitle className="text-lg">Ubicación</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="location">Compartir ubicación</Label>
            <Switch id="location" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle className="text-lg">Privacidad</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="share-trip">Compartir viaje</Label>
            <Switch id="share-trip" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
