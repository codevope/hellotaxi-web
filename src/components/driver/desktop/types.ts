import type { User } from "@/lib/types";

export interface DesktopIncomingRequestProps {
  passenger: User;
  pickup: string;
  dropoff: string;
  fare: number;
  requestTimeLeft: number;
  isCountering: boolean;
  counterOfferAmount: string;
  onCounterOfferChange: (amount: string) => void;
  onAccept: () => void;
  onReject: () => void;
  onStartCounterOffer: () => void;
  onSubmitCounterOffer: () => void;
  onCancelCounterOffer: () => void;
}

export interface DesktopActiveRideProps {
  passenger: User;
  pickup: string;
  dropoff: string;
  fare: number;
  status: 'en_camino' | 'esperando' | 'viajando' | 'llegando';
  arrivalTime?: string;
  estimatedDuration?: number;
  distanceRemaining?: number;
  onCompleteRide: () => void;
  onCallPassenger: () => void;
  onMessagePassenger: () => void;
  onNavigate: () => void;
}

export interface DesktopRatingModalProps {
  isOpen: boolean;
  passenger: User;
  fare: number;
  onClose: () => void;
  onSubmitRating: (rating: number, comment: string) => void;
}