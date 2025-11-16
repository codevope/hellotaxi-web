"use client";

/**
 * Perfil de Usuario - Vista Desktop
 *
 * Características:
 * - Layout de 2 columnas
 * - Información más detallada
 * - Estadísticas expandidas
 */

import { useAuth } from "@/hooks/auth/use-auth";
import { useDriverAuth } from "@/hooks/auth/use-driver-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  Home,
  Star,
  Car,
  LogOut,
  Settings,
  Calendar,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

export default function DesktopProfilePage() {
  const { user, appUser, signOut } = useAuth();
  const { isDriver } = useDriverAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">Gestiona tu información personal</p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna Izquierda - Avatar y Stats */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-32 h-32">
                  <AvatarImage
                    src={user?.photoURL || ""}
                    alt={user?.displayName || ""}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-4xl">
                    {user?.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-2xl font-bold">
                    {user?.displayName || "Usuario"}
                  </h2>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
                {isDriver && (
                  <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-medium">
                    <Car className="w-5 h-5" />
                    <span>Conductor Verificado</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          {appUser && (
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {appUser.ridesCount || 0}
                    </div>
                    <div className="text-sm text-gray-600">Viajes Totales</div>
                  </div>
                  <Car className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <div className="text-2xl font-bold text-amber-600 flex items-center gap-1">
                      <Star className="w-6 h-6 fill-current" />
                      {appUser.rating?.toFixed(1) || "5.0"}
                    </div>
                    <div className="text-sm text-gray-600">Calificación</div>
                  </div>
                </div>
                {appUser.createdAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Miembro desde{" "}
                      {format(appUser.createdAt.toDate(), "MMMM yyyy", {
                        locale: es,
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna Derecha - Información Personal */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    defaultValue={user?.displayName || ""}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ""}
                    disabled
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    defaultValue={appUser?.phone || ""}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    defaultValue={appUser?.address || ""}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Guardar Cambios</Button>
              </div>
            </CardContent>
          </Card>

          {isDriver && (
            <Card>
              <CardHeader>
                <CardTitle>Acceso Rápido</CardTitle>
                <CardDescription>
                  Accede a tus herramientas de conductor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/desktop/driver">
                  <Button className="w-full" size="lg">
                    <Car className="w-5 h-5 mr-2" />
                    Ir al Panel de Conductor
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
