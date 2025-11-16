"use client";

/**
 * Perfil de Usuario - Vista Mobile
 *
 * Características:
 * - Diseño en tarjetas verticales
 * - Formulario optimizado para touch
 * - Avatar grande y visible
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
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MobileProfilePage() {
  const { user, appUser, signOut } = useAuth();
  const { isDriver } = useDriverAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header con Avatar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
              <AvatarFallback className="bg-blue-100 text-blue-800 text-3xl">
                {user?.displayName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-xl font-bold">{user?.displayName || "Usuario"}</h2>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            {isDriver && (
              <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                <Car className="w-4 h-4" />
                <span>Conductor</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-xs text-gray-600">
              Nombre
            </Label>
            <Input
              id="name"
              defaultValue={user?.displayName || ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-xs text-gray-600">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              defaultValue={user?.email || ""}
              disabled
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-xs text-gray-600">
              Teléfono
            </Label>
            <Input
              id="phone"
              type="tel"
              defaultValue={appUser?.phone || ""}
              className="mt-1"
            />
          </div>
          <Button className="w-full">Guardar Cambios</Button>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      {appUser && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {appUser.ridesCount || 0}
                </div>
                <div className="text-xs text-gray-600">Viajes</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600 flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 fill-current" />
                  {appUser.rating?.toFixed(1) || "5.0"}
                </div>
                <div className="text-xs text-gray-600">Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <Card>
        <CardContent className="p-0">
          {isDriver && (
            <Link
              href="/mobile/driver"
              className="flex items-center justify-between p-4 border-b hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-gray-600" />
                <span>Panel de Conductor</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 text-red-600"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
