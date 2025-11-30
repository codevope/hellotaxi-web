"use client";

import Link from "next/link";
import { LogOut, User, LayoutDashboard, History } from "lucide-react";
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

  const isAdmin = appUser?.isAdmin || false;

  const navLinks = [
    // Conditionally render "Viaja" link
    !isDriver && { href: "/ride", label: "Viaja" },
    !isDriver && { href: "/drive", label: "Conduce" },
    { href: "/about", label: "Quiénes Somos" },
    { href: "/install", label: "Instalar App" },
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
          {isAdmin && !isMobile && (
            <Button
              variant="ghost"
              asChild
              className={cn(
                pathname.startsWith("/admin") && "font-bold bg-secondary"
              )}
            >
              <Link href="/admin">Panel de Admin</Link>
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
          {!isDriver && user && (
            <Button
              variant="ghost"
              asChild
              className={cn(
                pathname.startsWith("/rider") && "font-bold bg-secondary"
              )}
            >
              <Link href="/rider">Panel de Pasajero</Link>
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
                {isMobile && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/about">
                        <span>Quiénes Somos</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/install">
                        <span>Instalar App</span>
                      </Link>
                    </DropdownMenuItem>
                    {!isDriver && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/ride">
                            <span>Viaja</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/drive">
                            <span>Conduce</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          toast({
                            title: "Panel de Admin no disponible en móvil",
                            description: "El panel de administración solo está disponible en modo escritorio.",
                            duration: 5000,
                          });
                        }}
                      >
                        <span>Panel de Admin</span>
                      </DropdownMenuItem>
                    )}
                    {isDriver && (
                      <DropdownMenuItem asChild>
                        <Link href="/driver">
                          <span>Panel de Conductor</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {!isDriver && (
                      <DropdownMenuItem asChild>
                        <Link href="/rider">
                          <span>Panel de Pasajero</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}
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
                      <Link href="/driver/history">
                        <History className="mr-2 h-4 w-4" />
                        <span>Historial</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => {
                  await signOut();
                  router.push('/login');
                }}>
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
        </div>
      </header>
    </>
  );
}
