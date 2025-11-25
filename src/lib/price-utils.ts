/**
 * Utility functions para manejo de precios en la aplicación HelloTaxi
 */

/**
 * Redondea un precio a una décima (un decimal)
 * Ejemplos:
 * - 3.24 → 3.20
 * - 3.91 → 3.90
 * - 3.95 → 3.90
 * - 5.68 → 5.60
 * 
 * @param price - El precio a redondear
 * @returns El precio redondeado a una décima
 */
export function roundToDecimal(price: number): number {
  // Redondear a décimas hacia abajo
  return Math.floor(price * 10) / 10;
}

/**
 * Ajusta un precio al múltiplo de 0.50 más cercano hacia abajo
 * Ejemplos:
 * - 3.24 → 3.00
 * - 3.91 → 3.50
 * - 5.68 → 5.50
 * - 7.25 → 7.00
 * 
 * @param price - El precio a ajustar
 * @returns El precio ajustado al múltiplo de 0.50
 */
export function roundToHalfSole(price: number): number {
  return Math.floor(price * 2) / 2;
}

/**
 * Formatea un precio para mostrar con el símbolo de moneda
 * 
 * @param price - El precio a formatear
 * @param decimals - Número de decimales (default: 1 para una décima)
 * @returns String formateado "S/ XX.X"
 */
export function formatPrice(price: number, decimals: number = 1): string {
  return `S/ ${price.toFixed(decimals)}`;
}

/**
 * Incrementa un precio en múltiplos de 0.50
 * 
 * @param currentPrice - Precio actual
 * @param maxPrice - Precio máximo permitido
 * @returns El nuevo precio incrementado en 0.50 (sin exceder el máximo)
 */
export function incrementPrice(currentPrice: number, maxPrice: number): number {
  const newPrice = currentPrice + 0.50;
  return Math.min(roundToDecimal(newPrice), maxPrice);
}

/**
 * Decrementa un precio en múltiplos de 0.50
 * 
 * @param currentPrice - Precio actual
 * @param minPrice - Precio mínimo permitido
 * @returns El nuevo precio decrementado en 0.50 (sin bajar del mínimo)
 */
export function decrementPrice(currentPrice: number, minPrice: number): number {
  const newPrice = currentPrice - 0.50;
  return Math.max(roundToDecimal(newPrice), minPrice);
}

/**
 * Normaliza un precio al sistema de HelloTaxi
 * - Redondea a una décima
 * - Asegura que sea múltiplo de 0.50 para facilitar incrementos/decrementos
 * 
 * @param price - El precio a normalizar
 * @returns El precio normalizado
 */
export function normalizePrice(price: number): number {
  // Primero redondeamos a décimas
  const rounded = roundToDecimal(price);
  
  // Luego ajustamos al múltiplo de 0.50 más cercano hacia abajo
  // Esto facilita los incrementos/decrementos de 0.50
  return roundToHalfSole(rounded);
}

/**
 * Valida que un precio esté dentro del rango permitido
 * 
 * @param price - Precio a validar
 * @param minPrice - Precio mínimo
 * @param maxPrice - Precio máximo
 * @returns true si el precio está en el rango válido
 */
export function isValidPrice(price: number, minPrice: number, maxPrice: number): boolean {
  return price >= minPrice && price <= maxPrice;
}

/**
 * Calcula el cambio porcentual entre dos precios
 * 
 * @param originalPrice - Precio original
 * @param newPrice - Precio nuevo
 * @returns El porcentaje de cambio (positivo = aumento, negativo = descuento)
 */
export function calculatePercentageChange(originalPrice: number, newPrice: number): number {
  if (originalPrice === 0) return 0;
  return ((newPrice - originalPrice) / originalPrice) * 100;
}
