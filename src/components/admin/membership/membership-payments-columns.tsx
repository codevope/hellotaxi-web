"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import type { MembershipPayment, EnrichedDriver } from "@/lib/types";

export type EnrichedMembershipPayment = MembershipPayment & {
  driver?: EnrichedDriver;
};

export const membershipPaymentsColumns: ColumnDef<EnrichedMembershipPayment>[] = [
  {
    accessorKey: "driver",
    header: "Conductor",
    cell: ({ row }) => {
      const driver = row.original.driver;
      if (!driver) {
        return <span className="text-muted-foreground">Desconocido</span>;
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
    accessorKey: "periodStart",
    header: "Período",
    cell: ({ row }) => {
      const payment = row.original;
      if (!payment.periodStart || !payment.periodEnd) return "-";
      
      try {
        const start = new Date(payment.periodStart);
        const end = new Date(payment.periodEnd);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-";
        
        return (
          <div className="text-sm">
            {format(start, "dd MMM", { locale: es })} - {format(end, "dd MMM yyyy", { locale: es })}
          </div>
        );
      } catch {
        return "-";
      }
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
    accessorKey: "amount",
    header: () => <div className="text-right">Monto</div>,
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return <div className="text-right font-medium">S/ {amount.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "dueDate",
    header: "Vencimiento",
    cell: ({ row }) => {
      const dueDate = row.getValue("dueDate") as string;
      if (!dueDate) return "-";
      
      try {
        const date = new Date(dueDate);
        if (isNaN(date.getTime())) return "-";
        return format(date, "dd MMM yyyy", { locale: es });
      } catch {
        return "-";
      }
    },
  },
  {
    accessorKey: "paidDate",
    header: "Fecha de Pago",
    cell: ({ row }) => {
      const paidDate = row.getValue("paidDate") as string | undefined;
      if (!paidDate) {
        return <span className="text-sm text-muted-foreground">-</span>;
      }
      
      try {
        const date = new Date(paidDate);
        if (isNaN(date.getTime())) return "-";
        return (
          <span className="text-sm text-green-600">
            {format(date, "dd MMM yyyy", { locale: es })}
          </span>
        );
      } catch {
        return "-";
      }
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">Estado</div>,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      
      if (status === "paid") {
        return (
          <div className="flex justify-center">
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="mr-1 h-3 w-3" />
              Pagado
            </Badge>
          </div>
        );
      } else if (status === "overdue") {
        return (
          <div className="flex justify-center">
            <Badge variant="destructive">
              <AlertCircle className="mr-1 h-3 w-3" />
              Vencido
            </Badge>
          </div>
        );
      } else if (status === "cancelled") {
        return (
          <div className="flex justify-center">
            <Badge variant="outline" className="text-muted-foreground">
              <XCircle className="mr-1 h-3 w-3" />
              Cancelado
            </Badge>
          </div>
        );
      } else {
        return (
          <div className="flex justify-center">
            <Badge variant="secondary">
              <Clock className="mr-1 h-3 w-3" />
              Pendiente
            </Badge>
          </div>
        );
      }
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
];
