'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  normalizePrice, 
  incrementPrice, 
  decrementPrice, 
  calculatePercentageChange 
} from '@/lib/price-utils';

interface PriceSelectorProps {
  originalPrice: number;
  onPriceChange: (newPrice: number) => void;
  disabled?: boolean;
  maxIncrease?: number; // Porcentaje máximo de aumento (ej: 15 para 15%)
  maxDecrease?: number; // Porcentaje máximo de disminución (ej: 15 para 15%)
  step?: number; // Paso de incremento/decremento en soles (siempre será 0.50)
}

export function PriceSelector({
  originalPrice,
  onPriceChange,
  disabled = false,
  maxIncrease = 15,
  maxDecrease = 15,
  step = 0.50, // Siempre será 0.50
}: PriceSelectorProps) {
  // Normalizar el precio original
  const normalizedOriginal = normalizePrice(originalPrice);
  const [currentPrice, setCurrentPrice] = useState(normalizedOriginal);

  // Calcular límites normalizados
  const minPrice = Math.max(0.50, normalizePrice(originalPrice * (1 - maxDecrease / 100)));
  const maxPrice = normalizePrice(originalPrice * (1 + maxIncrease / 100));

  // Actualizar precio cuando cambie el original
  useEffect(() => {
    const normalized = normalizePrice(originalPrice);
    setCurrentPrice(normalized);
  }, [originalPrice]);

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
    <div className="space-y-2">
      {/* Selector de precio */}
      <div className="flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecreasePrice}
          disabled={disabled || isAtMin}
          className={cn(
            "h-8 w-8 rounded-full transition-all",
            disabled || isAtMin
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-red-50 hover:border-red-300 hover:text-red-600"
          )}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="text-center min-w-[100px]">
          <p className="text-2xl font-bold text-[#2E4CA6]">
            S/ {currentPrice.toFixed(1)}
          </p>
          {percentageChange !== 0 && (
            <p className={cn(
              "text-xs font-medium",
              percentageChange > 0 ? "text-green-600" : "text-red-600"
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
            "h-8 w-8 rounded-full transition-all",
            disabled || isAtMax
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-green-50 hover:border-green-300 hover:text-green-600"
          )}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Información adicional */}
      <div className="text-center space-y-1">
        {currentPrice !== normalizedOriginal && (
          <div className="text-xs text-gray-600">
            <span className="line-through">Precio sugerido: S/ {normalizedOriginal.toFixed(1)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>Mín: S/ {minPrice.toFixed(1)}</span>
          <span>Máx: S/ {maxPrice.toFixed(1)}</span>
        </div>
        
        {percentageChange > 10 && (
          <div className="text-xs text-amber-600 bg-amber-50 rounded-full px-2 py-1">
            Un precio más alto puede atraer conductores más rápido
          </div>
        )}
        
        {percentageChange < -5 && (
          <div className="text-xs text-orange-600 bg-orange-50 rounded-full px-2 py-1">
            Un precio más bajo puede tardarse más en conseguir conductor
          </div>
        )}
      </div>
    </div>
  );
}