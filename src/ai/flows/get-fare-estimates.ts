'use server';

/**
 * @fileOverview This file defines Genkit flows for estimating ride fares using two methods:
 * 1. A deterministic calculation based on set parameters.
 * 2. An LLM-based estimation that simulates an expert's reasoning.
 *
 * - estimateRideFareDeterministic - Calculates fare based on a precise formula.
 * - estimateRideFareLLM - Uses a Genkit prompt to estimate the fare.
 */

import { ai } from '@/ai/genkit';
import { getSettings } from '@/services/settings-service';
import {
  EstimateRideFareInputSchema,
  EstimateRideFareOutputSchema,
  type EstimateRideFareInput,
  type EstimateRideFareOutput,
} from '@/ai/schemas/fare-estimation-schemas';
import type { FareBreakdown, Coupon } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizePrice, roundToDecimal } from '@/lib/price-utils';


/**
 * Calculates the ride fare using a deterministic formula.
 * @param input The ride details.
 * @returns A promise that resolves to the calculated fare.
 */
export async function estimateRideFareDeterministic(
  input: EstimateRideFareInput
): Promise<EstimateRideFareOutput> {
  return estimateRideFareDeterministicFlow(input);
}


const estimateRideFareDeterministicFlow = ai.defineFlow(
  {
    name: 'estimateRideFareDeterministicFlow',
    inputSchema: EstimateRideFareInputSchema,
    outputSchema: EstimateRideFareOutputSchema,
  },
  async (input) => {
    console.log('[GENKIT FLOW] Input recibido:', input);
    
    // Get settings from Firestore
    const settings = await getSettings();
    console.log('[GENKIT FLOW] Settings obtenidos:', {
      baseFare: settings.baseFare,
      perKmFare: settings.perKmFare,
      perMinuteFare: settings.perMinuteFare,
      serviceTypes: settings.serviceTypes
    });

    // Get the service multiplier
    const serviceMultiplier =
      settings.serviceTypes.find((s) => s.id === input.serviceType)?.multiplier || 1;
    console.log('[GENKIT FLOW] Service multiplier:', serviceMultiplier);

    // Calculate base costs
    const baseFare = settings.baseFare;
    const distanceCost = input.distanceKm * settings.perKmFare;
    const durationCost = input.durationMinutes * settings.perMinuteFare;
    const baseCost = baseFare + distanceCost + durationCost;
    
    // Apply service type multiplier
    const serviceCost = baseCost * (serviceMultiplier - 1);
    let subtotal = baseCost + serviceCost;

    // Apply special day surcharge
    const rideDate = input.rideDate ? new Date(input.rideDate) : new Date();
    const specialRule = settings.specialFareRules.find(rule => {
      const startDate = new Date(rule.startDate);
      const endDate = new Date(rule.endDate);
      return rideDate >= startDate && rideDate <= endDate;
    });
    
    const specialDaySurcharge = specialRule ? subtotal * (specialRule.surcharge / 100) : 0;
    subtotal += specialDaySurcharge;

    // Apply peak time surcharge
    const currentTimeInMinutes = rideDate.getHours() * 60 + rideDate.getMinutes();
    
    const peakRule = settings.peakTimeRules.find(rule => {
      const [startHour, startMinute] = rule.startTime.split(':').map(Number);
      const [endHour, endMinute] = rule.endTime.split(':').map(Number);
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
    });
    
    const peakSurcharge = peakRule ? subtotal * (peakRule.surcharge / 100) : 0;
    let total = subtotal + peakSurcharge;

    // Apply coupon discount
    let couponDiscount = 0;
    if (input.couponCode) {
        const couponRef = doc(db, 'coupons', input.couponCode);
        const couponSnap = await getDoc(couponRef);
        
        if (couponSnap.exists()) {
            const coupon = couponSnap.data() as Coupon;
            const isExpired = new Date(coupon.expiryDate) < new Date();
            
            // Check if coupon is valid (active, not expired, meets minimum spend requirement)
            const meetsMinSpend = !coupon.minSpend || total >= coupon.minSpend;
            
            if (coupon.status === 'active' && !isExpired && meetsMinSpend) {
                if (coupon.discountType === 'percentage') {
                    couponDiscount = total * (coupon.value / 100);
                } else { // fixed amount
                    couponDiscount = coupon.value;
                }
                // Ensure discount doesn't make total negative
                couponDiscount = Math.min(total, couponDiscount);
                total -= couponDiscount;
            }
        }
    }


    // Normalizar el total final al sistema de precios de HelloTaxi
    // Redondea a décimas y ajusta a múltiplos de 0.50
    const normalizedTotal = normalizePrice(total);

    console.log('[GENKIT FLOW] Cálculos finales:', {
      baseFare,
      distanceCost,
      durationCost,
      serviceCost,
      peakSurcharge,
      specialDaySurcharge,
      couponDiscount,
      subtotal,
      total,
      normalizedTotal
    });

    const breakdown: FareBreakdown = {
      baseFare: roundToDecimal(baseFare),
      distanceCost: roundToDecimal(distanceCost),
      durationCost: roundToDecimal(durationCost),
      serviceMultiplier,
      serviceCost: roundToDecimal(serviceCost),
      peakSurcharge: roundToDecimal(peakSurcharge),
      specialDaySurcharge: roundToDecimal(specialDaySurcharge),
      couponDiscount: roundToDecimal(couponDiscount),
      subtotal: roundToDecimal(subtotal),
      total: normalizedTotal,
    };

    console.log('[GENKIT FLOW] Resultado final:', {
      estimatedFare: normalizedTotal,
      breakdown
    });

    return {
      estimatedFare: normalizedTotal,
      breakdown,
    };
  }
);


