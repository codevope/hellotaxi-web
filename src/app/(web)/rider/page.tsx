"use client";

import { useAuth } from "@/hooks/auth/use-auth";
import { useDriverAuth } from "@/hooks/auth/use-driver-auth";
import { useRiderNotifications } from "@/hooks/rider/use-rider-notifications";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, Shield, LayoutDashboard } from "lucide-react";
import Link from "next/link";

// Importar componente desktop responsivo
import RiderView from "./components/rider-view";

export default function RiderPage() {
  const { user, appUser, loading } = useAuth();
  const { isDriver, loading: driverLoading } = useDriverAuth();

  // Hook de notificaciones para el rider
  const riderNotifications = useRiderNotifications(appUser?.id);


  if (loading || driverLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center md:py-24">
        <Card className="max-w-md p-8">
          <CardHeader>
            <CardTitle>Acceso Requerido</CardTitle>
            <CardDescription> Debes iniciar sesión para pedir un viaje.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>  
              <Link href="/login">
                <LogIn className="mr-2" />
                Iniciar Sesión
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has complete profile (Google + Phone; contraseña opcional)
  const providerIds = user.providerData.map((p) => p.providerId);
  const hasGoogle = providerIds.includes("google.com");
  const hasPhoneInProfile = appUser?.phone && appUser.phone.trim().length > 0;
  const isProfileComplete = hasGoogle && hasPhoneInProfile;

  if (!isProfileComplete) {
    return (
      <div className="flex flex-col items-center justify-center p-4 py-16 text-center md:py-24">
        <Card className="max-w-md p-8">
          <CardHeader>
            <div className="flex flex-col items-center gap-4">
              <Shield className="h-16 w-16 text-amber-500" />
              <CardTitle>Perfil Incompleto</CardTitle>
            </div>
            <CardDescription>
              Para pedir un viaje necesitas completar tu perfil de seguridad:<br />
              <span className="text-xs text-gray-500">Solo necesitas vincular tu cuenta Google y registrar tu teléfono.</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {hasGoogle ? (
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={hasGoogle ? "text-green-700" : "text-gray-500"}>
                  Cuenta Google vinculada
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {hasPhoneInProfile ? (
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={hasPhoneInProfile ? "text-green-700" : "text-gray-500"}>
                  Teléfono registrado
                </span>
              </div>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href="/profile">
                <Shield className="mr-2 h-4 w-4" />
                Completar mi Perfil
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDriver) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center md:py-24">
        <Card className="max-w-md p-8">
          <CardHeader>
            <CardTitle>Función solo para Pasajeros</CardTitle>
            <CardDescription>
              Estás en tu rol de conductor. Para pedir un viaje, necesitas
              volver a tu rol de pasajero desde tu perfil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/driver">
                <LayoutDashboard className="mr-2" />
                Ir a mi Panel de Conductor
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Siempre renderizar la versión desktop de manera responsiva
  return <RiderView notifications={riderNotifications} />;
}