"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History, Loader2 } from "lucide-react";
import { useDriverAuth } from '@/hooks/auth/use-driver-auth';
import { useDriverRideHistory } from "@/hooks/driver/use-driver-ride-history";

export default function HistorialPage() {
  const { driver, loading } = useDriverAuth();
  const { rides: allRides } = useDriverRideHistory(driver, 50);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-6 w-6" />
              Historial de Viajes
            </CardTitle>
            <CardDescription>
              Historial completo de todos tus viajes realizados como conductor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allRides && allRides.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Pasajero</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Calificación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allRides.map((ride: any) => (
                      <TableRow key={ride.id}>
                        <TableCell className="text-sm">
                          {ride.createdAt && format(ride.createdAt.toDate(), "dd/MMM/yyyy", { locale: es })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {ride.createdAt && format(ride.createdAt.toDate(), "HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {ride.passenger?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                          {ride.pickupLocation?.address}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                          {ride.dropoffLocation?.address}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          S/{ride.agreedPrice?.toFixed(2) || ride.fare?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ride.status === "completed" ? "default" : ride.status === "cancelled" ? "destructive" : "secondary"}>
                            {ride.status === "completed" ? "Completado" : 
                             ride.status === "cancelled" ? "Cancelado" : 
                             ride.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ride.passengerRating ? (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              <span className="text-sm">{ride.passengerRating}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <History className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">Sin historial</h3>
                <p className="text-lg">No tienes viajes completados aún.</p>
                <p className="text-sm mt-2">Una vez que completes tu primer viaje, aparecerá aquí.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}