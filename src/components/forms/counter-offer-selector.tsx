'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  normalizePrice, 
  incrementPrice, 
  decrementPrice, 
  calculatePercentageChange,
  formatPrice 
} from '@/lib/price-utils';

interface CounterOfferSelectorProps {
  originalFare: number; // Precio que propuso el pasajero
  onPriceChange: (newPrice: number) => void;
  disabled?: boolean;
  maxIncrease?: number; // Porcentaje máximo de aumento (ej: 25 para 25%)
  maxDecrease?: number; // Porcentaje máximo de disminución (ej: 10 para 10%)
  step?: number; // Paso de incremento/decremento en soles (siempre será 0.50)
}

export function CounterOfferSelector({
  originalFare,
  onPriceChange,
  disabled = false,
  maxIncrease = 25,
  maxDecrease = 10,
  step = 0.50, // Siempre será 0.50 pero lo mantenemos por compatibilidad
}: CounterOfferSelectorProps) {
  // Normalizar el precio original al sistema de HelloTaxi
  const normalizedOriginal = normalizePrice(originalFare);
  const [currentPrice, setCurrentPrice] = useState(normalizedOriginal);

  // Calcular límites - más flexibles para conductores
  const minPrice = Math.max(1.0, normalizePrice(originalFare * (1 - maxDecrease / 100)));
  const maxPrice = normalizePrice(originalFare * (1 + maxIncrease / 100));

  // Actualizar precio cuando cambie el original
  useEffect(() => {
    const normalized = normalizePrice(originalFare);
    setCurrentPrice(normalized);
  }, [originalFare]);

  const handleDecreasePrice = () => {
    const newPrice = decrementPrice(currentPrice, minPrice);
    setCurrentPrice(newPrice);
    onPriceChange(newPrice);
  };

  const handleIncreasePrice = () => {
    const newPrice = incrementPrice(currentPrice, maxPrice);
    setCurrentPrice(newPrice);
    onPriceChange(newPrice);
  };

  const isAtMin = currentPrice <= minPrice;
  const isAtMax = currentPrice >= maxPrice;
  const percentageChange = calculatePercentageChange(normalizedOriginal, currentPrice);

  return (
    <div className="space-y-3">
      {/* Selector de precio */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-blue-50 via-white to-blue-50 rounded-lg border border-blue-200">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecreasePrice}
          disabled={disabled || isAtMin}
          className={cn(
            "h-10 w-10 rounded-full transition-all",
            disabled || isAtMin
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-red-50 hover:border-red-300 hover:text-red-600 border-2"
          )}
        >
          <Minus className="h-5 w-5" />
        </Button>

        <div className="text-center min-w-[120px]">
          <p className="text-3xl font-bold text-[#2E4CA6]">
            S/ {currentPrice.toFixed(1)}
          </p>
          {percentageChange !== 0 && (
            <p className={cn(
              "text-sm font-medium",
              percentageChange > 0 ? "text-green-600" : "text-orange-600"
            )}>
              {percentageChange > 0 ? "+" : ""}{percentageChange.toFixed(1)}%
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncreasePrice}
          disabled={disabled || isAtMax}
          className={cn(
            "h-10 w-10 rounded-full transition-all",
            disabled || isAtMax
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-green-50 hover:border-green-300 hover:text-green-600 border-2"
          )}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Información de referencia */}
      <div className="text-center space-y-2">
        {currentPrice !== normalizedOriginal && (
          <div className="text-sm text-gray-600">
            <span className="line-through">Precio propuesto: S/ {normalizedOriginal.toFixed(1)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>Mín: S/ {minPrice.toFixed(1)}</span>
          <span>Máx: S/ {maxPrice.toFixed(1)}</span>
        </div>
        

        {/* Consejos específicos para conductores */}
        {percentageChange > 15 && (
          <div className="text-xs text-amber-700 bg-amber-50 rounded-full px-3 py-1.5 border border-amber-200">
            Precio alto: Justifica el valor (tráfico, distancia, etc.)
          </div>
        )}
        
        {percentageChange > 0 && percentageChange <= 15 && (
          <div className="text-xs text-green-700 bg-green-50 rounded-full px-3 py-1.5 border border-green-200">
            Aumento moderado: Buena oportunidad de aceptación
          </div>
        )}
        
        {percentageChange < 0 && percentageChange >= -5 && (
          <div className="text-xs text-blue-700 bg-blue-50 rounded-full px-3 py-1.5 border border-blue-200">
            Precio competitivo: Probable aceptación rápida
          </div>
        )}
        
        {percentageChange < -5 && (
          <div className="text-xs text-orange-700 bg-orange-50 rounded-full px-3 py-1.5 border border-orange-200">
            Descuento significativo: Considera tus costos de operación
          </div>
        )}

        {percentageChange === 0 && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-200">
            Precio original: Sin ajustes
          </div>
        )}
      </div>
    </div>
  );
}