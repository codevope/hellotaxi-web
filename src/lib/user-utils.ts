/**
 * Utilidades para manejo de usuarios y roles
 */

import type { User, UserRole } from './types';

/**
 * Verifica si un usuario tiene un rol específico
 */
export function hasRole(user: User | null | undefined, role: UserRole): boolean {
  if (!user) return false;
  
  // Verificar en array de roles (nuevo sistema)
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.includes(role);
  }
  
  // Fallback a sistema legacy
  if (role === 'admin' && user.isAdmin) return true;
  if (user.role === role) return true;
  
  return false;
}

/**
 * Verifica si un usuario es administrador
 */
export function isAdmin(user: User | null | undefined): boolean {
  return hasRole(user, 'admin');
}

/**
 * Verifica si un usuario es conductor
 */
export function isDriver(user: User | null | undefined): boolean {
  return hasRole(user, 'driver');
}

/**
 * Verifica si un usuario es pasajero
 */
export function isRider(user: User | null | undefined): boolean {
  return hasRole(user, 'rider');
}

/**
 * Agrega un rol a un usuario (retorna nuevo array de roles)
 */
export function addRole(currentRoles: UserRole[], newRole: UserRole): UserRole[] {
  if (currentRoles.includes(newRole)) {
    return currentRoles;
  }
  return [...currentRoles, newRole];
}

/**
 * Remueve un rol de un usuario (retorna nuevo array de roles)
 */
export function removeRole(currentRoles: UserRole[], roleToRemove: UserRole): UserRole[] {
  return currentRoles.filter(role => role !== roleToRemove);
}

/**
 * Obtiene el rol principal del usuario para redirección
 * Prioridad: admin > driver > rider
 */
export function getPrimaryRole(user: User | null | undefined): UserRole | null {
  if (!user) return null;
  
  const roles = user.roles || [];
  
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('driver')) return 'driver';
  if (roles.includes('rider')) return 'rider';
  
  // Fallback a sistema legacy
  if (user.isAdmin) return 'admin';
  if (user.role) return user.role;
  
  return 'rider'; // Default
}

/**
 * Migra un usuario del sistema legacy al nuevo sistema de roles
 */
export function migrateUserToRoles(user: User): User {
  // Si ya tiene roles, no hacer nada
  if (user.roles && user.roles.length > 0) {
    return user;
  }
  
  const roles: UserRole[] = [];
  
  // Determinar roles basado en campos legacy
  if (user.isAdmin) {
    roles.push('admin');
  }
  
  if (user.role === 'driver') {
    roles.push('driver');
    roles.push('rider'); // Los conductores también pueden ser pasajeros
  } else {
    // Por defecto es rider
    roles.push('rider');
  }
  
  return {
    ...user,
    roles: roles.length > 0 ? roles : ['rider'],
  };
}
