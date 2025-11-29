/**
 * Utility functions para manejo de precios en la aplicación HelloTaxi
 */

/**
 * Redondea un precio a centésimas (dos decimales)
 * Ejemplos:
 * - 3.246 → 3.24
 * - 3.918 → 3.91
 * - 3.955 → 3.95
 * - 5.689 → 5.68
 * 
 * @param price - El precio a redondear
 * @returns El precio redondeado a centésimas
 */
export function roundToDecimal(price: number): number {
  // Redondear a centésimas hacia abajo
  return Math.floor(price * 100) / 100;
}

/**
 * Ajusta un precio al múltiplo de 0.10 más cercano hacia abajo
 * Ejemplos:
 * - 3.24 → 3.20
 * - 3.91 → 3.90
 * - 5.68 → 5.60
 * - 7.25 → 7.20
 * 
 * @param price - El precio a ajustar
 * @returns El precio ajustado al múltiplo de 0.10
 */
export function roundToTenCents(price: number): number {
  return Math.floor(price * 10) / 10;
}

/**
 * Formatea un precio para mostrar con el símbolo de moneda
 * 
 * @param price - El precio a formatear
 * @param decimals - Número de decimales (default: 2 para centésimas)
 * @returns String formateado "S/ XX.XX"
 */
export function formatPrice(price: number, decimals: number = 2): string {
  return `S/ ${price.toFixed(decimals)}`;
}

/**
 * Incrementa un precio en múltiplos de 0.10
 * 
 * @param currentPrice - Precio actual
 * @param maxPrice - Precio máximo permitido
 * @returns El nuevo precio incrementado en 0.10 (sin exceder el máximo)
 */
export function incrementPrice(currentPrice: number, maxPrice: number): number {
  const newPrice = currentPrice + 0.10;
  return Math.min(roundToDecimal(newPrice), maxPrice);
}

/**
 * Decrementa un precio en múltiplos de 0.10
 * 
 * @param currentPrice - Precio actual
 * @param minPrice - Precio mínimo permitido
 * @returns El nuevo precio decrementado en 0.10 (sin bajar del mínimo)
 */
export function decrementPrice(currentPrice: number, minPrice: number): number {
  const newPrice = currentPrice - 0.10;
  return Math.max(roundToDecimal(newPrice), minPrice);
}

/**
 * Normaliza un precio al sistema de HelloTaxi
 * - Redondea a centésimas (dos decimales)
 * - Asegura que sea múltiplo de 0.10 para facilitar incrementos/decrementos
 * 
 * @param price - El precio a normalizar
 * @returns El precio normalizado
 */
export function normalizePrice(price: number): number {
  // Primero redondeamos a centésimas
  const rounded = roundToDecimal(price);
  
  // Luego ajustamos al múltiplo de 0.10 más cercano hacia abajo
  // Esto facilita los incrementos/decrementos de 0.10
  return roundToTenCents(rounded);
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
