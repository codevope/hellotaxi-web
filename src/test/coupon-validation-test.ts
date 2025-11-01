/**
 * @fileOverview Archivo de prueba para validar la corrección de cupones
 * Este archivo verifica que los cupones se apliquen correctamente considerando
 * el gasto mínimo requerido
 */

import { estimateRideFareDeterministic } from '@/ai/flows/get-fare-estimates';
import type { EstimateRideFareInput } from '@/ai/schemas/fare-estimation-schemas';

/**
 * Test scenarios para validar la aplicación de cupones
 */
const testScenarios = [
  {
    name: 'Viaje con tarifa menor al gasto mínimo (S/15) - No debe aplicar descuento',
    input: {
      distanceKm: 3,
      durationMinutes: 10,
      serviceType: 'economy' as const,
      couponCode: 'BIENVENIDO10',
      peakTime: false,
    },
    expectedResult: {
      shouldApplyDiscount: false,
      reason: 'No cumple con gasto mínimo de S/20'
    }
  },
  {
    name: 'Viaje con tarifa igual al gasto mínimo (S/20) - Debe aplicar descuento',
    input: {
      distanceKm: 5,
      durationMinutes: 15,
      serviceType: 'economy' as const,
      couponCode: 'BIENVENIDO10',
      peakTime: false,
    },
    expectedResult: {
      shouldApplyDiscount: true,
      reason: 'Cumple exactamente con el gasto mínimo'
    }
  },
  {
    name: 'Viaje con tarifa mayor al gasto mínimo (S/25+) - Debe aplicar descuento',
    input: {
      distanceKm: 8,
      durationMinutes: 20,
      serviceType: 'economy' as const,
      couponCode: 'BIENVENIDO10',
      peakTime: false,
    },
    expectedResult: {
      shouldApplyDiscount: true,
      reason: 'Supera el gasto mínimo requerido'
    }
  },
  {
    name: 'Viaje sin cupón - No debe aplicar descuento',
    input: {
      distanceKm: 8,
      durationMinutes: 20,
      serviceType: 'economy' as const,
      peakTime: false,
    },
    expectedResult: {
      shouldApplyDiscount: false,
      reason: 'No se proporcionó cupón'
    }
  }
];

/**
 * Función para ejecutar las pruebas de validación de cupones
 */
export async function runCouponValidationTests() {
  console.log('🎟️ Iniciando pruebas de validación de cupones...\n');
  
  for (const scenario of testScenarios) {
    console.log(`📋 Prueba: ${scenario.name}`);
    console.log(`   Datos: ${JSON.stringify(scenario.input, null, 2)}`);
    
    try {
      const result = await estimateRideFareDeterministic(scenario.input);
      
      const hasDiscount = result.breakdown.couponDiscount > 0;
      const isExpectedResult = hasDiscount === scenario.expectedResult.shouldApplyDiscount;
      
      console.log(`   🎯 Resultado: ${isExpectedResult ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
      console.log(`   💰 Tarifa calculada: S/${result.estimatedFare}`);
      console.log(`   🎟️ Descuento aplicado: S/${result.breakdown.couponDiscount}`);
      console.log(`   📝 Razón: ${scenario.expectedResult.reason}`);
      
      if (!isExpectedResult) {
        console.log(`   ⚠️  PROBLEMA: Se esperaba ${scenario.expectedResult.shouldApplyDiscount ? 'aplicar' : 'NO aplicar'} descuento`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error}`);
    }
    
    console.log(''); // Línea en blanco para separar pruebas
  }
  
  console.log('🏁 Pruebas completadas\n');
}

/**
 * Función helper para probar un caso específico
 */
export async function testSpecificCase(
  distanceKm: number, 
  durationMinutes: number, 
  couponCode?: string
) {
  const input: EstimateRideFareInput = {
    distanceKm,
    durationMinutes,
    serviceType: 'economy',
    couponCode,
    peakTime: false,
  };
  
  console.log(`🧪 Prueba específica:`);
  console.log(`   Distancia: ${distanceKm}km`);
  console.log(`   Duración: ${durationMinutes} minutos`);
  console.log(`   Cupón: ${couponCode || 'Ninguno'}`);
  
  try {
    const result = await estimateRideFareDeterministic(input);
    
    console.log(`   💰 Tarifa final: S/${result.estimatedFare}`);
    console.log(`   🎟️ Descuento: S/${result.breakdown.couponDiscount}`);
    console.log(`   📊 Desglose completo:`, result.breakdown);
    
    return result;
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
    throw error;
  }
}