"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDriverRideHistory } from "@/hooks/driver/use-driver-ride-history";
import { useDriverAuth } from '@/hooks/auth/use-driver-auth';
import { Skeleton } from "@/components/ui/skeleton";
import { History, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EnrichedHistoryRide } from "@/hooks/driver/use-driver-ride-history";

const columns: ColumnDef<EnrichedHistoryRide>[] = [
  {
    accessorKey: "date",
    header: "Fecha",
    cell: ({ row }) => {
      const date = row.getValue("date") as string;
      return date ? format(new Date(date), "dd/MMM/yyyy", { locale: es }) : '-';
    },
  },
  {
    accessorKey: "date",
    id: "time",
    header: "Hora",
    cell: ({ row }) => {
      const date = row.original.date;
      return date ? format(new Date(date), "HH:mm", { locale: es }) : '-';
    },
  },
  {
    id: "passenger",
    accessorFn: (row) => row.passenger?.name,
    header: "Pasajero",
    cell: ({ row }) => {
      return row.original.passenger?.name || 'N/A';
    },
  },
  {
    accessorKey: "pickup",
    header: "Origen",
    cell: ({ row }) => {
      return row.original.pickupLocation?.address || row.original.pickup || '-';
    },
  },
  {
    accessorKey: "dropoff",
    header: "Destino",
    cell: ({ row }) => {
      return row.original.dropoffLocation?.address || row.original.dropoff || '-';
    },
  },
  {
    accessorKey: "fare",
    header: "Total",
    cell: ({ row }) => {
      const fare = row.getValue("fare") as number;
      return <span className="font-semibold">S/{fare?.toFixed(2) || '0.00'}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "completed" ? "default" : status === "cancelled" ? "destructive" : "secondary"}>
          {status === "completed" ? "Completado" : 
           status === "cancelled" ? "Cancelado" : 
           status === "in-progress" ? "En Progreso" :
           status === "accepted" ? "Aceptado" :
           status === "arrived" ? "Llegó" :
           status}
        </Badge>
      );
    },
  },
];

export default function HistorialPage() {
  const { driver, loading: authLoading } = useDriverAuth();
  const { rides: allRides, loading: ridesLoading } = useDriverRideHistory(driver, 50);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: allRides || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-6 w-6" />
              Historial de Viajes
            </CardTitle>
            <CardDescription>
              Historial completo de todos tus viajes realizados como conductor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ridesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-24" />
                    <Skeleton className="h-12 w-20" />
                    <Skeleton className="h-12 w-32" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 w-24" />
                    <Skeleton className="h-12 w-28" />
                  </div>
                ))}
              </div>
            ) : allRides && allRides.length > 0 ? (
              <div className="space-y-4">
                {/* Filtro de búsqueda */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar por pasajero..."
                    value={(table.getColumn("passenger")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      table.getColumn("passenger")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                  />
                </div>

                {/* Tabla */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => {
                            return (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            No se encontraron resultados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-between px-2">
                  <div className="text-sm text-muted-foreground">
                    Página {table.getState().pagination.pageIndex + 1} de{" "}
                    {table.getPageCount()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <History className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">Sin historial</h3>
                <p className="text-lg">No tienes viajes completados aún.</p>
                <p className="text-sm mt-2">Una vez que completes tu primer viaje, aparecerá aquí.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}