"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Menu,
  Home,
  Car,
  FileText,
  UserCircle,
  History,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DriverHeaderProps {
  currentPage?: 'dashboard' | 'vehicle' | 'documents' | 'profile' | 'history';
}

export function DriverHeader({ currentPage = 'dashboard' }: DriverHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Cerrar menú móvil cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen) {
        const target = event.target as HTMLElement;
        const menuButton = target.closest('[data-menu-button]');
        const menuContent = target.closest('[data-menu-content]');
        
        if (!menuButton && !menuContent) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleNavigation = (path: string) => {
    setIsMobileMenuOpen(false);
    // Si es el dashboard principal, ir a /driver sin parámetros
    if (path === '/driver') {
      router.push('/driver');
    } else {
      // Para otros tabs, usar el parámetro tab
      const tab = path.split('tab=')[1];
      router.push(`/driver?tab=${tab}`);
    }
  };

  const menuItems = [
    {
      path: '/driver',
      icon: Home,
      label: 'Dashboard',
      gradient: 'from-[#05C7F2] to-[#049DD9]',
      key: 'dashboard'
    },
    {
      path: '/driver?tab=vehicle',
      icon: Car,
      label: 'Mi Vehículo',
      gradient: 'from-[#0477BF] to-[#049DD9]',
      key: 'vehicle'
    },
    {
      path: '/driver?tab=documents',
      icon: FileText,
      label: 'Documentos',
      gradient: 'from-[#2E4CA6] to-[#0477BF]',
      key: 'documents'
    },
    {
      path: '/driver?tab=history',
      icon: History,
      label: 'Historial',
      gradient: 'from-[#049DD9] to-[#05C7F2]',
      key: 'history'
    },
    {
      path: '/driver?tab=profile',
      icon: UserCircle,
      label: 'Mi Perfil',
      gradient: 'from-[#0477BF] to-[#05C7F2]',
      key: 'profile'
    }
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#2E4CA6] via-[#0477BF] to-[#049DD9] shadow-xl">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-white">HELLO Taxi</span>
        </div>

        {/* Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-white/20 text-white"
          data-menu-button
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="bg-gradient-to-b from-white via-[#F2F2F2] to-white backdrop-blur-sm" data-menu-content>
          <div className="px-4 py-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-[#05C7F2]/10 hover:to-[#049DD9]/10 transition-all duration-200 group w-full text-left ${
                  currentPage === item.key ? 'bg-gradient-to-r from-[#05C7F2]/20 to-[#049DD9]/20' : ''
                }`}
              >
                <div className={`w-8 h-8 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <span className={`font-semibold ${currentPage === item.key ? 'text-[#0477BF]' : 'text-[#2E4CA6]'} group-hover:text-[#0477BF]`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}