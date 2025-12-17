'use client';

import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/lib/types';
import { DataTable } from '../../ui/data-table';
import { adminsColumns } from './dashboard-table-columns';

async function getAdmins(): Promise<User[]> {
  const usersCol = collection(db, 'users');
  
  // Consulta 1: Usuarios con 'admin' en roles (nuevo formato)
  const q1 = query(usersCol, where('roles', 'array-contains', 'admin'));
  const snapshot1 = await getDocs(q1);
  
  // Consulta 2: Usuarios con isAdmin = true (formato legacy)
  const q2 = query(usersCol, where('isAdmin', '==', true));
  const snapshot2 = await getDocs(q2);
  
  // Combinar resultados eliminando duplicados
  const adminMap = new Map<string, User>();
  
  snapshot1.docs.forEach(doc => {
    adminMap.set(doc.id, { id: doc.id, ...doc.data() } as User);
  });
  
  snapshot2.docs.forEach(doc => {
    if (!adminMap.has(doc.id)) {
      adminMap.set(doc.id, { id: doc.id, ...doc.data() } as User);
    }
  });
  
  return Array.from(adminMap.values());
}

export default function AdminsTable() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdmins() {
      try {
        const fetchedAdmins = await getAdmins();
        setAdmins(fetchedAdmins);
      } catch (error) {
        console.error('Error fetching admins:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAdmins();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Administradores</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            columns={adminsColumns}
            data={admins}
            searchKey="administrador"
            searchPlaceholder="Buscar por nombre o email..."
            pageSize={10}
            entityName="administrador"
          />
        )}
      </CardContent>
    </Card>
  );
}
