import type { JwtPayload } from "../types/auth.types";
import type { AstroCookies } from "astro";

/**
 * Decodifica un JWT sin verificar la firma (solo para leer el payload)
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

/**
 * Verifica si un token JWT ha expirado
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

/**
 * Guarda los tokens en las cookies
 */
export function setAuthCookies(
  cookies: AstroCookies,
  accessToken: string,
  refreshToken: string,
) {
  cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 15, // 15 minutos
    path: "/",
  });

  cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: "/",
  });
}

/**
 * Elimina los tokens de las cookies
 */
export function clearAuthCookies(cookies: AstroCookies) {
  cookies.delete("accessToken", { path: "/" });
  cookies.delete("refreshToken", { path: "/" });
}

/**
 * Obtiene el usuario desde las cookies
 */
export function getUserFromCookies(cookies: AstroCookies) {
  const accessToken = cookies.get("accessToken")?.value;
  if (!accessToken) return null;

  const payload = parseJwt(accessToken);
  if (!payload) return null;

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}
