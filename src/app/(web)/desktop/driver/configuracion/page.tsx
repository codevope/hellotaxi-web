"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Volume2, Vibrate, Moon, Globe, Shield } from "lucide-react";
import { useState } from "react";

/**
 * Configuración - Vista Desktop
 *
 * Ruta: /driver/(desktop)/configuracion
 */
export default function DesktopDriverConfig() {
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notificaciones */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <Label htmlFor="notifications-desktop">Notificaciones Push</Label>
                </div>
                <Switch
                  id="notifications-desktop"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-gray-400" />
                  <Label htmlFor="sounds-desktop">Sonidos</Label>
                </div>
                <Switch
                  id="sounds-desktop"
                  checked={sounds}
                  onCheckedChange={setSounds}
                  disabled={!notifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Apariencia */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-gray-400" />
                  <Label htmlFor="darkMode-desktop">Modo Oscuro</Label>
                </div>
                <Switch
                  id="darkMode-desktop"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>

              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <select className="flex-1 p-2 border border-gray-300 rounded-lg bg-white">
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button className="bg-amber-600 hover:bg-amber-700">
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}
