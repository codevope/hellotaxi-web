"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Coupon } from "@/lib/types";

const statusConfig = {
  active: { label: "Activo", variant: "default" as const },
  expired: { label: "Expirado", variant: "secondary" as const },
  disabled: { label: "Desactivado", variant: "destructive" as const },
};

interface PromotionsColumnsProps {
  onEdit: (coupon: Coupon) => void;
  onToggleStatus: (coupon: Coupon) => void;
}

export const createPromotionsColumns = ({
  onEdit,
  onToggleStatus,
}: PromotionsColumnsProps): ColumnDef<Coupon>[] => [
  {
    accessorKey: "code",
    header: "Código",
    cell: ({ row }) => {
      const coupon = row.original;
      return (
        <div>
          <div className="font-medium text-primary">{coupon.code}</div>
          {coupon.minSpend && (
            <div className="text-xs text-muted-foreground">
              Gasto mín: S/{coupon.minSpend}
            </div>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return row.original.code.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "value",
    header: "Descuento",
    cell: ({ row }) => {
      const coupon = row.original;
      return (
        <div className="font-semibold">
          {coupon.discountType === "percentage"
            ? `${coupon.value}%`
            : `S/${coupon.value.toFixed(2)}`}
        </div>
      );
    },
  },
  {
    accessorKey: "expiryDate",
    header: "Caducidad",
    cell: ({ row }) => {
      return format(new Date(row.original.expiryDate), "dd/MM/yyyy");
    },
  },
  {
    accessorKey: "usageLimit",
    header: "Límite de Uso",
    cell: ({ row }) => {
      const coupon = row.original;
      if (!coupon.usageLimit) return <span className="text-muted-foreground">Ilimitado</span>;
      const used = coupon.timesUsed || 0;
      return (
        <div className="text-sm">
          <span className={cn(used >= coupon.usageLimit && "text-red-600 font-semibold")}>
            {used} / {coupon.usageLimit}
          </span>
        </div>
      );
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
      const coupon = row.original;

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
              <DropdownMenuItem onClick={() => onEdit(coupon)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className={cn(
                      coupon.status === "active"
                        ? "text-destructive"
                        : "text-green-600"
                    )}
                  >
                    {coupon.status === "active" ? "Desactivar" : "Activar"}
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción cambiará el estado del cupón "{coupon.code}" a{" "}
                      <span className="font-bold">
                        {coupon.status === "active" ? "desactivado" : "activo"}
                      </span>
                      .
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onToggleStatus(coupon)}>
                      Sí, continuar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
