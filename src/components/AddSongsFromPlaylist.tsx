import { useState, useEffect } from "react";

interface Playlist {
  id: string;
  name: string;
  description?: string;
  images: { url: string }[];
  tracks: { total: number };
}

interface Track {
  uri: string;
  name: string;
  artists: string[];
  album: string;
  duration_ms: number;
}

interface AddSongsFromPlaylistProps {
  targetPlaylistId: string;
  accessToken: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function AddSongsFromPlaylist({
  targetPlaylistId,
  accessToken,
  onClose,
  onUpdate,
}: AddSongsFromPlaylistProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null,
  );
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar playlists del usuario
  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/spotify/playlists`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) throw new Error("Error al cargar playlists");

      const data = await response.json();

      // Filtrar la playlist actual
      const filteredPlaylists = data.data.filter(
        (p: Playlist) => p.id !== targetPlaylistId,
      );

      setPlaylists(filteredPlaylists);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar playlists",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadTracksFromPlaylist = async (playlistId: string) => {
    try {
      setIsLoadingTracks(true);
      setError(null);

      // Obtener todos los tracks usando paginación
      let allItems: any[] = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;
      let totalTracksExpected = 0;

      // Límite de seguridad para evitar bucles infinitos
      let maxIterations = 200; // Soporta hasta 20,000 canciones
      let iterations = 0;

      while (hasMore && iterations < maxIterations) {
        iterations++;
        const response = await fetch(
          `${import.meta.env.PUBLIC_API_URL}/spotify/playlists/${playlistId}?limit=${limit}&offset=${offset}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) throw new Error("Error al cargar canciones");

        const data = await response.json();
        const playlistData = data.data;

        // Guardar el total esperado en la primera iteración
        if (iterations === 1 && playlistData.tracks?.total) {
          totalTracksExpected = playlistData.tracks.total;
          console.log(
            `📀 Total de canciones en playlist: ${totalTracksExpected}`,
          );
        }

        if (
          playlistData.tracks?.items &&
          playlistData.tracks.items.length > 0
        ) {
          allItems = [...allItems, ...playlistData.tracks.items];
          offset += limit;

          console.log(
            `📥 Cargadas ${allItems.length}/${totalTracksExpected} canciones`,
          );

          // Si recibimos menos canciones que el límite, no hay más
          if (playlistData.tracks.items.length < limit) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      if (iterations >= maxIterations) {
        console.warn(
          `⚠️ Se alcanzó el límite de iteraciones. Canciones cargadas: ${allItems.length}`,
        );
      }

      console.log(`✅ Total canciones cargadas: ${allItems.length}`);

      // Transformar los items al formato esperado por el componente
      const transformedTracks: Track[] = allItems
        .filter((item) => item.track && !item.track.is_local) // Filtrar tracks locales
        .map((item) => ({
          uri: item.track.uri,
          name: item.track.name,
          artists: item.track.artists.map((a: any) => a.name),
          album: item.track.album.name,
          duration_ms: item.track.duration_ms,
        }));

      setTracks(transformedTracks);
      setSelectedTracks(new Set());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar canciones",
      );
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handlePlaylistSelect = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    loadTracksFromPlaylist(playlistId);
  };

  const toggleTrackSelection = (uri: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(uri)) {
      newSelected.delete(uri);
    } else {
      newSelected.add(uri);
    }
    setSelectedTracks(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTracks.size === tracks.length) {
      setSelectedTracks(new Set());
    } else {
      setSelectedTracks(new Set(tracks.map((t) => t.uri)));
    }
  };

  const handleAddTracks = async () => {
    if (selectedTracks.size === 0) return;

    if (!confirm(`¿Agregar ${selectedTracks.size} canción(es) a la playlist?`))
      return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/spotify/playlists/${targetPlaylistId}/tracks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify({
            uris: Array.from(selectedTracks),
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Error ${response.status}: ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${selectedTracks.size} canción(es) agregadas exitosamente!`);
        onUpdate();
        onClose();
      } else {
        throw new Error(result.message || "Error al agregar canciones");
      }
    } catch (err) {
      console.error("Error adding tracks:", err);
      setError(
        err instanceof Error ? err.message : "Error al agregar canciones",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Agregar Canciones desde otra Playlist</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {isLoading ? (
            <div className="loading">Cargando playlists...</div>
          ) : (
            <>
              <div className="section">
                <h3>Selecciona una Playlist</h3>
                <div className="playlists-grid">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className={`playlist-card ${
                        selectedPlaylistId === playlist.id ? "selected" : ""
                      }`}
                      onClick={() => handlePlaylistSelect(playlist.id)}
                    >
                      <img
                        src={
                          playlist.images[0]?.url || "/placeholder-playlist.png"
                        }
                        alt={playlist.name}
                      />
                      <div className="playlist-card-info">
                        <h4>{playlist.name}</h4>
                        <p>{playlist.tracks.total} canciones</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPlaylistId && (
                <div className="section">
                  <div className="section-header">
                    <h3>Canciones</h3>
                    {tracks.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="btn-text"
                      >
                        {selectedTracks.size === tracks.length
                          ? "Deseleccionar todo"
                          : "Seleccionar todo"}
                      </button>
                    )}
                  </div>

                  {isLoadingTracks ? (
                    <div className="loading">Cargando canciones...</div>
                  ) : tracks.length === 0 ? (
                    <div className="empty-state">
                      Esta playlist no tiene canciones
                    </div>
                  ) : (
                    <div className="tracks-list">
                      {tracks.map((track) => (
                        <div
                          key={track.uri}
                          className={`track-item ${
                            selectedTracks.has(track.uri) ? "selected" : ""
                          }`}
                          onClick={() => toggleTrackSelection(track.uri)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTracks.has(track.uri)}
                            onChange={() => {}}
                          />
                          <div className="track-info">
                            <div className="track-name">{track.name}</div>
                            <div className="track-artists">
                              {track.artists.join(", ")}
                            </div>
                          </div>
                          <div className="track-duration">
                            {formatDuration(track.duration_ms)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {selectedTracks.size > 0 && (
          <div className="modal-footer">
            <div className="selection-info">
              {selectedTracks.size} canción(es) seleccionada(s)
            </div>
            <button
              type="button"
              onClick={handleAddTracks}
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Agregando..."
                : `Agregar ${selectedTracks.size} canción(es)`}
            </button>
          </div>
        )}

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal-content.large {
            background: #1a1a1a;
            border-radius: 12px;
            max-width: 900px;
            width: 100%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #333;
          }

          .modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
            color: #fff;
          }

          .close-button {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #999;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
          }

          .close-button:hover {
            background: #333;
            color: #fff;
          }

          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
          }

          .section {
            margin-bottom: 30px;
          }

          .section h3 {
            margin: 0 0 16px 0;
            color: #fff;
            font-size: 1.2rem;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .btn-text {
            background: none;
            border: none;
            color: #1db954;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 600;
            padding: 4px 8px;
          }

          .btn-text:hover {
            text-decoration: underline;
          }

          .playlists-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
          }

          .playlist-card {
            background: #282828;
            border-radius: 8px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid transparent;
          }

          .playlist-card:hover {
            background: #333;
          }

          .playlist-card.selected {
            border-color: #1db954;
            background: #2b3621;
          }

          .playlist-card img {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            border-radius: 4px;
            margin-bottom: 12px;
          }

          .playlist-card-info h4 {
            margin: 0 0 4px 0;
            font-size: 1rem;
            color: #fff;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .playlist-card-info p {
            margin: 0;
            font-size: 0.85rem;
            color: #999;
          }

          .tracks-list {
            background: #282828;
            border-radius: 8px;
            max-height: 400px;
            overflow-y: auto;
          }

          .track-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            cursor: pointer;
            transition: background 0.2s;
            border-bottom: 1px solid #333;
          }

          .track-item:last-child {
            border-bottom: none;
          }

          .track-item:hover {
            background: #333;
          }

          .track-item.selected {
            background: #2b3621;
          }

          .track-item input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #1db954;
          }

          .track-info {
            flex: 1;
            min-width: 0;
          }

          .track-name {
            color: #fff;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-bottom: 4px;
          }

          .track-artists {
            color: #999;
            font-size: 0.85rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .track-duration {
            color: #999;
            font-size: 0.9rem;
          }

          .modal-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-top: 1px solid #333;
            background: #1a1a1a;
          }

          .selection-info {
            color: #fff;
            font-weight: 500;
          }

          .btn-primary {
            background: #1db954;
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 24px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 1rem;
          }

          .btn-primary:hover:not(:disabled) {
            background: #1ed760;
            transform: scale(1.05);
          }

          .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .loading,
          .empty-state {
            text-align: center;
            padding: 40px;
            color: #999;
          }

          .error-message {
            background: #ff4444;
            color: #fff;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
        `}</style>
      </div>
    </div>
  );
}
