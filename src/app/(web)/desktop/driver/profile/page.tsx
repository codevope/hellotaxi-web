"use client";

import { useDriverAuth } from "@/hooks/use-driver-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Star, Phone, Mail, MapPin, Shield, Calendar, Edit } from "lucide-react";

/**
 * Perfil del Conductor - Vista Desktop
 *
 * Ruta: /driver/(desktop)/profile
 */
export default function DesktopDriverProfile() {
  const { driver, loading } = useDriverAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">No se pudo cargar el perfil</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <Button variant="outline" className="gap-2">
            <Edit className="w-4 h-4" />
            Editar Perfil
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Información principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card principal con avatar */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <Avatar className="w-32 h-32 border-4 border-amber-200">
                    <AvatarImage src={driver.avatarUrl} alt={driver.name} />
                    <AvatarFallback className="bg-amber-100 text-amber-800 text-4xl font-bold">
                      {driver.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {driver.name}
                    </h2>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                        <span className="text-xl font-semibold text-gray-700">
                          {driver.rating?.toFixed(1) || "5.0"}
                        </span>
                      </div>
                      <Badge
                        variant={
                          driver.documentsStatus === "approved" ? "default" : "secondary"
                        }
                      >
                        {driver.documentsStatus === "approved" ? "Verificado" : "Pendiente"}
                      </Badge>
                    </div>
                    <p className="text-gray-600">
                      Miembro desde {new Date().getFullYear()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información de contacto */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {driver.phone && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Phone className="w-6 h-6 text-amber-600" />
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-semibold text-gray-900">{driver.phone}</p>
                    </div>
                  </div>
                )}
                {driver.email && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Mail className="w-6 h-6 text-amber-600" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{driver.email}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Stats y verificación */}
          <div className="space-y-6">
            {/* Estado de verificación */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Verificación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">KYC</span>
                  </div>
                  <Badge variant={driver.kycVerified ? "default" : "secondary"}>
                    {driver.kycVerified ? "Verificado" : "Pendiente"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Documentos</span>
                  </div>
                  <Badge
                    variant={
                      driver.documentsStatus === "approved" ? "default" : "secondary"
                    }
                  >
                    {driver.documentsStatus === "approved" ? "Aprobados" : "Pendiente"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Modelo de pago */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Modelo de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-amber-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-2">Plan Actual</p>
                  <p className="text-xl font-bold text-amber-800">
                    {driver.paymentModel === "subscription" ? "Suscripción" : "Comisión"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas rápidas */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Viajes Completados</span>
                  <span className="font-semibold text-gray-900">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Calificación Promedio</span>
                  <span className="font-semibold text-gray-900">
                    {driver.rating?.toFixed(1) || "5.0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ganancias Totales</span>
                  <span className="font-semibold text-green-600">$0.00</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
