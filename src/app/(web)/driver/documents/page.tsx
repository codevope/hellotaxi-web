"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import DriverDocuments from "@/components/driver/documents";
import { useDriverAuth } from "@/hooks/use-driver-auth";
import Link from "next/link";

export default function DriverDocumentsPage() {
  const { driver, setDriver, loading } = useDriverAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="container mx-auto p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">No se pudo cargar la información del conductor</h2>
              <p className="text-muted-foreground mb-4">
                Necesitas estar autenticado como conductor para ver tus documentos.
              </p>
              <Button asChild>
                <Link href="/driver">Volver al Panel</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header con botón de regreso */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild size="sm">
            <Link href="/driver" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al Panel
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Documentos del Conductor</h1>
            <p className="text-muted-foreground">
              Gestiona y revisa todos tus documentos de conductor
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Mis Documentos</CardTitle>
            <p className="text-muted-foreground">
              Mantén tus documentos actualizados para seguir operando como conductor
            </p>
          </CardHeader>
          <CardContent>
            <DriverDocuments 
              driver={driver} 
              onUpdate={(updatedDriver) => setDriver(updatedDriver)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}