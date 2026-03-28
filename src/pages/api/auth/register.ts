import type { APIRoute } from "astro";
import { register as apiRegister } from "../../../api/auth/auth.service";
import { setAuthCookies } from "../../../lib/auth.utils";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { username, email, password, full_name } = body;

    if (!username || !email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Username, email, and password are required",
        }),
        { status: 400 },
      );
    }

    // Llamar al servicio de registro
    const response = await apiRegister({
      username,
      email,
      password,
      full_name,
    });

    // Guardar tokens en cookies
    const { accessToken, refreshToken } = response.data.tokens;
    setAuthCookies(cookies, accessToken, refreshToken);

    return new Response(
      JSON.stringify({
        success: true,
        message: response.message,
        user: response.data.user,
      }),
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed";
    return new Response(
      JSON.stringify({
        success: false,
        message,
      }),
      { status: 400 },
    );
  }
};
