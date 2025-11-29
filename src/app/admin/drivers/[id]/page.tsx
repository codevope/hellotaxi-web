"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  ShieldCheck,
  ShieldX,
  Star,
  XCircle,
  ShieldAlert,
  CreditCard,
  Loader2,
  Save,
  MoreVertical,
  Car,
  User,
  Calendar,
  CalendarCheck,
  Eye,
  FileCheck,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type {
  Driver,
  MembershipStatus,
  PaymentModel,
  MembershipDuration,
  Ride,
  User as AppUser,
  DocumentName,
  DocumentStatus,
  Vehicle,
  VehicleModel,
  Settings,
  MembershipPayment,
} from "@/lib/types";
import { getSettings } from "@/services/settings-service";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  DocumentReference,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDocumentStatus } from "@/lib/document-status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { driverRidesColumns } from "@/components/admin/driver-rides-columns";

const statusConfig: Record<
  Driver["status"],
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  available: { label: "Disponible", variant: "default" },
  unavailable: { label: "No Disponible", variant: "secondary" },
  "on-ride": { label: "En Viaje", variant: "outline" },
};

const documentStatusConfig: Record<
  Driver["documentsStatus"],
  {
    label: string;
    color: string;
    icon: JSX.Element;
  }
> = {
  approved: {
    label: "Aprobado",
    color: "text-green-600",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  pending: {
    label: "Pendiente",
    color: "text-yellow-600",
    icon: <ShieldAlert className="h-5 w-5" />,
  },
  rejected: {
    label: "Rechazado",
    color: "text-red-600",
    icon: <ShieldX className="h-5 w-5" />,
  },
};

const paymentModelConfig: Record<PaymentModel, string> = {
  commission: "Comisión por Viaje",
  membership: "Membresía Mensual",
};

const getMembershipStatus = (
  expiryDate?: string
): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} => {
  if (!expiryDate) return { label: "N/A", variant: "secondary" };

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return { label: "Vencida", variant: "destructive" };
  if (diffDays <= 7) return { label: "Por Vencer", variant: "outline" };
  return { label: "Activa", variant: "default" };
};

type EnrichedRide = Omit<Ride, "passenger" | "driver" | "vehicle"> & {
  passenger: AppUser;
  driver: Driver;
  vehicle?: Vehicle;
};
type EnrichedDriver = Omit<Driver, "vehicle"> & { vehicle: Vehicle | null };

