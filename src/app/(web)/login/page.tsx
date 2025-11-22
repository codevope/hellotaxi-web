"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useDriverAuth } from "@/hooks/auth/use-driver-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/auth/use-auth";
import Image from "next/image";
export default function LoginPage() {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    loading,
    appUser,
  } = useAuth();
  const { isDriver } = useDriverAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [emailLogin, setEmailLogin] = useState("");
  const [passwordLogin, setPasswordLogin] = useState("");
  const [emailRegister, setEmailRegister] = useState("");
  const [passwordRegister, setPasswordRegister] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Función para redirigir según el tipo de usuario
  const redirectUserAfterLogin = () => {
    if (hasRedirected) return;

    setHasRedirected(true);

    // Verificar primero si es conductor usando isDriver del hook de conductores
    if (isDriver) {
      router.push("/driver");
      return;
    }

    // Si el usuario tiene rol de conductor en el perfil pero no es conductor activo
    if (appUser?.role === "driver") {
      router.push("/driver");
      return;
    }

    // Para todos los demás casos (pasajeros), ir a rider
    router.push("/rider");
  };

  // Efecto para redirigir automáticamente después del login
  useEffect(() => {
    if (appUser && !loading && !hasRedirected) {
      redirectUserAfterLogin();
    }
  }, [appUser, loading, hasRedirected]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmail(emailLogin, passwordLogin);
      toast({ title: "¡Bienvenido de vuelta!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signUpWithEmail(emailRegister, passwordRegister);
      toast({
        title: "¡Registro exitoso!",
        description: "Bienvenido a Hello Taxi.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      toast({ title: "¡Bienvenido!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error con Google",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`${
        isMobile
          ? "min-h-screen bg-gradient-to-br from-[#2E4CA6] via-[#0477BF] to-[#049DD9] flex flex-col justify-center"
          : "flex items-center justify-center p-4 min-h-[80vh]"
      }`}
    >
      <Card
        className={`${
          isMobile
            ? "mx-4 bg-white/95 backdrop-blur-sm border-0 shadow-2xl"
            : "max-w-md w-full shadow-2xl"
        }`}
      >
        <CardHeader className={`text-center ${isMobile ? "pb-8" : ""}`}>
          <CardTitle
            className={`font-headline ${
              isMobile ? "text-4xl text-[#2E4CA6]" : "text-2xl"
            }`}
          >
            {isMobile ? "Hello TAXI" : "Inicia Sesión o Regístrate"}
          </CardTitle>
          <CardDescription className={isMobile ? "text-xs text-gray-600" : ""}>
            {isMobile
              ? "Bienvenido, accede a tu cuenta"
              : "Elige tu método preferido para continuar"}
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? "px-6 pb-6" : ""}>
          <Tabs defaultValue="email-login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email-login">Ingresar</TabsTrigger>
              <TabsTrigger value="email-register">Registrarse</TabsTrigger>
            </TabsList>
            <TabsContent value="email-login" className="space-y-4 pt-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email-login"
                    className={`font-medium ${
                      isMobile ? "text-[#2E4CA6]" : ""
                    }`}
                  >
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email-login"
                      type="email"
                      placeholder="tu@correo.com"
                      value={emailLogin}
                      onChange={(e) => setEmailLogin(e.target.value)}
                      required
                      className={`pl-10 ${
                        isMobile
                          ? "h-12 border-2 border-gray-200 focus:border-[#05C7F2] transition-colors"
                          : ""
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <Label
                    htmlFor="password-login"
                    className={`font-medium ${
                      isMobile ? "text-[#2E4CA6]" : ""
                    }`}
                  >
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password-login"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordLogin}
                      onChange={(e) => setPasswordLogin(e.target.value)}
                      required
                      className={`pl-10 pr-10 ${
                        isMobile
                          ? "h-12 border-2 border-gray-200 focus:border-[#05C7F2] transition-colors"
                          : ""
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className={`w-full ${
                    isMobile
                      ? "h-12 bg-gradient-to-r from-[#05C7F2] to-[#049DD9] hover:from-[#049DD9] hover:to-[#0477BF] text-white font-semibold shadow-lg"
                      : ""
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                  <Mail className="mr-2" /> Ingresar con Correo
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="email-register" className="space-y-4 pt-4">
              <form onSubmit={handleEmailRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email-register"
                    className={`font-medium ${
                      isMobile ? "text-[#2E4CA6]" : ""
                    }`}
                  >
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email-register"
                      type="email"
                      placeholder="tu@correo.com"
                      value={emailRegister}
                      onChange={(e) => setEmailRegister(e.target.value)}
                      required
                      className={`pl-10 ${
                        isMobile
                          ? "h-12 border-2 border-gray-200 focus:border-[#05C7F2] transition-colors"
                          : ""
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <Label
                    htmlFor="password-register"
                    className={`font-medium ${
                      isMobile ? "text-[#2E4CA6]" : ""
                    }`}
                  >
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password-register"
                      type={showPassword ? "text" : "password"}
                      placeholder="Crea una contraseña segura"
                      value={passwordRegister}
                      onChange={(e) => setPasswordRegister(e.target.value)}
                      required
                      className={`pl-10 pr-10 ${
                        isMobile
                          ? "h-12 border-2 border-gray-200 focus:border-[#05C7F2] transition-colors"
                          : ""
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className={`w-full ${
                    isMobile
                      ? "h-12 bg-gradient-to-r from-[#05C7F2] to-[#049DD9] hover:from-[#049DD9] hover:to-[#0477BF] text-white font-semibold shadow-lg"
                      : ""
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                  <Mail className="mr-2" /> Registrarme
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O continúa con
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
            <Image
              src="/img/google-logo.webp"
              alt="Google"
              width={20}
              height={20}
              className="mr-2"
            />
            Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
