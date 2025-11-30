"use client";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, query, where, getDocs, addDoc, Timestamp, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { db, auth } from "@/lib/firebase";
import type { Ride } from "@/lib/types";

export default function ClaimsPage() {
  const [claim, setClaim] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [rides, setRides] = useState<Ride[]>([]);
  const [selectedRide, setSelectedRide] = useState("");
  const [loadingRides, setLoadingRides] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    async function fetchRides() {
      setLoadingRides(true);
      try {
        const user = auth.currentUser;
        if (!user) return;
        // Buscar viajes donde el usuario es pasajero
        const ridesQuery = query(
          collection(db, "rides"),
          where("passenger", "==", doc(db, "users", user.uid))
        );
        const snapshot = await getDocs(ridesQuery);
        const ridesList: Ride[] = snapshot.docs.map(docSnap => {
          const { id: _, ...data } = docSnap.data() as Ride;
          return {
            id: docSnap.id,
            ...data
          };
        });
        setRides(ridesList);
      } catch (err) {
        // No mostrar error, solo dejar vacío
      } finally {
        setLoadingRides(false);
      }
    }
    fetchRides();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Debes iniciar sesión para enviar un reclamo.");
        return;
      }
      if (!selectedRide) {
        setError("Debes seleccionar el viaje relacionado al reclamo.");
        return;
      }
      if (!reason) {
        setError("Debes seleccionar el motivo del reclamo.");
        return;
      }
      // Referencia al usuario en Firestore
      const userRef = doc(db, "users", user.uid);
      await addDoc(collection(db, "claims"), {
        claimant: userRef,
        date: Timestamp.now().toDate().toISOString(),
        reason,
        details: claim,
        status: "open",
        rideId: selectedRide,
      });
      setSubmitted(true);
    } catch (err) {
      setError("No se pudo enviar el reclamo. Intenta nuevamente.");
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Enviar un Reclamo</CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-green-600 font-semibold">¡Reclamo enviado correctamente!</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Motivo del reclamo</label>
                <Select value={reason} onValueChange={setReason} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conductor">Problema con el conductor</SelectItem>
                    <SelectItem value="Tarifa">Problema con la tarifa</SelectItem>
                    <SelectItem value="Vehículo">Problema con el vehículo</SelectItem>
                    <SelectItem value="Servicio">Problema con el servicio</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={claim}
                onChange={e => setClaim(e.target.value)}
                placeholder="Describe tu reclamo..."
                required
                rows={5}
              />
              <div>
                <label className="block mb-2 font-medium">Selecciona el viaje relacionado</label>
                <Select value={selectedRide} onValueChange={setSelectedRide} disabled={loadingRides || rides.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingRides ? "Cargando viajes..." : "Selecciona un viaje"} />
                  </SelectTrigger>
                  <SelectContent>
                    {rides.map(ride => (
                      <SelectItem key={ride.id} value={ride.id}>
                        {ride.pickup} → {ride.dropoff} ({ride.date?.slice(0,10)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Enviar Reclamo</Button>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
