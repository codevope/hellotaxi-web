

import type { DocumentReference } from 'firebase/firestore';

export type ServiceType = 'economy' | 'comfort' | 'exclusive';
export type PaymentModel = 'commission' | 'membership';
export type MembershipStatus = 'active' | 'pending' | 'expired';
export type MembershipDuration = 'monthly' | 'annual';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'yape' | 'plin';
export type UserRole = 'rider' | 'driver' | 'admin';

export interface MembershipPricing {
  economy: number;
  comfort: number;
  exclusive: number;
}

export interface MembershipPayment {
  id: string;
  driverId: string;
  amount: number;
  serviceType: ServiceType;
  dueDate: string; // ISO Date string
  paidDate?: string; // ISO Date string
  status: PaymentStatus;
  periodStart: string; // ISO Date string
  periodEnd: string; // ISO Date string
  createdAt: string; // ISO Date string
}

export type DocumentName = 'license' | 'insurance' | 'technicalReview' | 'backgroundCheck' | 'dni' | 'propertyCard';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface Location {
  id?: string; // Hacer opcional para mayor flexibilidad
  lat: number;
  lng: number;
  address?: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  serviceType: ServiceType;
  year: number;
  color: string;
  driverId: string;
  insuranceExpiry: string; // ISO Date string
  technicalReviewExpiry: string; // ISO Date string
  propertyCardRegistrationDate?: string; // ISO Date string
  status: 'active' | 'inactive' | 'in_review';
}

export interface VehicleModel {
    id: string;
    name: string;
    models: string[];
}

// Driver - SOLO datos específicos del rol de conductor
// Los datos personales (nombre, email, avatar, etc.) están en User
export interface Driver {
  id: string; // Mismo ID que el User
  userId: string; // Referencia al User para obtener datos personales
  status: 'available' | 'unavailable' | 'on-ride';
  documentsStatus: 'approved' | 'pending' | 'rejected';
  licenseExpiry: string; // ISO Date string
  backgroundCheckExpiry: string; // ISO Date string
  dniExpiry: string; // ISO Date string
  paymentModel: PaymentModel;
  membershipStatus: MembershipStatus;
  membershipExpiryDate?: string; // ISO Date string
  // Campos de comisión
  commissionPercentage?: number; // Porcentaje de comisión (ej: 15 para 15%)
  // Campos de membresía
  membershipPricing?: MembershipPricing; // Precios por tipo de servicio
  membershipDuration?: MembershipDuration; // Duración: mensual o anual
  membershipStartDate?: string; // ISO Date string - fecha de inicio de membresía
  membershipPausedDate?: string; // ISO Date string - fecha cuando se pausa la membresía
  lastPaymentDate?: string; // ISO Date string - última fecha de pago de membresía
  nextPaymentDue?: string; // ISO Date string - próxima fecha de vencimiento de pago
  documentStatus: Record<DocumentName, DocumentStatus>;
  documentUrls: Record<DocumentName, string>; // URLs de documentos subidos
  totalRidesAsDriver: number; // Total de viajes completados como conductor
  driverRating: number; // Calificación específica como conductor
  location?: Location;
  vehicle?: DocumentReference; // Opcional hasta que se asigne
  // Preferencias de notificación
  notificationPreferences?: {
    browserNotifications: boolean;
    soundNotifications: boolean;
    lastAudioPermissionGranted?: string; // ISO Date string cuando se habilitó por última vez
    deviceInfo?: {
      userAgent: string;
      platform: string;
      timestamp: string;
    }[];
  };
}

// EnrichedDriver: Driver con vehículo expandido y datos de usuario
export interface EnrichedDriver extends Omit<Driver, 'vehicle'> {
  vehicle: Vehicle | null;
  user: User; // Datos del usuario asociado
  // Helpers para acceso directo (evitar user.name)
  name: string;
  email: string;
  avatarUrl: string;
  phone: string;
  rating: number;
}

// DriverWithVehicleInfo extends Driver with vehicle information for UI display
export interface DriverWithVehicleInfo extends Driver {
  // Datos del usuario (desde User)
  name: string;
  email: string;
  avatarUrl: string;
  rating: number;
  phone: string;
  // Datos del vehículo (desde Vehicle)
  vehicleBrand: string;
  vehicleModel: string;
  licensePlate: string;
  vehicleColor?: string;
  vehicleYear?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  roles: UserRole[]; // Array de roles: puede ser ['rider'], ['driver'], ['rider', 'driver'], ['admin'], etc.
  signupDate: string; // ISO Date string
  totalRidesAsPassenger: number; // Viajes como pasajero
  rating: number; // Calificación general del usuario
  phone: string;
  address: string;
  status: 'active' | 'blocked' | 'incomplete';
  password?: string; // Contraseña opcional para mejorar seguridad
  // Campos legacy (mantener por compatibilidad temporal)
  role?: UserRole; // @deprecated - usar roles array
  isAdmin?: boolean; // @deprecated - verificar si 'admin' está en roles
  totalRides?: number; // @deprecated - usar totalRidesAsPassenger
}

