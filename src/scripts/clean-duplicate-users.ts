/**
 * Script de Migración: Limpieza de Usuarios Duplicados
 * 
 * Este script elimina la duplicación de datos entre las colecciones
 * 'users' y 'drivers' siguiendo estas reglas:
 * 
 * - Si existe en 'drivers' -> Eliminar de 'users' (es conductor)
 * - Si existe solo en 'users' -> Mantener (es pasajero)
 * - Si existe solo en 'drivers' -> Mantener (es conductor)
 * 
 * IMPORTANTE: Revisar el reporte antes de confirmar la limpieza
 */

import { db } from '../lib/firebase';
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';

interface DuplicateReport {
  uid: string;
  name: string;
  email: string;
  existsInUsers: boolean;
  existsInDrivers: boolean;
  action: 'keep-driver' | 'keep-user' | 'no-action';
}

async function analyzeData(): Promise<DuplicateReport[]> {
  console.log('🔍 Analizando colecciones users y drivers...\n');
  
  const report: DuplicateReport[] = [];
  
  // Obtener todos los usuarios
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const driversSnapshot = await getDocs(collection(db, 'drivers'));
  
  // Crear sets de UIDs
  const userUIDs = new Set(usersSnapshot.docs.map(doc => doc.id));
  const driverUIDs = new Set(driversSnapshot.docs.map(doc => doc.id));
  
  // Combinar todos los UIDs únicos
  const allUIDs = new Set([...userUIDs, ...driverUIDs]);
  
  for (const uid of allUIDs) {
    const existsInUsers = userUIDs.has(uid);
    const existsInDrivers = driverUIDs.has(uid);
    
    let name = 'Desconocido';
    let email = 'desconocido@email.com';
    
    // Obtener nombre y email
    if (existsInDrivers) {
      const driverDoc = await getDoc(doc(db, 'drivers', uid));
      const data = driverDoc.data();
      name = data?.name || name;
      email = data?.email || email;
    } else if (existsInUsers) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const data = userDoc.data();
      name = data?.name || name;
      email = data?.email || email;
    }
    
    let action: DuplicateReport['action'] = 'no-action';
    
    if (existsInUsers && existsInDrivers) {
      action = 'keep-driver'; // Eliminar de users, mantener en drivers
    } else if (existsInDrivers) {
      action = 'no-action'; // Ya está solo en drivers
    } else {
      action = 'keep-user'; // Ya está solo en users
    }
    
    report.push({
      uid,
      name,
      email,
      existsInUsers,
      existsInDrivers,
      action
    });
  }
  
  return report;
}

function printReport(report: DuplicateReport[]) {
  console.log('📊 REPORTE DE ANÁLISIS\n');
  console.log('═'.repeat(80));
  
  const duplicates = report.filter(r => r.action === 'keep-driver');
  const onlyDrivers = report.filter(r => r.existsInDrivers && !r.existsInUsers);
  const onlyUsers = report.filter(r => r.existsInUsers && !r.existsInDrivers);
  
  console.log(`\n🚨 DUPLICADOS ENCONTRADOS (${duplicates.length})`);
  console.log('   Estos usuarios existen en ambas colecciones:\n');
  duplicates.forEach(d => {
    console.log(`   • ${d.name} (${d.email})`);
    console.log(`     UID: ${d.uid}`);
    console.log(`     Acción: Eliminar de 'users', mantener en 'drivers'\n`);
  });
  
  console.log(`\n✅ SOLO EN DRIVERS (${onlyDrivers.length})`);
  console.log('   Estos conductores ya están correctamente configurados.\n');
  
  console.log(`\n✅ SOLO EN USERS (${onlyUsers.length})`);
  console.log('   Estos pasajeros ya están correctamente configurados.\n');
  
  console.log('═'.repeat(80));
  console.log(`\n📝 RESUMEN:`);
  console.log(`   Total de usuarios únicos: ${report.length}`);
  console.log(`   Duplicados a limpiar: ${duplicates.length}`);
  console.log(`   Sin cambios necesarios: ${onlyDrivers.length + onlyUsers.length}\n`);
}

async function cleanDuplicates(report: DuplicateReport[], dryRun: boolean = true) {
  const duplicates = report.filter(r => r.action === 'keep-driver');
  
  if (duplicates.length === 0) {
    console.log('✅ No hay duplicados para limpiar.\n');
    return;
  }
  
  if (dryRun) {
    console.log('🧪 MODO PRUEBA (Dry Run) - No se realizarán cambios\n');
  } else {
    console.log('⚠️  EJECUTANDO LIMPIEZA REAL\n');
  }
  
  for (const duplicate of duplicates) {
    try {
      if (!dryRun) {
        // Eliminar de users
        await deleteDoc(doc(db, 'users', duplicate.uid));
      }
      console.log(`✅ ${duplicate.name}: Eliminado de 'users'`);
    } catch (error) {
      console.error(`❌ Error limpiando ${duplicate.name}:`, error);
    }
  }
  
  console.log(`\n✅ Limpieza completada. ${duplicates.length} duplicados procesados.\n`);
}

// Función principal
async function main() {
  console.log('\n🚀 Iniciando análisis de duplicados...\n');
  
  try {
    // Analizar
    const report = await analyzeData();
    printReport(report);
    
    // Preguntar si continuar (en Node.js usarías readline, aquí es manual)
    console.log('\n⚠️  Para ejecutar la limpieza, cambia dryRun a false en el código.\n');
    
    // Ejecutar en modo prueba
    await cleanDuplicates(report, true);
    
    // Para ejecutar realmente, descomentar la siguiente línea:
    // await cleanDuplicates(report, false);
    
  } catch (error) {
    console.error('❌ Error durante la ejecución:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().then(() => {
    console.log('✅ Script completado.');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

export { analyzeData, cleanDuplicates, printReport };
