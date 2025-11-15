'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  addDoc,
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ChatMessage } from '@/lib/types';

interface UseChatTypingParams {
  rideId?: string;
  currentUserId?: string;
  otherUserId?: string;
}

export function useChatTyping({ rideId, currentUserId, otherUserId }: UseChatTypingParams) {
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  // Indicar que estoy escribiendo
  const startTyping = useCallback(async () => {
    if (!rideId || !currentUserId) return;
    
    try {
      const typingRef = doc(db, 'rides', rideId, 'typing', currentUserId);
      await setDoc(typingRef, {
        userId: currentUserId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  }, [rideId, currentUserId]);

  // Indicar que dejé de escribir
  const stopTyping = useCallback(async () => {
    if (!rideId || !currentUserId) return;
    
    try {
      const typingRef = doc(db, 'rides', rideId, 'typing', currentUserId);
      await deleteDoc(typingRef);
    } catch (error) {
      console.error('Error removing typing status:', error);
    }
  }, [rideId, currentUserId]);

  // Escuchar si el otro usuario está escribiendo
  useEffect(() => {
    if (!rideId || !otherUserId) return;

    const typingRef = doc(db, 'rides', rideId, 'typing', otherUserId);
    
    const unsubscribe = onSnapshot(typingRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const typingTime = new Date(data.timestamp).getTime();
        const now = new Date().getTime();
        
        // Considerar "escribiendo" solo si fue hace menos de 3 segundos
        setIsOtherUserTyping(now - typingTime < 3000);
      } else {
        setIsOtherUserTyping(false);
      }
    });

    return () => unsubscribe();
  }, [rideId, otherUserId]);

  // Limpiar el estado de escritura al desmontar
  useEffect(() => {
    return () => {
      if (rideId && currentUserId) {
        stopTyping();
      }
    };
  }, [rideId, currentUserId, stopTyping]);

  return {
    isOtherUserTyping,
    startTyping,
    stopTyping,
  };
}

interface UseEnhancedChatParams {
  rideId?: string;
  currentUserId?: string;
}

export function useEnhancedChat({ rideId, currentUserId }: UseEnhancedChatParams) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Escuchar mensajes del chat
  useEffect(() => {
    if (!rideId) {
      setMessages([]);
      return;
    }

    const chatQuery = query(
      collection(db, 'rides', rideId, 'chatMessages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(chatQuery, (querySnapshot) => {
      const chatMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];
      
      setMessages(chatMessages);
    });

    return () => unsubscribe();
  }, [rideId]);

  // Enviar mensaje
  const sendMessage = useCallback(async (text: string) => {
    if (!rideId || !currentUserId || !text.trim()) return;

    setIsLoading(true);
    
    try {
      const messagesRef = collection(db, 'rides', rideId, 'chatMessages');
      const messageData: Omit<ChatMessage, 'id'> = {
        userId: currentUserId,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      // Usar addDoc para generar ID automáticamente
      await addDoc(messagesRef, messageData);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [rideId, currentUserId]);

  return {
    messages,
    sendMessage,
    isLoading,
  };
}