"use client";

import React, { createContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import type { User as AppUser } from "@/lib/types";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: FirebaseUser | null;
  appUser: AppUser | null;
  setAppUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  setAppUser: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Intentar buscar primero en users
        let userDocRef = doc(db, 'users', firebaseUser.uid);
        let userSnap = await getDoc(userDocRef);
        
        // Si no existe en users, buscar en drivers
        if (!userSnap.exists()) {
          userDocRef = doc(db, 'drivers', firebaseUser.uid);
          userSnap = await getDoc(userDocRef);
        }
        
        if (userSnap.exists()) {
          const userData = { id: userSnap.id, ...userSnap.data() } as AppUser;
          console.log("👤 Usuario cargado desde:", userSnap.ref.path, userData);
          setAppUser(userData);
        } else {
          // Usuario autenticado pero sin perfil - crear perfil inicial
          console.log("📝 Creando perfil inicial para:", firebaseUser.email);
          
          const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario';
          const newUserData: AppUser = {
            id: firebaseUser.uid,
            name: name,
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || '/img/avatar.png',
            role: 'passenger',
            signupDate: new Date().toISOString(),
            totalRides: 0,
            rating: 5.0,
            phone: firebaseUser.phoneNumber || '',
            address: '',
            isAdmin: false,
            status: 'incomplete',
          };
          
          // Crear documento en users
          const newUserRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(newUserRef, newUserData);
          
          console.log("✅ Perfil creado exitosamente");
          setAppUser(newUserData);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, appUser, setAppUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
