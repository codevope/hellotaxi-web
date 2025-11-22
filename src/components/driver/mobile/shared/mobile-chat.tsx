"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Send,
  Smile,
  Paperclip,
  Phone,
  User,
  MoreVertical,
  Check,
  CheckCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * MOBILE CHAT
 * 
 * Componente de chat móvil compartido entre conductores y pasajeros.
 * Diseño tipo WhatsApp/Telegram optimizado para móvil.
 */

export interface MobileChatProps {
  messages: Array<{
    id: string;
    content: string;
    sender: 'user' | 'other';
    timestamp: string;
    status?: 'sent' | 'delivered' | 'read';
    type?: 'text' | 'location' | 'system';
  }>;
  onSendMessage: (message: string) => Promise<void>;
  otherUserName: string;
  otherUserAvatar?: string;
  onClose: () => void;
}

export function MobileChat({
  messages,
  onSendMessage,
  otherUserName,
  otherUserAvatar,
  onClose,
}: MobileChatProps) {
  // ====================================
  // ESTADO Y REFS
  // ====================================
  
  const [newMessage, setNewMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Inicializar el audio del mensaje
  React.useEffect(() => {
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
  
  // ====================================
  // EFECTOS
  // ====================================
  
  // Auto-scroll a mensajes nuevos
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-focus en input
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Simulación de "escribiendo..."
  React.useEffect(() => {
    if (messages.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);
  
  // ====================================
  // HANDLERS
  // ====================================
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      await playMessageSound(); // Reproducir sonido al enviar mensaje
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const renderMessageStatus = (status?: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };
  
  // ====================================
  // RENDER
  // ====================================
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 bg-white z-50 flex flex-col"
    >
      {/* Header del chat */}
      <motion.header 
        className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
      >
        {/* Botón cerrar */}
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-10 w-10"
        >
          <X className="w-5 h-5" />
        </Button>
        
        {/* Info del usuario */}
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10 border border-gray-200">
            <AvatarImage src={otherUserAvatar} />
            <AvatarFallback className="bg-blue-500 text-white">
              {otherUserName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              {otherUserName}
            </h2>
            <p className="text-sm text-gray-500">
              {isTyping ? 'Escribiendo...' : 'En línea'}
            </p>
          </div>
        </div>
        
        {/* Acciones */}
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10"
          >
            <Phone className="w-5 h-5" />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </motion.header>
      
      {/* Área de mensajes */}
      <div className="flex-1 bg-gray-50 relative overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => {
                const isFromUser = message.sender === 'user';
                const isSystemMessage = message.type === 'system';
                
                if (isSystemMessage) {
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex justify-center"
                    >
                      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {message.content}
                      </div>
                    </motion.div>
                  );
                }
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isFromUser ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`
                          px-4 py-2 rounded-2xl
                          ${isFromUser
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                          }
                        `}
                      >
                        <p className="text-sm leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                      
                      {/* Timestamp y estado */}
                      <div className={`flex items-center gap-1 mt-1 ${
                        isFromUser ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </span>
                        {isFromUser && renderMessageStatus(message.status)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {/* Indicador de escritura */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[70%]">
                    <div className="bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-200 px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      
      {/* Input de mensaje */}
      <motion.div 
        className="bg-white border-t border-gray-200 p-4"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-end gap-3">
          {/* Botón de adjunto */}
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 flex-shrink-0"
          >
            <Paperclip className="w-5 h-5 text-gray-500" />
          </Button>
          
          {/* Input de texto */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className="pr-12 py-3 rounded-full border-gray-300"
              maxLength={500}
            />
            
            {/* Botón emoji */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            >
              <Smile className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
          
          {/* Botón enviar */}
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className={`h-10 w-10 rounded-full flex-shrink-0 ${
              newMessage.trim() 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-300'
            }`}
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </Button>
        </div>
        
        {/* Contador de caracteres */}
        {newMessage.length > 400 && (
          <div className="text-xs text-gray-500 text-right mt-2">
            {newMessage.length}/500
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}