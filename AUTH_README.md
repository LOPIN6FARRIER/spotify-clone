# Sistema de Autenticación - Spotify Clone

Sistema de autenticación completo integrado con el backend de `vinicioesparza`.

## 🔐 Características Implementadas

- ✅ Login de usuarios
- ✅ Registro de usuarios  
- ✅ Logout
- ✅ Refresh token automático
- ✅ Middleware de autenticación
- ✅ Cookies HTTP-only para tokens
- ✅ Protección de rutas
- ✅ Componente de perfil de usuario

## 📁 Estructura de Archivos

```
src/
├── api/
│   └── auth/
│       └── auth.service.ts          # Servicios de autenticación (login, register, etc.)
├── components/
│   └── UserProfile.astro            # Componente de perfil/login
├── lib/
│   └── auth.utils.ts                # Utilidades JWT y cookies
├── middleware.ts                     # Middleware de autenticación global
├── pages/
│   ├── login.astro                  # Página de login
│   ├── register.astro               # Página de registro
│   └── api/
│       └── auth/
│           ├── login.ts             # API endpoint login
│           ├── register.ts          # API endpoint register
│           └── logout.ts            # API endpoint logout
└── types/
    └── auth.types.ts                # Tipos TypeScript
```

## 🚀 Uso

### Proteger una página

```astro
---
// src/pages/protected.astro
const user = Astro.locals.user;

if (!user) {
  return Astro.redirect('/login');
}
---

<Layout title="Página Protegida">
  <h1>Bienvenido, {user.email}!</h1>
</Layout>
```

### Proteger solo para admins

```astro
---
const user = Astro.locals.user;

if (!user || user.role !== 'admin') {
  return Astro.redirect('/');
}
---
```

### Acceder al usuario en componentes

```astro
---
const user = Astro.locals.user;
---

{user ? (
  <p>Hola {user.email}</p>
) : (
  <a href="/login">Iniciar Sesión</a>
)}
```

### Hacer peticiones autenticadas desde el cliente

```typescript
// Incluir cookies automáticamente
const response = await fetch('/api/mi-endpoint', {
  credentials: 'include' // Envía las cookies
});
```

### Usar el access token en llamadas API externas

En una API route:

```typescript
// src/pages/api/mi-endpoint.ts
export const GET: APIRoute = async ({ locals }) => {
  const accessToken = locals.accessToken;
  
  if (!accessToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Usar el token para llamadas externas
  const response = await fetch('https://api.externa.com/data', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  return new Response(JSON.stringify(await response.json()));
};
```

## 🔄 Flujo de Autenticación

1. **Login/Register**
   - Usuario envía credenciales → `/api/auth/login` o `/api/auth/register`
   - Backend retorna `accessToken` y `refreshToken`
   - Se guardan en cookies HTTP-only

2. **Middleware**
   - En cada request, verifica si hay `accessToken` válido
   - Si está expirado pero hay `refreshToken`, renueva automáticamente
   - Guarda usuario en `Astro.locals.user`

3. **Acceso a páginas**
   - Páginas leen `Astro.locals.user`
   - Redirigen a `/login` si no hay usuario (opcional)

4. **Logout**
   - Cliente llama `/api/auth/logout`
   - Se eliminan todas las cookies
   - Se invalida sesión en backend

## 🍪 Cookies Utilizadas

| Cookie | Duración | Descripción |
|--------|----------|-------------|
| `accessToken` | 15 minutos | Token de acceso JWT |
| `refreshToken` | 7 días | Token para renovar access token |

## 🔧 Configuración

Asegúrate de tener la variable de entorno en `.env`:

```env
PUBLIC_API_URL=https://data.vinicioesparza.dev/api
```

## 📝 Endpoints del Backend

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST | `/api/auth/refresh` | Renovar access token |

## 🎨 Componentes

### UserProfile

Muestra el perfil del usuario o botones de login/register:

```astro
---
import UserProfile from '@/components/UserProfile.astro';
---

<UserProfile />
```

## 🛡️ Seguridad

- ✅ Cookies HTTP-only (no accesibles desde JavaScript)
- ✅ SameSite=lax (protección CSRF)
- ✅ Secure en producción (solo HTTPS)
- ✅ Refresh token automático
- ✅ Tokens con expiración

## 📱 Ejemplo Completo

Ver implementación en:
- [login.astro](./src/pages/login.astro)
- [register.astro](./src/pages/register.astro)
- [AsideMenu.astro](./src/components/AsideMenu.astro)
