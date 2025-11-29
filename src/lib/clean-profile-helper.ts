/**
 * Script de Limpieza Manual - Para ejecutar en la consola del navegador
 * 
 * Instrucciones:
 * 1. Abre la consola del navegador (F12)
 * 2. Copia y pega este código completo
 * 3. Ejecuta: await cleanMyDuplicateProfile()
 * 
 * Esto eliminará tu perfil de 'users' si existe en 'drivers'
 */

import { db, auth } from './firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

export async function cleanMyDuplicateProfile() {
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ No hay usuario autenticado');
    return;
  }
  
  console.log(`🔍 Verificando perfil de: ${user.displayName} (${user.email})`);
  console.log(`   UID: ${user.uid}\n`);
  
  // Verificar si existe en ambas colecciones
  const userDocRef = doc(db, 'users', user.uid);
  const driverDocRef = doc(db, 'drivers', user.uid);
  
  const [userDoc, driverDoc] = await Promise.all([
    getDoc(userDocRef),
    getDoc(driverDocRef)
  ]);
  
  const existsInUsers = userDoc.exists();
  const existsInDrivers = driverDoc.exists();
  
  console.log(`📊 Estado actual:`);
  console.log(`   Existe en 'users': ${existsInUsers ? '✅' : '❌'}`);
  console.log(`   Existe en 'drivers': ${existsInDrivers ? '✅' : '❌'}\n`);
  
  if (existsInDrivers && existsInUsers) {
    console.log(`⚠️  DUPLICADO DETECTADO`);
    console.log(`   Eres conductor, tu perfil debe estar solo en 'drivers'\n`);
    
    // Mostrar datos de cada colección
    if (existsInUsers) {
      const userData = userDoc.data();
      console.log(`📄 Datos en 'users':`);
      console.log(`   Nombre: ${userData?.name}`);
      console.log(`   Teléfono: ${userData?.phone}`);
      console.log(`   Dirección: ${userData?.address}\n`);
    }
    
    if (existsInDrivers) {
      const driverData = driverDoc.data();
      console.log(`📄 Datos en 'drivers':`);
      console.log(`   Nombre: ${driverData?.name}`);
      console.log(`   Teléfono: ${driverData?.phone}`);
      console.log(`   Dirección: ${driverData?.address}\n`);
    }
    
    console.log(`🗑️  Eliminando perfil duplicado de 'users'...`);
    await deleteDoc(userDocRef);
    console.log(`✅ Perfil eliminado de 'users'`);
    console.log(`✅ Tu perfil ahora está solo en 'drivers' (correcto)\n`);
    console.log(`🔄 Por favor, recarga la página para ver los cambios.\n`);
    
  } else if (existsInDrivers && !existsInUsers) {
    console.log(`✅ PERFECTO - Tu perfil ya está correctamente configurado`);
    console.log(`   Eres conductor y tu perfil está solo en 'drivers'\n`);
    
  } else if (existsInUsers && !existsInDrivers) {
    console.log(`✅ PERFECTO - Tu perfil ya está correctamente configurado`);
    console.log(`   Eres pasajero y tu perfil está solo en 'users'\n`);
    
  } else {
    console.error(`❌ ERROR - No se encontró tu perfil en ninguna colección`);
    console.log(`   Esto no debería ocurrir. Contacta a soporte.\n`);
  }
}

// Hacer disponible globalmente en el navegador
if (typeof window !== 'undefined') {
  (window as any).cleanMyDuplicateProfile = cleanMyDuplicateProfile;
  console.log('✅ Función cleanMyDuplicateProfile() lista para usar');
}
