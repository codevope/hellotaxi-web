"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Navigation, 
  DollarSign, 
  Calendar, 
  Clock, 
  Star,
  User,
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { EnrichedDriver } from '@/lib/types';

interface MobileDriverHistoryProps {
  driver: EnrichedDriver;
  history: any[] | undefined;
}

/**
 * Historial de viajes móvil optimizado
 *
 * Características:
 * - Lista de viajes con scroll infinito
 * - Filtros por fecha y estado
 * - Búsqueda por pasajero o ubicación
 * - Estadísticas resumidas
 * - Vista detallada de viajes
 * - Ganancias por período
 */
export function MobileDriverHistory({
  driver,
  history = []
}: MobileDriverHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [expandedRide, setExpandedRide] = useState<string | null>(null);

  // Filtrar viajes
  const getFilteredRides = () => {
    if (!history) return [];

    let filtered = [...history];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(ride => 
        ride.passenger?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ride.pickup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ride.dropoff?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por fecha
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    switch (selectedFilter) {
      case 'today':
        filtered = filtered.filter(ride => 
          new Date(ride.createdAt.toDate()) >= today
        );
        break;
      case 'week':
        filtered = filtered.filter(ride => 
          new Date(ride.createdAt.toDate()) >= weekAgo
        );
        break;
      case 'month':
        filtered = filtered.filter(ride => 
          new Date(ride.createdAt.toDate()) >= monthAgo
        );
        break;
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt.toDate()).getTime() - new Date(a.createdAt.toDate()).getTime()
    );
  };

  const filteredRides = getFilteredRides();

  // Calcular estadísticas
  const getStatsForPeriod = () => {
    const total = filteredRides.length;
    const earnings = filteredRides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
    const avgRating = filteredRides.reduce((sum, ride) => sum + (ride.passengerRating || 5), 0) / (total || 1);

    return { total, earnings, avgRating };
  };

  const stats = getStatsForPeriod();

  // Obtener configuración de estado
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          label: 'Completado', 
          color: 'bg-green-500',
          textColor: 'text-green-700'
        };
      case 'cancelled':
        return { 
          label: 'Cancelado', 
          color: 'bg-red-500',
          textColor: 'text-red-700'
        };
      default:
        return { 
          label: 'Desconocido', 
          color: 'bg-gray-500',
          textColor: 'text-gray-700'
        };
    }
  };

  const filterOptions = [
    { id: 'all', label: 'Todos', count: history?.length || 0 },
    { 
      id: 'today', 
      label: 'Hoy', 
      count: history?.filter(ride => {
        const today = new Date().toDateString();
        return new Date(ride.createdAt.toDate()).toDateString() === today;
      }).length || 0 
    },
    { 
      id: 'week', 
      label: 'Semana', 
      count: history?.filter(ride => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(ride.createdAt.toDate()) >= weekAgo;
      }).length || 0 
    },
    { 
      id: 'month', 
      label: 'Mes', 
      count: history?.filter(ride => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(ride.createdAt.toDate()) >= monthAgo;
      }).length || 0 
    }
  ];

  return (
    <div className="mobile-driver-history p-4 space-y-4 bg-gray-50 min-h-screen">
      
      {/* Header con estadísticas */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Historial de Viajes</h2>
            <p className="text-sm text-gray-600">
              {selectedFilter === 'all' ? 'Todos los viajes' : 
               selectedFilter === 'today' ? 'Viajes de hoy' :
               selectedFilter === 'week' ? 'Últimos 7 días' :
               'Último mes'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-gray-600">Viajes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                S/{stats.earnings.toFixed(2)}
              </p>
              <p className="text-xs text-gray-600">Ganancias</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.avgRating.toFixed(1)}
              </p>
              <p className="text-xs text-gray-600">Rating prom.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por pasajero o ubicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterOptions.map((filter) => (
          <Button
            key={filter.id}
            variant={selectedFilter === filter.id ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex items-center gap-2 whitespace-nowrap",
              selectedFilter === filter.id && "bg-blue-600"
            )}
            onClick={() => setSelectedFilter(filter.id as any)}
          >
            <span>{filter.label}</span>
            <Badge variant="secondary" className="text-xs">
              {filter.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Lista de viajes */}
      <div className="space-y-3">
        {filteredRides.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">
                No hay viajes
              </h3>
              <p className="text-sm text-gray-500">
                {searchTerm 
                  ? 'No se encontraron viajes que coincidan con tu búsqueda.'
                  : 'No tienes viajes en el período seleccionado.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRides.map((ride) => {
            const statusConfig = getStatusConfig(ride.status);
            const isExpanded = expandedRide === ride.id;
            const rideDate = new Date(ride.createdAt.toDate());

            return (
              <Card 
                key={ride.id}
                className={cn(
                  "cursor-pointer transition-all",
                  isExpanded && "ring-2 ring-blue-200"
                )}
                onClick={() => setExpandedRide(isExpanded ? null : ride.id)}
              >
                <CardContent className="p-4">
                  {/* Header del viaje */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{ride.passenger?.name || 'Pasajero'}</p>
                        <p className="text-xs text-gray-600">
                          {format(rideDate, 'PPP', { locale: es })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        S/{(ride.fare || 0).toFixed(2)}
                      </p>
                      <Badge 
                        className={cn("text-white text-xs", statusConfig.color)}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Ruta básica */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <p className="text-sm truncate">{ride.pickup}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-red-600" />
                      <p className="text-sm truncate">{ride.dropoff}</p>
                    </div>
                  </div>

                  {/* Información expandida */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Hora de inicio:</p>
                          <p>{format(rideDate, 'HH:mm', { locale: es })}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Duración:</p>
                          <p>{ride.duration || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Distancia:</p>
                          <p>{ride.distance || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Rating:</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{ride.passengerRating?.toFixed(1) || '5.0'}</span>
                          </div>
                        </div>
                      </div>

                      {ride.passengerComment && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Comentario:</p>
                          <p className="text-sm text-gray-600 italic">
                            "{ride.passengerComment}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}