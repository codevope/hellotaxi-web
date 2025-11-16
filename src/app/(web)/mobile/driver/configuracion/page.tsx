"use client";

import { useDriverAuth } from "@/hooks/auth/use-driver-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, Volume2, Vibrate, Moon, Globe } from "lucide-react";
import { useState } from "react";

/**
 * Configuración - Vista Mobile
 *
 * Ruta: /driver/(mobile)/configuracion
 */
export default function MobileDriverConfig() {
  const { driver, loading } = useDriverAuth();
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h1>

      {/* Notificaciones */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <Label htmlFor="notifications" className="text-base">
                Notificaciones Push
              </Label>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-gray-400" />
              <Label htmlFor="sounds" className="text-base">
                Sonidos
              </Label>
            </div>
            <Switch
              id="sounds"
              checked={sounds}
              onCheckedChange={setSounds}
              disabled={!notifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate className="w-5 h-5 text-gray-400" />
              <Label htmlFor="vibration" className="text-base">
                Vibración
              </Label>
            </div>
            <Switch
              id="vibration"
              checked={vibration}
              onCheckedChange={setVibration}
              disabled={!notifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Apariencia */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Apariencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-gray-400" />
              <Label htmlFor="darkMode" className="text-base">
                Modo Oscuro
              </Label>
            </div>
            <Switch
              id="darkMode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Idioma */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Idioma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-400" />
            <select className="flex-1 p-2 border border-gray-300 rounded-lg bg-white">
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Guardar */}
      <Button className="w-full bg-amber-600 hover:bg-amber-700 h-12">
        Guardar Configuración
      </Button>
    </div>
  );
}
