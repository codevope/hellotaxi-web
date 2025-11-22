"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

/**
 * CONTENEDOR DEL CONDUCTOR MÓVIL
 * 
 * Contenedor simplificado para demostración del sistema móvil.
 */
export default function MobileDriverContainer() {
  // ====================================
  // ESTADO MOCK PARA DEMO
  // ====================================
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock driver para demo
  const mockDriver = {
    id: 'demo-driver',
    name: 'Conductor Demo',
    email: 'driver@example.com',
    phone: '+1234567890',
    avatar: null,
  };
  
  // ====================================
  // HANDLERS
  // ====================================
  
  const handleLogin = async () => {
    setIsLoading(true);
    // Simular login
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsLoading(false);
    }, 1000);
  };
  
  // ====================================
  // ESTADOS DE CARGA
  // ====================================
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Iniciando sesión...
            </h3>
            <p className="text-sm text-gray-600">
              Verificando credenciales del conductor
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // ====================================
  // PANTALLA DE LOGIN
  // ====================================
  
  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-md w-full space-y-6">
          {/* Logo y título */}
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">🚕</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              HelloTaxi Conductor
            </h1>
            <p className="text-gray-600 mt-2">
              Inicia sesión para comenzar a conducir
            </p>
          </div>
          
          {/* Información para conductores */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Para conductores únicamente
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ Gestiona tus viajes en tiempo real</li>
              <li>✅ Recibe solicitudes instantáneas</li>
              <li>✅ Chat directo con pasajeros</li>
              <li>✅ Seguimiento de ganancias</li>
              <li>✅ Navegación integrada</li>
            </ul>
          </div>
          
          {/* Botón de login */}
          <Button
            onClick={handleLogin}
            className="w-full h-12 text-lg"
            size="lg"
            disabled={isLoading}
          >
            <LogIn className="w-5 h-5 mr-2" />
            Iniciar Demo Conductor
          </Button>
          
          {/* Información adicional */}
          <div className="text-center text-xs text-gray-500">
            Solo conductores registrados pueden acceder
          </div>
        </div>
      </div>
    );
  }
  
  // ====================================
  // INTERFAZ PRINCIPAL
  // ====================================
  
  return (
    <div className="h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-green-600 rounded-full mx-auto flex items-center justify-center mb-4">
          <span className="text-white text-2xl font-bold">🚕</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Interfaz Móvil Conductor
        </h1>
        <p className="text-gray-600">
          Demo de la interfaz móvil para conductores
        </p>
        <div className="bg-white rounded-lg p-6 shadow-sm border max-w-md">
          <h3 className="font-semibold text-gray-900 mb-4">
            Usuario: {mockDriver.name}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            La interfaz completa del conductor está en desarrollo. 
            Esta es una demostración del sistema de autenticación.
          </p>
          <Button
            onClick={() => setIsAuthenticated(false)}
            variant="outline"
            className="w-full"
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}