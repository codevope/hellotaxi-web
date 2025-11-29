"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Ride, User, Driver, Vehicle } from "@/lib/types";

type EnrichedRide = Omit<Ride, "driver" | "passenger" | "vehicle"> & {
  driver?: Driver;
  passenger: User;
  vehicle?: Vehicle;
};

const rideStatusConfig: Record<
  Ride["status"],
  { label: string; variant: "secondary" | "default" | "destructive" }
> = {
  searching: { label: "Buscando", variant: "default" },
  accepted: { label: "Aceptado", variant: "default" },
  arrived: { label: "Ha llegado", variant: "default" },
  completed: { label: "Completado", variant: "secondary" },
  "in-progress": { label: "En Progreso", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  "counter-offered": { label: "Contraoferta", variant: "default" },
};

export const driverRidesColumns: ColumnDef<EnrichedRide>[] = [
  {
    accessorKey: "passenger",
    id: "pasajero",
    header: "Pasajero",
    accessorFn: (row) => row.passenger.name,
    cell: ({ row }) => {
      const passenger = row.original.passenger;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={passenger.avatarUrl} alt={passenger.name} />
            <AvatarFallback>{passenger.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{passenger.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (!row.original.date) return <div className="text-muted-foreground">-</div>;
      try {
        return <div>{format(new Date(row.original.date), "dd/MM/yyyy")}</div>;
      } catch (error) {
        return <div className="text-muted-foreground">Fecha inválida</div>;
      }
    },
  },
  {
    accessorKey: "fare",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tarifa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium text-right">S/{row.original.fare.toFixed(2)}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const config = rideStatusConfig[row.original.status];
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
];
