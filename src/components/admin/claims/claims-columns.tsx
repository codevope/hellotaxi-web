"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { Claim, User } from "@/lib/types";

export type EnrichedClaim = Omit<Claim, "claimant"> & {
  claimant: User;
};

const statusConfig = {
  open: { label: "Abierto", variant: "destructive" as const },
  "in-progress": { label: "En Proceso", variant: "default" as const },
  resolved: { label: "Resuelto", variant: "secondary" as const },
};

export const claimsColumns: ColumnDef<EnrichedClaim>[] = [
  {
    accessorKey: "claimant",
    header: "Usuario",
    cell: ({ row }) => {
      const claimant = row.original.claimant;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={claimant.avatarUrl} alt={claimant.name} />
            <AvatarFallback>{claimant.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{claimant.name}</div>
            <div className="text-sm text-muted-foreground">
              ID Viaje: {row.original.rideId}
            </div>
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return row.original.claimant.name
        .toLowerCase()
        .includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "reason",
    header: "Motivo",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.reason}</div>;
    },
    filterFn: (row, id, value) => {
      return row.original.reason.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "details",
    header: "Descripción",
    cell: ({ row }) => {
      const details = row.original.details;
      if (!details) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="max-w-md truncate" title={details}>
          {details}
        </div>
      );
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
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={statusConfig[status].variant}>
          {statusConfig[status].label}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const status = row.original.status;
      return statusConfig[status].label
        .toLowerCase()
        .includes(value.toLowerCase());
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const claim = row.original;

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
                <Link href={`/admin/claims/${claim.id}`}>Gestionar reclamo</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
