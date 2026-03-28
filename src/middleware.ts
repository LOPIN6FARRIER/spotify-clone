import { defineMiddleware } from "astro:middleware";
import {
  getUserFromCookies,
  isTokenExpired,
  setAuthCookies,
} from "./lib/auth.utils";
import { refreshAccessToken } from "./api/auth/auth.service";

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, locals, url } = context;

  // Intentar obtener el usuario desde las cookies
  const user = getUserFromCookies(cookies);
  const accessToken = cookies.get("accessToken")?.value;
  const refreshToken = cookies.get("refreshToken")?.value;

  // Si hay usuario y el access token no ha expirado
  if (user && accessToken && !isTokenExpired(accessToken)) {
    locals.user = user;
    locals.accessToken = accessToken;
    return next();
  }

  // Si el access token expiró pero hay refresh token, intentar refrescar
  if (refreshToken && (!accessToken || isTokenExpired(accessToken))) {
    try {
      const response = await refreshAccessToken(refreshToken);
      const newAccessToken = response.data.accessToken;
      const newRefreshToken = response.data.refreshToken || refreshToken;

      // Guardar nuevos tokens
      setAuthCookies(cookies, newAccessToken, newRefreshToken);

      // Actualizar locals
      const newUser = getUserFromCookies(cookies);
      if (newUser) {
        locals.user = newUser;
        locals.accessToken = newAccessToken;
      }
    } catch (err) {
      // Si falla el refresh, limpiar cookies
      console.error("Failed to refresh token:", err);
      cookies.delete("accessToken", { path: "/" });
      cookies.delete("refreshToken", { path: "/" });
    }
  }

  return next();
});
