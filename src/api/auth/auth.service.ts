import type {
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  LoginInput,
  RegisterInput,
} from "../../types/auth.types";

const API_BASE =
  import.meta.env.PUBLIC_API_URL || "https://data.vinicioesparza.dev/api";

/**
 * Login de usuario
 */
export async function login(input: LoginInput): Promise<LoginResponse> {
  const url = `${API_BASE}/auth/login`;
  console.log("[Auth Service] Llamando a:", url);
  console.log("[Auth Service] Con datos:", {
    email: input.email,
    password: "***",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  console.log("[Auth Service] Status response:", res.status);

  const payload = await res.json().catch(() => null);
  console.log("[Auth Service] Payload response:", payload);

  if (!res.ok) {
    const message = payload?.message ?? `Login failed (${res.status})`;
    throw new Error(message);
  }

  return payload;
}

/**
 * Registro de usuario
 */
export async function register(
  input: RegisterInput,
): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const message = payload?.message ?? `Register failed (${res.status})`;
    throw new Error(message);
  }

  return payload;
}

/**
 * Logout de usuario
 */
export async function logout(
  refreshToken?: string,
  accessToken?: string,
): Promise<void> {
  if (!refreshToken && !accessToken) return;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  try {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const message = payload?.message ?? `Logout failed (${res.status})`;
      throw new Error(message);
    }
  } catch (err) {
    console.error("Logout service failed:", err);
    throw err;
  }
}

/**
 * Refrescar access token
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshTokenResponse> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    throw new Error("Refresh token failed");
  }

  return res.json();
}
