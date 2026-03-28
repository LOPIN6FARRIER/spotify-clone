const API_BASE =
  import.meta.env.PUBLIC_API_URL || "https://data.vinicioesparza.dev/api";

export interface Song {
  id: number;
  albumId: number;
  title: string;
  image: string;
  artists: string[];
  album: string;
  duration: string;
  uri?: string;
}

export interface Playlist {
  id: string;
  albumId: number;
  title: string;
  color: string;
  cover: string;
  artists: string[];
  songs?: Song[];
}

export interface UpdatePlaylistRequest {
  title?: string;
  cover?: string;
  artists?: string[];
  color?: string;
}

export interface ReorderSongsRequest {
  songIds: number[];
}

/**
 * Obtener todas las playlists
 */
export async function getPlaylists(accessToken?: string): Promise<Playlist[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}/playlists`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch playlists: ${res.status}`);
  }

  const data = await res.json();
  return data.data || data;
}

/**
 * Obtener detalles de una playlist
 */
export async function getPlaylistById(
  playlistId: string,
  accessToken?: string,
): Promise<Playlist> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch playlist: ${res.status}`);
  }

  const data = await res.json();
  return data.data || data;
}

/**
 * Actualizar playlist (solo admin)
 */
export async function updatePlaylist(
  playlistId: string,
  updates: UpdatePlaylistRequest,
  accessToken: string,
): Promise<Playlist> {
  const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      error?.message || `Failed to update playlist: ${res.status}`,
    );
  }

  const data = await res.json();
  return data.data || data;
}

/**
 * Eliminar canción de playlist (solo admin)
 */
export async function removeSongFromPlaylist(
  playlistId: string,
  songUri: string,
  accessToken: string,
): Promise<void> {
  console.log("📡 [removeSongFromPlaylist] Endpoint:", `${API_BASE}/spotify/playlists/${playlistId}/tracks`);
  console.log("📦 [removeSongFromPlaylist] Body:", { uris: [songUri] });
  console.log("🔑 [removeSongFromPlaylist] Token:", accessToken ? `${accessToken.substring(0, 20)}...` : "Missing");
  
  const res = await fetch(
    `${API_BASE}/spotify/playlists/${playlistId}/tracks`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ uris: [songUri] }),
    },
  );

  console.log("📥 [removeSongFromPlaylist] Response status:", res.status, res.statusText);

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    console.error("❌ [removeSongFromPlaylist] Error response:", error);
    throw new Error(error?.message || error?.error || `Failed to remove song: ${res.status}`);
  }
  
  console.log("✅ [removeSongFromPlaylist] Success!");
}

/**
 * Reordenar canciones en playlist (solo admin)
 */
export async function reorderPlaylistSongs(
  playlistId: string,
  uris: string[],
  accessToken: string,
): Promise<void> {
  console.log(
    "📡 Enviando petición PUT a:",
    `${API_BASE}/spotify/playlists/${playlistId}/tracks`,
  );
  console.log("📦 Body:", { uris });

  const res = await fetch(
    `${API_BASE}/spotify/playlists/${playlistId}/tracks`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ uris }),
    },
  );

  console.log("📥 Respuesta status:", res.status, res.statusText);

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    console.log("❌ Error del servidor:", error);
    throw new Error(error?.message || `Failed to reorder songs: ${res.status}`);
  }

  console.log("✅ Petición exitosa!");
}

/**
 * Agregar canción a playlist (solo admin)
 */
export async function addSongToPlaylist(
  playlistId: string,
  songId: number,
  accessToken: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/playlists/${playlistId}/songs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ songId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || `Failed to add song: ${res.status}`);
  }
}
