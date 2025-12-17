"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { membershipPaymentsColumns, type EnrichedMembershipPayment } from "./membership-payments-columns";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import type { MembershipPayment, Driver, EnrichedDriver } from "@/lib/types";
import { DataTable } from "@/components/ui/data-table";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";

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
          let driverUser: any = undefined;
          if (payment.driverId) {
            try {
              const driverDoc = await getDoc(doc(db, "drivers", payment.driverId));
              if (driverDoc.exists()) {
                driver = { id: driverDoc.id, ...driverDoc.data() } as Driver;
                // Obtener datos del usuario asociado
                const userDoc = await getDoc(doc(db, "users", driver.userId));
                if (userDoc.exists()) {
                  driverUser = userDoc.data();
                }
              }
            } catch (error) {
              console.error("Error loading driver/user:", payment.driverId, error);
            }
          }
          // Combinar datos de Driver y User -> tipar como EnrichedDriver
          const enrichedDriver: EnrichedDriver | undefined = driver && driverUser
            ? ({
                ...driver,
                user: { id: driver.userId, name: driverUser.name, email: driverUser.email, avatarUrl: driverUser.avatarUrl, roles: driverUser.roles || [], signupDate: driverUser.signupDate || new Date().toISOString(), totalRidesAsPassenger: driverUser.totalRidesAsPassenger || 0, rating: driverUser.rating || 5.0, phone: driverUser.phone || '', address: driverUser.address || '', status: driverUser.status || 'active' },
                name: driverUser.name || "Sin nombre",
                avatarUrl: driverUser.avatarUrl || "",
                email: driverUser.email || '',
                phone: driverUser.phone || '',
                rating: driverUser.rating || 5.0,
                vehicle: null,
              } as EnrichedDriver)
            : undefined;
          enrichedPayments.push({ ...payment, driver: enrichedDriver });
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
