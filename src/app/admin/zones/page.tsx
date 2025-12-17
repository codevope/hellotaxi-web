

'use client';

import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { SpecialFareRule } from '@/lib/types';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SpecialFareRuleForm from '@/components/admin/settings/special-fare-rule-form';
import { createSpecialFareRulesColumns } from '@/components/admin/settings/special-fare-rules-columns';

export default function AdminZonesPage() {
  const [rules, setRules] = useState<SpecialFareRule[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<SpecialFareRule | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const rulesCol = collection(db, 'specialFareRules');
    const unsubscribe = onSnapshot(
      rulesCol,
      (querySnapshot) => {
        const fetchedRules = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as SpecialFareRule)
        );
        setRules(fetchedRules);
        setIsFetching(false);
      },
      (error) => {
        console.error("Error fetching special fare rules:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las reglas de tarifas.' });
        setIsFetching(false);
      }
    );
    return () => unsubscribe();
  }, [toast]);

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'specialFareRules', id));
      toast({ title: 'Regla Eliminada', description: 'La regla de tarifa ha sido eliminada.' });
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la regla.' });
    }
  };
  
  const handleEditClick = (rule: SpecialFareRule) => {
      setSelectedRule(rule);
      setIsDialogOpen(true);
  }
  
  const handleAddClick = () => {
      setSelectedRule(null);
      setIsDialogOpen(true);
  }
  
  const onFormFinished = () => {
      setIsDialogOpen(false);
      setSelectedRule(null);
  }

  const columns = createSpecialFareRulesColumns({
    onEdit: handleEditClick,
    onDelete: handleDeleteRule,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Gestión de Tarifas Especiales
          </h1>
        </div>
         <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2" />
            Añadir Nueva Regla
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reglas de Tarifas Activas</CardTitle>
          <CardDescription>Lista de todos los periodos con recargos especiales por fecha.</CardDescription>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={rules}
              searchKey="name"
              searchPlaceholder="Buscar por nombre del evento..."
              pageSize={10}
              entityName="regla de tarifa"
            />
          )}
        </CardContent>
      </Card>
      
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{selectedRule ? "Editar Regla de Tarifa" : "Añadir Nueva Regla de Tarifa"}</DialogTitle>
              </DialogHeader>
              <SpecialFareRuleForm rule={selectedRule} onFinished={onFormFinished} />
          </DialogContent>
      </Dialog>

    </div>
  );
}