/**
 * Estimates the ride fare using an LLM.
 * @param input The ride details.
 * @returns A promise that resolves to the LLM's estimated fare.
 */
export async function estimateRideFareLLM(
  input: EstimateRideFareInput
): Promise<EstimateRideFareOutput> {
  return estimateRideFareLLMFlow(input);
}

/**
 * Creates a basic breakdown for LLM estimations
 */
function createBasicBreakdown(estimatedFare: number): FareBreakdown {
  return {
    baseFare: 0,
    distanceCost: 0,
    durationCost: 0,
    serviceMultiplier: 1,
    serviceCost: 0,
    peakSurcharge: 0,
    specialDaySurcharge: 0,
    couponDiscount: 0,
    subtotal: estimatedFare,
    total: estimatedFare,
  };
}

const llmPrompt = ai.definePrompt({
  name: 'estimateRideFareLLMPrompt',
  input: { schema: EstimateRideFareInputSchema },
  output: { schema: EstimateRideFareOutputSchema },
  prompt: `Eres un experto en tarifas de taxi en Perú. Tu tarea es estimar el costo de un viaje, no siguiendo una fórmula matemática estricta, sino usando tu juicio como lo haría un taxista experimentado.
    
    Analiza los siguientes datos del viaje:
    - Distancia: {{distanceKm}} km
    - Duración: {{durationMinutes}} minutos
    - Tipo de Servicio: {{serviceType}}
    - ¿Hora Punta?: {{peakTime}}

    Basado en tu experiencia, considera factores implícitos como el tráfico potencial (la duración ya lo sugiere, pero puedes inferir la intensidad), el costo de combustible, el desgaste del vehículo, y el nivel de confort del servicio.
    
    Calcula una tarifa final justa y competitiva en Soles (S/). La tarifa debe ser un número único. No expliques tu razonamiento, solo proporciona el número final en el campo 'estimatedFare'.`,
});

const estimateRideFareLLMFlow = ai.defineFlow(
  {
    name: 'estimateRideFareLLMFlow',
    inputSchema: EstimateRideFareInputSchema,
    outputSchema: EstimateRideFareOutputSchema,
  },
  async (input) => {
    const { output } = await llmPrompt(input);
    
    // Normalizar el precio estimado por el LLM
    const normalizedFare = normalizePrice(output!.estimatedFare);
    
    return {
      estimatedFare: normalizedFare,
      breakdown: createBasicBreakdown(normalizedFare),
    };
  }
);
