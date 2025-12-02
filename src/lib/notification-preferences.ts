import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Driver } from './types';

export interface NotificationPreferencesUpdate {
  browserNotifications?: boolean;
  soundNotifications?: boolean;
  lastAudioPermissionGranted?: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    timestamp: string;
  };
}

/**
 * Actualiza las preferencias de notificación de un conductor en la base de datos
 */
export async function updateDriverNotificationPreferences(
  driverId: string,
  updates: NotificationPreferencesUpdate
): Promise<void> {
  const driverRef = doc(db, 'drivers', driverId);
  
  try {
    // Obtener preferencias actuales
    const driverDoc = await getDoc(driverRef);
    
    if (!driverDoc.exists()) {
      console.error(' El documento del conductor no existe:', driverId);
      throw new Error('Driver document not found');
    }
    
    const driverData = driverDoc.data() as Driver;

    
    const currentPreferences = driverData?.notificationPreferences || {
      browserNotifications: false,
      soundNotifications: false,
    };

    // Agregar info del dispositivo si se proporciona
    let updatedDeviceInfo = currentPreferences.deviceInfo || [];
    if (updates.deviceInfo) {
      // Mantener solo los últimos 3 dispositivos para no llenar la BD
      updatedDeviceInfo = [updates.deviceInfo, ...updatedDeviceInfo.slice(0, 2)];
    }

    const newPreferences = {
      ...currentPreferences,
      ...updates,
      deviceInfo: updatedDeviceInfo,
    };

    await updateDoc(driverRef, {
      notificationPreferences: newPreferences,
    });

  } catch (error) {
    console.error(' Error actualizando preferencias de notificación:', error);
    throw error;
  }
}

/**
 * Obtiene las preferencias de notificación de un conductor
 */
export async function getDriverNotificationPreferences(
  driverId: string
): Promise<Driver['notificationPreferences']> {
  const driverRef = doc(db, 'drivers', driverId);
  
  try {
    const driverDoc = await getDoc(driverRef);
    const driverData = driverDoc.data() as Driver;
    
    return driverData?.notificationPreferences || {
      browserNotifications: false,
      soundNotifications: false,
    };
  } catch (error) {
    console.error(' Error obteniendo preferencias de notificación:', error);
    return {
      browserNotifications: false,
      soundNotifications: false,
    };
  }
}

/**
 * Obtiene información del dispositivo actual
 */
export function getCurrentDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Verifica si el conductor ya habilitó el sonido desde este dispositivo recientemente
 */
export function hasRecentAudioPermission(
  preferences: Driver['notificationPreferences'],
  hoursThreshold: number = 24
): boolean {
  if (!preferences?.lastAudioPermissionGranted) return false;
  
  const lastGranted = new Date(preferences.lastAudioPermissionGranted);
  const threshold = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
  
  return lastGranted > threshold;
}