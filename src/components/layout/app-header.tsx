"use client";

import Link from "next/link";
import { Car, LogOut, User, LayoutDashboard, Menu, X, FileText, History, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/auth/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDriverAuth } from '@/hooks/auth/use-driver-auth';
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AppHeader() {
  const { user, appUser, signOut } = useAuth();
  const { isDriver } = useDriverAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = appUser?.isAdmin || false;

  // Función para manejar clic en panel de admin
  const handleAdminPanelClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      setIsMobileMenuOpen(false);
      toast({
        title: "📱 Panel de Admin no disponible en móvil",
        description: "El panel de administración solo está disponible en modo escritorio. Por favor, accede desde una computadora.",
        duration: 5000,
      });
      return false;
    }
    setIsMobileMenuOpen(false);
    return true;
  };

  const navLinks = [
    // Conditionally render "Viaja" link
    !isDriver && { href: "/ride", label: "Viaja" },
    !isDriver && { href: "/drive", label: "Conduce" },
    { href: "/about", label: "Quiénes Somos" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-card border-b shadow-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-blue-600">
          <h1 className={cn(
            "font-bold font-headline bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] bg-clip-text text-transparent",
            isMobile ? "text-xl" : "text-3xl lg:text-4xl"
          )}>
            Hello TAXI
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Button
              variant="ghost"
              asChild
              key={link.href}
              className={cn(pathname === link.href && "font-bold bg-secondary")}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          {isAdmin && (
            <Button
              variant="ghost"
              asChild={!isMobile}
              className={cn(
                pathname.startsWith("/admin") && "font-bold bg-secondary"
              )}
              onClick={isMobile ? handleAdminPanelClick : undefined}
            >
              {isMobile ? (
                <>Panel de Admin</>
              ) : (
                <Link href="/admin">Panel de Admin</Link>
              )}
            </Button>
          )}
          {isDriver && (
            <Button
              variant="ghost"
              asChild
              className={cn(
                pathname.startsWith("/driver") && "font-bold bg-secondary"
              )}
            >
              <Link href="/driver">Panel de Conductor</Link>
            </Button>
          )}
        </nav>

        {/* Mobile & Desktop Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.photoURL || ""}
                      alt={user.displayName || ""}
                    />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) ||
                        user.email?.charAt(0) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>
                {isDriver && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/driver/historial">
                        <History className="mr-2 h-4 w-4" />
                        <span>Historial</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/driver/configuracion">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configuración</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/driver/documents">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Documentos</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/driver/vehicle">
                        <Car className="mr-2 h-4 w-4" />
                        <span>Mi Vehículo</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/driver/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil Conductor</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={() => router.push("/login")}
              size={isMobile ? "sm" : "default"}
            >
              Iniciar Sesión
            </Button>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobile && isMobileMenuOpen && (
        <div className="bg-card border-b shadow-sm md:hidden">
          <nav className="flex flex-col p-4 space-y-2">
            {navLinks.map((link) => (
              <Button
                variant="ghost"
                asChild
                key={link.href}
                className={cn(
                  "justify-start",
                  pathname === link.href && "font-bold bg-secondary"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            {isAdmin && (
              <Button
                variant="ghost"
                className={cn(
                  "justify-start",
                  pathname.startsWith("/admin") && "font-bold bg-secondary"
                )}
                onClick={handleAdminPanelClick}
              >
                Panel de Admin
              </Button>
            )}
            {isDriver && (
              <Button
                variant="ghost"
                asChild
                className={cn(
                  "justify-start",
                  pathname.startsWith("/driver") && "font-bold bg-secondary"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link href="/driver">Panel de Conductor</Link>
              </Button>
            )}
            
            {/* Logout button for mobile menu */}
            {user && (
              <>
                <div className="border-t pt-2 mt-2">
                  <Button
                    variant="ghost"
                    className="justify-start w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