export default function DriverDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();

  const [driver, setDriver] = useState<EnrichedDriver | null>(null);
  const [rides, setRides] = useState<EnrichedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [allVehicleModels, setAllVehicleModels] = useState<VehicleModel[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // State for editable fields
  const [paymentModel, setPaymentModel] = useState<PaymentModel>("commission");
  const [documentsStatus, setDocumentsStatus] =
    useState<Driver["documentsStatus"]>("pending");
  const [individualDocStatuses, setIndividualDocStatuses] = useState<
    Partial<Record<DocumentName, DocumentStatus>>
  >({});
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleYear, setVehicleYear] = useState<number>(
    new Date().getFullYear()
  );
  const [vehicleColor, setVehicleColor] = useState("");
  const [serviceType, setServiceType] = useState<"economy" | "comfort" | "exclusive">("economy");

  // Vehicle document dates state
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [technicalReviewExpiry, setTechnicalReviewExpiry] = useState("");
  const [propertyCardRegistrationDate, setPropertyCardRegistrationDate] = useState("");

  // Payment model fields state
  const [commissionPercentage, setCommissionPercentage] = useState<number>(15); // Default 15%
  const [membershipPrice, setMembershipPrice] = useState<number>(0);
  const [membershipDuration, setMembershipDuration] = useState<"monthly" | "annual">("monthly");
  const [membershipStartDate, setMembershipStartDate] = useState<string>("");

  // Document viewer state
  const [selectedDocument, setSelectedDocument] = useState<{
    name: DocumentName;
    url: string;
  } | null>(null);

  // Edit date dialog state
  const [editDateDialog, setEditDateDialog] = useState<{
    open: boolean;
    docName: DocumentName | null;
    dateType: 'expiry' | 'registration' | null;
    currentDate: string;
  }>({ open: false, docName: null, dateType: null, currentDate: "" });

  // Payment history state - ahora cargamos desde Firestore
  const [paymentHistory, setPaymentHistory] = useState<MembershipPayment[]>([]);

  useEffect(() => {
    if (typeof id !== "string") return;

    async function fetchDriverData() {
      try {
        // Leer settings directamente desde Firestore para evitar problemas de cache
        const settingsDocRef = doc(db, "appSettings", "main");
        
        const [vehicleModelsSnapshot, driverSnap, settingsSnap] = await Promise.all([
          getDocs(collection(db, "vehicleModels")),
          getDoc(doc(db, "drivers", id as string)),
          getDoc(settingsDocRef),
        ]);

        let appSettings: Settings;
        if (settingsSnap.exists()) {
          const dbData = settingsSnap.data();
          // Combinar con defaults para asegurar que todos los campos existan
          appSettings = {
            id: settingsSnap.id,
            baseFare: dbData.baseFare ?? 3.5,
            perKmFare: dbData.perKmFare ?? 1.0,
            perMinuteFare: dbData.perMinuteFare ?? 0.20,
            negotiationRange: dbData.negotiationRange ?? 15,
            locationUpdateInterval: dbData.locationUpdateInterval ?? 15,
            mapCenterLat: dbData.mapCenterLat ?? -6.7713,
            mapCenterLng: dbData.mapCenterLng ?? -79.8442,
            membershipFeeEconomy: dbData.membershipFeeEconomy ?? 40,
            membershipFeeComfort: dbData.membershipFeeComfort ?? 50,
            membershipFeeExclusive: dbData.membershipFeeExclusive ?? 60,
            commissionPercentageEconomy: dbData.commissionPercentageEconomy ?? 15,
            commissionPercentageComfort: dbData.commissionPercentageComfort ?? 12,
            commissionPercentageExclusive: dbData.commissionPercentageExclusive ?? 10,
            serviceTypes: dbData.serviceTypes ?? [],
            cancellationReasons: dbData.cancellationReasons ?? [],
            peakTimeRules: dbData.peakTimeRules ?? [],
            specialFareRules: [],
          } as Settings;
        } else {
          appSettings = await getSettings();
        }
        
        console.log('⚙️ Settings cargados:', {
          commissionPercentageEconomy: appSettings.commissionPercentageEconomy,
          commissionPercentageComfort: appSettings.commissionPercentageComfort,
          commissionPercentageExclusive: appSettings.commissionPercentageExclusive,
          membershipFeeEconomy: appSettings.membershipFeeEconomy,
          membershipFeeComfort: appSettings.membershipFeeComfort,
          membershipFeeExclusive: appSettings.membershipFeeExclusive,
        });
        setSettings(appSettings);

        const fetchedVehicleModels = vehicleModelsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as VehicleModel)
        );
        setAllVehicleModels(
          fetchedVehicleModels.sort((a, b) => a.name.localeCompare(b.name))
        );

        if (driverSnap.exists()) {
          const driverData = {
            id: driverSnap.id,
            ...driverSnap.data(),
          } as Driver;
          
          let vehicleData: Vehicle | null = null;
          
          // Intentar obtener el vehículo si existe la referencia
          if (driverData.vehicle && driverData.vehicle instanceof DocumentReference) {
            const vehicleSnap = await getDoc(driverData.vehicle);
            if (vehicleSnap.exists()) {
              vehicleData = {
                id: vehicleSnap.id,
                ...vehicleSnap.data(),
              } as Vehicle;
            }
          }
          
          const enrichedDriver = { ...driverData, vehicle: vehicleData };

          setDriver(enrichedDriver);
          setPaymentModel(enrichedDriver.paymentModel);
          setDocumentsStatus(enrichedDriver.documentsStatus);
          
          // Inicializar campos de modelo de pago
          const vehicleServiceType = vehicleData?.serviceType || 'economy';
          
          // Comisión: Usar la del driver si existe, sino usar settings según tipo de servicio
          const defaultCommission = vehicleServiceType === 'economy' ? appSettings.commissionPercentageEconomy :
                                   vehicleServiceType === 'comfort' ? appSettings.commissionPercentageComfort :
                                   appSettings.commissionPercentageExclusive;
          
          // Precio de membresía: Usar el del driver.membershipPricing si existe, sino usar settings
          const driverMembershipPrice = enrichedDriver.membershipPricing?.[vehicleServiceType];
          const defaultMembershipPrice = driverMembershipPrice || (
            vehicleServiceType === 'economy' ? appSettings.membershipFeeEconomy :
            vehicleServiceType === 'comfort' ? appSettings.membershipFeeComfort :
            appSettings.membershipFeeExclusive
          );
          
          setCommissionPercentage(enrichedDriver.commissionPercentage || defaultCommission);
          setMembershipPrice(defaultMembershipPrice);
          setMembershipDuration(enrichedDriver.membershipDuration || "monthly");
          setMembershipStartDate(enrichedDriver.membershipStartDate || "");
          
          // Solo establecer valores del vehículo si existe
          if (vehicleData) {
            setVehicleBrand(vehicleData.brand);
            setVehicleModel(vehicleData.model);
            setLicensePlate(vehicleData.licensePlate);
            setVehicleYear(vehicleData.year);
            setVehicleColor(vehicleData.color);
            setServiceType(vehicleData.serviceType);
            setInsuranceExpiry(vehicleData.insuranceExpiry || "");
            setTechnicalReviewExpiry(vehicleData.technicalReviewExpiry || "");
            setPropertyCardRegistrationDate(vehicleData.propertyCardRegistrationDate || "");
          }
          
          setIndividualDocStatuses(
            enrichedDriver.documentStatus || {
              license: "pending",
              insurance: "pending",
              backgroundCheck: "pending",
              technicalReview: "pending",
              dni: "pending",
              propertyCard: "pending",
            }
          );

          // Fetch driver's rides
          const ridesQuery = query(
            collection(db, "rides"),
            where("driver", "==", driverSnap.ref)
          );
          const ridesSnapshot = await getDocs(ridesQuery);

          const driverRidesPromises = ridesSnapshot.docs.map(
            async (rideDoc) => {
              const rideData = { id: rideDoc.id, ...rideDoc.data() } as Ride;
              const passengerSnap = await getDoc(
                rideData.passenger as DocumentReference
              );

              if (!passengerSnap.exists()) return null; // Skip if passenger is missing

              const passengerData = passengerSnap.data() as AppUser;

              let rideVehicleData: Vehicle | undefined = undefined;
              if (rideData.vehicle) {
                const rideVehicleSnap = await getDoc(
                  rideData.vehicle as DocumentReference
                );
                if (rideVehicleSnap.exists()) {
                  rideVehicleData = rideVehicleSnap.data() as Vehicle;
                }
              }

              return {
                ...rideData,
                driver: driverData,
                passenger: passengerData,
                vehicle: rideVehicleData,
              };
            }
          );

          const driverRides = (await Promise.all(driverRidesPromises)).filter(
            Boolean
          ) as EnrichedRide[];
          setRides(
            driverRides.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
          );
        } else {
          console.error("No such driver!");
        }
      } catch (error) {
        console.error("Error fetching driver data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDriverData();
  }, [id]);

  // Actualizar precios cuando cambie el tipo de servicio del vehículo (guardado en BD)
  useEffect(() => {
    if (!driver?.vehicle || !settings) return;

    const vehicleServiceType = driver.vehicle.serviceType;
    
    // Actualizar comisión solo si no tiene valor personalizado guardado
    if (!driver.commissionPercentage) {
      const defaultCommission = 
        vehicleServiceType === 'economy' ? settings.commissionPercentageEconomy :
        vehicleServiceType === 'comfort' ? settings.commissionPercentageComfort :
        settings.commissionPercentageExclusive;
      setCommissionPercentage(defaultCommission);
    }

    // Actualizar precio de membresía desde driver.membershipPricing o settings
    const driverMembershipPrice = driver.membershipPricing?.[vehicleServiceType];
    const defaultMembershipPrice = driverMembershipPrice || (
      vehicleServiceType === 'economy' ? settings.membershipFeeEconomy :
      vehicleServiceType === 'comfort' ? settings.membershipFeeComfort :
      settings.membershipFeeExclusive
    );
    setMembershipPrice(defaultMembershipPrice);
  }, [driver?.vehicle?.serviceType, settings, driver?.commissionPercentage, driver?.membershipPricing]);

  // Actualizar precios cuando el usuario cambia el tipo de servicio en el select (estado local)
  useEffect(() => {
    if (!settings) {
      console.log('⚠️ Settings no disponible');
      return;
    }

    console.log('🔄 Tipo de servicio cambió a:', serviceType, '| Modelo de pago:', paymentModel);
    console.log('📊 Settings completo:', settings);

    // Determinar si usar precio/comisión personalizado o default
    const hasCustomCommission = driver?.commissionPercentage !== undefined;
    const hasCustomMembership = driver?.membershipPricing?.[serviceType] !== undefined;

    // Actualizar comisión SOLO si el modelo de pago es "commission"
    if (paymentModel === 'commission' && !hasCustomCommission) {
      const defaultCommission = 
        serviceType === 'economy' ? settings.commissionPercentageEconomy :
        serviceType === 'comfort' ? settings.commissionPercentageComfort :
        settings.commissionPercentageExclusive;
      console.log('💰 Actualizando comisión a:', defaultCommission, {
        economy: settings.commissionPercentageEconomy,
        comfort: settings.commissionPercentageComfort,
        exclusive: settings.commissionPercentageExclusive
      });
      setCommissionPercentage(defaultCommission);
    }

    // Actualizar precio de membresía SOLO si el modelo de pago es "membership"
    if (paymentModel === 'membership') {
      const defaultMembershipPrice = 
        serviceType === 'economy' ? settings.membershipFeeEconomy :
        serviceType === 'comfort' ? settings.membershipFeeComfort :
        settings.membershipFeeExclusive;
      
      console.log('💵 Precios de membresía:', {
        economy: settings.membershipFeeEconomy,
        comfort: settings.membershipFeeComfort,
        exclusive: settings.membershipFeeExclusive,
        selected: defaultMembershipPrice
      });
      
      console.log('🔍 Driver membershipPricing:', driver?.membershipPricing);
      console.log('🔍 hasCustomMembership:', hasCustomMembership);
      console.log('🔍 Precio personalizado para', serviceType, ':', driver?.membershipPricing?.[serviceType]);
      
      // Usar precio personalizado si existe, sino default
      const finalPrice = hasCustomMembership ? driver!.membershipPricing![serviceType] : defaultMembershipPrice;
      console.log('💵 Actualizando precio de membresía a:', finalPrice);
      setMembershipPrice(finalPrice);
    }
  }, [serviceType, settings, paymentModel, driver?.commissionPercentage, driver?.membershipPricing]);

  // Cargar historial de pagos desde Firestore
  useEffect(() => {
    if (!driver || driver.paymentModel !== 'membership') {
      setPaymentHistory([]);
      return;
    }

    async function loadPaymentHistory() {
      try {
        const paymentsQuery = query(
          collection(db, "membershipPayments"),
          where("driverId", "==", id)
        );
        const paymentsSnap = await getDocs(paymentsQuery);
        
        const payments = paymentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MembershipPayment));

        // Ordenar por fecha de vencimiento (más recientes primero)
        payments.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        
        console.log('📋 Payment history loaded:', payments.length, 'payments for driver', id);
        setPaymentHistory(payments);
      } catch (error) {
        console.error("Error loading payment history:", error);
        setPaymentHistory([]);
      }
    }

    loadPaymentHistory();
  }, [driver, id]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-8">
        <h1 className="text-2xl">Conductor no encontrado.</h1>
      </div>
    );
  }

  const handleSaveChanges = async () => {
    if (!driver) return;
    
    // Validar que los campos del vehículo estén completos
    if (!vehicleBrand || !vehicleModel || !licensePlate || !vehicleColor) {
      toast({
        variant: "destructive",
        title: "Campos Incompletos",
        description: "Por favor complete todos los campos del vehículo (marca, modelo, placa, color).",
      });
      return;
    }
    
    setIsUpdating(true);

    try {
      // Validate unique license plate
      const q = query(
        collection(db, "vehicles"),
        where("licensePlate", "==", licensePlate.toUpperCase())
      );
      const querySnapshot = await getDocs(q);
      const otherVehicle = querySnapshot.docs.find(
        (d) => d.id !== driver.vehicle?.id
      );
      if (otherVehicle) {
        toast({
          variant: "destructive",
          title: "Placa Duplicada",
          description:
            "Esta placa ya está registrada en el sistema para otro vehículo.",
        });
        setIsUpdating(false);
        return;
      }

      const driverRef = doc(db, "drivers", driver.id);

      const allDocsApproved = Object.values(individualDocStatuses).every(
        (s) => s === "approved"
      );
      const finalDocumentsStatus = allDocsApproved
        ? "approved"
        : documentsStatus;

      const driverUpdates: Partial<Driver> = {
        paymentModel: paymentModel,
        documentStatus: individualDocStatuses as Record<
          DocumentName,
          DocumentStatus
        >,
        documentsStatus: finalDocumentsStatus,
      };

      // Si cambia de membresía a comisión, cancelar pagos pendientes
      if (driver.paymentModel === 'membership' && paymentModel === 'commission') {
        console.log('⏸️ Pausando membresía, cancelando pagos pendientes...');
        await handlePauseMembership();
        driverUpdates.membershipPausedDate = new Date().toISOString();
      }

      // Si cambia de comisión a membresía (reactivación), generar nuevo período
      const isReactivating = driver.paymentModel === 'commission' && paymentModel === 'membership';
      if (isReactivating) {
        console.log('▶️ Reactivando membresía...');
        // La fecha de inicio será la nueva membershipStartDate configurada
        driverUpdates.membershipPausedDate = deleteField() as any;
      }

      // Actualizar campos según el modelo de pago
      if (paymentModel === "commission") {
        // Solo guardar commissionPercentage si es diferente del valor por defecto en settings
        const vehicleServiceType = driver.vehicle?.serviceType || 'economy';
        const defaultCommission = 
          vehicleServiceType === 'economy' ? settings?.commissionPercentageEconomy :
          vehicleServiceType === 'comfort' ? settings?.commissionPercentageComfort :
          settings?.commissionPercentageExclusive;
        
        // Si es diferente al default, guardar; si es igual, eliminar para usar settings dinámicamente
        if (commissionPercentage !== defaultCommission) {
          driverUpdates.commissionPercentage = commissionPercentage;
        } else {
          driverUpdates.commissionPercentage = deleteField() as any;
        }
      } else if (paymentModel === "membership") {
        // Crear estructura de precios según tipo de servicio del vehículo
        if (!driver.vehicle) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Debe asignar un vehículo antes de configurar membresía.",
          });
          setIsUpdating(false);
          return;
        }
        
        const vehicleServiceType = driver.vehicle.serviceType;
        
        // Determinar el precio por defecto según el tipo de servicio
        const defaultPrice = 
          vehicleServiceType === 'economy' ? settings?.membershipFeeEconomy :
          vehicleServiceType === 'comfort' ? settings?.membershipFeeComfort :
          settings?.membershipFeeExclusive;
        
        // Si el precio es diferente al default, guardar una estructura personalizada
        // Si es igual al default, eliminar membershipPricing para que use siempre settings
        if (membershipPrice !== defaultPrice) {
          // Guardar precio personalizado solo para el tipo de servicio actual
          // Los otros tipos usan valores por defecto de settings
          driverUpdates.membershipPricing = {
            economy: vehicleServiceType === 'economy' ? membershipPrice : 
                     (driver.membershipPricing?.economy || settings?.membershipFeeEconomy || 0),
            comfort: vehicleServiceType === 'comfort' ? membershipPrice : 
                     (driver.membershipPricing?.comfort || settings?.membershipFeeComfort || 0),
            exclusive: vehicleServiceType === 'exclusive' ? membershipPrice : 
                       (driver.membershipPricing?.exclusive || settings?.membershipFeeExclusive || 0),
          };
        } else {
          // Si volvió al precio por defecto, eliminar membershipPricing
          // para que siempre use los valores de settings (dinámicamente)
          driverUpdates.membershipPricing = deleteField() as any;
        }
        
        driverUpdates.membershipDuration = membershipDuration;
        driverUpdates.membershipStartDate = membershipStartDate;
        
        // Calcular fecha de vencimiento basada en fecha de inicio y duración
        if (membershipStartDate) {
          const startDate = new Date(membershipStartDate);
          const expiryDate = new Date(startDate);
          const nextDue = new Date(startDate);
          
          if (membershipDuration === "monthly") {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            nextDue.setMonth(nextDue.getMonth() + 1);
          } else if (membershipDuration === "annual") {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            nextDue.setFullYear(nextDue.getFullYear() + 1);
          }
          
          driverUpdates.membershipExpiryDate = expiryDate.toISOString();
          driverUpdates.nextPaymentDue = nextDue.toISOString();
        }
      }

      // Eliminar campos undefined antes de updateDoc (Firestore no acepta undefined)
      Object.keys(driverUpdates).forEach(key => {
        if (driverUpdates[key as keyof typeof driverUpdates] === undefined) {
          delete driverUpdates[key as keyof typeof driverUpdates];
        }
      });

      let vehicleRef: DocumentReference;
      let updatedVehicle: Vehicle;

      // Si no existe vehículo, crear uno nuevo
      if (!driver.vehicle) {
        const newVehicleData = {
          brand: vehicleBrand,
          model: vehicleModel,
          licensePlate: licensePlate.toUpperCase(),
          year: vehicleYear,
          color: vehicleColor,
          serviceType: serviceType,
          status: "active" as const,
          insuranceExpiry: "",
          technicalReviewExpiry: "",
          propertyCardRegistrationDate: "",
          driverId: driver.id,
        };

        // Crear nuevo documento de vehículo
        const vehiclesCollectionRef = collection(db, "vehicles");
        const newVehicleRef = doc(vehiclesCollectionRef);
        await setDoc(newVehicleRef, newVehicleData);
        
        // Actualizar la referencia del vehículo en el driver
        driverUpdates.vehicle = newVehicleRef;
        
        vehicleRef = newVehicleRef;
        updatedVehicle = { id: newVehicleRef.id, ...newVehicleData };
      } else {
        // Si existe vehículo, actualizarlo
        vehicleRef = doc(db, "vehicles", driver.vehicle.id);
        
        const vehicleUpdates: Partial<Vehicle> = {
          brand: vehicleBrand,
          model: vehicleModel,
          licensePlate: licensePlate.toUpperCase(),
          year: vehicleYear,
          color: vehicleColor,
          serviceType: serviceType,
        };

        await updateDoc(vehicleRef, vehicleUpdates);
        updatedVehicle = { ...driver.vehicle, ...vehicleUpdates };
      }

      // Guardar cambios del driver
      await updateDoc(driverRef, driverUpdates);

      // Update local state to reflect changes immediately
      const updatedDriver = {
        ...driver,
        ...driverUpdates,
        vehicle: updatedVehicle,
      };
      setDriver(updatedDriver);
      setDocumentsStatus(finalDocumentsStatus);
      
      // Actualizar los campos del formulario con los datos guardados
      setVehicleBrand(updatedVehicle.brand);
      setVehicleModel(updatedVehicle.model);
      setLicensePlate(updatedVehicle.licensePlate);
      setVehicleYear(updatedVehicle.year);
      setVehicleColor(updatedVehicle.color);
      setServiceType(updatedVehicle.serviceType);
      setInsuranceExpiry(updatedVehicle.insuranceExpiry || "");
      setTechnicalReviewExpiry(updatedVehicle.technicalReviewExpiry || "");
      setPropertyCardRegistrationDate(updatedVehicle.propertyCardRegistrationDate || "");

      // Actualizar estado local del driver con los nuevos datos
      setDriver(updatedDriver);

      // Si se configuró membresía, generar el primer período de pago si no existe
      if (paymentModel === 'membership' && membershipStartDate && updatedVehicle) {
        console.log('🔄 Generando primer período de pago...');
        await generatePaymentPeriod(updatedDriver, updatedVehicle);
      }

      toast({
        title: "¡Perfil del Conductor Actualizado!",
        description: driver.vehicle 
          ? "Los cambios en el perfil del conductor han sido guardados."
          : "Vehículo asignado correctamente al conductor.",
      });
    } catch (error) {
      console.error("Error updating driver:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el perfil del conductor. " + (error as Error).message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproval = async (status: "approved" | "rejected") => {
    if (!driver) return;
    setIsUpdating(true);
    const driverRef = doc(db, "drivers", driver.id);
    try {
      await updateDoc(driverRef, { documentsStatus: status });
      setDriver({ ...driver, documentsStatus: status });
      setDocumentsStatus(status);
      toast({
        title: `Documentos ${
          status === "approved" ? "Aprobados" : "Rechazados"
        }`,
        description: `El estado general de la documentación de ${driver.name} se ha actualizado.`,
      });
    } catch (error) {
      console.error("Error updating document status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado de los documentos.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIndividualDocStatusChange = (
    docName: DocumentName,
    status: DocumentStatus
  ) => {
    setIndividualDocStatuses((prev) => ({ ...prev, [docName]: status }));
  };

  const handleViewDocument = (docName: DocumentName) => {
    if (!driver) return;
    const url = driver.documentUrls?.[docName];
    if (url) {
      setSelectedDocument({ name: docName, url });
    } else {
      toast({
        variant: "destructive",
        title: "Sin documento",
        description: "Este conductor aún no ha subido este documento",
      });
    }
  };

  const handleEditVehicleDocDate = (docName: DocumentName, dateType: 'expiry' | 'registration') => {
    if (!driver?.vehicle) {
      toast({
        variant: "destructive",
        title: "Sin vehículo asignado",
        description: "Debe asignar un vehículo primero antes de editar las fechas.",
      });
      return;
    }

    let currentDate = "";
    if (docName === "insurance") currentDate = insuranceExpiry;
    else if (docName === "technicalReview") currentDate = technicalReviewExpiry;
    else if (docName === "propertyCard") currentDate = propertyCardRegistrationDate;

    setEditDateDialog({
      open: true,
      docName,
      dateType,
      currentDate,
    });
  };

  const handleMarkPaymentComplete = async () => {
    if (!driver || !driver.nextPaymentDue || !driver.membershipDuration) return;

    setIsUpdating(true);
    try {
      const driverRef = doc(db, "drivers", driver.id);
      
      // Calcular el próximo período de pago
      const currentDue = new Date(driver.nextPaymentDue);
      const nextDue = new Date(currentDue);
      
      if (driver.membershipDuration === "monthly") {
        nextDue.setMonth(nextDue.getMonth() + 1);
      } else if (driver.membershipDuration === "annual") {
        nextDue.setFullYear(nextDue.getFullYear() + 1);
      }

      const updates: Partial<Driver> = {
        lastPaymentDate: new Date().toISOString(),
        nextPaymentDue: nextDue.toISOString(),
        membershipExpiryDate: nextDue.toISOString(),
      };

      await updateDoc(driverRef, updates);

      // Actualizar estado local
      setDriver({
        ...driver,
        lastPaymentDate: updates.lastPaymentDate,
        nextPaymentDue: updates.nextPaymentDue,
        membershipExpiryDate: updates.membershipExpiryDate,
      });

      toast({
        title: "Pago registrado",
        description: `Pago confirmado. Próximo vencimiento: ${format(nextDue, "dd MMM yyyy", { locale: es })}`,
      });
    } catch (error) {
      console.error("Error marking payment complete:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar el pago.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegisterPayment = async (paymentId: string) => {
    if (!driver) return;

    setIsUpdating(true);
    try {
      const paymentRef = doc(db, "membershipPayments", paymentId);
      const paymentSnap = await getDoc(paymentRef);
      
      if (!paymentSnap.exists()) {
        throw new Error("Pago no encontrado");
      }

      const payment = { id: paymentSnap.id, ...paymentSnap.data() } as MembershipPayment;

      if (payment.status === 'paid') {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Este pago ya fue registrado anteriormente.",
        });
        setIsUpdating(false);
        return;
      }

      // Actualizar el pago como pagado
      await updateDoc(paymentRef, {
        status: 'paid',
        paidDate: new Date().toISOString(),
      });

      // Actualizar estado local
      setPaymentHistory(prev => 
        prev.map(p => 
          p.id === paymentId 
            ? { ...p, status: 'paid' as const, paidDate: new Date().toISOString() }
            : p
        )
      );

      toast({
        title: "Pago registrado",
        description: `Pago de S/ ${payment.amount.toFixed(2)} registrado correctamente.`,
      });

      // Generar el siguiente período si no existe
      await generateNextPaymentPeriod();
    } catch (error) {
      console.error("Error registering payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar el pago.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const generatePaymentPeriod = async (driverData: EnrichedDriver, vehicleData: Vehicle) => {
    if (!driverData || !vehicleData || !driverData.membershipStartDate) {
      console.log('⚠️ Datos insuficientes para generar pago:', { 
        hasDriver: !!driverData, 
        hasVehicle: !!vehicleData, 
        hasStartDate: !!driverData?.membershipStartDate 
      });
      return;
    }

    try {
      console.log('🔍 Buscando pagos existentes para driver:', driverData.id);
      // Buscar el último período generado
      const paymentsQuery = query(
        collection(db, "membershipPayments"),
        where("driverId", "==", driverData.id)
      );
      const paymentsSnap = await getDocs(paymentsQuery);
      console.log('📊 Pagos encontrados:', paymentsSnap.size);
      
      if (paymentsSnap.empty && driverData.membershipStartDate) {
        // Si no hay pagos, crear el primero
        console.log('✨ Creando primer período de pago...');
        // Parsear la fecha manualmente para evitar problemas de zona horaria
        const [year, month, day] = driverData.membershipStartDate.split('-').map(Number);
        const startDate = new Date(year, month - 1, day); // month es 0-indexed
        const endDate = new Date(startDate);
        
        if (driverData.membershipDuration === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        
        // La fecha de vencimiento es el mismo día que termina el período
        const dueDate = new Date(endDate);

        const serviceType = vehicleData.serviceType;
        const amount = driverData.membershipPricing?.[serviceType] || 
                      (serviceType === 'economy' ? settings?.membershipFeeEconomy :
                       serviceType === 'comfort' ? settings?.membershipFeeComfort :
                       settings?.membershipFeeExclusive) || 0;

        console.log('💰 Datos del pago a crear:', { 
          serviceType, 
          amount, 
          periodStart: startDate.toISOString(), 
          periodEnd: endDate.toISOString(),
          dueDate: dueDate.toISOString()
        });

        const newPayment: Omit<MembershipPayment, 'id'> = {
          driverId: driverData.id,
          amount,
          dueDate: dueDate.toISOString(),
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
          status: new Date() > dueDate ? 'overdue' : 'pending',
          serviceType,
          createdAt: new Date().toISOString(),
        };

        const newPaymentRef = doc(collection(db, "membershipPayments"));
        await setDoc(newPaymentRef, newPayment);
        console.log('✅ Pago creado con ID:', newPaymentRef.id);
        
        // Recargar historial
        const updatedPayments = await getDocs(paymentsQuery);
        const payments = updatedPayments.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MembershipPayment));
        payments.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        setPaymentHistory(payments);
      } else {
        // Verificar si necesitamos generar el siguiente período
        const payments = paymentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MembershipPayment));
        
        payments.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        const lastPayment = payments[0];
        const now = new Date();
        
        console.log('🔍 Verificando si necesita siguiente período...', { 
          lastPaymentDue: lastPayment?.dueDate, 
          isOverdue: lastPayment && new Date(lastPayment.dueDate) < now 
        });
        
        // Si el último pago ya venció, generar el siguiente
        if (lastPayment && new Date(lastPayment.dueDate) < now) {
          console.log('✨ Generando siguiente período...');
          const nextPeriodStart = new Date(lastPayment.periodEnd);
          const nextDueDate = new Date(nextPeriodStart);
          
          if (driverData.membershipDuration === 'monthly') {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          } else {
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          }

          const serviceType = vehicleData.serviceType;
          const amount = driverData.membershipPricing?.[serviceType] || 
                        (serviceType === 'economy' ? settings?.membershipFeeEconomy :
                         serviceType === 'comfort' ? settings?.membershipFeeComfort :
                         settings?.membershipFeeExclusive) || 0;

          const newPayment: Omit<MembershipPayment, 'id'> = {
            driverId: driverData.id,
            amount,
            dueDate: nextDueDate.toISOString(),
            periodStart: nextPeriodStart.toISOString(),
            periodEnd: nextDueDate.toISOString(),
            status: 'overdue',
            serviceType,
            createdAt: new Date().toISOString(),
          };

          const newPaymentRef = doc(collection(db, "membershipPayments"));
          await setDoc(newPaymentRef, newPayment);
          console.log('✅ Siguiente período creado con ID:', newPaymentRef.id);
          
          // Recargar historial
          const updatedPayments = await getDocs(paymentsQuery);
          const updatedPaymentsList = updatedPayments.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as MembershipPayment));
          updatedPaymentsList.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
          setPaymentHistory(updatedPaymentsList);
        }
      }
    } catch (error) {
      console.error("❌ Error generating payment period:", error);
    }
  };

  // Función wrapper para mantener compatibilidad
  const generateNextPaymentPeriod = async () => {
    if (!driver || !driver.vehicle) return;
    await generatePaymentPeriod(driver, driver.vehicle);
  };

  const handlePauseMembership = async () => {
    if (!driver) return;

    try {
      // Buscar todos los pagos pendientes o vencidos
      const paymentsQuery = query(
        collection(db, "membershipPayments"),
        where("driverId", "==", driver.id),
        where("status", "in", ["pending", "overdue"])
      );
      const paymentsSnap = await getDocs(paymentsQuery);

      console.log(`🚫 Cancelando ${paymentsSnap.size} pagos pendientes...`);

      // Cancelar todos los pagos pendientes
      const cancelPromises = paymentsSnap.docs.map(async (paymentDoc) => {
        await updateDoc(doc(db, "membershipPayments", paymentDoc.id), {
          status: 'cancelled',
        });
        console.log(`✅ Pago ${paymentDoc.id} cancelado`);
      });

      await Promise.all(cancelPromises);

      // Actualizar estado local
      setPaymentHistory(prev => 
        prev.map(p => 
          p.status === 'pending' || p.status === 'overdue'
            ? { ...p, status: 'cancelled' as const }
            : p
        )
      );

      toast({
        title: "Membresía pausada",
        description: `Se cancelaron ${paymentsSnap.size} pagos pendientes.`,
      });
    } catch (error) {
      console.error("❌ Error pausando membresía:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo pausar la membresía correctamente.",
      });
    }
  };

  const handleSaveVehicleDocDate = async () => {
    if (!driver?.vehicle || !editDateDialog.docName) return;

    setIsUpdating(true);
    try {
      const vehicleRef = doc(db, "vehicles", driver.vehicle.id);
      const updates: Partial<Vehicle> = {};

      if (editDateDialog.docName === "insurance") {
        updates.insuranceExpiry = editDateDialog.currentDate;
        setInsuranceExpiry(editDateDialog.currentDate);
      } else if (editDateDialog.docName === "technicalReview") {
        updates.technicalReviewExpiry = editDateDialog.currentDate;
        setTechnicalReviewExpiry(editDateDialog.currentDate);
      } else if (editDateDialog.docName === "propertyCard") {
        updates.propertyCardRegistrationDate = editDateDialog.currentDate;
        setPropertyCardRegistrationDate(editDateDialog.currentDate);
      }

      await updateDoc(vehicleRef, updates);

      // Actualizar estado local
      setDriver({
        ...driver,
        vehicle: { ...driver.vehicle, ...updates },
      });

      toast({
        title: "Fecha actualizada",
        description: "La fecha del documento ha sido guardada correctamente.",
      });

      setEditDateDialog({ open: false, docName: null, dateType: null, currentDate: "" });
    } catch (error) {
      console.error("Error updating vehicle document date:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la fecha del documento.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const docNameMap: Record<DocumentName, string> = {
    license: "Licencia de Conducir",
    insurance: "SOAT / Seguro",
    technicalReview: "Revisión Técnica",
    backgroundCheck: "Antecedentes",
    dni: "DNI",
    propertyCard: "Tarjeta de Propiedad",
  };

  const getIndividualDocBadge = (docName: DocumentName) => {
    const status = individualDocStatuses[docName] || "pending";
    const config: Record<
      DocumentStatus,
      { label: string; variant: "default" | "outline" | "destructive" }
    > = {
      approved: { label: "Aprobado", variant: "default" },
      pending: { label: "Pendiente", variant: "outline" },
      rejected: { label: "Rechazado", variant: "destructive" },
    };
    return (
      <Badge variant={config[status].variant}>{config[status].label}</Badge>
    );
  };

  const docStatus = documentStatusConfig[documentsStatus];
  const membershipStatus = getMembershipStatus(driver.membershipExpiryDate);

  const driverDocumentDetails: {
    name: DocumentName;
    label: string;
    expiryDate: string;
  }[] = [
    { name: "dni", label: "DNI", expiryDate: driver.dniExpiry },
    {
      name: "license",
      label: "Licencia de Conducir",
      expiryDate: driver.licenseExpiry,
    },
    {
      name: "backgroundCheck",
      label: "Certificado de Antecedentes",
      expiryDate: driver.backgroundCheckExpiry,
    },
  ];

  const vehicleDocumentDetails: {
    name: DocumentName;
    label: string;
    expiryDate?: string;
    registrationDate?: string;
  }[] = [
    {
      name: "propertyCard",
      label: "Tarjeta de Propiedad",
      registrationDate: driver.vehicle?.propertyCardRegistrationDate,
    },
    {
      name: "insurance",
      label: "SOAT / Póliza de Seguro",
      expiryDate: driver.vehicle?.insuranceExpiry,
    },
    {
      name: "technicalReview",
      label: "Revisión Técnica",
      expiryDate: driver.vehicle?.technicalReviewExpiry,
    },
  ];

  const availableModels =
    allVehicleModels.find((b) => b.name === vehicleBrand)?.models || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Detalles del Conductor
          </h1>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-8">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={driver.avatarUrl} alt={driver.name} />
                <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle>{driver.name}</CardTitle>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{driver.rating.toFixed(1)} de calificación</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <Badge variant={statusConfig[driver.status].variant}>
                  {statusConfig[driver.status].label}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Estado Documentos:
                  </span>
                  <Badge
                    variant={
                      driver.documentsStatus === "approved"
                        ? "default"
                        : driver.documentsStatus === "rejected"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {driver.documentsStatus === "approved"
                      ? "Aprobado"
                      : driver.documentsStatus === "rejected"
                      ? "Rechazado"
                      : "Pendiente"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Viajes Realizados:
                  </span>
                  <span className="font-medium">{driver.totalRides || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehículo Asociado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!driver?.vehicle ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <div className="rounded-full bg-muted p-3">
                    <Car className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Sin vehículo asignado</p>
                    <p className="text-xs text-muted-foreground">
                      Este conductor aún no tiene un vehículo asociado. Complete los datos a continuación para asignar uno.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Vehículo actual</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {vehicleBrand} {vehicleModel} {vehicleYear} - {vehicleColor}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Placa: <span className="font-medium">{licensePlate}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="serviceType">Tipo de Servicio</Label>
                <Select
                  value={serviceType}
                  onValueChange={(value) => setServiceType(value as "economy" | "comfort" | "exclusive")}
                  disabled={isUpdating}
                >
                  <SelectTrigger id="serviceType">
                    <SelectValue placeholder="Seleccionar tipo de servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Económico</SelectItem>
                    <SelectItem value="comfort">Confort</SelectItem>
                    <SelectItem value="exclusive">Exclusivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleBrand">Marca</Label>
                <Select
                  value={vehicleBrand}
                  onValueChange={(value) => {
                    setVehicleBrand(value);
                    setVehicleModel(""); // Reset model when brand changes
                  }}
                  disabled={isUpdating}
                >
                  <SelectTrigger id="vehicleBrand">
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {allVehicleModels.map((brand) => (
                      <SelectItem key={brand.id} value={brand.name}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleModel">Modelo</Label>
                <Select
                  value={vehicleModel}
                  onValueChange={setVehicleModel}
                  disabled={
                    isUpdating || !vehicleBrand || availableModels.length === 0
                  }
                >
                  <SelectTrigger id="vehicleModel">
                    <SelectValue placeholder="Seleccionar modelo" />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start">
                    {availableModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleYear">Año</Label>
                  <Input
                    id="vehicleYear"
                    type="number"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(Number(e.target.value))}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleColor">Color</Label>
                  <Input
                    id="vehicleColor"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="licensePlate">Placa</Label>
                <Input
                  id="licensePlate"
                  value={licensePlate}
                  onChange={(e) =>
                    setLicensePlate(e.target.value.toUpperCase())
                  }
                  disabled={isUpdating}
                />
              </div>
              
              <div className="pt-4 border-t">
                <Button
                  onClick={handleSaveChanges}
                  disabled={isUpdating}
                  className="w-full"
                  size="lg"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Información del Vehículo
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">

          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="documents">
                <FileText className="mr-2 h-4 w-4" />
                Documentación
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="mr-2 h-4 w-4" />
                Historial de Pagos
              </TabsTrigger>
              <TabsTrigger value="rides">
                <Car className="mr-2 h-4 w-4" />
                Viajes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verificación de Documentación</CardTitle>
                  <CardDescription>
                    Revisa el estado individual de cada documento y gestiona la
                    aprobación general del conductor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
              <div
                className={`flex items-center gap-3 rounded-lg border p-4 ${docStatus.color}`}
              >
                {docStatus.icon}
                <div className="font-semibold">
                  Estado general: {docStatus.label}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Documentos Personales</h3>
                <ul className="space-y-3">
                  {driverDocumentDetails.map((docDetail) => {
                    const hasValidDate = docDetail.expiryDate && docDetail.expiryDate.trim() !== '';
                    const statusInfo = hasValidDate ? getDocumentStatus(docDetail.expiryDate) : null;
                    return (
                      <li
                        key={docDetail.name}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                      >
                        <div className="flex flex-col gap-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">
                              {docDetail.label}
                            </span>
                          </div>
                          {statusInfo ? (
                            <div
                              className={cn(
                                "flex items-center gap-1.5 text-sm ml-7",
                                statusInfo.color
                              )}
                            >
                              {statusInfo.icon}
                              <span>
                                {statusInfo.label} (Vence: {format(new Date(docDetail.expiryDate), "dd/MM/yyyy")})
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-sm ml-7 text-muted-foreground">
                              <CalendarCheck className="h-4 w-4" />
                              <span>Sin fecha de vencimiento registrada</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getIndividualDocBadge(docDetail.name)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(docDetail.name)}
                            disabled={!driver.documentUrls?.[docDetail.name]}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleIndividualDocStatusChange(
                                    docDetail.name,
                                    "approved"
                                  )
                                }
                              >
                                Aprobar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleIndividualDocStatusChange(
                                    docDetail.name,
                                    "rejected"
                                  )
                                }
                              >
                                Rechazar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleIndividualDocStatusChange(
                                    docDetail.name,
                                    "pending"
                                  )
                                }
                              >
                                Marcar como Pendiente
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Documentos del Vehículo</h3>
                {!driver?.vehicle && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-3">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Sin vehículo asignado. Asigna un vehículo para poder registrar las fechas de vencimiento.
                    </p>
                  </div>
                )}
                <ul className="space-y-3">
                    {vehicleDocumentDetails.map((docDetail) => {
                      const statusInfo = docDetail.expiryDate
                        ? getDocumentStatus(docDetail.expiryDate)
                        : null;
                      return (
                        <li
                          key={docDetail.name}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                        >
                          <div className="flex flex-col gap-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <Car className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">
                                {docDetail.label}
                              </span>
                            </div>
                          {statusInfo ? (
                            <div
                              className={cn(
                                "flex items-center gap-1.5 text-sm ml-7",
                                statusInfo.color
                              )}
                            >
                              {statusInfo.icon}
                              <span>
                                {statusInfo.label} (Vence:{" "}
                                {format(
                                  new Date(docDetail.expiryDate!),
                                  "dd/MM/yyyy"
                                )}
                                )
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-sm ml-7 text-muted-foreground">
                              <CalendarCheck className="h-4 w-4" />
                              {docDetail.registrationDate ? (
                                <span>
                                  Registrado:{" "}
                                  {format(
                                    new Date(docDetail.registrationDate),
                                    "dd/MM/yyyy"
                                  )}
                                </span>
                              ) : (
                                <span>Fecha no registrada</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getIndividualDocBadge(docDetail.name)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(docDetail.name)}
                            disabled={!driver.documentUrls?.[docDetail.name]}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditVehicleDocDate(
                              docDetail.name,
                              docDetail.expiryDate !== undefined ? 'expiry' : 'registration'
                            )}
                            disabled={!driver?.vehicle}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Fecha
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleIndividualDocStatusChange(
                                    docDetail.name,
                                    "approved"
                                  )
                                }
                              >
                                Aprobar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleIndividualDocStatusChange(
                                    docDetail.name,
                                    "rejected"
                                  )
                                }
                              >
                                Rechazar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleIndividualDocStatusChange(
                                    docDetail.name,
                                    "pending"
                                  )
                                }
                              >
                                Marcar como Pendiente
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t">
                <div className="flex gap-4">
                  <Button
                    className="w-full"
                    onClick={() => handleApproval("approved")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2" />
                    )}
                    Aprobar Conductor
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleApproval("rejected")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-2 animate-spin" />
                    ) : (
                      <XCircle className="mr-2" />
                    )}
                    Rechazar Conductor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Configuración de Modelo de Pago</span>
                  </CardTitle>
                  <CardDescription>
                    Selecciona el modelo de pago y personaliza los precios según el tipo de servicio del vehículo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Selector de modelo de pago */}
                    <div className="space-y-2">
                      <Label htmlFor="paymentModel" className="text-sm font-medium">
                        Modelo de Pago
                      </Label>
                      <Select
                        value={paymentModel}
                        onValueChange={(value) =>
                          setPaymentModel(value as PaymentModel)
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger id="paymentModel">
                          <SelectValue placeholder="Seleccionar modelo de pago" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="commission">
                            Comisión por Viaje
                          </SelectItem>
                          <SelectItem value="membership">
                            Membresía Mensual
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Información del tipo de servicio */}
                    {driver?.vehicle && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Tipo de Servicio del Vehículo</span>
                          </div>
                          <Badge variant="default" className="capitalize">
                            {serviceType === 'economy' ? 'Económico' :
                             serviceType === 'comfort' ? 'Confort' :
                             serviceType === 'exclusive' ? 'Exclusivo' : serviceType}
                          </Badge>
                        </div>
                        <p className="text-xs text-blue-700 mt-2">
                          Los precios se basan en el tipo de servicio del vehículo. Los valores mostrados son de la configuración global, pero puedes personalizarlos para este conductor específicamente.
                        </p>
                      </div>
                    )}

                    {/* Indicador de membresía pausada */}
                    {paymentModel === 'membership' && driver?.membershipPausedDate && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-900">Membresía Pausada</span>
                          </div>
                          <Badge variant="outline" className="text-amber-700 border-amber-300">
                            Inactiva
                          </Badge>
                        </div>
                        <p className="text-xs text-amber-700 mt-2">
                          La membresía fue pausada el {format(new Date(driver.membershipPausedDate), "dd MMM yyyy", { locale: es })}. No se generarán nuevos pagos hasta que la reactives.
                        </p>
                      </div>
                    )}

                    {!driver?.vehicle && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-amber-800">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Vehículo requerido</span>
                        </div>
                        <p className="text-xs text-amber-700">
                          Debe asignar un vehículo primero para configurar el modelo de pago. Los precios se determinan según el tipo de servicio del vehículo.
                        </p>
                      </div>
                    )}

                    {/* Sección de Comisión */}
                    {paymentModel === "commission" && driver?.vehicle && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Porcentaje de Comisión
                          </Label>
                          <a href="/admin/settings" className="text-xs text-primary hover:underline">
                            Ver configuración global
                          </a>
                        </div>

                        {/* Info: Precio por defecto */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Precio global configurado:</span>
                            <span className="font-medium">
                              {serviceType === 'economy' ? settings?.commissionPercentageEconomy :
                               serviceType === 'comfort' ? settings?.commissionPercentageComfort :
                               settings?.commissionPercentageExclusive}%
                            </span>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="commissionPercentage" className="text-xs text-muted-foreground">
                              Precio personalizado para este conductor:
                            </Label>
                            <div className="flex gap-2 items-center max-w-xs">
                              <Input
                                id="commissionPercentage"
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={commissionPercentage}
                                onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                                disabled={isUpdating}
                                className="flex-1"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            El conductor pagará <span className="font-semibold">{commissionPercentage}%</span> de comisión por cada viaje completado
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Sección de Membresía */}
                    {paymentModel === "membership" && driver?.vehicle && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Precio de Membresía
                          </Label>
                          <a href="/admin/settings" className="text-xs text-primary hover:underline">
                            Ver configuración global
                          </a>
                        </div>

                        {/* Info: Precio por defecto */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Precio global configurado:</span>
                            <span className="font-medium">
                              S/ {serviceType === 'economy' ? settings?.membershipFeeEconomy :
                                  serviceType === 'comfort' ? settings?.membershipFeeComfort :
                                  settings?.membershipFeeExclusive}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="membershipPrice" className="text-xs text-muted-foreground">
                              Precio personalizado para este conductor:
                            </Label>
                            <div className="flex gap-2 items-center max-w-xs">
                              <span className="text-sm text-muted-foreground">S/</span>
                              <Input
                                id="membershipPrice"
                                type="number"
                                min="0"
                                step="10"
                                value={membershipPrice}
                                onChange={(e) => setMembershipPrice(Number(e.target.value))}
                                disabled={isUpdating}
                                className="flex-1"
                              />
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Precio mensual que pagará este conductor específicamente
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="membershipDuration" className="text-sm font-medium">
                              Duración
                            </Label>
                            <Select
                              value={membershipDuration}
                              onValueChange={(value) =>
                                setMembershipDuration(value as MembershipDuration)
                              }
                              disabled={isUpdating}
                            >
                              <SelectTrigger id="membershipDuration">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Mensual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="membershipStartDate" className="text-sm font-medium">
                              Fecha de Inicio
                            </Label>
                            <Input
                              id="membershipStartDate"
                              type="date"
                              value={membershipStartDate}
                              onChange={(e) => setMembershipStartDate(e.target.value)}
                              disabled={isUpdating}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <Button
                      onClick={handleSaveChanges}
                      disabled={isUpdating}
                      className="w-full"
                      size="lg"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Modelo de Pago
                        </>
                      )}
                    </Button>
                    
                    {paymentModel === 'membership' && driver?.vehicle && driver?.membershipStartDate && (
                      driver?.membershipPausedDate ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground text-center">
                            Para reactivar, actualiza la fecha de inicio y guarda los cambios
                          </p>
                        </div>
                      ) : (
                        <Button
                          onClick={handlePauseMembership}
                          disabled={isUpdating}
                          variant="outline"
                          className="w-full border-amber-300 text-amber-700 hover:text-amber-500 hover:bg-amber-50"
                          size="lg"
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              Pausar Membresía
                            </>
                          )}
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Historial de Pagos de Membresía
                  </CardTitle>
                  <CardDescription>
                    Registro permanente de todos los pagos realizados. Los pagos pasados no se modifican.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {driver?.paymentModel === 'membership' ? (
                    paymentHistory.length > 0 ? (
                      <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Tipo de Servicio</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Fecha de Vencimiento</TableHead>
                      <TableHead>Fecha de Pago</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment, index) => {
                      if (!payment.periodStart || !payment.periodEnd || !payment.dueDate) {
                        console.warn('Payment with invalid dates:', payment);
                        return null;
                      }
                      
                      const periodStart = new Date(payment.periodStart);
                      const periodEnd = new Date(payment.periodEnd);
                      const dueDate = new Date(payment.dueDate);
                      
                      // Validar que las fechas son válidas
                      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime()) || isNaN(dueDate.getTime())) {
                        console.warn('Payment with invalid date values:', payment);
                        return null;
                      }
                      
                      return (
                        <TableRow key={payment.id} className={payment.status === 'cancelled' ? 'opacity-60' : ''}>
                          <TableCell className={cn("font-medium", payment.status === 'cancelled' && "line-through")}>
                            {format(periodStart, "dd MMM", { locale: es })} - {format(periodEnd, "dd MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {payment.serviceType === 'economy' ? 'Económico' :
                               payment.serviceType === 'comfort' ? 'Confort' :
                               payment.serviceType === 'exclusive' ? 'Exclusivo' : payment.serviceType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            S/ {payment.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {format(dueDate, "dd MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            {payment.paidDate ? (
                              <span className="text-sm text-green-600">
                                {format(new Date(payment.paidDate), "dd MMM yyyy", { locale: es })}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {payment.status === 'paid' ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Pagado
                              </Badge>
                            ) : payment.status === 'overdue' ? (
                              <Badge variant="destructive">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Vencido
                              </Badge>
                            ) : payment.status === 'cancelled' ? (
                              <Badge variant="outline" className="text-muted-foreground">
                                <XCircle className="mr-1 h-3 w-3" />
                                Cancelado
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="mr-1 h-3 w-3" />
                                Pendiente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {payment.status === 'paid' ? (
                              <span className="text-sm text-green-600 flex items-center justify-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Completado
                              </span>
                            ) : payment.status === 'cancelled' ? (
                              <span className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                <XCircle className="h-4 w-4" />
                                Cancelado
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleRegisterPayment(payment.id)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-2 h-3 w-3" />
                                )}
                                Marcar como Pagado
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                    ) : (
                      <div className="text-center py-8 space-y-2">
                        {driver?.membershipPausedDate ? (
                          <>
                            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-muted-foreground font-medium">
                              Membresía Pausada
                            </p>
                            <p className="text-sm text-muted-foreground">
                              No se generarán nuevos pagos. Para reactivar, actualiza la fecha de inicio en la configuración.
                            </p>
                          </>
                        ) : (
                          <p className="text-muted-foreground">
                            No hay historial de pagos aún. Configure la fecha de inicio de la membresía para generar el historial.
                          </p>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 space-y-2">
                      <p className="text-muted-foreground">
                        Este conductor está en modo <span className="font-semibold">Comisión por Viaje</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        El historial de pagos solo está disponible para conductores con membresía mensual.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rides" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Viajes</CardTitle>
                  <CardDescription>
                    Todos los viajes realizados por este conductor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rides.length > 0 ? (
                    <DataTable
                      columns={driverRidesColumns}
                      data={rides}
                      searchKey="pasajero"
                      searchPlaceholder="Buscar por nombre de pasajero..."
                      pageSize={10}
                      entityName="viaje"
                    />
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Este conductor aún no ha realizado ningún viaje.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog para ver documento */}
      <Dialog
        open={!!selectedDocument}
        onOpenChange={() => setSelectedDocument(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument && docNameMap[selectedDocument.name]}
            </DialogTitle>
            <DialogDescription>Conductor: {driver?.name}</DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              {/* Información del documento */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {selectedDocument.name === "propertyCard"
                      ? "Fecha de Registro"
                      : "Fecha de Vencimiento"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      let date = "";
                      if (selectedDocument.name === "dni")
                        date = driver.dniExpiry;
                      else if (selectedDocument.name === "license")
                        date = driver.licenseExpiry;
                      else if (selectedDocument.name === "backgroundCheck")
                        date = driver.backgroundCheckExpiry;
                      else if (selectedDocument.name === "insurance")
                        date = driver.vehicle?.insuranceExpiry || "";
                      else if (selectedDocument.name === "technicalReview")
                        date = driver.vehicle?.technicalReviewExpiry || "";
                      else if (selectedDocument.name === "propertyCard")
                        date =
                          driver.vehicle?.propertyCardRegistrationDate || "";

                      return date
                        ? format(new Date(date), "dd/MMM/yyyy", { locale: es })
                        : "No especificada";
                    })()}
                  </p>
                </div>
              </div>

              {/* Vista previa del documento */}
              <div className="border rounded-lg p-4">
                {selectedDocument.url.endsWith(".pdf") ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-muted rounded-md">
                      <FileCheck className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="font-medium">Documento PDF</p>
                        <p className="text-sm text-muted-foreground">
                          Los PDFs se abren en una nueva pestaña
                        </p>
                      </div>
                    </div>
                    <Button asChild className="w-full">
                      <a
                        href={selectedDocument.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Abrir PDF en nueva pestaña
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div
                    className="relative w-full"
                    style={{ minHeight: "400px" }}
                  >
                    <Image
                      src={selectedDocument.url}
                      alt={docNameMap[selectedDocument.name]}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedDocument(null)}>
              Cerrar
            </Button>
            {selectedDocument && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedDocument) {
                      handleIndividualDocStatusChange(
                        selectedDocument.name,
                        "rejected"
                      );
                      toast({
                        title: "Documento rechazado",
                        description: "No olvides guardar los cambios",
                        variant: "destructive",
                      });
                      setSelectedDocument(null);
                    }
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => {
                    if (selectedDocument) {
                      handleIndividualDocStatusChange(
                        selectedDocument.name,
                        "approved"
                      );
                      toast({
                        title: "Documento aprobado",
                        description: "No olvides guardar los cambios",
                      });
                      setSelectedDocument(null);
                    }
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar fechas de documentos del vehículo */}
      <Dialog
        open={editDateDialog.open}
        onOpenChange={(open) => !open && setEditDateDialog({ open: false, docName: null, dateType: null, currentDate: "" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar {editDateDialog.dateType === 'expiry' ? 'Fecha de Vencimiento' : 'Fecha de Registro'}
            </DialogTitle>
            <DialogDescription>
              {editDateDialog.docName && docNameMap[editDateDialog.docName]}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="docDate">
                {editDateDialog.dateType === 'expiry' ? 'Fecha de Vencimiento' : 'Fecha de Registro'}
              </Label>
              <Input
                id="docDate"
                type="date"
                value={editDateDialog.currentDate}
                onChange={(e) => setEditDateDialog(prev => ({ ...prev, currentDate: e.target.value }))}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Esta fecha se guardará en el vehículo asignado al conductor.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDateDialog({ open: false, docName: null, dateType: null, currentDate: "" })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveVehicleDocDate}
              disabled={isUpdating || !editDateDialog.currentDate}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Fecha
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
