/**
 * Prueba rápida para validar el problema del cupón BIENVENIDO10
 */

import { estimateRideFareDeterministic } from '@/ai/flows/get-fare-estimates';

async function testBIENVENIDO10Issue() {
  console.log('🔍 Probando el problema reportado con BIENVENIDO10...\n');
  
  // Caso 1: Viaje de S/20 (límite exacto) - DEBE aplicar descuento
  console.log('📋 Caso 1: Viaje de exactamente S/20');
  try {
    const result1 = await estimateRideFareDeterministic({
      distanceKm: 5,
      durationMinutes: 15,
      serviceType: 'economy',
      couponCode: 'BIENVENIDO10',
      peakTime: false,
    });
    
    console.log(`💰 Tarifa sin descuento: S/${(result1.estimatedFare + result1.breakdown.couponDiscount).toFixed(2)}`);
    console.log(`🎟️ Descuento aplicado: S/${result1.breakdown.couponDiscount.toFixed(2)}`);
    console.log(`💸 Tarifa final: S/${result1.estimatedFare.toFixed(2)}`);
    
    if (result1.breakdown.couponDiscount > 0) {
      console.log('✅ CORRECTO: Se aplicó el descuento como esperado');
    } else {
      console.log('❌ ERROR: No se aplicó descuento cuando debería haberlo hecho');
    }
  } catch (error) {
    console.log(`❌ Error en caso 1: ${error}`);
  }
  
  console.log('');
  
  // Caso 2: Viaje de S/15 (menor al límite) - NO debe aplicar descuento
  console.log('📋 Caso 2: Viaje menor a S/20 (no debería aplicar descuento)');
  try {
    const result2 = await estimateRideFareDeterministic({
      distanceKm: 2,
      durationMinutes: 8,
      serviceType: 'economy',
      couponCode: 'BIENVENIDO10',
      peakTime: false,
    });
    
    console.log(`💰 Tarifa calculada: S/${result2.estimatedFare.toFixed(2)}`);
    console.log(`🎟️ Descuento aplicado: S/${result2.breakdown.couponDiscount.toFixed(2)}`);
    
    if (result2.breakdown.couponDiscount === 0) {
      console.log('✅ CORRECTO: No se aplicó descuento porque no cumple el gasto mínimo');
    } else {
      console.log('❌ ERROR: Se aplicó descuento cuando NO debería (gasto < S/20)');
    }
  } catch (error) {
    console.log(`❌ Error en caso 2: ${error}`);
  }
  
  console.log('\n🏁 Prueba completada');
}

// Exportar para uso en otros archivos
export { testBIENVENIDO10Issue };

// Si este archivo se ejecuta directamente
if (require.main === module) {
  testBIENVENIDO10Issue().catch(console.error);
}