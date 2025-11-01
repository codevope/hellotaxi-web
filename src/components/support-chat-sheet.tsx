'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supportChat } from '@/ai/flows/support-chat';
import { useToast } from '@/hooks/use-toast';

type Message = {
  text: string;
  isUser: boolean;
};

export function SupportChatSheet() {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: '¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy?',
      isUser: false,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = { text: inputText, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    const currentText = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Convertir el historial al formato esperado por supportChat
      const chatHistory = messages
        .filter((_, index) => index % 2 === 0 && index + 1 < messages.length)
        .map((userMsg, index) => ({
          query: userMsg.text,
          response: messages[index * 2 + 1]?.text || ''
        }));
      
      if (typeof supportChat === 'function') {
        const result = await supportChat({ query: currentText, history: chatHistory });
        const aiMessage: Message = { text: result.response || 'Lo siento, no pude procesar tu solicitud.', isUser: false };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const aiMessage: Message = { text: 'Gracias por tu mensaje. Te ayudaré en lo que pueda.', isUser: false };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error in support chat:', error);
      const errorMessage: Message = { text: 'Lo siento, hubo un error. Por favor intenta nuevamente.', isUser: false };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Asistente de Soporte
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Haz una pregunta sobre la aplicación y la IA te ayudará.
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="space-y-4 py-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3',
                msg.isUser ? 'justify-end' : 'justify-start'
              )}
            >
              {!msg.isUser && (
                <div className="bg-primary rounded-full p-2 shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-lg px-3 py-2 max-w-[80%] break-words',
                  msg.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {msg.text}
              </div>
              {msg.isUser && (
                <div className="bg-secondary rounded-full p-2 shrink-0">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="bg-primary rounded-full p-2 shrink-0">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Escribiendo...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje aquí..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={!inputText.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}