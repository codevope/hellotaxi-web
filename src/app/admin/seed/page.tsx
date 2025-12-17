'use client';

import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, AlertTriangle, Trash2, Sparkles, Settings2 } from 'lucide-react';
import { seedDatabase, clearCollections } from '@/services/seed-db';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type SeedDataType = 'test' | 'blank';

export default function AdminSeedPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const handleSeedDatabase = async (dataType: SeedDataType) => {
    setIsSeeding(true);
    try {
      await seedDatabase(dataType);
      toast({
        title: "Base de datos poblada",
        description: dataType === 'test' 
          ? "Los datos de prueba se han cargado correctamente."
          : "La configuración base se ha cargado correctamente."
      });
    } catch (error) {
      console.error('Error seeding database:', error);
      toast({
        variant: 'destructive',
        title: "Error al poblar",
        description: "No se pudieron cargar los datos."
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearDatabase = async () => {
    setIsClearing(true);
    try {
        await clearCollections();
        toast({
            title: "Base de Datos Limpiada",
            description: "Todas las colecciones han sido eliminadas exitosamente.",
        });
    } catch (error) {
        console.error("Error clearing database:", error);
        toast({
            variant: "destructive",
            title: "Error al Limpiar",
            description: "No se pudo limpiar la base de datos.",
        });
    } finally {
        setIsClearing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl font-headline">
                Inicializar Base de Datos
            </h1>
            <p className="text-muted-foreground">Cargar datos de prueba para desarrollo y testing.</p>
          </div>
        </div>
      </div>
      
      {/* Clear Database Section */}
      <Card className="max-w-2xl mx-auto border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona Peligrosa
          </CardTitle>
          <CardDescription>
            Elimina TODOS los datos de la base de datos. Esta acción es irreversible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isSeeding || isClearing} className="w-full">
                {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Limpiar Toda la Base de Datos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-destructive h-5 w-5" />
                  ¿Estás absolutamente seguro?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará permanentemente todos los usuarios, conductores, vehículos, viajes, alertas SOS, reclamos y notificaciones. 
                  <br /><br />
                  <strong>No se puede deshacer.</strong> Luego deberás poblar la base de datos manualmente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleClearDatabase} 
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Sí, eliminar todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Seed Database Section */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Poblar Base de Datos
          </CardTitle>
          <CardDescription>
            Añade datos a las colecciones existentes. No elimina información previa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Data Section */}
          <div className="space-y-3">
            <div>
              <h3 className="font-medium flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Datos de Prueba
              </h3>
              <p className="text-sm text-muted-foreground">
                Incluye usuarios, conductores, vehículos, viajes, alertas y reclamos de ejemplo
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isSeeding || isClearing} className="w-full">
                  {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                  Poblar Datos de Prueba
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Poblar con datos de prueba?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Añadirá 3 usuarios, 4 conductores, 4 vehículos, 5 viajes, 2 reclamos, 1 alerta SOS y configuración completa. 
                    <br /><br />
                    No eliminará datos existentes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleSeedDatabase('test')}>
                    Sí, poblar datos de prueba
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="border-t pt-6">
            {/* Blank/Production Section */}
            <div className="space-y-3">
              <div>
                <h3 className="font-medium flex items-center gap-2 mb-1">
                  <Settings2 className="h-4 w-4 text-green-500" />
                  Configuración Base
                </h3>
                <p className="text-sm text-muted-foreground">
                  Solo configuración esencial: 25 marcas de vehículos, tipos de servicio, reglas de cancelación y tarifas
                </p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isSeeding || isClearing} className="w-full">
                    {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                    Poblar Solo Configuración
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Poblar configuración base?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div>
                        <p>Añadirá solo la configuración esencial:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>25 marcas de vehículos con sus modelos</li>
                          <li>3 tipos de servicio (Económico, Confort, Exclusivo)</li>
                          <li>12 motivos de cancelación</li>
                          <li>3 reglas de hora punta</li>
                          <li>Configuración de tarifas y comisiones</li>
                        </ul>
                        <p className="mt-2">Sin usuarios, conductores ni viajes de ejemplo.</p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleSeedDatabase('blank')}>
                      Sí, poblar configuración
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
