"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreVertical, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Driver, EnrichedDriver, PaymentModel, MembershipStatus, Vehicle } from "@/lib/types";
import Link from "next/link";

// Usamos `EnrichedDriver` exportado desde `@/lib/types` (incluye `user`, `name`, `avatarUrl`, `rating`, etc.)

const statusConfig = {
  available: { label: "Disponible", variant: "default" as const },
  unavailable: { label: "No Disponible", variant: "secondary" as const },
  "on-ride": { label: "En Viaje", variant: "outline" as const },
};

const documentStatusConfig = {
  approved: {
    label: "Aprobado",
    icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
    variant: "secondary" as const,
  },
  pending: {
    label: "Pendiente",
    icon: <ShieldAlert className="h-4 w-4 text-yellow-500" />,
    variant: "outline" as const,
  },
  rejected: {
    label: "Rechazado",
    icon: <ShieldX className="h-4 w-4 text-red-500" />,
    variant: "destructive" as const,
  },
};

const paymentModelConfig: Record<PaymentModel, string> = {
  commission: "Comisión por Viaje",
  membership: "Membresía Semanal",
};

const membershipStatusConfig: Record<
  MembershipStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Activa", variant: "default" },
  pending: { label: "Pendiente", variant: "outline" },
  expired: { label: "Vencida", variant: "destructive" },
};

export const driversColumns: ColumnDef<EnrichedDriver>[] = [
  {
    accessorKey: "name",
    id: "conductor",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Conductor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const driver = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={driver.avatarUrl} alt={driver.name} />
            <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{driver.name}</div>
            <div className="text-sm text-muted-foreground">
              Rating: {driver.rating.toFixed(1)} ★
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "vehicle",
    header: "Vehículo",
    cell: ({ row }) => {
      const vehicle = row.original.vehicle;
      if (!vehicle) {
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Sin asignar
          </Badge>
        );
      }
      return (
        <div>
          <div>
            {vehicle.brand} {vehicle.model}
          </div>
          <div className="text-sm text-muted-foreground">
            {vehicle.licensePlate}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "serviceType",
    header: "Tipo de Servicio",
    accessorFn: (row) => row.vehicle?.serviceType || "sin-asignar",
    cell: ({ row }) => {
      const vehicle = row.original.vehicle;
      if (!vehicle) {
        return (
          <Badge variant="secondary" className="text-muted-foreground">
            N/A
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="capitalize">
          {vehicle.serviceType === 'economy' ? 'Económico' : 
           vehicle.serviceType === 'comfort' ? 'Confort' : 
           vehicle.serviceType === 'exclusive' ? 'Exclusivo' : vehicle.serviceType}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Estado Actual",
    cell: ({ row }) => {
      const config = statusConfig[row.original.status];
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: "documentsStatus",
    header: "Documentos",
    cell: ({ row }) => {
      const config = documentStatusConfig[row.original.documentsStatus];
      return (
        <Badge variant={config.variant} className="flex items-center gap-1.5 w-fit">
          {config.icon}
          <span>{config.label}</span>
        </Badge>
      );
    },
  },
  {
    accessorKey: "paymentModel",
    header: "Modelo de Pago",
    cell: ({ row }) => {
      const driver = row.original;
      return (
        <div>
          <div className="font-medium">{paymentModelConfig[driver.paymentModel]}</div>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const driver = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/drivers/${driver.id}`}>Ver detalles</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
