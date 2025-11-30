"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { Claim, User } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type EnrichedClaim = Omit<Claim, 'claimant'> & { claimant: User };

const statusConfig = {
  open: { label: 'Abierto', variant: 'destructive' as const },
  'in-progress': { label: 'En Proceso', variant: 'default' as const },
  resolved: { label: 'Resuelto', variant: 'secondary' as const },
};

export default function UserClaimsPage() {
  const [claims, setClaims] = useState<EnrichedClaim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClaims() {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        const claimsQuery = query(
          collection(db, "claims"),
          where("claimant", "==", userRef)
        );

        const snapshot = await getDocs(claimsQuery);
        const claimsList: EnrichedClaim[] = snapshot.docs.map((docSnap) => {
          const { id: _, ...data } = docSnap.data() as Claim;
          return {
            id: docSnap.id,
            ...data,
            claimant: { id: user.uid, name: user.displayName || '', email: user.email || '', avatarUrl: user.photoURL || '', roles: ['rider'], signupDate: '', totalRidesAsPassenger: 0, rating: 0, phone: '', address: '', status: 'active' } as User
          };
        });

        // Ordenar por fecha, más recientes primero
        claimsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setClaims(claimsList);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchClaims();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Mis Reclamos</h1>
        <Card>
          <CardContent className="py-10 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tienes reclamos registrados.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Mis Reclamos</h1>
      <div className="space-y-4">
        {claims.map((claim) => (
          <Card key={claim.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{claim.reason}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(claim.date), "dd 'de' MMMM 'del' yyyy", { locale: es })}
                  </CardDescription>
                </div>
                <Badge variant={statusConfig[claim.status].variant}>
                  {statusConfig[claim.status].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Detalles:</p>
                <p className="text-sm text-muted-foreground italic bg-muted p-3 rounded-md">
                  "{claim.details}"
                </p>
              </div>
              
              {claim.adminResponse && (
                <div>
                  <p className="text-sm font-medium mb-1">Respuesta del Administrador:</p>
                  <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                    {claim.adminResponse}
                  </p>
                </div>
              )}

              {!claim.adminResponse && claim.status === 'open' && (
                <p className="text-xs text-muted-foreground">
                  Tu reclamo está siendo revisado. Recibirás una respuesta pronto.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
