"use client";

import { useDriverAuth } from "@/hooks/use-driver-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, Phone, Mail, MapPin, Shield, Calendar } from "lucide-react";

/**
 * Perfil del Conductor - Vista Mobile
 *
 * Ruta: /driver/(mobile)/profile
 */
export default function MobileDriverProfile() {
  const { driver, loading } = useDriverAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">No se pudo cargar el perfil</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header con avatar */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4 border-4 border-amber-200">
              <AvatarImage src={driver.avatarUrl} alt={driver.name} />
              <AvatarFallback className="bg-amber-100 text-amber-800 text-3xl font-bold">
                {driver.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{driver.name}</h1>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-semibold text-gray-700">
                {driver.rating?.toFixed(1) || "5.0"}
              </span>
            </div>
            <Badge
              variant={driver.documentsStatus === "approved" ? "default" : "secondary"}
              className="mb-2"
            >
              {driver.documentsStatus === "approved" ? "Verificado" : "Pendiente"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Información de contacto */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {driver.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{driver.phone}</span>
            </div>
          )}
          {driver.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{driver.email}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estado de verificación */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Estado de Verificación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">KYC Verificado</span>
            </div>
            <Badge variant={driver.kycVerified ? "default" : "secondary"}>
              {driver.kycVerified ? "Sí" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">Documentos</span>
            </div>
            <Badge
              variant={driver.documentsStatus === "approved" ? "default" : "secondary"}
            >
              {driver.documentsStatus === "approved" ? "Aprobados" : "Pendiente"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Modelo de pago */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Modelo de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="text-base px-4 py-2">
            {driver.paymentModel === "subscription" ? "Suscripción" : "Comisión"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
