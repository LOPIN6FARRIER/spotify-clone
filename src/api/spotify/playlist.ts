/**
 * API de Spotify - Conexión con backend vinicioesparza
 * localhost:8888/api/spotify
 */

import { colors } from "@/lib/colors";
import type { Playlist, Song } from "@/lib/data";
import { songs } from "../../lib/data";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8888/api";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SpotifyPlaylist {
  collaborative: boolean;
  description: string;
  external_urls: Externalurls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: Owner;
  primary_color: null;
  public: boolean;
  snapshot_id: string;
  tracks: Tracks;
  items: Tracks;
  type: string;
  uri: string;
}

interface Tracks {
  href: string;
  total: number;
}

interface Owner {
  display_name: string;
  external_urls: Externalurls;
  href: string;
  id: string;
  type: string;
  uri: string;
}

interface Image {
  height: null | number;
  url: string;
  width: null | number;
}

interface Externalurls {
  spotify: string;
}

interface PlaylistDetails {
  collaborative: boolean;
  description: string;
  external_urls: Externalurls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: Owner;
  primary_color: null;
  public: boolean;
  snapshot_id: string;
  tracks: Tracks;
  items: Tracks;
  type: string;
  uri: string;
}

interface Tracks {
  href: string;
  items: Item[];
  limit: number;
  next: null;
  offset: number;
  previous: null;
  total: number;
}

interface Item {
  added_at: string;
  added_by: Addedby;
  is_local: boolean;
  primary_color: null;
  track: Track;
  item: Track;
  video_thumbnail: Videothumbnail;
}

interface Videothumbnail {
  url: null;
}

interface Track {
  preview_url: null;
  available_markets: string[];
  explicit: boolean;
  type: string;
  episode: boolean;
  track: boolean;
  album: Album;
  artists: Artist[];
  disc_number: number;
  track_number: number;
  duration_ms: number;
  external_ids: Externalids;
  external_urls: Externalurls;
  href: string;
  id: string;
  name: string;
  popularity: number;
  uri: string;
  is_local: boolean;
}

interface Externalids {
  isrc: string;
}

interface Album {
  available_markets: string[];
  type: string;
  album_type: string;
  href: string;
  id: string;
  images: Image[];
  name: string;
  release_date: string;
  release_date_precision: string;
  uri: string;
  artists: Artist[];
  external_urls: Externalurls;
  total_tracks: number;
}

