'use client';

import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Claim, User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, DocumentReference } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { claimsColumns, type EnrichedClaim } from './claims-columns';

async function getClaims(): Promise<EnrichedClaim[]> {
  const claimsCol = collection(db, 'claims');
  const claimSnapshot = await getDocs(claimsCol);
  const claimsList = claimSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Claim));

  const enrichedClaims: EnrichedClaim[] = [];

  for (const claim of claimsList) {
    if (claim.claimant && claim.claimant instanceof DocumentReference) {
      const claimantSnap = await getDoc(claim.claimant);
      if(claimantSnap.exists()) {
        enrichedClaims.push({
          ...claim,
          claimant: { id: claimantSnap.id, ...claimantSnap.data() } as User,
        });
      }
    }
  }
  
  return enrichedClaims.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}


export default function ClaimsTable() {
  const [claims, setClaims] = useState<EnrichedClaim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClaims() {
      try {
        const fetchedClaims = await getClaims();
        setClaims(fetchedClaims);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    }
    loadClaims();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Reclamos</CardTitle>
          <CardDescription>
            Todos los reclamos registrados por pasajeros y conductores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Reclamos</CardTitle>
        <CardDescription>
          Todos los reclamos registrados por pasajeros y conductores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={claimsColumns}
          data={claims}
          searchKey="claimant"
          searchPlaceholder="Buscar por usuario, motivo o descripción..."
          pageSize={10}
          entityName="reclamo"
        />
      </CardContent>
    </Card>
  );
}
