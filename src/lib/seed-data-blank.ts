// This file contains blank/minimal data to seed a production-ready Firestore database.
// Only essential configuration data is included, no test users, drivers, or rides.

import type { Driver, User, Ride, Claim, SOSAlert, Notification, Settings, ServiceTypeConfig, Coupon, SpecialFareRule, CancellationReason, PeakTimeRule, Location, Vehicle, VehicleModel } from '@/lib/types';

// ================================================================= //
//                      VEHICLE BRANDS & MODELS                      //
// ================================================================= //
export const vehicleModels: Omit<VehicleModel, 'id'>[] = [
    {
        name: 'Toyota',
        models: ['Yaris', 'Etios', 'Avanza', 'Corolla', 'Raize', 'Hilux', 'Fortuner']
    },
    {
        name: 'Kia',
        models: ['Picanto', 'Soluto', 'Rio', 'Cerato', 'Seltos', 'Sportage']
    },
    {
        name: 'Hyundai',
        models: ['Grand i10', 'Accent', 'Verna', 'Creta', 'Tucson', 'Santa Fe']
    },
    {
        name: 'Chevrolet',
        models: ['Sail', 'Onix', 'Joy', 'Tracker', 'Blazer']
    },
    {
        name: 'Suzuki',
        models: ['Swift', 'Dzire', 'Baleno', 'Ertiga', 'Vitara']
    },
    {
        name: 'Nissan',
        models: ['V-Drive', 'Versa', 'Sentra', 'Kicks', 'X-Trail']
    },
    {
        name: 'Honda',
        models: ['City', 'Civic', 'CR-V', 'HR-V']
    },
    {
        name: 'Mazda',
        models: ['2', '3', 'CX-3', 'CX-5', 'CX-30']
    },
    {
        name: 'Volkswagen',
        models: ['Gol', 'Polo', 'Virtus', 'T-Cross', 'Tiguan']
    },
    {
        name: 'Renault',
        models: ['Kwid', 'Sandero', 'Logan', 'Duster', 'Captur']
    },
    {
        name: 'Peugeot',
        models: ['208', '2008', '3008', '5008']
    },
    {
        name: 'Ford',
        models: ['Fiesta', 'Focus', 'Escape', 'Explorer', 'Ranger']
    },
    {
        name: 'Mercedes-Benz',
        models: ['Clase A', 'Clase C', 'Clase E', 'GLA', 'GLC', 'GLE']
    },
    {
        name: 'BMW',
        models: ['Serie 1', 'Serie 3', 'Serie 5', 'X1', 'X3', 'X5']
    },
    {
        name: 'Audi',
        models: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7']
    },
    {
        name: 'Mitsubishi',
        models: ['Mirage', 'Outlander', 'Montero Sport', 'L200']
    },
    {
        name: 'Subaru',
        models: ['Impreza', 'XV', 'Forester', 'Outback']
    },
    {
        name: 'Jeep',
        models: ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler']
    },
    {
        name: 'Chery',
        models: ['QQ', 'Tiggo 2', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8']
    },
    {
        name: 'JAC',
        models: ['S2', 'S3', 'S4', 'T6', 'T8']
    },
    {
        name: 'MG',
        models: ['3', '5', 'ZS', 'HS', 'RX5']
    },
    {
        name: 'BYD',
        models: ['F3', 'S6', 'Song', 'Tang']
    },
    {
        name: 'Geely',
        models: ['Emgrand', 'Coolray', 'Okavango']
    },
    {
        name: 'Great Wall',
        models: ['Wingle', 'Haval H6', 'Poer']
    },
    {
        name: 'Otros',
        models: ['Otro modelo']
    }
];


// ================================================================= //
//                            VEHICLES                               //
// ================================================================= //
export const vehicles: Omit<Vehicle, 'id' | 'driverId'>[] = [];


// ================================================================= //
//                            DRIVERS                                //
// ================================================================= //
export const drivers: (Omit<Driver, 'id' | 'vehicle' | 'userId'> & {licensePlate: string, userName: string, userEmail: string})[] = [];


// ================================================================= //
//                             USERS                                 //
// ================================================================= //
export const users: (Omit<User, 'id'>)[] = [];


// ================================================================= //
//                             RIDES                                 //
// ================================================================= //
export const rides: (Omit<Ride, 'id' | 'driver' | 'passenger' | 'vehicle'> & { driverName: string, passengerEmail: string })[] = [];

// ================================================================= //
//                             CLAIMS                                //
// ================================================================= //
export const claims: (Omit<Claim, 'id' | 'claimant' | 'rideId'> & { rideIndex: number, claimantEmail: string })[] = [];

// ================================================================= //
//                           SOS ALERTS                              //
// ================================================================= //
export const sosAlerts: (Omit<SOSAlert, 'id' | 'driver' | 'passenger' | 'rideId'> & { rideIndex: number, driverName: string, passengerEmail: string })[] = [];

// ================================================================= //
//                         NOTIFICATIONS                             //
// ================================================================= //
export const notifications: Omit<Notification, 'id'>[] = [];

// ================================================================= //
//                             COUPONS                               //
// ================================================================= //
export const coupons: Omit<Coupon, 'id'>[] = [];


// ================================================================= //
//                         APP CONFIGURATION                         //
// ================================================================= //
export const serviceTypes: ServiceTypeConfig[] = [
  { id: 'economy', name: 'Económico', description: 'Vehículos estándar para el día a día', multiplier: 1.0 },
  { id: 'comfort', name: 'Confort', description: 'Vehículos más nuevos y espaciosos', multiplier: 1.3 },
  { id: 'exclusive', name: 'Exclusivo', description: 'La mejor flota y los mejores conductores', multiplier: 1.8 },
];

export const specialFareRules: Omit<SpecialFareRule, 'id'>[] = [
    { name: 'Fiestas Patrias', startDate: new Date(new Date().getFullYear(), 6, 28).toISOString(), endDate: new Date(new Date().getFullYear(), 6, 29).toISOString(), surcharge: 50 },
    { name: 'Navidad', startDate: new Date(new Date().getFullYear(), 11, 24).toISOString(), endDate: new Date(new Date().getFullYear(), 11, 25).toISOString(), surcharge: 75 },
    { name: 'Año Nuevo', startDate: new Date(new Date().getFullYear(), 11, 31).toISOString(), endDate: new Date(new Date().getFullYear() + 1, 0, 1).toISOString(), surcharge: 100 },
]

export const cancellationReasons: CancellationReason[] = [
    { code: 'DRIVER_LATE', reason: 'El conductor se demora mucho' },
    { code: 'DRIVER_REQUEST', reason: 'El conductor pidió que cancelara' },
    { code: 'NO_LONGER_NEEDED', reason: 'Ya no necesito el viaje' },
    { code: 'PICKUP_ISSUE', reason: 'Problema con el punto de recojo' },
    { code: 'WRONG_ADDRESS', reason: 'Ingresé mal la dirección' },
    { code: 'PRICE_TOO_HIGH', reason: 'El precio es muy alto' },
    { code: 'FOUND_ALTERNATIVE', reason: 'Encontré otra alternativa' },
    { code: 'NO_SHOW', reason: 'El pasajero no se presentó' },
    { code: 'PASSENGER_REQUEST', reason: 'El pasajero pidió cancelar' },
    { code: 'VEHICLE_ISSUE', reason: 'Problema con el vehículo' },
    { code: 'TRAFFIC', reason: 'Mucho tráfico' },
    { code: 'OTHER', reason: 'Otro motivo' },
];

export const peakTimeRules: PeakTimeRule[] = [
    { id: 'peak1', name: 'Hora Punta Mañana', startTime: '07:00', endTime: '09:00', surcharge: 20 },
    { id: 'peak2', name: 'Hora Punta Tarde', startTime: '17:00', endTime: '20:00', surcharge: 25 },
    { id: 'peak3', name: 'Horario Nocturno', startTime: '23:00', endTime: '05:00', surcharge: 35 },
];


// ================================================================= //
//                           SETTINGS                                //
// ================================================================= //
export const settings: Omit<Settings, 'id' | 'serviceTypes' | 'cancellationReasons' | 'specialFareRules' | 'peakTimeRules'> = {
    baseFare: 3.5,
    perKmFare: 1.0,
    perMinuteFare: 0.20,
    negotiationRange: 15, // en porcentaje
    locationUpdateInterval: 15, // en segundos
    mapCenterLat: -12.08, 
    mapCenterLng: -77.05, 
    membershipFeeEconomy: 40,
    membershipFeeComfort: 50,
    membershipFeeExclusive: 60,
    commissionPercentageEconomy: 15,
    commissionPercentageComfort: 15,
    commissionPercentageExclusive: 15,
};
