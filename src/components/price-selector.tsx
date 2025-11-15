'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceSelectorProps {
  originalPrice: number;
  onPriceChange: (newPrice: number) => void;
  disabled?: boolean;
  maxIncrease?: number; // Porcentaje máximo de aumento (ej: 15 para 15%)
  maxDecrease?: number; // Porcentaje máximo de disminución (ej: 15 para 15%)
  step?: number; // Paso de incremento/decremento en soles
}

export function PriceSelector({
  originalPrice,
  onPriceChange,
  disabled = false,
  maxIncrease = 15,
  maxDecrease = 15,
  step = 0.50,
}: PriceSelectorProps) {
  const [currentPrice, setCurrentPrice] = useState(originalPrice);

  // Calcular límites
  const minPrice = Math.max(0.50, originalPrice * (1 - maxDecrease / 100));
  const maxPrice = originalPrice * (1 + maxIncrease / 100);

  // Actualizar precio cuando cambie el original
  useEffect(() => {
    setCurrentPrice(originalPrice);
  }, [originalPrice]);

  const decreasePrice = () => {
    const newPrice = Math.max(minPrice, currentPrice - step);
    setCurrentPrice(newPrice);
    onPriceChange(newPrice);
  };

  const increasePrice = () => {
    const newPrice = Math.min(maxPrice, currentPrice + step);
    setCurrentPrice(newPrice);
    onPriceChange(newPrice);
  };

  const isAtMin = currentPrice <= minPrice;
  const isAtMax = currentPrice >= maxPrice;
  const percentageChange = ((currentPrice - originalPrice) / originalPrice) * 100;

  return (
    <div className="space-y-2">
      {/* Selector de precio */}
      <div className="flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={decreasePrice}
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
            S/ {currentPrice.toFixed(2)}
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
          onClick={increasePrice}
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
        {currentPrice !== originalPrice && (
          <div className="text-xs text-gray-600">
            <span className="line-through">Precio sugerido: S/ {originalPrice.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>Mín: S/ {minPrice.toFixed(2)}</span>
          <span>Máx: S/ {maxPrice.toFixed(2)}</span>
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