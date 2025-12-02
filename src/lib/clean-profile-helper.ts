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

import { db, auth } from "./firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";

export async function cleanMyDuplicateProfile() {
  const user = auth.currentUser;

  if (!user) {
    console.error(" No hay usuario autenticado");
    return;
  }

  // Verificar si existe en ambas colecciones
  const userDocRef = doc(db, "users", user.uid);
  const driverDocRef = doc(db, "drivers", user.uid);

  const [userDoc, driverDoc] = await Promise.all([
    getDoc(userDocRef),
    getDoc(driverDocRef),
  ]);

  const existsInUsers = userDoc.exists();
  const existsInDrivers = driverDoc.exists();

  if (existsInDrivers && existsInUsers) {
    // Mostrar datos de cada colección
    if (existsInUsers) {
      const userData = userDoc.data();
    }

    if (existsInDrivers) {
      const driverData = driverDoc.data();
    }

    await deleteDoc(userDocRef);
  } else if (existsInDrivers && !existsInUsers) {
  } else if (existsInUsers && !existsInDrivers) {
  } else {
  }
}

// Hacer disponible globalmente en el navegador
if (typeof window !== "undefined") {
  (window as any).cleanMyDuplicateProfile = cleanMyDuplicateProfile;
}