export type FareBreakdown = {
  baseFare: number;
  distanceCost: number;
  durationCost: number;
  serviceMultiplier: number;
  serviceCost: number;
  peakSurcharge: number;
  specialDaySurcharge: number;
  couponDiscount: number;
  subtotal: number;
  total: number;
};

export type CancellationReason = {
    code: string;
    reason: string;
};

export type RideStatus = 'searching' | 'accepted' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'counter-offered';

export interface Ride {
  id: string;
  pickup: string;
  dropoff: string;
  pickupLocation?: Location; // Coordenadas del punto de recojo
  dropoffLocation?: Location; // Coordenadas del punto de destino
  date: string;
  fare: number;
  driver: DocumentReference | null;
  passenger: DocumentReference;
  vehicle: DocumentReference | null;
  status: RideStatus;
  serviceType: ServiceType;
  paymentMethod: PaymentMethod;
  cancellationReason?: CancellationReason;
  cancelledBy?: 'passenger' | 'driver' | 'system';
  cancelledAt?: string; // ISO Date string - cuando se canceló el viaje
  assignmentTimestamp?: string; // ISO Date string
  peakTime?: boolean;
  couponCode?: string;
  fareBreakdown?: FareBreakdown;
  rejectedBy?: DocumentReference[];
  isRatedByPassenger?: boolean;
  offeredTo?: DocumentReference | null;
  offeredToTimestamp?: string; // ISO Date string - cuando se ofreció el viaje a un conductor
  // Calificaciones del viaje específico
  driverRating?: number; // Calificación que el pasajero le dio al conductor en este viaje
  driverComment?: string; // Comentario del pasajero sobre el conductor
  passengerRating?: number; // Calificación que el conductor le dio al pasajero en este viaje
  passengerComment?: string; // Comentario del conductor sobre el pasajero
}

export interface Review {
    id: string;
    rating: number;
    comment: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    createdAt: string; // ISO Date string;
}


export interface ScheduledRide {
    id: string;
    pickup: string;
    dropoff: string;
    scheduledTime: string; // ISO Date string
    passenger: DocumentReference;
    status: 'pending' | 'confirmed' | 'cancelled';
    serviceType: ServiceType;
    paymentMethod: PaymentMethod;
    createdAt: string;
}

export interface ChatMessage {
  id?: string;
  userId: string;
  text: string;
  timestamp: string; // ISO Date string
}


export interface Claim {
  id: string;
  rideId: string;
  claimant: DocumentReference;
  date: string; // ISO Date string
  reason: string;
  details: string;
  status: 'open' | 'in-progress' | 'resolved';
  adminResponse?: string;
}

export interface SOSAlert {
  id: string;
  rideId: string;
  passenger: DocumentReference;
  driver: DocumentReference;
  date: string; // ISO Date string
  status: 'pending' | 'attended';
  triggeredBy: 'passenger' | 'driver';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string; // ISO Date string
  target: 'all-passengers' | 'all-drivers' | 'specific-user';
  status: 'sent' | 'failed';
}

export interface Coupon {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    value: number;
    expiryDate: string; // ISO Date string
    status: 'active' | 'expired' | 'disabled';
    minSpend?: number;
    usageLimit?: number;
    timesUsed?: number;
}


export type ServiceTypeConfig = {
    id: ServiceType,
    name: string;
    description: string,
    multiplier: number
}

export interface SpecialFareRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  surcharge: number; // Percentage
}

export interface PeakTimeRule {
  id: string;
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  surcharge: number; // Percentage
}

export interface Settings {
    id: string;
    baseFare: number;
    perKmFare: number;
    perMinuteFare: number;
    negotiationRange: number;
    locationUpdateInterval: number;
    mapCenterLat: number;
    mapCenterLng: number;
    // Precios de membresía por tipo de servicio
    membershipFeeEconomy: number;
    membershipFeeComfort: number;
    membershipFeeExclusive: number;
    // Porcentajes de comisión por tipo de servicio
    commissionPercentageEconomy: number;
    commissionPercentageComfort: number;
    commissionPercentageExclusive: number;
    serviceTypes: ServiceTypeConfig[];
    cancellationReasons: CancellationReason[];
    specialFareRules: SpecialFareRule[];
    peakTimeRules: PeakTimeRule[];
}

export type Passenger = User;

// This represents the raw user object from Firebase Auth
export interface FirebaseUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
    providerData: any[];
    metadata: {
        creationTime?: string;
        lastSignInTime?: string;
    }
}
    
