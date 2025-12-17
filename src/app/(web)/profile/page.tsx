"use client";

import { useState, useEffect } from "react";
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
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import type { User } from "@/lib/types";
import { updatePassword } from "firebase/auth";
import { Star, Car, LogOut, Settings, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

export default function DesktopProfilePage() {
  // Estado para la contraseña
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Cambiar la contraseña usando Firebase Auth
  const handleSavePassword = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Error",
        description:
          "No se pudo identificar al usuario. Por favor, recarga la página.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }
    setIsSavingPassword(true);
    try {
      // Cambiar la contraseña en Firebase Auth
      await updatePassword(auth.currentUser, password);
      setPassword("");
      setConfirmPassword("");
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña de acceso se actualizó correctamente.",
      });
    } catch (error: any) {
      let errorMessage =
        "No se pudo actualizar la contraseña. Intenta de nuevo.";
      if (error?.code === "auth/requires-recent-login") {
        errorMessage =
          "Por seguridad, debes volver a iniciar sesión para cambiar la contraseña.";
      }
      toast({
        title: "Error al guardar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };
  const { user, appUser, signOut, setAppUser } = useAuth();
  const { isDriver } = useDriverAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estados cuando appUser cambie
  useEffect(() => {
    if (appUser) {
      setName(appUser.name || user?.displayName || "");
      // Mostrar el teléfono sin el prefijo +51 para que el usuario vea solo su número
      const phoneToDisplay = appUser.phone 
        ? appUser.phone.startsWith('+51') 
          ? appUser.phone.substring(3) 
          : appUser.phone
        : "";
      setPhone(phoneToDisplay);
      setAddress(appUser.address || "");
    }
  }, [appUser, user?.displayName]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleSaveProfile = async () => {
    if (!appUser?.id || !user) {
      toast({
        title: "Error",
        description:
          "No se pudo identificar al usuario. Por favor, recarga la página.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Siempre actualizar en users (datos personales están ahí)
      const userRef = doc(db, "users", appUser.id);

      // Procesar el teléfono: agregar prefijo +51 si no lo tiene
      let processedPhone = phone.trim();
      if (processedPhone && !processedPhone.startsWith('+51')) {
        // Limpiar el teléfono de espacios y caracteres especiales
        const cleanPhone = processedPhone.replace(/[\s\-\(\)]/g, '');
        processedPhone = `+51${cleanPhone}`;
      }

      const updateData = {
        name: name.trim(),
        phone: processedPhone,
        address: address.trim(),
      };

      // Verificar si el usuario ahora cumple con todos los requisitos para 'active'
      const providerIds = user.providerData.map((p) => p.providerId);
      const hasGoogle = providerIds.includes("google.com");
      const hasPhone = processedPhone.length > 0;

      // Perfil completo: Google autenticación + teléfono (contraseña es opcional)
      const newStatus: "active" | "blocked" | "incomplete" =
        hasGoogle && hasPhone ? "active" : "incomplete";

      await updateDoc(userRef, {
        ...updateData,
        status: newStatus,
      });

      // Actualizar appUser con los nuevos datos
      if (setAppUser) {
        const updatedAppUser: User = {
          ...appUser!,
          name: updateData.name,
          phone: updateData.phone,
          address: updateData.address,
          status: newStatus,
        };
        setAppUser(updatedAppUser);
      }

      toast({
        title: "Perfil actualizado",
        description:
          "Tu nombre, teléfono y dirección se guardaron correctamente",
      });
    } catch (error: any) {
      console.error("Error guardando perfil:", error);

      let errorMessage = "No se pudo actualizar tu perfil. Intenta de nuevo.";

      if (error?.code === "permission-denied") {
        errorMessage = "No tienes permisos para actualizar este perfil.";
      } else if (error?.code === "not-found") {
        errorMessage = "El perfil no existe en la base de datos.";
      }

      toast({
        title: "Error al guardar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(appUser?.name || user?.displayName || "");
    setPhone(appUser?.phone || "");
    setAddress(appUser?.address || "");
    toast({
      title: "Cambios descartados",
      description: "Se restauraron los valores originales",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mi Perfil</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gestiona tu información personal
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full sm:w-auto"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Columna Izquierda - Avatar y Stats */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32">
                  {appUser?.avatarUrl || user?.photoURL ? (
                    <AvatarImage
                      src={appUser?.avatarUrl || user?.photoURL || ""}
                      alt={appUser?.name || user?.displayName || "Usuario"}
                    />
                  ) : null}
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-3xl sm:text-4xl">
                    {appUser?.name?.charAt(0) ||
                      user?.displayName?.charAt(0) || (
                        <MapPin className="w-8 h-8" />
                      )}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {appUser?.name || user?.displayName || "Usuario"}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 break-all">
                    {appUser?.email || user?.email}
                  </p>
                </div>
                {isDriver && (
                  <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 sm:px-4 py-2 rounded-full font-medium text-sm">
                    <Car className="w-4 h-4 sm:w-5 sm:h-5" />
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
                <CardTitle className="text-lg sm:text-xl">
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {(appUser as any).ridesCount || appUser.totalRides || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Viajes Totales
                    </div>
                  </div>
                  <Car className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-amber-600 flex items-center gap-1">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                      {appUser.rating?.toFixed(1) || "5.0"}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Calificación
                    </div>
                  </div>
                </div>
                {(appUser as any).createdAt && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Miembro desde{" "}
                      {format(
                        (appUser as any).createdAt.toDate(),
                        "MMMM yyyy",
                        {
                          locale: es,
                        }
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Acceso Rápido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Acceso Rápido</CardTitle>
              <CardDescription className="text-sm">
                Accede a tus servicios y gestiones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isDriver && (
                <>
                  <Link href="/rider">
                    <Button variant="outline" className="w-full my-2">
                      <MapPin className="w-5 h-5 mr-2" />
                      Ir al Panel de Pasajero
                    </Button>
                  </Link>
                  <Link href="/profile/claims">
                    <Button variant="outline" className="w-full my-2">
                      <Settings className="w-5 h-5 mr-2" />
                      Mis Reclamos
                    </Button>
                  </Link>
                </>
              )}
              {isDriver && (
                <Link href="/driver">
                  <Button className="w-full my-2">
                    <Car className="w-5 h-5 mr-2" />
                    Ir al Panel de Conductor
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha - Información Personal */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Información Personal
              </CardTitle>
              <CardDescription className="text-sm">
                Actualiza tu información de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 md:col-span-1">
                  <Label htmlFor="name" className="text-sm">
                    Nombre Completo
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <Label htmlFor="email" className="text-sm">
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
                <div className="sm:col-span-2 md:col-span-1">
                  <Label htmlFor="phone" className="text-sm">
                    Teléfono
                  </Label>
                  <div className="relative mt-1">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                      +51
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="987 654 321"
                      className="pl-12"
                      maxLength={11}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ingresa el número sin el código de país (9 dígitos)
                  </p>
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <Label htmlFor="address" className="text-sm">
                    Dirección
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej: Av. Principal 123, Miraflores"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card de Seguridad - Cambiar Contraseña */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Seguridad
              </CardTitle>
              <CardDescription className="text-sm">
                Actualiza tu contraseña de acceso (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-sm">
                  Nueva Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-sm">
                  Confirmar Contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleSavePassword}
                disabled={isSavingPassword || !password}
                className="w-full"
              >
                {isSavingPassword ? "Guardando..." : "Guardar Contraseña"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
