# Refactorización Mobile/Desktop - HelloTaxi PWA

## 📋 Resumen

Se ha implementado una arquitectura limpia y escalable para separar las vistas Mobile y Desktop de la aplicación HelloTaxi, resolviendo los problemas de diseño y mantenimiento del código actual.

## 🎯 Problema Resuelto

**Antes:**
- ✗ Una única estructura de vistas con condicionales mobile/desktop mezclados
- ✗ Lógica de detección mobile dentro de vistas Desktop deficiente
- ✗ Código difícil de mantener con CSS duplicado
- ✗ Archivo `driver/page.tsx` con **977 líneas** de código mezclado

**Después:**
- ✓ Separación completa entre Mobile y Desktop
- ✓ Detección de dispositivo centralizada y persistente
- ✓ Lógica de negocio compartida (headless hooks)
- ✓ CSS específico por plataforma
- ✓ Lazy loading automático según dispositivo
- ✓ Code splitting optimizado

---

## 🏗️ Arquitectura Implementada

### 1. Hooks de Detección de Dispositivo

**Ubicación:** `src/hooks/device/`

#### `use-device-type.ts`
Hook principal de detección con persistencia en localStorage.

```typescript
const {
  deviceType,      // 'mobile' | 'tablet' | 'desktop'
  isMobile,        // boolean
  isTablet,        // boolean
  isDesktop,       // boolean
  isLandscape,     // boolean
  screenSize,      // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  width,           // number
  height,          // number
  forceMobileView, // () => void
  forceDesktopView,// () => void
  resetViewPreference, // () => void
} = useDeviceType();
```

**Características:**
- Detección por media queries (768px breakpoint)
- Persistencia en localStorage (7 días)
- Detección de orientación (landscape/portrait)
- Forzado manual de vista
- SSR-safe

#### `use-platform-redirect.ts`
Hook para redirección automática basada en dispositivo.

```typescript
const { isRedirecting, currentDeviceType, targetPath } = usePlatformRedirect({
  basePath: '/driver',
  mobilePath: '/driver/mobile/dashboard',
  desktopPath: '/driver/desktop/dashboard'
});
```

#### `use-responsive-config.ts`
Hook para configuración responsive (dimensiones, spacing, etc.)

```typescript
const {
  dimensions,       // DimensionConfig
  spacing,          // { sm, md, lg }
  getValue,         // <T>(config: ResponsiveConfig<T>) => T
  availableHeight,  // number
  availableWidth,   // number
  isCompact,        // boolean
  getGridColumns,   // (minWidth) => number
} = useResponsiveConfig();
```

---

### 2. Context Provider Global

**Ubicación:** `src/components/providers/device-provider.tsx`

Provider que envuelve toda la aplicación y proporciona información de dispositivo globalmente.

```typescript
// En app/layout.tsx
<DeviceProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</DeviceProvider>

// En cualquier componente
const { isMobile, dimensions, getValue } = useDevice();
```

**Componentes auxiliares:**
- `<DeviceSwitch>` - Renderizado condicional por tipo de dispositivo
- `<ShowOn mobile/tablet/desktop>` - Mostrar solo en dispositivos específicos
- `<HideOn mobile/tablet/desktop>` - Ocultar en dispositivos específicos

---

### 3. Lógica de Negocio Compartida

**Ubicación:** `src/components/driver/shared/logic/`

#### `use-driver-ride-logic.ts`
Hook headless (sin UI) que centraliza TODA la lógica de negocio del driver.

```typescript
const logic = useDriverRideLogic({ driver });

// Retorna:
{
  // Estado
  isAvailable,
  incomingRequest,
  activeRide,
  completedRideForRating,
  rideHistory,
  driverLocation,

  // Handlers
  toggleAvailability,
  acceptRequest,
  rejectRequest,
  updateRideStatus,
  completeRide,
  submitRating,
  sendMessage,

  // Notificaciones
  hasNotificationPermission,
  audioEnabled,
  requestNotificationPermission,

  // Chat
  chatMessages,
  unreadChatCount,

  // Estados derivados
  hasActiveRide,
  hasIncomingRequest,
  canAcceptRides,
}
```

