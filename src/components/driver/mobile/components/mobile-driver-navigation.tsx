"use client";

import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  User, 
  Clock, 
  Settings,
  MapPin,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ActiveTab = 'dashboard' | 'profile' | 'history' | 'settings';

interface MobileDriverNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasIncomingRequest: boolean;
  hasActiveRide: boolean;
}

/**
 * Navegación inferior para la app móvil del conductor
 *
 * Características:
 * - 4 pestañas principales
 * - Indicadores de notificaciones
 * - Estados visuales claros
 * - Badges para alertas
 * - Diseño optimizado para táctil
 */
export function MobileDriverNavigation({
  activeTab,
  onTabChange,
  hasIncomingRequest,
  hasActiveRide
}: MobileDriverNavigationProps) {

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: Home,
      badge: hasIncomingRequest || hasActiveRide,
      badgeText: hasIncomingRequest ? 'Nuevo' : hasActiveRide ? 'Activo' : '',
      badgeColor: hasIncomingRequest ? 'bg-red-500' : hasActiveRide ? 'bg-green-500' : 'bg-blue-500'
    },
    {
      id: 'profile' as const,
      label: 'Perfil',
      icon: User,
      badge: false,
      badgeText: '',
      badgeColor: 'bg-gray-500'
    },
    {
      id: 'history' as const,
      label: 'Historial',
      icon: Clock,
      badge: false,
      badgeText: '',
      badgeColor: 'bg-gray-500'
    },
    {
      id: 'settings' as const,
      label: 'Ajustes',
      icon: Settings,
      badge: false,
      badgeText: '',
      badgeColor: 'bg-gray-500'
    }
  ];

  return (
    <nav className="mobile-driver-navigation fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-3 px-2 relative",
                  "transition-colors duration-200 active:bg-gray-100",
                  isActive 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-6 w-6 mb-1",
                    isActive ? "text-blue-600" : "text-gray-500"
                  )} />
                  
                  {/* Badge de notificación */}
                  {item.badge && (
                    <>
                      <div className={cn(
                        "absolute -top-2 -right-2 h-4 w-4 rounded-full animate-ping",
                        item.badgeColor
                      )} />
                      <div className={cn(
                        "absolute -top-2 -right-2 h-4 w-4 rounded-full flex items-center justify-center",
                        item.badgeColor
                      )}>
                        <div className="h-2 w-2 bg-white rounded-full" />
                      </div>
                    </>
                  )}
                </div>
                
                <span className={cn(
                  "text-xs font-medium leading-none",
                  isActive ? "text-blue-600" : "text-gray-500"
                )}>
                  {item.label}
                </span>

                {/* Badge con texto */}
                {item.badge && item.badgeText && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "absolute -top-1 -right-1 text-xs px-1 py-0 h-5",
                      "text-white border-0",
                      item.badgeColor
                    )}
                  >
                    {item.badgeText}
                  </Badge>
                )}

                {/* Indicador de pestaña activa */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Safe area para dispositivos con notch */}
      <div className="bg-white h-safe-area-inset-bottom" />
    </nav>
  );
}