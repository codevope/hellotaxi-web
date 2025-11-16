"use client";

import { useDriverAuth } from "@/hooks/use-driver-auth";
import DriverDocuments from "@/components/driver/documents";
import { Loader2 } from "lucide-react";

/**
 * Documentos del Conductor - Vista Mobile
 *
 * Ruta: /driver/(mobile)/documents
 */
export default function MobileDriverDocuments() {
  const { driver, loading } = useDriverAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Documentos</h1>
      <DriverDocuments driver={driver} />
    </div>
  );
}
