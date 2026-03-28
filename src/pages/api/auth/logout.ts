import type { APIRoute } from "astro";
import { logout as apiLogout } from "../../../api/auth/auth.service";
import { clearAuthCookies } from "../../../lib/auth.utils";

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const refreshToken = cookies.get("refreshToken")?.value;
    const accessToken = cookies.get("accessToken")?.value;

    // Llamar al servicio de logout
    if (refreshToken || accessToken) {
      await apiLogout(refreshToken, accessToken).catch((err) => {
        console.error("Logout request failed:", err);
      });
    }

    // Limpiar cookies
    clearAuthCookies(cookies);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Logged out successfully",
      }),
      { status: 200 },
    );
  } catch (error) {
    // Incluso si falla, limpiamos las cookies
    clearAuthCookies(cookies);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Logout failed but cookies cleared",
      }),
      { status: 200 },
    );
  }
};
