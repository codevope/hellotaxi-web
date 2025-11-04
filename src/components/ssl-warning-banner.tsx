"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ExternalLink } from "lucide-react";
import { getBrowserCapabilities } from "@/lib/browser-capabilities";
import { useState, useEffect } from "react";

export function SSLWarningBanner() {
  const [capabilities, setCapabilities] = useState<ReturnType<typeof getBrowserCapabilities> | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setCapabilities(getBrowserCapabilities());
    
    // Verificar si ya fue desestimado en esta sesión
    const dismissed = sessionStorage.getItem('ssl-warning-dismissed');
    setIsDismissed(dismissed === 'true');
  }, []);

  if (!capabilities || capabilities.isSecureContext || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('ssl-warning-dismissed', 'true');
  };

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const httpsUrl = `https://${currentDomain}`;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-yellow-50 border-b-2 border-yellow-200">
      <Alert variant="destructive" className="max-w-4xl mx-auto">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold">
          🔒 Conexión No Segura Detectada
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <div className="text-sm">
            <p className="mb-2">
              Esta aplicación requiere <strong>HTTPS</strong> para funcionar completamente. 
              En HTTP, las siguientes funciones no están disponibles:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
              <li>Geolocalización precisa del conductor</li>
              <li>Notificaciones del navegador</li>
              <li>Alertas de sonido para nuevas solicitudes</li>
              <li>Funciones de seguridad avanzadas</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => window.location.href = httpsUrl}
              className="bg-green-600 hover:bg-green-700"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Cambiar a HTTPS
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
            >
              Continuar en HTTP (Limitado)
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}