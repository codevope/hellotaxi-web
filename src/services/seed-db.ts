
'use server';

import { collection, doc, writeBatch, DocumentReference, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as testData from '@/lib/seed-data';
import * as blankData from '@/lib/seed-data-blank';

type SeedDataType = 'test' | 'blank';

const collectionsToReset = [
    'rides',
    'claims',
    'sosAlerts',
    'drivers',
    'users',
    'notifications',
    'scheduledRides',
    'coupons',
    'specialFareRules',
    'vehicles',
    'vehicleModels',
];


/**
 * Deletes all documents from the specified collections.
 * Exported to allow clearing database without re-seeding.
 */
export async function clearCollections() {
    console.log('Clearing transactional collections...');

    for (const collectionName of collectionsToReset) {
        const collectionRef = collection(db, collectionName);
        try {
            const querySnapshot = await getDocs(collectionRef);
            if (querySnapshot.empty) {
                continue;
            }
            // Cannot use batch for more than 500 operations. Delete one by one.
            for (const doc of querySnapshot.docs) {
                await deleteDoc(doc.ref);
            }
             console.log(`Deleted ${querySnapshot.docs.length} documents from ${collectionName}.`);
        } catch (error) {
            console.warn(`Could not query or delete from collection ${collectionName}. It might not exist or be protected by rules. Skipping.`);
        }
    }
    
    console.log('Transactional collections cleared.');
}

/**
 * Seeds the Firestore database with initial data.
 * This function is idempotent, meaning it can be run multiple times without creating duplicate data.
 * It uses a write batch to perform all writes as a single atomic operation.
 * @param dataType - Type of data to seed: 'test' for test data or 'blank' for production-ready blank data
 */
export async function seedDatabase(dataType: SeedDataType = 'test') {
  const batch = writeBatch(db);
  console.log(`Starting to seed database with ${dataType} data...`);

  // Select the appropriate data source
  const data = dataType === 'test' ? testData : blankData;
  const {
    drivers,
    users,
    rides,
    claims,
    sosAlerts,
    notifications,
    settings,
    serviceTypes,
    coupons,
    specialFareRules,
    cancellationReasons,
    peakTimeRules,
    vehicles,
    vehicleModels
  } = data;

  // --- PHASE 1: Seed independent collections and get their references ---
  const userRefsByEmail = new Map<string, DocumentReference>();
  for (const userData of users) {
    const userRef = doc(collection(db, 'users'));
    batch.set(userRef, { ...userData, id: userRef.id });
    userRefsByEmail.set(userData.email, userRef);
  }
  console.log(`${users.length} users prepared for batch.`);
  
  const vehicleRefsByPlate = new Map<string, DocumentReference>();
  for (const vehicleData of vehicles) {
      const vehicleRef = doc(collection(db, 'vehicles'));
      batch.set(vehicleRef, { ...vehicleData, id: vehicleRef.id, driverId: '' }); // driverId will be updated later
      vehicleRefsByPlate.set(vehicleData.licensePlate, vehicleRef);
  }
  console.log(`${vehicles.length} vehicles prepared for batch.`);

  const driverRefsByEmail = new Map<string, DocumentReference>();
  const driverRefsByName = new Map<string, DocumentReference>(); // Para compatibilidad con rides
  for (const driverData of drivers) {
    // Cast para acceder a campos temporales userEmail y userName
    const driverDataWithTemp = driverData as typeof driverData & { userEmail: string, userName: string };
    
    // Obtener referencia del usuario por email
    const userRef = userRefsByEmail.get(driverDataWithTemp.userEmail);
    if (!userRef) {
        console.error(`User with email ${driverDataWithTemp.userEmail} not found for driver`);
        continue;
    }
    
    const driverRef = doc(collection(db, 'drivers'), userRef.id); // Mismo ID que el usuario
    const vehicleRef = vehicleRefsByPlate.get(driverDataWithTemp.licensePlate);
    if (!vehicleRef) {
        console.error(`Vehicle with plate ${driverDataWithTemp.licensePlate} not found for driver ${driverDataWithTemp.userName}`);
        continue;
    }
    const { licensePlate, userName, userEmail, ...driverWithoutTempFields } = driverDataWithTemp;
    const driverDataWithId = { 
      ...driverWithoutTempFields, 
      id: driverRef.id,
      userId: userRef.id, // Referencia al usuario
      vehicle: vehicleRef 
    };
    batch.set(driverRef, driverDataWithId);
    driverRefsByEmail.set(userEmail, driverRef);
    driverRefsByName.set(userName, driverRef); // Para buscar por nombre en rides

    // Update the vehicle with its assigned driver's ID
    batch.update(vehicleRef, { driverId: driverRef.id });
  }
  console.log(`${drivers.length} drivers prepared for batch.`);
  
  for (const notificationData of notifications) {
    const notificationRef = doc(collection(db, 'notifications'));
    batch.set(notificationRef, { ...notificationData, id: notificationRef.id });
  }
  console.log(`${notifications.length} notifications prepared for batch.`);
  
  for (const couponData of coupons) {
    const couponRef = doc(collection(db, 'coupons'));
    batch.set(couponRef, { ...couponData, id: couponRef.id });
  }
  console.log(`${coupons.length} coupons prepared for batch.`);

  for (const ruleData of specialFareRules) {
    const ruleRef = doc(collection(db, 'specialFareRules'));
    batch.set(ruleRef, { ...ruleData, id: ruleRef.id });
  }
  console.log(`${specialFareRules.length} special fare rules prepared for batch.`);

  for (const modelData of vehicleModels) {
    const modelRef = doc(collection(db, 'vehicleModels'));
    batch.set(modelRef, { ...modelData, id: modelRef.id });
  }
  console.log(`${vehicleModels.length} vehicle models prepared for batch.`);

  const settingsDocRef = doc(db, 'appSettings', 'main');
  batch.set(settingsDocRef, { id: 'main', ...settings, serviceTypes, cancellationReasons, specialFareRules, peakTimeRules });
  console.log('App settings prepared for batch.');


  // --- PHASE 2: Seed dependent collections using the created references ---
  const rideRefs: DocumentReference[] = [];
  for (const rideData of rides) {
    const { driverName, passengerEmail, ...rest } = rideData;
    // Buscar conductor por nombre
    const driver = drivers.find(d => d.userName === driverName);
    if (!driver) {
        console.error(`Driver ${driverName} not found for ride`);
        continue;
    }
    const driverRef = driverRefsByEmail.get(driver.userEmail);
    const passengerRef = userRefsByEmail.get(passengerEmail);
    const vehicleRef = driver ? vehicleRefsByPlate.get(driver.licensePlate) : null;
    
    if (driverRef && passengerRef && vehicleRef) {
      const rideRef = doc(collection(db, 'rides'));
      batch.set(rideRef, {
        ...rest,
        id: rideRef.id,
        driver: driverRef,
        passenger: passengerRef,
        vehicle: vehicleRef
      });
      rideRefs.push(rideRef);
    }
  }
  console.log(`${rides.length} rides prepared for batch.`);

  for (const claimData of claims) {
    const { claimantEmail, rideIndex, ...rest } = claimData;
    const claimantRef = userRefsByEmail.get(claimantEmail);
    const rideRef = rideRefs[rideIndex];

    if (claimantRef && rideRef) {
        const claimRef = doc(collection(db, 'claims'));
        batch.set(claimRef, { 
          ...rest, 
          id: claimRef.id, 
          claimant: claimantRef,
          rideId: rideRef.id 
        });
    }
  }
  console.log(`${claims.length} claims prepared for batch.`);
  
  for (const alertData of sosAlerts) {
    const { driverName, passengerEmail, rideIndex, ...rest } = alertData;
    const driverRef = driverRefsByName.get(driverName);
    const passengerRef = userRefsByEmail.get(passengerEmail);
    const rideRef = rideRefs[rideIndex];

    if (driverRef && passengerRef && rideRef) {
        const alertRef = doc(collection(db, 'sosAlerts'));
        batch.set(alertRef, {
            ...rest,
            id: alertRef.id,
            driver: driverRef,
            passenger: passengerRef,
            rideId: rideRef.id,
        });
    }
  }
  console.log(`${sosAlerts.length} SOS alerts prepared for batch.`);


  // Commit the batch
  await batch.commit();
  console.log('Database seeded successfully!');
}


/**
 * Clears transactional collections and then seeds the database with fresh data.
 * Keeps the 'appSettings' collection intact.
 * @param dataType - Type of data to seed: 'test' for test data or 'blank' for production-ready blank data
 */
export async function resetAndSeedDatabase(dataType: SeedDataType = 'test') {
    await clearCollections();
    await seedDatabase(dataType);
}
