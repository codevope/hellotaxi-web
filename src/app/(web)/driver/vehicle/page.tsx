"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { useDriverAuth } from "@/hooks/use-driver-auth";

export default function DriverVehiclePage() {
  const { driver } = useDriverAuth();

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Mi Vehículo</CardTitle>
            <p className="text-muted-foreground">
              Información y detalles de tu vehículo registrado
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Marca</Label>
                  <p className="text-lg font-semibold">{driver?.vehicle?.brand || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Modelo</Label>
                  <p className="text-lg font-semibold">{driver?.vehicle?.model || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Año</Label>
                  <p className="text-lg font-semibold">{driver?.vehicle?.year || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Placa</Label>
                  <p className="text-lg font-semibold">{driver?.vehicle?.licensePlate || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Color</Label>
                  <p className="text-lg font-semibold">{driver?.vehicle?.color || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Estado</Label>
                  <p className="text-lg font-semibold">{driver?.vehicle?.status || 'No registrado'}</p>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button variant="outline" className="w-full sm:w-auto">
                  <FileText className="mr-2 h-4 w-4" />
                  Editar Información del Vehículo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}