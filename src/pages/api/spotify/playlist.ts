import type { APIRoute } from "astro";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8888/api";

export const GET: APIRoute = async ({ request }) => {
  try {
    const response = await fetch(`${API_URL}/spotify/playlists`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch playlists",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
