"use client";

import React from 'react';
import { 
  Car, 
  History, 
  FileText, 
  UserCog, 
  Wallet,
  LayoutDashboard,
  Bot,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  type: 'driver' | 'passenger';
  hasActiveRide?: boolean;
  hasIncomingRequest?: boolean;
}

const driverTabs = [
  { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
  { id: 'vehicle', label: 'Vehículo', icon: Car },
  { id: 'history', label: 'Historial', icon: History },
  { id: 'documents', label: 'Docs', icon: FileText },
  { id: 'profile', label: 'Perfil', icon: Wallet },
];

const getPassengerTabs = (hasActiveRide: boolean = false) => [
  { id: 'dashboard', label: 'Viaje', icon: Car },
  { id: 'history', label: 'Historial', icon: History },
  ...(hasActiveRide ? [{ id: 'chat', label: 'Chat', icon: MessageCircle }] : []),
  { id: 'support', label: 'Ayuda', icon: Bot },
];

export function MobileBottomNav({ 
  activeTab, 
  onTabChange, 
  type, 
  hasActiveRide, 
  hasIncomingRequest 
}: MobileBottomNavProps) {
  const tabs = type === 'driver' ? driverTabs : getPassengerTabs(hasActiveRide);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset-bottom">
      <nav className="flex justify-around items-center py-2 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'dashboard' && (hasActiveRide || hasIncomingRequest);

          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center h-16 w-full min-w-0 px-1 relative
                ${isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }
              `}
            >
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {showBadge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs animate-pulse"
                    >
                      !
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium leading-none truncate max-w-full">
                  {tab.label}
                </span>
              </div>
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}