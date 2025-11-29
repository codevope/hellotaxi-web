'use client';

import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '../ui/data-table';
import { createUsersColumns } from './users-table-columns';

async function getUsers(): Promise<User[]> {
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('role', '==', 'passenger'));
  const userSnapshot = await getDocs(q);
  const userList = userSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as User
  );
  return userList;
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadUsers() {
      try {
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const handleToggleBlockUser = async (user: User) => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    const userRef = doc(db, 'users', user.id);

    try {
      await updateDoc(userRef, { status: newStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      toast({
        title: `Usuario ${newStatus === 'blocked' ? 'Bloqueado' : 'Desbloqueado'}`,
        description: `${user.name} ha sido ${newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'} correctamente.`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado del usuario.',
      });
    }
  };

  const columns = createUsersColumns(handleToggleBlockUser);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos los Usuarios (Pasajeros)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            searchKey="usuario"
            searchPlaceholder="Buscar por nombre o email..."
            pageSize={10}
            entityName="usuario"
          />
        )}
      </CardContent>
    </Card>
  );
}
