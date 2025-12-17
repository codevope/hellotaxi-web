"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, User, UserCog, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { SOSAlert, User as AppUser } from "@/lib/types";

export type EnrichedSOSAlert = Omit<SOSAlert, "driver" | "passenger"> & {
  driver: AppUser; // Ahora driver es User con datos completos
  passenger: AppUser;
};

const statusConfig = {
  pending: { label: "Pendiente", variant: "destructive" as const },
  attended: { label: "Atendida", variant: "secondary" as const },
};

const triggeredByConfig = {
  passenger: {
    label: "Pasajero",
    icon: <User className="h-4 w-4 mr-2" />,
  },
  driver: {
    label: "Conductor",
    icon: <UserCog className="h-4 w-4 mr-2" />,
  },
};

export const sosAlertsColumns = (
  handleUpdateStatus: (alertId: string) => Promise<void>,
  updatingId: string | null
): ColumnDef<EnrichedSOSAlert>[] => [
  {
    accessorKey: "triggeredBy",
    header: "Iniciada por",
    cell: ({ row }) => {
      const alert = row.original;
      const config = triggeredByConfig[alert.triggeredBy];
      const name =
        alert.triggeredBy === "passenger"
          ? alert.passenger.name
          : alert.driver.name;

      return (
        <div className="flex items-center">
          {config.icon}
          <div>
            <div className="font-medium">{config.label}</div>
            <div className="text-sm text-muted-foreground">{name}</div>
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const alert = row.original;
      const name =
        alert.triggeredBy === "passenger"
          ? alert.passenger.name
          : alert.driver.name;
      return (
        triggeredByConfig[alert.triggeredBy].label
          .toLowerCase()
          .includes(value.toLowerCase()) ||
        name.toLowerCase().includes(value.toLowerCase())
      );
    },
  },
  {
    accessorKey: "rideId",
    header: "Detalles del Viaje",
    cell: ({ row }) => {
      const alert = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">Pasajero: {alert.passenger.name}</div>
          {alert.passenger.phone && (
            <div className="text-sm text-muted-foreground">
              {alert.passenger.phone}
            </div>
          )}
          <div className="font-medium">
            Conductor: {alert.driver.name}
          </div>
          {alert.driver.phone && (
            <div className="text-sm text-muted-foreground">
            {alert.driver.phone}
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            ID Viaje: {alert.rideId}
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const alert = row.original;
      const searchValue = value.toLowerCase();
      return (
        alert.passenger.name.toLowerCase().includes(searchValue) ||
        alert.driver.name.toLowerCase().includes(searchValue) ||
        alert.rideId.toLowerCase().includes(searchValue) ||
        (alert.passenger.phone?.toLowerCase().includes(searchValue) ?? false) ||
        (alert.driver.phone?.toLowerCase().includes(searchValue) ?? false)
      );
    },
  },
  {
    accessorKey: "date",
    header: "Fecha y Hora",
    cell: ({ row }) => {
      const date = new Date(row.original.date);
      return date.toLocaleString("es-PE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const alert = row.original;
      if (updatingId === alert.id) {
        return <Loader2 className="h-4 w-4 animate-spin" />;
      }
      return (
        <Badge variant={statusConfig[alert.status].variant}>
          {statusConfig[alert.status].label}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return statusConfig[row.original.status].label
        .toLowerCase()
        .includes(value.toLowerCase());
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const alert = row.original;

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/rides/${alert.rideId}`}>
                  Ver detalles del viaje
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(alert.id)}
                disabled={alert.status === "attended" || updatingId === alert.id}
              >
                Marcar como Atendida
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
