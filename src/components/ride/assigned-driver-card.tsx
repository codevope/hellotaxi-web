'use client';

import { X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DriverRating } from '@/components/driver/driver-rating';
import { PriceDisplay } from '@/components/forms/price-display';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Ride, DriverWithVehicleInfo } from '@/lib/types';

interface AssignedDriverCardProps {
  activeRide: Ride;
  assignedDriver: DriverWithVehicleInfo;
  onOpenCancelDialog: () => void;
}

export function AssignedDriverCard({
  activeRide,
  assignedDriver,
  onOpenCancelDialog,
}: AssignedDriverCardProps) {
  const getStatusHeader = () => {
    switch (activeRide.status) {
      case 'accepted':
        return {
          title: 'Conductor en Camino',
          description: 'Preparándose para recogerte',
        };
      case 'arrived':
        return {
          title: '¡Tu Conductor ha Llegado!',
          description: 'Dirígete al punto de encuentro',
        };
      case 'in-progress':
        return {
          title: 'Viaje en Curso',
          description: 'Disfruta tu viaje seguro',
        };
      default:
        return {
          title: 'Viaje Activo',
          description: 'Tu viaje está en progreso',
        };
    }
  };

  const statusHeader = getStatusHeader();

  return (
    <div className="space-y-4">
      {/* Status Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] p-5 shadow-xl">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="relative space-y-1">
          <h3 className="text-xl font-bold text-white">
            {statusHeader.title}
          </h3>
          <p className="text-sm text-[#f0ff22]">
            {statusHeader.description}
          </p>
        </div>
      </div>

      {/* Driver Card - Diseño Premium */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="bg-gradient-to-r from-[#F2F2F2] to-white p-4 sm:p-6">
          {/* Sección superior: Avatar, Nombre/Rating y Precio */}
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
            {/* Avatar con borde gradiente - Izquierda */}
            <div className="relative flex-shrink-0">
              <Avatar className="relative h-14 w-14 sm:h-16 sm:w-16 border-4 border-white shadow-md">
                <AvatarImage
                  src={assignedDriver.avatarUrl}
                  alt={assignedDriver.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-[#0477BF] to-[#049DD9] text-lg sm:text-xl font-bold text-white">
                  {assignedDriver.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Centro: Nombre y Rating */}
            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-lg font-bold text-[#2E4CA6]">
                {assignedDriver.name}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <DriverRating
                  rating={assignedDriver.rating}
                  size="lg"
                  showLabel={false}
                />
              </div>
            </div>

            {/* Derecha: Precio */}
            <div className="flex-shrink-0">
              <PriceDisplay
                amount={activeRide.fare}
                label="Tarifa"
                size="lg"
                variant="highlight"
              />
            </div>
          </div>

          {/* Sección inferior: Datos del vehículo */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Vehículo</p>
                <p className="text-sm sm:text-base font-semibold text-gray-700">
                  {assignedDriver.vehicleBrand} {assignedDriver.vehicleModel}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Año</p>
                <p className="text-sm sm:text-base font-semibold text-gray-700">
                  {assignedDriver.vehicleYear}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Color</p>
                <p className="text-sm sm:text-base font-semibold text-gray-700">
                  {assignedDriver.vehicleColor}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Placa</p>
                <p className="text-sm sm:text-base font-mono font-bold text-[#0477BF]">
                  {assignedDriver.licensePlate}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-100 p-4">
          {activeRide.status === 'accepted' ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 border-2 border-red-200 bg-white font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-500 hover:text-red-50"
                >
                  <X className="mr-2 h-4 w-4" /> Cancelar Viaje
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Seguro que quieres cancelar?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción podría afectar negativamente tu
                    calificación como pasajero. ¿Aún deseas
                    cancelar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    No, continuar viaje
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={onOpenCancelDialog}>
                    Sí, cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="outline"
              disabled
              className="w-full h-12 border-2 border-gray-200 bg-gray-50 font-semibold text-gray-400 cursor-not-allowed"
            >
              <X className="mr-2 h-4 w-4" /> No se puede cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
