import { useEffect } from "react";
import { usePlaylistStore } from "../store/playlistStore";
import { getUserPlaylists } from "../api/spotify/playlist";

export function PlaylistProvider({ localPlaylists, localSongs }) {
  const {
    setPlaylists,
    setSongs,
    setLoading,
    setError,
    shouldRefetch,
    markAsFetched,
    playlists,
  } = usePlaylistStore();

  useEffect(() => {
    async function fetchPlaylists() {
      console.log("🔄 PlaylistProvider: Iniciando...");
      console.log("📦 Playlists locales:", localPlaylists.length);
      console.log("📦 Playlists en store (desde cache):", playlists.length);

      // Si el store tiene playlists de Spotify (más que las locales), usar el cache
      const hasSpotifyInCache = playlists.length > localPlaylists.length;

      if (hasSpotifyInCache) {
        console.log("✅ Usando playlists del cache:", playlists.length);
        // No hacer nada, ya están en el store desde el persist
        if (!shouldRefetch()) {
          console.log("⏭️ Cache válido, no se necesita fetch");
          return;
        }
        console.log("🔄 Cache expirado, refetching...");
      } else {
        // Si no hay cache, inicializar con locales mientras se hace fetch
        console.log("📝 No hay cache, iniciando con playlists locales");
        setPlaylists(localPlaylists);
        setSongs(localSongs);
      }

      console.log("🌐 Fetching playlists de Spotify...");
      setLoading(true);
      setError(null);

      try {
        const result = await getUserPlaylists();

        console.log("✅ Resultado de API:", result);

        if (result.success && result.data && result.data.length > 0) {
          const allPlaylists = [...localPlaylists, ...result.data];
          console.log(
            "✅ Total de playlists:",
            allPlaylists.length,
            "(",
            localPlaylists.length,
            "locales +",
            result.data.length,
            "Spotify)",
          );
          setPlaylists(allPlaylists);
          setSongs(localSongs);
          markAsFetched();
        } else {
          console.warn(
            "⚠️ No se obtuvieron playlists de Spotify:",
            result.message,
          );
        }
      } catch (error) {
        console.error("❌ Error fetching playlists:", error);
        setError(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    fetchPlaylists();
  }, [localPlaylists, localSongs]);

  return null;
}