**Ventajas:**
- ✓ Reutilizable en Mobile y Desktop
- ✓ Fácil de testear (sin dependencias de UI)
- ✓ Separación de responsabilidades
- ✓ Un solo source of truth para la lógica

---

### 4. Estilos Separados por Plataforma

**Mobile:** `src/styles/mobile/driver-mobile.css`
- Bottom sheets
- Floating action buttons
- Touch-optimized components
- Safe area insets (notch)
- Landscape optimizations

**Desktop:** `src/styles/desktop/driver-desktop.css`
- 3-column layout
- Sidebar navigation
- Desktop-specific cards
- Hover states
- Scrollbar customization

---

### 5. Componentes Refactorizados

#### Página Principal `/driver`

**Archivo:** `src/app/(web)/driver/page.tsx`

```typescript
export default function DriverPage() {
  const { isMobile, isDesktop } = useDevice();

  if (isMobile) {
    return <MobileDashboard />; // Lazy loaded
  }

  return <DesktopDashboard />; // Lazy loaded
}
```

**Características:**
- ✓ Lazy loading con `next/dynamic`
- ✓ Code splitting automático
- ✓ Loading states específicos por plataforma
- ✓ Solo carga el código necesario

#### Desktop Dashboard

**Archivo:** `src/components/driver/desktop/desktop-driver-dashboard.tsx`

Layout de 3 columnas:
1. **Sidebar izquierdo:** Perfil, estado, navegación
2. **Centro:** Mapa en tiempo real
3. **Panel derecho:** Solicitudes y viaje activo

```typescript
export default function DesktopDriverDashboard() {
  const logic = useDriverRideLogic({ driver });

  return (
    <div className="driver-desktop-layout">
      <aside className="driver-desktop-sidebar">...</aside>
      <main className="driver-desktop-map">
        <MapView />
      </main>
      <aside className="driver-desktop-panel">
        <DesktopDriverStatePanel {...logic} />
      </aside>
    </div>
  );
}
```

#### Mobile Dashboard

**Archivo:** `src/components/driver/mobile-dashboard-wrapper.tsx`

Wrapper que adapta el componente mobile existente al nuevo hook.

```typescript
export default function MobileDriverDashboardWrapper() {
  const logic = useDriverRideLogic({ driver });

  // Adapta props del nuevo hook al componente existente
  return <MobileDriverDashboard {...adaptedProps} />;
}
```

---

## 📦 Estructura de Archivos Creados/Modificados

```
src/
├── hooks/
│   └── device/                              # ✨ NUEVO
│       ├── use-device-type.ts               # Hook de detección
│       ├── use-platform-redirect.ts         # Hook de redirección
│       ├── use-responsive-config.ts         # Hook de configuración
│       └── index.ts                         # Exports
│
├── components/
│   ├── providers/                           # ✨ NUEVO
│   │   ├── device-provider.tsx              # Context Provider
│   │   └── index.ts
│   │
│   └── driver/
│       ├── shared/                          # ✨ NUEVO
│       │   └── logic/
│       │       ├── use-driver-ride-logic.ts # Lógica compartida
│       │       └── index.ts
│       │
│       ├── desktop/
│       │   └── desktop-driver-dashboard.tsx # ✨ NUEVO
│       │
│       └── mobile-dashboard-wrapper.tsx     # ✨ NUEVO
│
├── styles/
│   ├── mobile/                              # ✨ NUEVO
│   │   └── driver-mobile.css
│   └── desktop/                             # ✨ NUEVO
│       └── driver-desktop.css
│
└── app/
    ├── layout.tsx                           # 🔄 MODIFICADO (DeviceProvider)
    └── (web)/driver/
        ├── page.tsx                         # 🔄 REFACTORIZADO
        └── page-backup.tsx                  # 💾 BACKUP del original
```

