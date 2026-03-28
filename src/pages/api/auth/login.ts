import type { APIRoute } from "astro";
import { login as apiLogin } from "../../../api/auth/auth.service";
import { setAuthCookies } from "../../../lib/auth.utils";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("[API Route] Login request recibido");
    console.log("[API Route] Email:", email);
    console.log("[API Route] Password length:", password?.length);
    console.log("[API Route] Body completo:", JSON.stringify(body));

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email and password are required",
        }),
        { status: 400 },
      );
    }

    // Llamar al servicio de autenticación
    console.log("[API Route] Llamando a apiLogin con:", {
      email,
      password: "***",
    });
    const response = await apiLogin({ email, password });
    console.log("[API Route] Respuesta exitosa del backend");

    // Guardar tokens en cookies
    const { accessToken, refreshToken } = response.data.tokens;
    setAuthCookies(cookies, accessToken, refreshToken);

    return new Response(
      JSON.stringify({
        success: true,
        message: response.message,
        user: response.data.user,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("[API Route] Error completo:", error);
    console.error(
      "[API Route] Error message:",
      error instanceof Error ? error.message : "Unknown",
    );
    const message = error instanceof Error ? error.message : "Login failed";
    return new Response(
      JSON.stringify({
        success: false,
        message,
      }),
      { status: 401 },
    );
  }
};
