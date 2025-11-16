"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Star } from "lucide-react";
import { useDriverAuth } from '@/hooks/auth/use-driver-auth';

export default function DriverProfilePage() {
  const { driver } = useDriverAuth();

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Perfil del Conductor</CardTitle>
            <p className="text-muted-foreground">
              Tu información personal y configuración de cuenta
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Información Personal */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={driver?.avatarUrl || ""} alt={driver?.name || ""} />
                  <AvatarFallback className="text-xl">
                    {driver?.name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-semibold">{driver?.name || 'Conductor'}</h3>
                  <p className="text-gray-600 text-lg">Conductor Registrado</p>
                  <p className="text-gray-500">ID: {driver?.id || 'No disponible'}</p>
                </div>
              </div>

              {/* Detalles del Conductor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Estado</Label>
                  <Badge variant={driver?.status === 'available' ? 'default' : 'secondary'} className="mt-1">
                    {driver?.status === 'available' ? 'Disponible' : 
                     driver?.status === 'on-ride' ? 'En Viaje' : 'No Disponible'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Documentos</Label>
                  <Badge variant={driver?.documentsStatus === 'approved' ? 'default' : 'secondary'} className="mt-1">
                    {driver?.documentsStatus === 'approved' ? 'Aprobados' : 
                     driver?.documentsStatus === 'pending' ? 'Pendientes' : 'Rechazados'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">KYC Verificado</Label>
                  <Badge variant={driver?.kycVerified ? 'default' : 'secondary'} className="mt-1">
                    {driver?.kycVerified ? 'Verificado' : 'No Verificado'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Calificación</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-5 w-5 fill-current text-yellow-400" />
                    <span className="text-lg font-semibold">{driver?.rating?.toFixed(1) || 'Sin calificar'}</span>
                  </div>
                </div>
              </div>

              {/* Configuración de Vehículo */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Información del Vehículo</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Marca y Modelo:</span>
                      <p className="font-medium">{driver?.vehicle?.brand} {driver?.vehicle?.model}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Placa:</span>
                      <p className="font-medium">{driver?.vehicle?.licensePlate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Editar Perfil
                </Button>
                <Button variant="outline" className="w-full sm:w-auto">
                  Cambiar Contraseña
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}