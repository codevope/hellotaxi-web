"use client";

import React, { useState } from 'react';
import { 
  Star, 
  DollarSign, 
  User as UserIcon,
  Send,
  ThumbsUp,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "@/lib/types";

interface DesktopRatingModalProps {
  isOpen: boolean;
  passenger: User;
  fare: number;
  onClose: () => void;
  onSubmitRating: (rating: number, comment: string) => void;
}

export function DesktopRatingModal({
  isOpen,
  passenger,
  fare,
  onClose,
  onSubmitRating,
}: DesktopRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmitRating(rating, comment);
      // Reset form
      setRating(0);
      setHoverRating(0);
      setComment('');
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    onClose();
  };

  const quickComments = [
    "Excelente pasajero",
    "Muy puntual",
    "Educado y respetuoso",
    "Fácil de encontrar",
    "Sin problemas"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-center">
            <ThumbsUp className="h-6 w-6 text-green-600" />
            ¡Viaje Completado!
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Califica tu experiencia con este pasajero
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del viaje completado */}
          <Card className="border border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-green-300">
                    <AvatarImage src={passenger.avatarUrl || undefined} />
                    <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                      {passenger.name?.charAt(0) || <UserIcon className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{passenger.name}</h3>
                    <p className="text-sm text-gray-600">Viaje completado</p>
                  </div>
                </div>
                <Badge className="bg-green-600 hover:bg-green-700">
                  <DollarSign className="h-4 w-4 mr-1" />
                  S/ {fare.toFixed(2)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Sistema de calificación */}
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              ¿Cómo fue tu experiencia?
            </h3>
            
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && "Necesita mejorar"}
                {rating === 2 && "Regular"}
                {rating === 3 && "Bueno"}
                {rating === 4 && "Muy bueno"}
                {rating === 5 && "Excelente"}
              </p>
            )}
          </div>

          {/* Comentarios rápidos */}
          {rating >= 4 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Comentarios rápidos:</h4>
              <div className="flex flex-wrap gap-2">
                {quickComments.map((quickComment) => (
                  <Button
                    key={quickComment}
                    variant="outline"
                    size="sm"
                    onClick={() => setComment(quickComment)}
                    className={`text-xs ${
                      comment === quickComment
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'border-gray-300'
                    }`}
                  >
                    {quickComment}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Comentario personalizado */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium text-gray-700">
              Comentario adicional (opcional)
            </label>
            <Textarea
              id="comment"
              placeholder="Escribe un comentario sobre el pasajero..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={200}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {comment.length}/200 caracteres
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Saltar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Calificación
            </Button>
          </div>

          {rating === 0 && (
            <p className="text-xs text-center text-red-500">
              Debes seleccionar al menos una estrella para enviar tu calificación
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}