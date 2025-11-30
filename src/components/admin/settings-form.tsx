"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Save,
  Database,
  Trash2,
  PlusCircle,
  Settings as SettingsIcon,
  Ruler,
  DatabaseZap,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { getSettings } from "@/services/settings-service";
import { seedDatabase, resetAndSeedDatabase } from "@/services/seed-db";
import { useEffect, useState } from "react";
import type {
  Settings,
  CancellationReason,
  Driver,
  Vehicle,
} from "@/lib/types";
import { useDriverProfile } from "@/hooks/auth/use-driver-profile";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  DocumentReference,
  getDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MembershipPaymentsHistory from "./membership-payments-history";

type PaymentRecord = {
  driverId: string;
  driverName: string;
  serviceType: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  lastPaymentDate?: string;
};

export default function SettingsForm() {
  const { toast } = useToast();
  const { driverProfile } = useDriverProfile();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsDocRef = doc(db, "appSettings", "main");
      const settingsSnap = await getDoc(settingsDocRef);
      if (settingsSnap.exists()) {
        const appSettings = {
          id: settingsSnap.id,
          ...settingsSnap.data(),
        } as Settings;
        setSettings(appSettings);
      } else {
        const appSettings = await getSettings();
        setSettings(appSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los ajustes de la aplicación.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const driversSnapshot = await getDocs(collection(db, "drivers"));
      const paymentRecords: PaymentRecord[] = [];
      for (const driverDoc of driversSnapshot.docs) {
        const driverData = { id: driverDoc.id, ...driverDoc.data() } as Driver;
        if (
          driverData.paymentModel === "membership" &&
          driverData.nextPaymentDue
        ) {
          let vehicleData: Vehicle | null = null;
          if (
            driverData.vehicle &&
            driverData.vehicle instanceof DocumentReference
          ) {
            const vehicleSnap = await getDoc(driverData.vehicle);
            if (vehicleSnap.exists()) {
              vehicleData = {
                id: vehicleSnap.id,
                ...vehicleSnap.data(),
              } as Vehicle;
            }
          }
          // Obtener el nombre del usuario relacionado
          let userName = "";
          if (driverData.userId) {
            const userSnap = await getDoc(doc(db, "users", driverData.userId));
            if (userSnap.exists()) {
              const userData = userSnap.data() as { name?: string };
              userName = userData.name || "Sin nombre";
            } else {
              userName = "Sin nombre";
            }
          } else {
            userName = "Sin nombre";
          }
          if (vehicleData && driverData.membershipPricing) {
            const dueDate = new Date(driverData.nextPaymentDue);
            const now = new Date();
            const status = dueDate < now ? "overdue" : "pending";
            paymentRecords.push({
              driverId: driverData.id,
              driverName: userName,
              serviceType: vehicleData.serviceType,
              amount: driverData.membershipPricing[vehicleData.serviceType],
              dueDate: driverData.nextPaymentDue,
              status,
              lastPaymentDate: driverData.lastPaymentDate,
            });
          }
        }
      }
      setPayments(
        paymentRecords.sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )
      );
    } catch (error) {
      console.error("Error loading payments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los pagos.",
      });
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      if (!settings) return;
      setSaving(true);

      const baseFare = parseFloat(
        (document.getElementById("baseFare") as HTMLInputElement)?.value || "0"
      );
      const perKmFare = parseFloat(
        (document.getElementById("perKmFare") as HTMLInputElement)?.value || "0"
      );
      const perMinuteFare = parseFloat(
        (document.getElementById("perMinuteFare") as HTMLInputElement)?.value ||
          "0"
      );
      const negotiationRange = parseFloat(
        (document.getElementById("negotiationRange") as HTMLInputElement)
          ?.value || "0"
      );
      const mapCenterLat = parseFloat(
        (document.getElementById("mapCenterLat") as HTMLInputElement)?.value ||
          "0"
      );
      const mapCenterLng = parseFloat(
        (document.getElementById("mapCenterLng") as HTMLInputElement)?.value ||
          "0"
      );

      const commissionEconomy = parseFloat(
        (document.getElementById("commissionEconomy") as HTMLInputElement)
          ?.value || "15"
      );
      const commissionComfort = parseFloat(
        (document.getElementById("commissionComfort") as HTMLInputElement)
          ?.value || "15"
      );
      const commissionExclusive = parseFloat(
        (document.getElementById("commissionExclusive") as HTMLInputElement)
          ?.value || "15"
      );

      const membershipEconomy = parseFloat(
        (document.getElementById("membershipEconomy") as HTMLInputElement)
          ?.value || "0"
      );
      const membershipComfort = parseFloat(
        (document.getElementById("membershipComfort") as HTMLInputElement)
          ?.value || "0"
      );
      const membershipExclusive = parseFloat(
        (document.getElementById("membershipExclusive") as HTMLInputElement)
          ?.value || "0"
      );

      const updatedServiceTypes = settings.serviceTypes.map((service) => {
        const multiplierInput = document.getElementById(
          `multiplier-${service.id}`
        ) as HTMLInputElement;
        return {
          ...service,
          multiplier: parseFloat(
            multiplierInput?.value || service.multiplier.toString()
          ),
        };
      });

      const updatedSettings: Settings = {
        ...settings,
        baseFare,
        perKmFare,
        perMinuteFare,
        negotiationRange,
        mapCenterLat,
        mapCenterLng,
        commissionPercentageEconomy: commissionEconomy,
        commissionPercentageComfort: commissionComfort,
        commissionPercentageExclusive: commissionExclusive,
        membershipFeeEconomy: membershipEconomy,
        membershipFeeComfort: membershipComfort,
        membershipFeeExclusive: membershipExclusive,
        serviceTypes: updatedServiceTypes,
      };

      const settingsRef = doc(db, "appSettings", "main");
      await setDoc(settingsRef, updatedSettings, { merge: true });

      await loadSettings();
      toast({
        title: "¡Cambios Guardados!",
        description:
          "La configuración de la aplicación ha sido actualizada exitosamente.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los cambios. Intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCancellationReason = () => {
    if (settings) {
      const newReason: CancellationReason = { code: "", reason: "" };
      setSettings({
        ...settings,
        cancellationReasons: [...settings.cancellationReasons, newReason],
      });
    }
  };

  const handleRemoveCancellationReason = (index: number) => {
    if (settings) {
      const updatedReasons = [...settings.cancellationReasons];
      updatedReasons.splice(index, 1);
      setSettings({ ...settings, cancellationReasons: updatedReasons });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <p className="text-destructive">No se pudo cargar la configuración.</p>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        {/* Tabs List - Horizontal at the top */}
        <TabsList className="grid w-full grid-cols-3 gap-2 bg-transparent p-0 h-auto border-b">
          <TabsTrigger
            value="general"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
          >
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
          >
            <DatabaseZap className="h-4 w-4" />
            <span className="hidden sm:inline">Pagos</span>
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
          >
            <Ruler className="h-4 w-4" />
            <span className="hidden sm:inline">Reglas</span>
          </TabsTrigger>
        </TabsList>

        {/* Tabs Content */}
        <div className="pt-6">
          <TabsContent value="general" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Cálculo de Tarifas de Viaje</CardTitle>
                <CardDescription>
                  Define los costos base para el cálculo de todas las tarifas.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseFare">Tarifa Base (S/)</Label>
                  <Input
                    id="baseFare"
                    defaultValue={settings.baseFare.toFixed(2)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perKmFare">Tarifa por Km (S/)</Label>
                  <Input
                    id="perKmFare"
                    defaultValue={settings.perKmFare.toFixed(2)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perMinuteFare">Tarifa por Minuto (S/)</Label>
                  <Input
                    id="perMinuteFare"
                    defaultValue={settings.perMinuteFare.toFixed(2)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parámetros Operativos</CardTitle>
                <CardDescription>
                  Ajusta los multiplicadores y parámetros generales de la app.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Multiplicadores de Servicio
                  </h3>
                  {settings.serviceTypes.map((service) => (
                    <div key={service.id} className="space-y-2 mb-4">
                      <Label htmlFor={`multiplier-${service.id}`}>
                        Multiplicador {service.name}
                      </Label>
                      <Input
                        id={`multiplier-${service.id}`}
                        defaultValue={service.multiplier}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Configuración General
                  </h3>
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="negotiationRange">
                      Rango de Negociación (%)
                    </Label>
                    <Input
                      id="negotiationRange"
                      defaultValue={settings.negotiationRange}
                    />
                  </div>
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="mapCenterLat">
                      Latitud del Centro del Mapa
                    </Label>
                    <Input
                      id="mapCenterLat"
                      defaultValue={settings.mapCenterLat}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mapCenterLng">
                      Longitud del Centro del Mapa
                    </Label>
                    <Input
                      id="mapCenterLng"
                      defaultValue={settings.mapCenterLng}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6 mt-0">
            {/* Datos del conductor actual (solo si existe) */}
            {driverProfile && (
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={driverProfile.avatarUrl}
                  alt={driverProfile.name}
                  className="h-10 w-10 rounded-full border"
                  style={{ objectFit: "cover" }}
                />
                <span className="font-semibold text-lg">
                  {driverProfile.name}
                </span>
              </div>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Comisiones por Tipo de Servicio</CardTitle>
                <CardDescription>
                  Porcentaje de comisión que cobra la plataforma a los
                  conductores por cada viaje completado.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commissionEconomy">Económico (%)</Label>
                  <Input
                    id="commissionEconomy"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={settings.commissionPercentageEconomy || 15}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        commissionPercentageEconomy:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionComfort">Confort (%)</Label>
                  <Input
                    id="commissionComfort"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={settings.commissionPercentageComfort || 15}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        commissionPercentageComfort:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionExclusive">Exclusivo (%)</Label>
                  <Input
                    id="commissionExclusive"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={settings.commissionPercentageExclusive || 15}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        commissionPercentageExclusive:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Precios de Membresía por Tipo de Servicio</CardTitle>
                <CardDescription>
                  Precio mensual de membresía según el tipo de servicio del
                  conductor.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="membershipEconomy">Económico (S/)</Label>
                  <Input
                    id="membershipEconomy"
                    type="number"
                    min="0"
                    step="10"
                    value={settings.membershipFeeEconomy}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        membershipFeeEconomy: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="membershipComfort">Confort (S/)</Label>
                  <Input
                    id="membershipComfort"
                    type="number"
                    min="0"
                    step="10"
                    value={settings.membershipFeeComfort}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        membershipFeeComfort: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="membershipExclusive">Exclusivo (S/)</Label>
                  <Input
                    id="membershipExclusive"
                    type="number"
                    min="0"
                    step="10"
                    value={settings.membershipFeeExclusive}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        membershipFeeExclusive: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div>
              <MembershipPaymentsHistory />
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Reglas de Horas Punta</span>
                  <Button variant="ghost" size="icon">
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Define recargos automáticos para periodos de alta demanda.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.peakTimeRules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <Label
                        htmlFor={`peak-name-${index}`}
                        className="font-medium flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        {rule.name}
                      </Label>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor={`peak-start-${index}`}>
                          Hora Inicio
                        </Label>
                        <Input
                          id={`peak-start-${index}`}
                          type="time"
                          defaultValue={rule.startTime}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`peak-end-${index}`}>Hora Fin</Label>
                        <Input
                          id={`peak-end-${index}`}
                          type="time"
                          defaultValue={rule.endTime}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`peak-surcharge-${index}`}>
                        Recargo (%)
                      </Label>
                      <Input
                        id={`peak-surcharge-${index}`}
                        type="number"
                        defaultValue={rule.surcharge}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Motivos de Cancelación</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddCancellationReason}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Motivo
                  </Button>
                </CardTitle>
                <CardDescription>
                  Define los motivos que los usuarios pueden seleccionar al
                  cancelar un viaje.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.cancellationReasons.map((reason, index) => (
                  <div
                    key={index}
                    className="flex items-end gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1 grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor={`reason-code-${index}`}>
                          Código Interno (ID)
                        </Label>
                        <Input
                          id={`reason-code-${index}`}
                          defaultValue={reason.code}
                          placeholder="Ej: DRIVER_LATE"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`reason-text-${index}`}>
                          Texto para el Usuario
                        </Label>
                        <Input
                          id={`reason-text-${index}`}
                          defaultValue={reason.reason}
                          placeholder="Ej: El conductor se demora mucho"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCancellationReason(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Save Button - Fixed at the bottom */}
      <div className="flex justify-end pt-6 border-t mt-8">
        <Button onClick={handleSaveChanges} size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Todos los Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
