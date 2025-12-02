
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Phone } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/auth/use-auth';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  otherUserPhone?: string; // Número de teléfono del otro usuario para llamadas
  otherUserName?: string; // Nombre del otro usuario
}

export default function Chat({ 
  messages, 
  onSendMessage, 
  isLoading = false, 
  otherUserPhone,
  otherUserName 
}: ChatProps) {
  const [inputText, setInputText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const currentUserId = user?.uid;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
        try {
          if (!audioRef.current.paused) {
            audioRef.current.pause();
          }
        } catch (error) {
          // Ignorar errores al pausar durante cleanup
        }
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
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log('No se pudo reproducir el sonido del mensaje:', error);
        }
        setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSend = async () => {
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      await playMessageSound(); // Reproducir sonido al enviar mensaje
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Función para iniciar llamada telefónica
  const handleCall = () => {
    if (!otherUserPhone) {
      console.warn('No hay número de teléfono disponible para el usuario');
      return;
    }
    
    // Limpiar el número de teléfono de espacios y caracteres especiales
    const cleanedPhone = otherUserPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Usar el protocolo tel: para iniciar una llamada
    window.location.href = `tel:${cleanedPhone}`;

  };

  return (
    <div className="flex flex-col h-full">
      {/* Header del chat con botón de llamada */}
      {otherUserPhone && (
        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              {otherUserName || 'Chat'}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors"
            onClick={handleCall}
            title={`Llamar a ${otherUserName || 'usuario'}`}
          >
            <Phone className="h-4 w-4 mr-1" />
            <span className="text-xs">Llamar</span>
          </Button>
        </div>
      )}
      
      <ScrollArea className="flex-1 p-1" ref={scrollAreaRef}>
        <div className="space-y-4 p-3">
          {messages.map((msg, index) => {
            const isMe = msg.userId === currentUserId;
            return (
               <div
                key={msg.id || index}
                className={cn(
                    'flex items-end gap-2',
                    isMe ? 'justify-end' : 'justify-start'
                )}
                >
                <div
                    className={cn(
                    'rounded-lg px-3 py-2 max-w-xs md:max-w-md',
                    isMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                >
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1 text-right">
                        {format(new Date(msg.timestamp), 'HH:mm')}
                    </p>
                </div>
                </div>
            )
          })}
        </div>
      </ScrollArea>
      <div className="flex items-center p-2 border-t">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe un mensaje..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button onClick={handleSend} size="icon" className="ml-2" disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
