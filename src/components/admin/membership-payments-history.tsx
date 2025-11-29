"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Loader2 } from "lucide-react";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { membershipPaymentsColumns, type EnrichedMembershipPayment } from "./membership-payments-columns";
import type { MembershipPayment, Driver } from "@/lib/types";

export default function MembershipPaymentsHistory() {
  const [payments, setPayments] = useState<EnrichedMembershipPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        const paymentsQuery = query(
          collection(db, "membershipPayments"),
          orderBy("dueDate", "desc")
        );
        const paymentsSnap = await getDocs(paymentsQuery);
        
        const paymentsData = paymentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MembershipPayment));

        // Enriquecer con información del conductor
        const enrichedPayments: EnrichedMembershipPayment[] = [];
        
        for (const payment of paymentsData) {
          let driver: Driver | undefined = undefined;
          
          if (payment.driverId) {
            try {
              const driverDoc = await getDoc(doc(db, "drivers", payment.driverId));
              if (driverDoc.exists()) {
                driver = { id: driverDoc.id, ...driverDoc.data() } as Driver;
              }
            } catch (error) {
              console.error("Error loading driver:", payment.driverId, error);
            }
          }
          
          enrichedPayments.push({ ...payment, driver });
        }

        setPayments(enrichedPayments);
      } catch (error) {
        console.error("Error loading membership payments:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos de Membresías</CardTitle>
          <CardDescription>
            Registro completo de todos los pagos de membresía de todos los conductores
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
        <CardTitle>Historial de Pagos de Membresías</CardTitle>
        <CardDescription>
          Registro completo de todos los pagos de membresía de todos los conductores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={membershipPaymentsColumns}
          data={payments}
          searchKey="driver"
          searchPlaceholder="Buscar por conductor..."
          pageSize={20}
          entityName="pago"
        />
      </CardContent>
    </Card>
  );
}
