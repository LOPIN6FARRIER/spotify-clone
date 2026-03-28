# Panel de Administración - Spotify Clone

Sistema completo de administración de playlists para usuarios con rol **admin**.

## ✨ Funcionalidades Implementadas

### 🎵 Gestión de Playlists

- ✅ **Editar Playlists**: Los admins pueden acceder a un editor especial para cada playlist
- ✅ **Drag & Drop**: Arrastra canciones para reordenarlas visualmente
- ✅ **Eliminar Canciones**: Botón de eliminar en cada canción con confirmación
- ✅ **Panel de Admin**: Interfaz centralizada para gestionar todas las playlists
- ✅ **Indicadores Visuales**: Iconos de editar en hover sobre playlists editables

### 🔐 Control de Acceso

- Solo usuarios con rol `admin` pueden acceder
- Rutas protegidas automáticamente
- UI adaptativa según el rol del usuario

## 📁 Archivos Creados

### Servicios API
```
src/api/playlists/
└── playlist.service.ts         # Servicios para CRUD de playlists
```

### Componentes
```
src/components/
├── PlaylistEditor.tsx          # Editor de playlist con drag & drop
├── PlaylistsItemCard.astro     # Actualizado con icono de editar para admin
└── AsideMenu.astro             # Actualizado con link a panel de admin
```

### Páginas
```
src/pages/
├── admin.astro                           # Panel de administración principal
├── playlist/[id].astro                   # Actualizado con botón editar
└── playlist/[id]/edit.astro             # Página de edición de playlist
```

## 🚀 Uso

### Acceder al Panel de Admin

1. Inicia sesión como admin
2. En el menú lateral verás "Admin Panel"
3. Click para ver todas las playlists administrables

### Editar una Playlist

**Opción 1: Desde la home**
- Pasa el mouse sobre una playlist local
- Click en el icono de lápiz (esquina superior izquierda)

**Opción 2: Desde la página de playlist**
- Abre cualquier playlist local
- Click en el botón "Editar" (junto al título)

**Opción 3: Desde el panel admin**
- Ve a `/admin`
- Click en el icono de editar sobre cualquier playlist

### Reordenar Canciones

1. En la página de edición, arrastra las canciones usando el icono de "drag handle" (⋮⋮)
2. Suelta en la nueva posición
3. El orden se guarda automáticamente al soltar

### Eliminar Canciones

1. Click en el icono de papelera (🗑️) al final de cada canción
2. Confirma la eliminación
3. La canción se elimina inmediatamente

## 🔧 API Endpoints Necesarios

El frontend hace llamadas a estos endpoints (implementa en tu backend):

```typescript
// Obtener playlists
GET /api/playlists

// Obtener una playlist
GET /api/playlists/:id

// Actualizar playlist
PATCH /api/playlists/:id
Body: { title?, cover?, artists?, color? }

// Eliminar canción de playlist
DELETE /api/playlists/:playlistId/songs/:songId

// Reordenar canciones
PUT /api/playlists/:playlistId/reorder
Body: { songIds: [1, 3, 2, 5, 4] }

// Agregar canción a playlist
POST /api/playlists/:playlistId/songs
Body: { songId: number }
```

Todos los endpoints requieren autenticación y rol admin:
```
Headers: {
  'Authorization': 'Bearer {accessToken}',
  'Content-Type': 'application/json'
}
```

## 💡 Ejemplos de Código

### Verificar si el usuario es admin en una página

```astro
---
const user = Astro.locals.user;
const isAdmin = user?.role === 'admin';

if (!isAdmin) {
  return Astro.redirect('/');
}
---
```

### Mostrar contenido solo para admins

```astro
---
const user = Astro.locals.user;
---

{user?.role === 'admin' && (
  <button>Solo admins ven esto</button>
)}
```

### Usar el servicio de playlists desde el servidor

```typescript
import { updatePlaylist } from '@/api/playlists/playlist.service';

const accessToken = Astro.locals.accessToken;
await updatePlaylist('playlist-id', {
  title: 'Nuevo título'
}, accessToken);
```

## 🎨 Características UX

- **Drag & Drop fluido**: Visual feedback durante el arrastre
- **Estado de carga**: Spinner mientras se guarda
- **Mensajes de error**: Feedback claro cuando algo falla
- **Confirmaciones**: Diálogos de confirmación en acciones destructivas
- **Hover states**: Efectos visuales en interacciones
- **Responsive**: Funciona en diferentes tamaños de pantalla

## 📊 Estado de las características

| Característica | Estado | Notas |
|---|---|---|
| Ver playlists | ✅ | Funcionando |
| Editar playlist | ✅ | Implementado |
| Reordenar canciones | ✅ | Drag & drop |
| Eliminar canción | ✅ | Con confirmación |
| Agregar canción | 🔄 | API lista, UI pendiente |
| Crear playlist | 📋 | Planeado |
| Eliminar playlist | 📋 | Planeado |

## 🔐 Seguridad

- ✅ Verificación de rol en el servidor (middleware)
- ✅ Rutas protegidas con redirect
- ✅ Tokens en headers de API
- ✅ Validación de permisos en cada endpoint
- ✅ UI condicional según rol

## 📸 Flujo de Usuario

```
Login como admin
    ↓
Ver "Admin Panel" en menú
    ↓
Click en "Admin Panel"
    ↓
Ver todas las playlists locales
    ↓
Click en icono de editar
    ↓
Página de edición
    ↓
Drag & drop para reordenar
    ↓
Click en 🗑️ para eliminar
    ↓
Cambios guardados automáticamente
```

## 🛠️ Personalización

### Cambiar colores del tema admin

Edita en [admin.astro](./src/pages/admin.astro):

```css
.admin-header {
  background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
  /* Cambia a tus colores */
}
```

### Agregar más acciones rápidas

En la sección `quick-actions` de [admin.astro](./src/pages/admin.astro), agrega un nuevo card:

```astro
<div class="action-card">
  <div class="icon-wrapper">
    <!-- Tu icono SVG aquí -->
  </div>
  <h3>Nueva Acción</h3>
  <p>Descripción</p>
  <button class="btn-action">Ejecutar</button>
</div>
```

## 🐛 Resolución de Problemas

### "Unauthorized" al editar

Asegúrate de:
1. Estar logueado como admin
2. El backend esté corriendo
3. CORS configurado correctamente

### Drag & drop no funciona

Verifica que:
1. El componente tenga `client:load`
2. Los IDs de canciones sean únicos
3. No haya errores de JavaScript en consola

### No veo el botón "Editar"

Verifica:
1. Que seas admin: `user.role === 'admin'`
2. Que sea una playlist local: `playlist.local === true`
3. Que estés autenticado

---

**Recuerda:** Necesitas implementar los endpoints en tu backend para que la funcionalidad sea completamente funcional. El frontend está listo y hace las llamadas correspondientes.
