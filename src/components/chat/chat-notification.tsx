'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User, Driver, ChatMessage } from '@/lib/types';

interface ChatNotificationProps {
  message?: ChatMessage;
  sender?: User | Driver;
  isVisible: boolean;
  onClose: () => void;
  onClick: () => void;
  duration?: number; // Duración en ms, 0 = no auto-close
}

export function ChatNotification({
  message,
  sender,
  isVisible,
  onClose,
  onClick,
  duration = 5000
}: ChatNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      if (duration > 0) {
        const timer = setTimeout(() => {
          onClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, duration, onClose]);

  if (!message || !sender) return null;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out',
        isVisible && isAnimating
          ? 'transform translate-x-0 opacity-100'
          : 'transform translate-x-full opacity-0 pointer-events-none'
      )}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm cursor-pointer hover:shadow-xl transition-shadow"
           onClick={onClick}>
        <div className="flex items-start gap-3">
          {/* Avatar del remitente */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={sender.avatarUrl} alt={sender.name} />
            <AvatarFallback className="bg-blue-500 text-white font-semibold">
              {sender.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {/* Contenido del mensaje */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-gray-900 text-sm truncate">
                {sender.name}
              </span>
            </div>
            <p className="text-gray-600 text-sm line-clamp-2 break-words">
              {message.text}
            </p>
            <span className="text-xs text-gray-400 mt-1">
              Hace un momento
            </span>
          </div>
          
          {/* Botón cerrar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-600 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook para manejar las notificaciones de chat
export function useChatNotifications(isEnabled: boolean = true) {
  const [notification, setNotification] = useState<{
    message: ChatMessage;
    sender: User | Driver;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showNotification = useCallback((message: ChatMessage, sender: User | Driver) => {
    if (!isEnabled) return;
    
    setNotification({ message, sender });
    setIsVisible(true);
  }, [isEnabled]);

  const hideNotification = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setNotification(null), 300); // Esperar a que termine la animación
  }, []);

  return {
    notification: notification?.message,
    sender: notification?.sender,
    isVisible,
    showNotification,
    hideNotification,
  };
}