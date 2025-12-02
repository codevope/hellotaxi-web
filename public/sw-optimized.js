// Service Worker Optimizado para HelloTaxi PWA
const CACHE_NAME = 'hellotaxi-v1';
const STATIC_CACHE = 'hellotaxi-static-v1';
const DYNAMIC_CACHE = 'hellotaxi-dynamic-v1';

// Recursos críticos para cachear inmediatamente
const STATIC_ASSETS = [
  '/',
  '/install',
  '/manifest.json',
  '/sounds/notification.mp3',
  '/sounds/error.mp3',
  '/sounds/arrived.mp3',
  '/sounds/msg.mp3',
  '/sounds/taxi.mp3',
  '/img/logo.png'
];

// URLs de runtime que no deben ser cacheadas
const SKIP_CACHE_URLS = [
  '/api/',
  '/_next/webpack-hmr',
  'chrome-extension://',
  'moz-extension://'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Error caching static assets:', error);
    })
  );
});

// Activar service worker
self.addEventListener('activate', (event) => {
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar cachés obsoletos
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Evitar interceptar ciertas URLs
  if (SKIP_CACHE_URLS.some(skipUrl => url.pathname.startsWith(skipUrl))) {
    return;
  }

  // Estrategia Cache First para assets estáticos
  if (request.destination === 'image' || 
      request.destination === 'audio' ||
      request.destination === 'font' ||
      request.destination === 'style' ||
      request.destination === 'script') {
    
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request).then((fetchResponse) => {
          // Solo cachear respuestas válidas
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }
          
          const responseToCache = fetchResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return fetchResponse;
        });
      })
    );
    return;
  }

  // Estrategia Network First para navegación
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        // Cachear páginas exitosas
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Fallback a caché en caso de error de red
        return caches.match(request).then((response) => {
          return response || caches.match('/');
        });
      })
    );
    return;
  }

  // Para otras peticiones, intentar red primero, fallback a caché
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {


  let notificationData = {
    title: 'HelloTaxi',
    body: 'Nueva actualización disponible',
    icon: '/icons/android/android-launchericon-192-192.png',
    badge: '/icons/android/android-launchericon-72-72.png',
    tag: 'hellotaxi-notification',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: '/icons/android/android-launchericon-48-48.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/android/android-launchericon-48-48.png'
      }
    ]
  };

  // Procesar datos de la notificación push si están disponibles
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[SW] Error parsing notification data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Abrir la aplicación
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Manejar sincronización en segundo plano
self.addEventListener('sync', (event) => {
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Función de sincronización en segundo plano
async function doBackgroundSync() {
  try {
    
    // Aquí podrías sincronizar datos pendientes con el servidor
    // Por ejemplo: enviar viajes offline, actualizar perfil, etc.
    
    // Ejemplo: sincronizar datos locales con Firebase
    const pendingData = await getStoredPendingData();
    if (pendingData.length > 0) {
      await syncPendingData(pendingData);
    }
    
  } catch (error) {
    console.error('[SW] Error en sincronización:', error);
  }
}

// Función auxiliar para obtener datos pendientes
async function getStoredPendingData() {
  try {
    // Implementar lógica para obtener datos pendientes del IndexedDB o localStorage
    return [];
  } catch (error) {
    console.error('[SW] Error obteniendo datos pendientes:', error);
    return [];
  }
}

// Función auxiliar para sincronizar datos pendientes
async function syncPendingData(data) {
  try {
    // Implementar lógica para enviar datos al servidor
  } catch (error) {
    console.error('[SW] Error sincronizando datos:', error);
  }
}

// Manejar actualizaciones del service worker
self.addEventListener('message', (event) => {
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Limpiar cachés antiguos periódicamente
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupOldCaches());
  }
});

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name !== STATIC_CACHE && name !== DYNAMIC_CACHE
    );
    
    await Promise.all(
      oldCaches.map(cacheName => caches.delete(cacheName))
    );
    
  } catch (error) {
    console.error('[SW] Error limpiando cachés:', error);
  }
}
