'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Phone, 
  MoreVertical, 
  Check, 
  CheckCheck,
  Clock,
  Smile
} from 'lucide-react';
import type { ChatMessage, User, Driver } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/auth/use-auth';

interface EnhancedChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  otherUser?: User | Driver | null; // El otro usuario en el chat
  isTyping?: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  rideStatus?: 'searching' | 'accepted' | 'arrived' | 'in-progress' | 'completed' | 'counter-offered' | 'cancelled';
}

export default function EnhancedChat({ 
  messages, 
  onSendMessage, 
  isLoading = false,
  otherUser,
  isTyping = false,
  onTypingStart,
  onTypingStop,
  rideStatus = 'accepted'
}: EnhancedChatProps) {
  const [inputText, setInputText] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user, appUser } = useAuth();
  const currentUserId = user?.uid;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Determinar si el usuario actual es conductor
  const isDriver = !!(appUser as any)?.vehicleId || !!(appUser as any)?.paymentModel;

  // Inicializar el audio del mensaje
  useEffect(() => {
    audioRef.current = new Audio('/sounds/msg.mp3');
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.5; // Volumen moderado
    
    // Event listeners para manejar el estado del audio
    audioRef.current.addEventListener('ended', () => setIsPlaying(false));
    audioRef.current.addEventListener('error', () => setIsPlaying(false));
    
    return () => {
      if (audioRef.current) {
        setIsPlaying(false);
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
        audioRef.current.removeEventListener('error', () => setIsPlaying(false));
        audioRef.current.src = '';
      }
    };
  }, []);

  const playMessageSound = async () => {
    if (audioRef.current && !isPlaying) {
      try {
        setIsPlaying(true);
        audioRef.current.currentTime = 0; // Reiniciar desde el inicio
        await audioRef.current.play();
      } catch (error) {
        console.log('No se pudo reproducir el sonido del mensaje:', error);
        setIsPlaying(false);
      }
    }
  };
  const userType = isDriver ? 'driver' : 'passenger';

  // Debug logs
  useEffect(() => {
    console.log('EnhancedChat - User detection:', {
      appUser,
      vehicleId: (appUser as any)?.vehicleId,
      paymentModel: (appUser as any)?.paymentModel,
      isDriver,
      userType
    });
  }, [appUser, isDriver, userType]);

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    console.log('EnhancedChat handleSend:', { 
      hasText: !!inputText.trim(), 
      isLoading, 
      text: inputText.trim() 
    });
    if (inputText.trim() && !isLoading) {
      console.log('Sending message:', inputText);
      onSendMessage(inputText);
      await playMessageSound(); // Reproducir sonido al enviar mensaje
      setInputText('');
      onTypingStop?.();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    // Manejo del indicador de escritura
    if (!typingTimeout) {
      onTypingStart?.();
    }
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    const timeout = setTimeout(() => {
      onTypingStop?.();
      setTypingTimeout(null);
    }, 1000);
    
    setTypingTimeout(timeout);
  };

  const getMessageStatus = (message: ChatMessage) => {
    // Todos los mensajes se consideran "enviados" inmediatamente
    // para evitar la confusión del ícono de reloj
    return 'sent';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
      case 'sent':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-green-500" />;
      default:
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
    }
  };

  const getAvatar = (userId: string) => {
    if (userId === currentUserId) {
      return {
        name: appUser?.name || 'Tú',
        avatarUrl: appUser?.avatarUrl,
        initials: appUser?.name?.charAt(0) || 'T'
      };
    } else {
      return {
        name: otherUser?.name || 'Usuario',
        avatarUrl: otherUser?.avatarUrl,
        initials: otherUser?.name?.charAt(0) || 'U'
      };
    }
  };

  // Función para iniciar llamada telefónica
  const handleCall = () => {
    // Obtener el teléfono de forma segura
    const phoneNumber = otherUser?.phone;
    if (!phoneNumber) {
      console.warn('No hay número de teléfono disponible para el usuario');
      return;
    }
    
    // Limpiar el número de teléfono de espacios y caracteres especiales
    const cleanedPhone = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Usar el protocolo tel: para iniciar una llamada
    window.location.href = `tel:${cleanedPhone}`;
    
    console.log('Iniciando llamada a:', cleanedPhone);
  };

  // Log para debugging
  useEffect(() => {
    console.log('EnhancedChat - otherUser phone:', {
      hasOtherUser: !!otherUser,
      otherUserName: otherUser?.name,
      otherUserPhone: otherUser?.phone,
      shouldShowCallButton: !!otherUser?.phone
    });
  }, [otherUser]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header del chat */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-blue-500">
            <AvatarImage src={otherUser?.avatarUrl} alt={otherUser?.name} />
            <AvatarFallback className="bg-blue-500 text-white font-semibold">
              {otherUser?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-gray-900">{otherUser?.name || 'Usuario'}</h3>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-500">En línea</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {otherUser?.phone ? (
            <Button 
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
              onClick={handleCall}
              title={`Llamar a ${otherUser.name}`}
            >
              <Phone className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Llamar</span>
            </Button>
          ) : (
            <div className="text-xs text-gray-400 italic">Sin teléfono</div>
          )}
          <Button variant="ghost" size="icon" className="text-gray-600">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mensajes */}
      <ScrollArea className="flex-1 p-1" ref={scrollAreaRef}>
        <div className="space-y-4 p-4">
          {messages.map((msg, index) => {
            const isMe = msg.userId === currentUserId;
            const avatar = getAvatar(msg.userId);
            const status = isMe ? getMessageStatus(msg) : null;
            
            return (
              <div
                key={msg.id || index}
                className={cn(
                  'flex items-end gap-2 max-w-[85%]',
                  isMe ? 'justify-end ml-auto' : 'justify-start mr-auto'
                )}
              >
                {/* Avatar solo para mensajes de otros */}
                {!isMe && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={avatar.avatarUrl} alt={avatar.name} />
                    <AvatarFallback className="bg-gray-500 text-white text-xs">
                      {avatar.initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2 max-w-xs break-words',
                    isMe
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                  )}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  
                  {/* Timestamp y estado */}
                  <div className={cn(
                    'flex items-center justify-end gap-1 mt-1',
                    isMe ? 'text-blue-100' : 'text-gray-500'
                  )}>
                    <span className="text-xs">
                      {format(new Date(msg.timestamp), 'HH:mm', { locale: es })}
                    </span>
                    {isMe && status && getStatusIcon(status)}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Indicador de escritura */}
          {isTyping && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={otherUser?.avatarUrl} alt={otherUser?.name} />
                <AvatarFallback className="bg-gray-500 text-white text-xs">
                  {otherUser?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">escribiendo...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input de mensaje */}
      <div className="flex items-center p-4 bg-white border-t border-gray-200">
        <div className="flex items-center flex-1 bg-gray-100 rounded-full px-4 py-2">
          <Button variant="ghost" size="icon" className="text-gray-500 h-8 w-8">
            <Smile className="h-4 w-4" />
          </Button>
          <Input
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
          />
        </div>
        <Button 
          onClick={handleSend} 
          size="icon" 
          className="ml-3 h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600" 
          disabled={isLoading || !inputText.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}