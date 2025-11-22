"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  X, 
  User, 
  Phone, 
  MoreVertical,
  MapPin,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { User as UserType } from '@/lib/types';

interface MobileChatProps {
  currentUser: UserType;
  otherUser: UserType;
  rideId: string;
  onClose: () => void;
  messages?: any[];
  onSendMessage?: (message: string) => void;
}

/**
 * Chat móvil optimizado para comunicación conductor-pasajero
 *
 * Características:
 * - Interfaz de chat táctil
 * - Header con información del usuario
 * - Burbujas de mensajes optimizadas
 * - Input con envío rápido
 * - Estados de mensaje (enviado/entregado/leído)
 * - Scroll automático
 * - Acciones rápidas
 */
export function MobileChat({
  currentUser,
  otherUser,
  rideId,
  onClose,
  messages = [],
  onSendMessage
}: MobileChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll automático al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enfocar input al abrir
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Enviar mensaje
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    onSendMessage?.(newMessage);
    setNewMessage('');
    
    // Simular que el otro usuario está escribiendo
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  // Enviar con Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mensajes de ejemplo si no hay mensajes reales
  const displayMessages = messages.length > 0 ? messages : [
    {
      id: '1',
      text: '¡Hola! Ya estoy en camino para recogerte.',
      sender: currentUser.role === 'driver' ? currentUser : otherUser,
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'read'
    },
    {
      id: '2',
      text: 'Perfecto, te estaré esperando en la puerta principal.',
      sender: currentUser.role === 'driver' ? otherUser : currentUser,
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      status: 'read'
    },
    {
      id: '3',
      text: 'Estaré ahí en 3 minutos aproximadamente.',
      sender: currentUser.role === 'driver' ? currentUser : otherUser,
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
      status: 'delivered'
    }
  ];

  const quickMessages = [
    '¡Ya llegué!',
    'Estoy en camino',
    '5 minutos más',
    'Gracias'
  ];

  return (
    <div className="mobile-chat flex flex-col h-full bg-gray-50">
      
      {/* Header del chat */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-gray-200">
              <AvatarImage 
                src={otherUser.profileImage || '/images/default-user.jpg'} 
                alt={otherUser.name} 
              />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold text-lg">{otherUser.name}</h3>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-green-100 text-green-700"
                >
                  En viaje
                </Badge>
                {isTyping && (
                  <span className="text-xs text-gray-500 italic">
                    escribiendo...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Phone className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.map((message) => {
          const isFromCurrentUser = message.sender.id === currentUser.id;
          
          return (
            <div 
              key={message.id}
              className={cn(
                "flex",
                isFromCurrentUser ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 relative",
                isFromCurrentUser 
                  ? "bg-blue-600 text-white rounded-tr-sm" 
                  : "bg-white text-gray-900 border rounded-tl-sm shadow-sm"
              )}>
                <p className="text-sm leading-relaxed">{message.text}</p>
                
                <div className={cn(
                  "flex items-center gap-1 mt-1 text-xs",
                  isFromCurrentUser ? "text-blue-100" : "text-gray-500"
                )}>
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(new Date(message.timestamp), 'HH:mm', { locale: es })}
                  </span>
                  
                  {isFromCurrentUser && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs ml-2 h-4 px-1",
                        message.status === 'read' && "bg-blue-200 text-blue-800",
                        message.status === 'delivered' && "bg-gray-200 text-gray-700",
                        message.status === 'sent' && "bg-gray-100 text-gray-600"
                      )}
                    >
                      {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓' : '○'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Indicador de escritura */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Mensajes rápidos */}
      <div className="px-4 py-2 border-t bg-white">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickMessages.map((msg, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="whitespace-nowrap text-xs"
              onClick={() => {
                setNewMessage(msg);
                setTimeout(() => handleSendMessage(), 100);
              }}
            >
              {msg}
            </Button>
          ))}
        </div>
      </div>

      {/* Input de mensaje */}
      <div className="bg-white border-t p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className="rounded-xl border-gray-300 focus:border-blue-500 resize-none"
              rows={1}
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Safe area para dispositivos con notch */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  );
}