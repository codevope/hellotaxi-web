'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function RideDebugger() {
  const [rideId, setRideId] = useState('BixeADlYTkFYUKeXgWzs');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const debugRide = async () => {
    if (!rideId.trim()) return;
    
    setLoading(true);
    setDebugInfo(null);

    try {
      
      // 1. Verificar si el documento existe
      const rideRef = doc(db, 'rides', rideId);
      const rideSnap = await getDoc(rideRef);
      
      const exists = rideSnap.exists();
      
      let rideData = null;
      let driverData = null;
      let passengerData = null;
      let vehicleData = null;
      
      if (exists) {
        const rawData = rideSnap.data();
        rideData = { id: rideSnap.id, ...rawData };
        
        // 2. Verificar referencias
        try {
          if (rawData?.driver) {
            const driverSnap = await getDoc(rawData.driver);
            driverData = driverSnap.exists() ? { id: driverSnap.id, ...driverSnap.data() as any } : null;
          }
          
          if (rawData?.passenger) {
            const passengerSnap = await getDoc(rawData.passenger);
            passengerData = passengerSnap.exists() ? { id: passengerSnap.id, ...passengerSnap.data() as any } : null;
          }
          
          if (rawData?.vehicle) {
            const vehicleSnap = await getDoc(rawData.vehicle);
            vehicleData = vehicleSnap.exists() ? { id: vehicleSnap.id, ...vehicleSnap.data() as any } : null;
          }
        } catch (refError) {
          console.error('Error fetching references:', refError);
        }
      }
      
      setDebugInfo({
        rideExists: exists,
        rideData,
        driverData,
        passengerData,
        vehicleData,
        error: null
      });
      
    } catch (error) {
      console.error(' Debug error:', error);
      setDebugInfo({
        rideExists: false,
        rideData: null,
        driverData: null,
        passengerData: null,
        vehicleData: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rideId) {
      debugRide();
    }
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Ride Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={rideId}
              onChange={(e) => setRideId(e.target.value)}
              placeholder="Ride ID"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button onClick={debugRide} disabled={loading}>
              {loading ? 'Debugging...' : 'Debug Ride'}
            </Button>
          </div>

          {debugInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      {debugInfo.rideExists ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">Documento</p>
                        <p className="text-xs text-muted-foreground">
                          {debugInfo.rideExists ? 'Existe' : 'No existe'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      {debugInfo.driverData ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">Conductor</p>
                        <p className="text-xs text-muted-foreground">
                          {debugInfo.driverData ? 'Cargado' : 'No disponible'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      {debugInfo.passengerData ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">Pasajero</p>
                        <p className="text-xs text-muted-foreground">
                          {debugInfo.passengerData ? 'Cargado' : 'No disponible'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      {debugInfo.vehicleData ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">Vehículo</p>
                        <p className="text-xs text-muted-foreground">
                          {debugInfo.vehicleData ? 'Cargado' : 'No disponible'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {debugInfo.error && (
                <Card className="border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <p className="font-medium">Error: {debugInfo.error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {debugInfo.rideData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Datos del Viaje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                      {JSON.stringify(debugInfo.rideData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}