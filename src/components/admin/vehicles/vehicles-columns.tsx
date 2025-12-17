"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Vehicle, User } from "@/lib/types";

export type EnrichedVehicle = Vehicle & { driver?: User };

export const vehiclesColumns: ColumnDef<EnrichedVehicle>[] = [
  {
    accessorKey: "brand",
    header: "Vehículo",
    cell: ({ row }) => {
      const vehicle = row.original;
      return (
        <div>
          <div className="font-medium">
            {vehicle.brand} {vehicle.model}
          </div>
          <div className="text-sm text-muted-foreground">
            {vehicle.year} - {vehicle.color}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "licensePlate",
    header: "Placa",
    cell: ({ row }) => {
      return <Badge variant="secondary">{row.getValue("licensePlate")}</Badge>;
    },
  },
  {
    accessorKey: "serviceType",
    header: "Tipo de Servicio",
    cell: ({ row }) => {
      const serviceType = row.getValue("serviceType") as string;
      const labels: Record<string, string> = {
        economy: "Económico",
        comfort: "Confort",
        exclusive: "Exclusivo",
      };
      return (
        <Badge variant="outline" className="capitalize">
          {labels[serviceType] || serviceType}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "driver",
    header: "Conductor Asignado",
    cell: ({ row }) => {
      const driver = row.original.driver;
      if (!driver) {
        return <span className="text-muted-foreground">No asignado</span>;
      }
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={driver.avatarUrl} alt={driver.name} />
            <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{driver.name}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const driver = row.original.driver;
      if (!driver) return false;
      return driver.name.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const vehicle = row.original;
      if (!vehicle.driver || !vehicle.driverId) {
        return null;
      }
      return (
        <div className="text-right">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/drivers/${vehicle.driverId}`}>
              Ver Conductor
            </Link>
          </Button>
        </div>
      );
    },
  },
];
