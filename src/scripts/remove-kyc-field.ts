/**
 * Script para eliminar el campo kycVerified de todos los conductores en Firestore
 * 
 * Uso:
 * 1. Abrir terminal en la raíz del proyecto
 * 2. npm install (si no lo has hecho)
 * 3. npx ts-node src/scripts/remove-kyc-field.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore';

// Configuración de Firebase (ajusta según tu .env)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function removeKycVerifiedField() {
  console.log('🔄 Iniciando eliminación del campo kycVerified...\n');

  try {
    // Obtener todos los conductores
    const driversSnapshot = await getDocs(collection(db, 'drivers'));
    console.log(`📋 Encontrados ${driversSnapshot.size} conductores\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const driverDoc of driversSnapshot.docs) {
      const driverData = driverDoc.data();
      
      // Verificar si el campo existe
      if ('kycVerified' in driverData) {
        console.log(`🔧 Eliminando kycVerified de: ${driverData.name} (${driverDoc.id})`);
        
        const driverRef = doc(db, 'drivers', driverDoc.id);
        await updateDoc(driverRef, {
          kycVerified: deleteField()
        });
        
        updatedCount++;
      } else {
        console.log(`⏭️  Saltando: ${driverData.name} (campo no existe)`);
        skippedCount++;
      }
    }

    console.log('\n✅ Proceso completado!');
    console.log(`   - Documentos actualizados: ${updatedCount}`);
    console.log(`   - Documentos sin cambios: ${skippedCount}`);
    console.log(`   - Total procesados: ${driversSnapshot.size}`);

  } catch (error) {
    console.error('❌ Error al eliminar el campo:', error);
    process.exit(1);
  }
}

// Ejecutar el script
removeKycVerifiedField()
  .then(() => {
    console.log('\n👋 Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
