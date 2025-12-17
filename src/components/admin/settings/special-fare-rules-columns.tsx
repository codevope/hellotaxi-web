"use client";

import { ColumnDef } from "@tanstack/react-table";
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
import { es } from "date-fns/locale";
import type { SpecialFareRule } from "@/lib/types";

interface SpecialFareRulesColumnsProps {
  onEdit: (rule: SpecialFareRule) => void;
  onDelete: (id: string) => void;
}

export const createSpecialFareRulesColumns = ({
  onEdit,
  onDelete,
}: SpecialFareRulesColumnsProps): ColumnDef<SpecialFareRule>[] => [
  {
    accessorKey: "name",
    header: "Nombre del Evento",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.name}</div>;
    },
    filterFn: (row, id, value) => {
      return row.original.name.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "startDate",
    header: "Fecha de Inicio",
    cell: ({ row }) => {
      return format(new Date(row.original.startDate), "dd MMM yyyy", {
        locale: es,
      });
    },
  },
  {
    accessorKey: "endDate",
    header: "Fecha de Fin",
    cell: ({ row }) => {
      return format(new Date(row.original.endDate), "dd MMM yyyy", {
        locale: es,
      });
    },
  },
  {
    id: "period",
    header: "Período",
    cell: ({ row }) => {
      const rule = row.original;
      return (
        <div className="text-sm">
          {format(new Date(rule.startDate), "dd/MM/yy")} -{" "}
          {format(new Date(rule.endDate), "dd/MM/yy")}
        </div>
      );
    },
  },
  {
    accessorKey: "surcharge",
    header: "Recargo",
    cell: ({ row }) => {
      return (
        <div className="font-semibold text-primary">
          {row.original.surcharge}%
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const rule = row.original;

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
              <DropdownMenuItem onClick={() => onEdit(rule)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive"
                  >
                    Eliminar
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará permanentemente la regla "{rule.name}
                      ".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(rule.id)}>
                      Sí, eliminar
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
