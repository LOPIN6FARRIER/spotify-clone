import { useState, useMemo } from "react";
import { usePlaylistStore } from "../store/playlistStore";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const playlists = usePlaylistStore((state) => state.playlists);
  const songs = usePlaylistStore((state) => state.songs);

  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const { filteredPlaylists, filteredSongs } = useMemo(() => {
    if (!query.trim()) {
      return { filteredPlaylists: [], filteredSongs: [] };
    }

    const normalizedQuery = normalizeText(query);

    // Filtrar playlists
    const filteredPlaylists = playlists.filter((playlist) => {
      const titleMatch = normalizeText(playlist.title).includes(
        normalizedQuery,
      );
      const artistsMatch = playlist.artists.some((artist) =>
        normalizeText(artist).includes(normalizedQuery),
      );
      return titleMatch || artistsMatch;
    });

    // Filtrar canciones
    const filteredSongs = songs.filter((song) => {
      const titleMatch = normalizeText(song.title).includes(normalizedQuery);
      const artistsMatch = song.artists.some((artist) =>
        normalizeText(artist).includes(normalizedQuery),
      );
      const albumMatch = normalizeText(song.album).includes(normalizedQuery);
      return titleMatch || artistsMatch || albumMatch;
    });

    return { filteredPlaylists, filteredSongs };
  }, [query, playlists, songs]);

  const hasResults = filteredPlaylists.length > 0 || filteredSongs.length > 0;
  const showResults = query.trim() !== "";

  return (
    <div className="relative flex flex-col h-full bg-zinc-900 overflow-y-auto">
      <div className="px-6 pt-6">
        <h1 className="text-3xl font-bold text-white mb-6">Buscar</h1>

        {/* Barra de búsqueda */}
        <div className="mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿Qué quieres escuchar?"
            className="w-full max-w-md px-4 py-3 rounded-full bg-white text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white"
            autoFocus
          />
        </div>

        {/* Resultados */}
        {showResults && hasResults && (
          <div>
            {/* Playlists */}
            {filteredPlaylists.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Playlists
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredPlaylists.map((playlist) => (
                    <a
                      key={playlist.id}
                      href={`/playlist/${playlist.id}`}
                      className="bg-zinc-800/40 p-4 rounded-md hover:bg-zinc-700/40 transition-all group cursor-pointer"
                    >
                      <div className="relative mb-4">
                        <img
                          src={playlist.cover}
                          alt={playlist.title}
                          className="w-full aspect-square object-cover rounded-md shadow-lg"
                        />
                      </div>
                      <h3 className="font-semibold text-white truncate">
                        {playlist.title}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">
                        {playlist.artists.join(", ")}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Canciones */}
            {filteredSongs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Canciones
                </h2>
                <div className="space-y-2">
                  {filteredSongs.slice(0, 20).map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 p-2 rounded-md hover:bg-zinc-800/40 transition-all group cursor-pointer"
                    >
                      <img
                        src={song.image}
                        alt={song.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">
                          {song.title}
                        </h4>
                        <p className="text-sm text-gray-400 truncate">
                          {song.artists.join(", ")}
                        </p>
                      </div>
                      <div className="text-sm text-gray-400">
                        {song.duration}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje cuando no hay búsqueda */}
        {!showResults && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Escribe algo para empezar a buscar
            </p>
          </div>
        )}

        {/* Mensaje cuando no hay resultados */}
        {showResults && !hasResults && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              No se encontraron resultados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
