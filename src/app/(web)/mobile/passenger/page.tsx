"use client";

/**
 * Vista Mobile Optimizada para Passenger
 *
 * Características:
 * - Pantalla completa (sin header/footer web)
 * - Interfaz tipo app móvil
 * - Todas las funcionalidades: pedir viaje, chat, notificaciones, SOS
 * - Bottom navigation integrado en el layout
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  doc,
  onSnapshot,
  getDoc,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UberStylePassengerDashboard } from "@/components/ride/uber-style-passenger-dashboard";
import { useRideStore } from "@/store/ride-store";
import type { Driver, Vehicle, DriverWithVehicleInfo, CancellationReason } from "@/lib/types";
import { processRating } from "@/ai/flows/process-rating";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield } from "lucide-react";
import Link from "next/link";
import StartNow from "@/components/ride/start-now";

// Helper function to enrich driver with vehicle information
async function enrichDriverWithVehicle(
  driver: Driver
): Promise<DriverWithVehicleInfo> {
  try {
    const vehicleSnap = await getDoc(driver.vehicle);
    if (vehicleSnap.exists()) {
      const vehicleData = vehicleSnap.data() as Vehicle;
      return {
        ...driver,
        vehicleBrand: vehicleData.brand,
        vehicleModel: vehicleData.model,
        licensePlate: vehicleData.licensePlate,
        vehicleColor: vehicleData.color,
        vehicleYear: vehicleData.year,
      };
    }
  } catch (error) {
    console.error("Error loading vehicle data:", error);
  }

  // Fallback if vehicle data can't be loaded
  return {
    ...driver,
    vehicleBrand: "N/A",
    vehicleModel: "N/A",
    licensePlate: "N/A",
  };
}

function MobilePassengerContent() {
  const { user, appUser } = useAuth();
  const { toast } = useToast();

  const {
    status,
    activeRide,
    assignedDriver,
    chatMessages,
    pickupLocation,
    dropoffLocation,
    driverLocation,
    counterOfferValue,
    originalFare,
    setActiveRide,
    setChatMessages,
    setDriverLocation,
    assignDriver,
    completeRideForRating,
    resetRide,
    resetAll,
    setCounterOffer,
    setStatus,
  } = useRideStore();

  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [isRatingSubmitting, setIsSubmittingRating] = useState(false);

  // MASTER useEffect to listen for ride document changes and update UI state
  useEffect(() => {
    if (!user?.uid) {
      if (useRideStore.getState().status !== "idle") {
        resetRide();
      }
      return;
    }

    // This query finds any ride for the user that isn't in a final state.
    const q = query(
      collection(db, "rides"),
      where("passenger", "==", doc(db, "users", user.uid))
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log("📡 Snapshot received, docs count:", snapshot.docs.length);

      const activeRides = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as any))
        .filter(
          (ride: any) =>
            !["completed", "cancelled"].includes(ride.status) ||
            (ride.status === "completed" && !ride.isRatedByPassenger)
        );

      console.log("🔍 Active rides found:", activeRides.length);

      if (activeRides.length === 0) {
        // Only reset if we are not in the middle of rating a just-completed ride.
        if (useRideStore.getState().status !== "rating") {
          console.log("🔄 No active rides, resetting");
          resetRide();
        }
        return;
      }

      const rideData = activeRides[0]; // Assuming user has only one active ride
      console.log("🚗 Processing ride:", {
        id: rideData.id,
        status: rideData.status,
      });

      setActiveRide(rideData);

      switch (rideData.status) {
        case "searching":
          console.log("🔍 Setting status to searching");
          setStatus("searching");
          break;

        case "counter-offered":
          console.log("💰 Counter offer received:", rideData.fare);
          if (useRideStore.getState().counterOfferValue !== rideData.fare) {
            setCounterOffer(rideData.fare);
          }
          break;

        case "accepted":
        case "arrived":
        case "in-progress":
          console.log("👨‍💼 Driver assigned, status:", rideData.status);
          setStatus("assigned");
          if (rideData.driver) {
            const driverSnap = await getDoc(rideData.driver);
            if (driverSnap.exists()) {
              const driverData = {
                id: driverSnap.id,
                ...driverSnap.data(),
              } as Driver;
              const enrichedDriver = await enrichDriverWithVehicle(driverData);
              assignDriver(enrichedDriver);
              if (driverData.location) {
                setDriverLocation(driverData.location);
              }
            }
          }
          break;

        case "completed":
          console.log("✅ Ride completed");
          if (!rideData.isRatedByPassenger) {
            if (rideData.driver) {
              const driverSnap = await getDoc(rideData.driver);
              if (driverSnap.exists()) {
                const driverData = {
                  id: driverSnap.id,
                  ...driverSnap.data(),
                } as Driver;
                const enrichedDriver = await enrichDriverWithVehicle(
                  driverData
                );
                completeRideForRating(enrichedDriver);
              }
            }
          }
          break;

        default:
          console.log("⚠️ Unknown ride status:", rideData.status);
          break;
      }
    });

    return () => unsubscribe();
  }, [
    user?.uid,
    assignDriver,
    resetRide,
    setActiveRide,
    setCounterOffer,
    setDriverLocation,
    setStatus,
    completeRideForRating,
  ]);

  // Listener for chat messages
  useEffect(() => {
    if (!activeRide || status !== "assigned") return;

    const chatQuery = query(
      collection(db, "rides", activeRide.id, "chatMessages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(chatQuery, (querySnapshot) => {
      const messages = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as any)
      );
      setChatMessages(messages);
    });

    return () => unsubscribe();
  }, [activeRide, status, setChatMessages]);

  const handleCancelRide = async (reason: CancellationReason) => {
    const currentRide = useRideStore.getState().activeRide;
    if (!currentRide) return;

    const rideRef = doc(db, "rides", currentRide.id);

    try {
      await updateDoc(rideRef, {
        status: "cancelled",
        cancellationReason: reason,
        cancelledBy: "passenger",
      });

      toast({
        title: "Viaje Cancelado",
        description: `Motivo: ${reason.reason}.`,
      });
      resetRide();
    } catch (error) {
      console.error("Error cancelling ride:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar el viaje.",
      });
    }
  };

  const handleAcceptCounterOffer = async () => {
    if (!activeRide) return;

    try {
      const rideRef = doc(db, "rides", activeRide.id);

      // Get the driver reference from offeredTo field
      const currentRideDoc = await getDoc(rideRef);
      if (!currentRideDoc.exists()) {
        throw new Error("Ride not found");
      }

      const currentRideData = currentRideDoc.data();
      const driverRef = currentRideData.offeredTo;

      if (!driverRef) {
        throw new Error("Driver reference not found");
      }

      console.log(
        "🎯 Accepting counter-offer and assigning driver:",
        driverRef.id
      );

      const counterOfferAmount = useRideStore.getState().counterOfferValue;

      await updateDoc(rideRef, {
        status: "accepted",
        fare: counterOfferAmount,
        driver: driverRef,
        offeredTo: null,
      });

      setCounterOffer(null);
      setStatus("assigned");

      toast({
        title: "Contraoferta aceptada",
        description: `Has aceptado la tarifa de S/${counterOfferAmount?.toFixed(
          2
        )}`,
      });
    } catch (error) {
      console.error("Error accepting counter-offer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo aceptar la contraoferta.",
      });
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!user || !activeRide) return;

    const chatMessagesRef = collection(
      db,
      "rides",
      activeRide.id,
      "chatMessages"
    );
    await addDoc(chatMessagesRef, {
      userId: user.uid,
      text,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    const currentRide = useRideStore.getState().activeRide;
    const currentDriver = useRideStore.getState().assignedDriver;
    if (!currentDriver || !currentRide) return;

    setIsSubmittingRating(true);

    try {
      await processRating({
        ratedUserId: currentDriver.id,
        isDriver: true,
        rating,
        comment,
      });

      const rideRef = doc(db, "rides", currentRide.id);
      await updateDoc(rideRef, { isRatedByPassenger: true });

      toast({
        title: "¡Gracias por tu calificación!",
        description:
          "Tu opinión ayuda a mantener la calidad de nuestra comunidad.",
      });
      completeRideForRating(currentDriver);
      resetAll();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        variant: "destructive",
        title: "Error al Calificar",
        description:
          "No se pudo guardar tu calificación. Por favor, intenta de nuevo.",
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="h-full w-full">
      <UberStylePassengerDashboard
        user={appUser!}
        currentRide={activeRide}
        assignedDriver={assignedDriver}
        counterOffer={
          counterOfferValue
            ? { amount: counterOfferValue, originalFare: originalFare }
            : null
        }
        isSearching={status === "searching"}
        searchStartTime={null}
        pickupLocation={pickupLocation}
        dropoffLocation={dropoffLocation}
        rideLocation={driverLocation}
        chatMessages={chatMessages}
        onSendMessage={handleSendMessage}
        onCancelRide={() =>
          handleCancelRide({
            code: "user_cancelled",
            reason: "Cancelado por el usuario",
          })
        }
        onAcceptCounterOffer={handleAcceptCounterOffer}
        onRejectCounterOffer={() =>
          handleCancelRide({
            code: "counter_offer_rejected",
            reason: "Contraoferta rechazada",
          })
        }
        isPassengerChatOpen={isDriverChatOpen}
        setIsPassengerChatOpen={setIsDriverChatOpen}
        completedRideForRating={status === "rating" ? assignedDriver : null}
        onRatingSubmit={handleRatingSubmit}
        isRatingSubmitting={isRatingSubmitting}
      />
    </div>
  );
}

export default function MobilePassengerPage() {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <StartNow />;
  }

  // Check if user has complete profile (Google + Password + Phone)
  const providerIds = user.providerData.map((p) => p.providerId);
  const hasGoogle = providerIds.includes("google.com");
  const hasPassword = providerIds.includes("password");
  const hasPhoneInProfile = appUser?.phone && appUser.phone.trim().length > 0;
  const isProfileComplete = hasGoogle && hasPassword && hasPhoneInProfile;

  if (!isProfileComplete) {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-screen text-center bg-gray-50">
        <Card className="max-w-md p-6">
          <CardHeader>
            <div className="flex flex-col items-center gap-4">
              <Shield className="h-16 w-16 text-amber-500" />
              <CardTitle>Perfil Incompleto</CardTitle>
            </div>
            <CardDescription>
              Para pedir un viaje necesitas completar tu perfil de seguridad:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {hasGoogle ? (
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={hasGoogle ? "text-green-700" : "text-gray-500"}>
                  Cuenta Google vinculada
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {hasPassword ? (
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span
                  className={hasPassword ? "text-green-700" : "text-gray-500"}
                >
                  Contraseña configurada
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {hasPhoneInProfile ? (
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span
                  className={
                    hasPhoneInProfile ? "text-green-700" : "text-gray-500"
                  }
                >
                  Teléfono registrado
                </span>
              </div>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href="/mobile/profile">
                <Shield className="mr-2 h-4 w-4" />
                Completar mi Perfil
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <MobilePassengerContent />;
}