---

## 🚀 Uso y Ejemplos

### Ejemplo 1: Usar detección de dispositivo

```typescript
'use client';
import { useDevice } from '@/components/providers';

function MyComponent() {
  const { isMobile, dimensions, getValue } = useDevice();

  const padding = getValue({
    mobile: 16,
    desktop: 24
  });

  return (
    <div style={{ padding }}>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

### Ejemplo 2: Renderizado condicional

```typescript
import { ShowOn, HideOn, DeviceSwitch } from '@/components/providers';

// Opción 1: ShowOn/HideOn
<ShowOn mobile>
  <MobileOnlyComponent />
</ShowOn>

<HideOn mobile>
  <DesktopOnlyComponent />
</HideOn>

// Opción 2: DeviceSwitch
<DeviceSwitch
  mobile={<MobileView />}
  tablet={<TabletView />}
  desktop={<DesktopView />}
/>
```

### Ejemplo 3: Usar lógica compartida

```typescript
import { useDriverRideLogic } from '@/components/driver/shared/logic';

function MyDriverComponent() {
  const logic = useDriverRideLogic({ driver });

  return (
    <div>
      <button onClick={() => logic.toggleAvailability(!logic.isAvailable)}>
        {logic.isAvailable ? 'Desconectar' : 'Conectar'}
      </button>

      {logic.hasIncomingRequest && (
        <div>
          <button onClick={() => logic.acceptRequest(logic.incomingRequest.id)}>
            Aceptar
          </button>
          <button onClick={() => logic.rejectRequest(logic.incomingRequest.id)}>
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
}
```

### Ejemplo 4: Configuración responsive

```typescript
import { useResponsiveConfig } from '@/hooks/device';

function MyComponent() {
  const { dimensions, getGridColumns, isCompact } = useResponsiveConfig();

  return (
    <div
      style={{
        padding: dimensions.paddingX,
        gap: dimensions.gap,
        gridTemplateColumns: `repeat(${getGridColumns(200)}, 1fr)`
      }}
    >
      {/* Contenido */}
    </div>
  );
}
```

---

## 🔧 Configuración

### Breakpoints

```typescript
const BREAKPOINTS = {
  xs: 0,      // 0-640px
  sm: 640,    // 640-768px
  md: 768,    // 768-1024px (principal mobile breakpoint)
  lg: 1024,   // 1024-1280px
  xl: 1280,   // 1280-1536px
  '2xl': 1536 // 1536px+
};
```

### Tipos de Dispositivo

```typescript
const DEVICE_BREAKPOINTS = {
  mobile: 768,  // < 768px
  tablet: 1024, // 768px - 1024px
  desktop: 1024 // >= 1024px
};
```

### Persistencia

Las preferencias del usuario se guardan en `localStorage` con clave:
```
hellotaxi-device-preference
```

Expiración: 7 días

---

## 🧪 Testing

### Cambiar manualmente entre vistas

```typescript
const { forceMobileView, forceDesktopView, resetViewPreference } = useDevice();

// Forzar vista mobile
forceMobileView();

// Forzar vista desktop
forceDesktopView();

// Resetear a detección automática
resetViewPreference();
```

### Simular diferentes dispositivos

1. Abrir DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Seleccionar dispositivo o tamaño custom
4. La aplicación detectará automáticamente el cambio

---

## 📈 Beneficios

### Performance
- ✓ Code splitting automático (mobile y desktop separados)
- ✓ Lazy loading (solo carga el código necesario)
- ✓ Reducción del bundle size por plataforma
- ✓ CSS específico por plataforma (no carga CSS innecesario)

### Mantenibilidad
- ✓ Separación clara de responsabilidades
- ✓ Lógica de negocio compartida (DRY)
- ✓ Fácil de testear (hooks headless)
- ✓ Cambios en mobile no afectan desktop y viceversa

### Escalabilidad
- ✓ Fácil agregar nuevos breakpoints (ej: tablet específico)
- ✓ Reutilización de hooks en toda la app
- ✓ Patrón consistente para nuevas features

### Developer Experience
- ✓ IntelliSense completo con TypeScript
- ✓ Tipos específicos por plataforma
- ✓ Hooks bien documentados
- ✓ Logging para debugging

---

## 🔮 Próximos Pasos (Opcional)

### 1. Route Groups (Recomendado)

Para una separación aún más estricta:

```
/driver/
├── (mobile)/
│   └── page.tsx    → MobileDashboard
├── (desktop)/
│   └── page.tsx    → DesktopDashboard
└── page.tsx        → Redirect según dispositivo
```

### 2. Middleware de Next.js

Implementar detección en middleware para redirect antes del renderizado:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent');
  const isMobile = /mobile/i.test(userAgent);

  if (request.nextUrl.pathname === '/driver') {
    return NextResponse.redirect(
      isMobile ? '/driver/mobile' : '/driver/desktop'
    );
  }
}
```

### 3. Extender a otras rutas

Aplicar el mismo patrón a:
- `/ride` (pasajeros)
- `/profile`
- `/about`
- Otras rutas relevantes

### 4. Tablet-specific Views

Crear vistas específicas para tablets:

```typescript
<DeviceSwitch
  mobile={<MobileView />}
  tablet={<TabletView />}      // ← Nueva vista específica
  desktop={<DesktopView />}
/>
```

---

## 📚 Recursos

### Archivos clave para referencia

1. **Hook principal:** `src/hooks/device/use-device-type.ts`
2. **Provider:** `src/components/providers/device-provider.tsx`
3. **Lógica compartida:** `src/components/driver/shared/logic/use-driver-ride-logic.ts`
4. **Página refactorizada:** `src/app/(web)/driver/page.tsx`

### Documentación relacionada

- Next.js Dynamic Imports: https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
- Next.js Route Groups: https://nextjs.org/docs/app/building-your-application/routing/route-groups
- React Context: https://react.dev/reference/react/useContext

---

## ✅ Checklist de Implementación

- [x] Crear estructura de carpetas
- [x] Implementar hooks de detección de dispositivo
- [x] Crear Context Provider global
- [x] Extraer lógica de negocio a hooks compartidos
- [x] Crear estilos separados mobile/desktop
- [x] Refactorizar página `/driver` con lazy loading
- [x] Crear Desktop Dashboard
- [x] Crear Mobile Dashboard wrapper
- [x] Integrar DeviceProvider en layout principal
- [x] Documentar cambios
- [ ] Testing en diferentes dispositivos
- [ ] Optimización de performance
- [ ] Extender a otras rutas (opcional)

---

## 🐛 Troubleshooting

### El dispositivo no se detecta correctamente

1. Verificar que `DeviceProvider` esté en el layout principal
2. Revisar breakpoints en `use-device-type.ts`
3. Limpiar localStorage: `localStorage.removeItem('hellotaxi-device-preference')`

### El componente no carga

1. Verificar importaciones dinámicas
2. Revisar que el path en `dynamic()` sea correcto
3. Ver errores en console del navegador

### Hydration errors

1. Asegurar que `ssr: false` esté en componentes dinámicos
2. Usar `useEffect` para código que depende de `window`
3. Revisar que no haya mismatches entre server y client

---

## 👨‍💻 Autor

Refactorización realizada por Claude Code
Fecha: 2025-11-16

## 📝 Notas

- Todos los archivos originales tienen backups con sufijo `-backup.tsx`
- La migración es gradual y mantiene compatibilidad con código existente
- Los componentes mobile existentes siguen funcionando mediante wrappers

---

**🎉 ¡Refactorización completada exitosamente!**
