"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Star, 
  Shield, 
  Car, 
  FileText, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriverRideLogic } from '@/hooks/driver/use-driver-ride-logic';
import type { EnrichedDriver } from '@/lib/types';

interface MobileDriverProfileProps {
  driver: EnrichedDriver;
  logic: ReturnType<typeof useDriverRideLogic>;
}

/**
 * Perfil móvil completo del conductor
 *
 * Características:
 * - Información personal y contacto
 * - Estados de verificación
 * - Estadísticas de rendimiento
 * - Información del vehículo
 * - Documentos y certificaciones
 * - Rating y reviews
 */
export function MobileDriverProfile({
  driver,
  logic
}: MobileDriverProfileProps) {
  const [activeSection, setActiveSection] = useState<'info' | 'vehicle' | 'documents' | 'stats'>('info');

  // Calcular estadísticas
  const getStats = () => {
    const today = new Date();
    const thisWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayRides = logic.rideHistory?.filter(ride => 
      new Date(ride.createdAt.toDate()).toDateString() === today.toDateString()
    ).length || 0;

    const weekRides = logic.rideHistory?.filter(ride => 
      new Date(ride.createdAt.toDate()) >= thisWeek
    ).length || 0;

    const monthRides = logic.rideHistory?.filter(ride => 
      new Date(ride.createdAt.toDate()) >= thisMonth
    ).length || 0;

    const totalEarnings = logic.rideHistory?.reduce((sum, ride) => 
      sum + (ride.fare || 0), 0
    ) || 0;

    return { todayRides, weekRides, monthRides, totalEarnings };
  };

  const stats = getStats();

  // Obtener estado de verificación
  const getVerificationStatus = () => {
    const status = driver.documentsStatus;
    switch (status) {
      case 'approved':
        return { 
          label: 'Verificado', 
          color: 'bg-green-500', 
          icon: Shield,
          description: 'Todos los documentos están aprobados'
        };
      case 'pending':
        return { 
          label: 'Pendiente', 
          color: 'bg-yellow-500', 
          icon: FileText,
          description: 'Documentos en revisión'
        };
      case 'rejected':
        return { 
          label: 'Rechazado', 
          color: 'bg-red-500', 
          icon: FileText,
          description: 'Algunos documentos fueron rechazados'
        };
      default:
        return { 
          label: 'No verificado', 
          color: 'bg-gray-500', 
          icon: FileText,
          description: 'Documentos no enviados'
        };
    }
  };

  const verificationStatus = getVerificationStatus();

  return (
    <div className="mobile-driver-profile p-4 space-y-4 bg-gray-50 min-h-screen">
      
      {/* Header del perfil */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-20 w-20 border-4 border-blue-100">
              <AvatarImage 
                src={driver.profileImage || '/images/default-driver.jpg'} 
                alt={driver.name} 
              />
              <AvatarFallback className="text-xl">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{driver.name}</h2>
              <p className="text-gray-600">{driver.email}</p>
              
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {driver.rating?.toFixed(1) || '5.0'}
                  </span>
                </div>
                
                <Badge 
                  className={cn("text-white text-xs", verificationStatus.color)}
                >
                  <verificationStatus.icon className="h-3 w-3 mr-1" />
                  {verificationStatus.label}
                </Badge>
              </div>
            </div>

            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          {/* Rating detallado */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Rating promedio</span>
              <span>{driver.rating?.toFixed(1) || '5.0'} / 5.0</span>
            </div>
            <Progress 
              value={(driver.rating || 5) * 20} 
              className="h-2" 
            />
            <p className="text-xs text-gray-600">
              Basado en {driver.totalRides || 0} viajes completados
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navegación de secciones */}
      <div className="grid grid-cols-4 gap-1 bg-white rounded-lg p-1">
        {[
          { id: 'info', label: 'Info', icon: User },
          { id: 'vehicle', label: 'Vehículo', icon: Car },
          { id: 'documents', label: 'Docs', icon: FileText },
          { id: 'stats', label: 'Stats', icon: TrendingUp }
        ].map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={cn(
                "flex flex-col items-center py-3 px-2 rounded-md transition-colors",
                isActive 
                  ? "bg-blue-100 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{section.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido de la sección */}
      <div className="space-y-4">
        {activeSection === 'info' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{driver.phone || 'No registrado'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{driver.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Registrado: {new Date(driver.createdAt?.toDate()).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Estado de Verificación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "h-3 w-3 rounded-full",
                    verificationStatus.color
                  )} />
                  <span className="font-medium">{verificationStatus.label}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {verificationStatus.description}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {activeSection === 'vehicle' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Información del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {driver.vehicle ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Marca</p>
                      <p className="text-sm">{driver.vehicleBrand || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Modelo</p>
                      <p className="text-sm">{driver.vehicleModel || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Año</p>
                      <p className="text-sm">{driver.vehicleYear || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Color</p>
                      <p className="text-sm">{driver.vehicleColor || 'N/A'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Placa</p>
                    <p className="text-lg font-bold tracking-wider">
                      {driver.licensePlate || 'No registrada'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No hay información de vehículo registrada
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {activeSection === 'documents' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Licencia de Conducir', status: 'approved' },
                  { name: 'SOAT', status: 'approved' },
                  { name: 'Revisión Técnica', status: 'pending' },
                  { name: 'Antecedentes Policiales', status: 'approved' }
                ].map((doc, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{doc.name}</span>
                    <Badge 
                      variant={doc.status === 'approved' ? 'default' : 'secondary'}
                      className={cn(
                        "text-xs",
                        doc.status === 'approved' && "bg-green-500"
                      )}
                    >
                      {doc.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'stats' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Estadísticas de Viajes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.todayRides}</p>
                    <p className="text-xs text-gray-600">Hoy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.weekRides}</p>
                    <p className="text-xs text-gray-600">Esta semana</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.monthRides}</p>
                    <p className="text-xs text-gray-600">Este mes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {logic.rideHistory?.length || 0}
                    </p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Ganancias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    S/{stats.totalEarnings.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">Ganancias totales</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}