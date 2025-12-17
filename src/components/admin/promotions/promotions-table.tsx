
'use client';

import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { db } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import PromotionsForm from './promotions-form';
import { useToast } from '@/hooks/use-toast';
import type { Coupon } from '@/lib/types';
import { createPromotionsColumns } from './promotions-columns';


export default function PromotionsTable() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const couponsCol = collection(db, 'coupons');
    const unsubscribe = onSnapshot(couponsCol, (querySnapshot) => {
        const couponsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
        const sortedList = couponsList.sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime());
        setCoupons(sortedList);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching coupons:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleStatus = async (coupon: Coupon) => {
    const newStatus = coupon.status === 'active' ? 'disabled' : 'active';
    const couponRef = doc(db, 'coupons', coupon.id);
    try {
      await updateDoc(couponRef, { status: newStatus });
      toast({
        title: '¡Estado Actualizado!',
        description: `El cupón "${coupon.code}" ahora está ${newStatus === 'active' ? 'activo' : 'desactivado'}.`,
      });
    } catch (error) {
       console.error("Error updating coupon status:", error);
       toast({
         variant: 'destructive',
         title: 'Error',
         description: 'No se pudo actualizar el estado del cupón.',
       });
    }
  }
  
  const handleEditClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsEditOpen(true);
  };

  const columns = createPromotionsColumns({
    onEdit: handleEditClick,
    onToggleStatus: handleToggleStatus,
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cupones Existentes</CardTitle>
          <CardDescription>
            Un registro de todos los códigos promocionales creados.
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Cupones Existentes</CardTitle>
          <CardDescription>
            Un registro de todos los códigos promocionales creados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={coupons}
            searchKey="code"
            searchPlaceholder="Buscar por código..."
            pageSize={10}
            entityName="cupón"
          />
        </CardContent>
      </Card>
      
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cupón</DialogTitle>
          </DialogHeader>
          <PromotionsForm coupon={selectedCoupon} onFinished={() => setIsEditOpen(false)} isDialog={true} />
        </DialogContent>
      </Dialog>
    </>
  );
}
