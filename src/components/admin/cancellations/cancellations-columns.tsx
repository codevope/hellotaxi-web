"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, User, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { Ride, Driver, User as AppUser } from "@/lib/types";

export type EnrichedCancellation = Omit<Ride, "driver" | "passenger"> & {
  driver: Driver & { name: string; avatarUrl: string };
  passenger: AppUser;
};

const cancelledByConfig = {
  passenger: {
    label: "Pasajero",
    icon: <User className="h-4 w-4" />,
  },
  driver: {
    label: "Conductor",
    icon: <UserCog className="h-4 w-4" />,
  },
  system: {
    label: "Sistema",
    icon: <UserCog className="h-4 w-4" />,
  },
};

export const cancellationsColumns: ColumnDef<EnrichedCancellation>[] = [
  {
    accessorKey: "cancelledBy",
    header: "Cancelado Por",
    cell: ({ row }) => {
      const cancelledBy = row.original.cancelledBy;
      if (!cancelledBy) return "-";

      return (
        <div className="flex items-center gap-2 font-medium">
          {cancelledByConfig[cancelledBy].icon}
          <span>{cancelledByConfig[cancelledBy].label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const cancelledBy = row.original.cancelledBy;
      if (!cancelledBy) return false;
      return cancelledByConfig[cancelledBy].label
        .toLowerCase()
        .includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "cancellationReason",
    header: "Motivo",
    cell: ({ row }) => {
      const reason = row.original.cancellationReason?.reason;
      return (
        <div className="font-medium max-w-xs">
          {reason || "No especificado"}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const reason = row.original.cancellationReason?.reason;
      if (!reason) return false;
      return reason.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "passenger",
    header: "Pasajero",
    cell: ({ row }) => {
      const passenger = row.original.passenger;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={passenger.avatarUrl} alt={passenger.name} />
            <AvatarFallback>{passenger.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{passenger.name}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return row.original.passenger.name
        .toLowerCase()
        .includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "driver",
    header: "Conductor",
    cell: ({ row }) => {
      const driver = row.original.driver;
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
      return row.original.driver.name
        .toLowerCase()
        .includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "date",
    header: "Fecha",
    cell: ({ row }) => {
      const date = new Date(row.original.date);
      return date.toLocaleDateString("es-PE", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const ride = row.original;

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
                <Link href={`/admin/rides/${ride.id}`}>
                  Ver detalles del viaje
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
