

'use client';

import { useContext } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { AuthContext } from '@/components/providers/auth-provider';
import { doc, setDoc, getDoc, updateDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import type { UserRole, User, Vehicle } from '@/lib/types';
import { vehicles } from '@/lib/seed-data';

async function createOrUpdateUserProfile(user: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  const providerIds = user.providerData.map((p) => p.providerId);
  const hasPassword = providerIds.includes('password');
  const hasGoogle = providerIds.includes('google.com');

  // Get current user profile to check phone number
  const existingData = userDoc.exists() ? userDoc.data() : {};
  const hasPhoneInProfile = existingData.phone && existingData.phone.trim().length > 0;

  // User is active if they have: Google AND password AND phone in profile
  const status = hasPassword && hasGoogle && hasPhoneInProfile ? 'active' : 'incomplete';

  if (!userDoc.exists()) {
    const name = user.displayName || user.email?.split('@')[0] || 'Usuario Anónimo';
    const newUser: User = {
      id: user.uid,
      name: name,
      email: user.email || '',
      avatarUrl: user.photoURL || '/img/avatar.png',
      roles: ['rider'], // Nuevo sistema: todos empiezan como rider
      signupDate: new Date().toISOString(),
      totalRidesAsPassenger: 0,
      rating: 5.0,
      phone: user.phoneNumber || '',
      address: '',
      status: status,
      // Campos legacy para retrocompatibilidad
      role: 'rider',
      isAdmin: false,
      totalRides: 0,
    };
    await setDoc(userRef, newUser);

    if (!user.displayName || !user.photoURL) {
        await updateProfile(user, { 
            displayName: name,
            photoURL: user.photoURL || '/img/avatar.png' 
        });
    }

    return newUser;
  }
  
  const existingUser = { id: userDoc.id, ...userDoc.data() } as User;
  if (existingUser.status !== status) {
    await updateDoc(userRef, { status: status });
    return { ...existingUser, status: status };
  }
  
  return existingUser;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const { user: firebaseUser, appUser, setAppUser } = context;

  // NOTA: El AuthProvider ya maneja onAuthStateChanged, 
  // no necesitamos duplicar la lógica aquí

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
        if (error.code === 'auth/account-exists-with-different-credential' && error.customData.email) {
            const email = error.customData.email;
            const credential = GoogleAuthProvider.credentialFromError(error);
            const methods = await fetchSignInMethodsForEmail(auth, email);

            if (methods.includes('password')) {
               const password = prompt('Parece que ya tienes una cuenta con este correo. Por favor, introduce tu contraseña para vincular tu cuenta de Google.');
                if (password) {
                    try {
                        const userCredential = await signInWithEmailAndPassword(auth, email, password);
                        await linkWithCredential(userCredential.user, credential!);
                        return;
                    } catch (e) {
                         throw new Error('La contraseña es incorrecta. No se pudo vincular la cuenta.');
                    }
                } else {
                    throw new Error('Se requiere contraseña para vincular cuentas.');
                }
            }
        }
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
             throw new Error('Este correo electrónico ya está en uso. Por favor, inicia sesión o utiliza otro correo.');
        }
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        console.error('Error signing up with email', error);
        throw error;
    }
  };


  const setPasswordForUser = async (password: string) => {
    if (!auth.currentUser) throw new Error("No hay un usuario autenticado.");
    const credential = EmailAuthProvider.credential(auth.currentUser.email!, password);
    try {
        await linkWithCredential(auth.currentUser, credential);
    } catch (error: any) {
        console.error("Error setting password", error);
        if (error.code === 'auth/credential-already-in-use') {
            throw new Error("Esta cuenta ya tiene una contraseña o está vinculada a otro usuario.");
        }
        throw error;
    }
  };


  const signInWithEmail = async (email: string, password: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Error signing in with email', error);
        throw error;
    }
  };

  const updatePhoneNumber = async (phoneNumber: string) => {
    if (!auth.currentUser) throw new Error("No hay un usuario autenticado.");
    
    // Check if phone number already exists for another user
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("phone", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const userWithSamePhone = querySnapshot.docs.find(doc => doc.id !== auth.currentUser!.uid);
        if (userWithSamePhone) {
            throw new Error("Este número de teléfono ya está registrado por otro usuario.");
        }
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    // Check if user now meets all requirements for 'active' status
    const providerIds = auth.currentUser.providerData.map((p) => p.providerId);
    const hasPassword = providerIds.includes('password');
    const hasGoogle = providerIds.includes('google.com');
    const hasPhone = phoneNumber && phoneNumber.trim().length > 0;
    
    const newStatus = hasPassword && hasGoogle && hasPhone ? 'active' : 'incomplete';
    
    await updateDoc(userRef, { 
      phone: phoneNumber,
      status: newStatus
    });
    
    // Refresh the user profile
    const updatedUserDoc = await getDoc(userRef);
    if (updatedUserDoc.exists()) {
      const updatedUser = { id: updatedUserDoc.id, ...updatedUserDoc.data() } as User;
      setAppUser(updatedUser);
    }
  };

  const linkGoogleAccount = async () => {
    if (!auth.currentUser) throw new Error("No hay un usuario autenticado.");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await checkAndCompleteProfile(auth.currentUser.uid);
      console.log("Google account linked!", result.user);
    } catch (error: any) {
      console.error("Error linking Google account", error);
      if (error.code === 'auth/credential-already-in-use') {
        throw new Error("Esta cuenta de Google ya está vinculada a otro usuario.");
      }
      throw error;
    }
  };

  const checkAndCompleteProfile = async (userId: string) => {
    if (!auth.currentUser) return;
    const user = auth.currentUser;
    const providerIds = user.providerData.map((p) => p.providerId);
    const hasPassword = providerIds.includes('password');
    const hasGoogle = providerIds.includes('google.com');

    // Get user profile to check phone
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};
    const hasPhoneInProfile = userData.phone && userData.phone.trim().length > 0;

    if (hasPassword && hasGoogle && hasPhoneInProfile) {
        await updateDoc(userRef, { status: 'active' });
        if(userSnap.exists()){
            setAppUser({ id: userSnap.id, ...userSnap.data() } as User);
        }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Redirigir al login después de cerrar sesión
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const updateUserRole = async (newRole: UserRole) => {
    if (!firebaseUser) throw new Error('User not logged in');
    if (!appUser) throw new Error('App user not loaded');

    const userRef = doc(db, 'users', firebaseUser.uid);
    const driverProfileRef = doc(db, 'drivers', firebaseUser.uid);
    const batch = writeBatch(db);

    // Obtener roles actuales
    const currentRoles = appUser.roles || [];
    let newRoles = [...currentRoles];

    if (newRole === 'driver') {
      // Agregar rol de driver si no lo tiene
      if (!newRoles.includes('driver')) {
        newRoles.push('driver');
      }
      
      // Verificar si ya existe perfil de conductor
      const driverProfileDoc = await getDoc(driverProfileRef);
      
      if (!driverProfileDoc.exists()) {
        // Crear nuevo perfil de conductor (SOLO datos específicos de conductor)
        batch.set(driverProfileRef, {
          id: firebaseUser.uid,
          userId: firebaseUser.uid,
          status: 'unavailable', // No disponible hasta que suba documentos y tenga vehículo
          documentsStatus: 'pending',
          licenseExpiry: '',
          dniExpiry: '',
          backgroundCheckExpiry: '',
          paymentModel: 'commission',
          commissionPercentage: 15,
          membershipStatus: 'pending',
          documentStatus: {
            dni: 'pending',
            license: 'pending',
            propertyCard: 'pending',
            insurance: 'pending',
            technicalReview: 'pending',
            backgroundCheck: 'pending'
          },
          documentUrls: {
            dni: '',
            license: '',
            propertyCard: '',
            insurance: '',
            technicalReview: '',
            backgroundCheck: ''
          },
          totalRidesAsDriver: 0,
          driverRating: 5.0,
          vehicle: null,
        });
        console.log('✅ Perfil de conductor creado');
      }
      
      // Actualizar roles en users
      batch.update(userRef, { 
        roles: newRoles,
        role: 'driver' // Legacy field
      });
      
    } else if (newRole === 'rider') {
      // Agregar rol de rider si no lo tiene
      if (!newRoles.includes('rider')) {
        newRoles.push('rider');
      }
      
      // Actualizar roles en users
      batch.update(userRef, { 
        roles: newRoles,
        role: 'rider' // Legacy field
      });
      
    } else if (newRole === 'admin') {
      // Agregar rol de admin
      if (!newRoles.includes('admin')) {
        newRoles.push('admin');
      }
      
      // Actualizar roles en users
      batch.update(userRef, { 
        roles: newRoles,
        isAdmin: true // Legacy field
      });
    }

    await batch.commit();

    // Recargar usuario actualizado
    const updatedUserDoc = await getDoc(userRef);
    if (updatedUserDoc.exists()) {
      const updatedUser = { id: updatedUserDoc.id, ...updatedUserDoc.data() } as User;
      setAppUser(updatedUser);
    }
  };

  return { 
      ...context, 
      user: firebaseUser, 
      signInWithGoogle, 
      signOut, 
      updateUserRole,
      signInWithEmail,
      signUpWithEmail,
      setPasswordForUser,
      linkGoogleAccount,
      updatePhoneNumber,
      checkAndCompleteProfile,
    };
}