interface Artist {
  external_urls: Externalurls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

interface Addedby {
  external_urls: Externalurls;
  href: string;
  id: string;
  type: string;
  uri: string;
}

interface Owner {
  display_name: string;
  external_urls: Externalurls;
  href: string;
  id: string;
  type: string;
  uri: string;
}

interface Image {
  height: number | null;
  url: string;
  width: number | null;
}

interface Followers {
  href: null;
  total: number;
}

interface Externalurls {
  spotify: string;
}

/**
 * Adaptador: Transforma datos de API de Spotify al formato del componente
 */
function adaptSpotifyPlaylistToLocal(
  spotifyPlaylist: SpotifyPlaylist,
): Playlist {
  // Obtener imagen de mayor calidad disponible
  const cover =
    spotifyPlaylist.images[0]?.url ||
    "https://via.placeholder.com/300x300?text=No+Cover";

  // Obtener un color aleatorio del conjunto
  const colorKeys = Object.keys(colors) as Array<keyof typeof colors>;
  const randomColor =
    colors[colorKeys[Math.floor(Math.random() * colorKeys.length)]];

  return {
    id: spotifyPlaylist.id,
    albumId: parseInt(spotifyPlaylist.id.slice(-4), 36), // Generar un albumId único
    title: spotifyPlaylist.name,
    color: randomColor,
    cover: cover,
    artists: [spotifyPlaylist.owner.display_name],
    local: false, // Playlists de Spotify no son locales
  };
}

/**
 * Obtener las playlists del usuario desde el backend (ya adaptadas)
 */
export async function getUserPlaylists(): Promise<{
  success: boolean;
  data: Playlist[];
  message?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/spotify/playlists`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiData: ApiResponse<SpotifyPlaylist[]> = await response.json();

    // Adaptar playlists al formato del componente
    if (apiData.success && apiData.data) {
      const adaptedPlaylists = apiData.data.map(adaptSpotifyPlaylistToLocal);
      return {
        success: true,
        data: adaptedPlaylists,
        message: apiData.message,
      };
    }

    return {
      success: false,
      data: [],
      message: "No se encontraron playlists",
    };
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
      data: [],
    };
  }
}

/**
 * Obtener detalles de una playlist específica (con paginación completa)
 */
export async function getPlaylistDetails(
  id: string | null | undefined,
): Promise<{ songs: Song[]; playlist: Playlist }> {
  if (!id) {
    console.error("Playlist ID is required");
    return { songs: [], playlist: {} as Playlist };
  }
  try {
    // Primera petición sin limit/offset para obtener el total
    const response = await fetch(`${API_URL}/spotify/playlists/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<PlaylistDetails> = await response.json();

    // Recolectar todas las canciones
    let allItems = [...data.data.tracks.items];
    const totalTracks = data.data.tracks.total;
    const limit = 100; // Spotify máximo es 100

    console.log(
      `📀 Primera página: ${allItems.length}/${totalTracks} canciones`,
    );

    // Seguir obteniendo páginas mientras haya más canciones
    // Agregar límite de seguridad para evitar bucles infinitos
    let offset = allItems.length;
    let maxIterations = Math.ceil(totalTracks / limit) + 5; // +5 como margen de seguridad
    let iterations = 0;

    while (offset < totalTracks && iterations < maxIterations) {
      iterations++;
      console.log(
        `📥 Cargando más canciones... (${offset}/${totalTracks}) - Iteración ${iterations}`,
      );

      const nextResponse = await fetch(
        `${API_URL}/spotify/playlists/${id}?limit=${limit}&offset=${offset}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!nextResponse.ok) {
        console.error(
          `Error cargando página siguiente: ${nextResponse.status}`,
        );
        break;
      }

      const nextData: ApiResponse<PlaylistDetails> = await nextResponse.json();
      const newItems = nextData.data.tracks.items;

      // Si no hay más items, salir del bucle
      if (!newItems || newItems.length === 0) {
        console.log(`⚠️ No hay más canciones disponibles en offset ${offset}`);
        break;
      }

      allItems = [...allItems, ...newItems];
      offset = allItems.length;

      console.log(
        `📊 Progreso: ${allItems.length}/${totalTracks} canciones cargadas`,
      );
    }

    if (iterations >= maxIterations) {
      console.warn(
        `⚠️ Se alcanzó el límite máximo de iteraciones (${maxIterations})`,
      );
    }

    console.log(
      `✅ Total canciones cargadas: ${allItems.length} de ${totalTracks}`,
    );

    return {
      songs: allItems.map((item, index) => ({
        id: index + 1, // Generate sequential numeric IDs
        albumId: parseInt(item.track.album.id.slice(-4), 36) || index + 1,
        title: item.track.name,
        artists: item.track.artists.map((artist) => artist.name),
        album: item.track.album.name,
        image: item.track.album.images[0]?.url || "",
        duration: `${Math.floor(item.track.duration_ms / 60000)}:${String(Math.floor((item.track.duration_ms % 60000) / 1000)).padStart(2, "0")}`, // Convert ms to "mm:ss" format
        uri: item.track.uri, // Spotify URI for creating playlists
      })),
      playlist: adaptSpotifyPlaylistToLocal(data.data),
    };
  } catch (error) {
    console.error("Error fetching playlist details:", error);
    return { songs: [], playlist: {} as Playlist };
  }
}
