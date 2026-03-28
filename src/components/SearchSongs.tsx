import { useState, useEffect } from "react";

interface SearchSongsProps {
  playlistId: string;
  accessToken: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
}

export function SearchSongs({
  playlistId,
  accessToken,
  onClose,
  onUpdate,
}: SearchSongsProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [selectedUris, setSelectedUris] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insertPosition, setInsertPosition] = useState<"end" | "start">("end");

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        type: "track",
        limit: "20",
      });

      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/spotify/search?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data.tracks) {
        setResults(data.data.tracks.items || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Error searching:", err);
      setError(err instanceof Error ? err.message : "Error al buscar");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelection = (uri: string) => {
    const newSelected = new Set(selectedUris);
    if (newSelected.has(uri)) {
      newSelected.delete(uri);
    } else {
      newSelected.add(uri);
    }
    setSelectedUris(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUris.size === results.length) {
      setSelectedUris(new Set());
    } else {
      setSelectedUris(new Set(results.map((track) => track.uri)));
    }
  };

  const handleAddSelected = async () => {
    if (selectedUris.size === 0) return;

    setIsAdding(true);
    setError(null);

    try {
      const body: any = {
        uris: Array.from(selectedUris),
      };

      // Si se selecciona "Al inicio", agregar position: 0
      if (insertPosition === "start") {
        body.position = 0;
      }

      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/spotify/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify(body),
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
        const positionText =
          insertPosition === "start" ? "al inicio" : "al final";
        alert(
          `✅ ${selectedUris.size} canción(es) agregada(s) ${positionText} exitosamente!`,
        );
        setSelectedUris(new Set());
        onUpdate();
        onClose();
      } else {
        throw new Error(result.message || "Error al agregar canciones");
      }
    } catch (err) {
      console.error("Error adding songs:", err);
      setError(err instanceof Error ? err.message : "Error al agregar");
    } finally {
      setIsAdding(false);
    }
  };

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Buscar Canciones</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar canciones... (ej: Peso Pluma)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
          {isSearching && <div className="loading-spinner">⟳</div>}
        </div>

        {results.length > 0 && (
          <>
            <div className="results-header">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={
                    selectedUris.size === results.length && results.length > 0
                  }
                  onChange={toggleSelectAll}
                />
                <span className="checkmark"></span>
                <span className="label-text">
                  Seleccionar todas ({results.length})
                </span>
              </label>
              {selectedUris.size > 0 && (
                <div className="add-controls">
                  <div className="position-selector">
                    <button
                      onClick={() => setInsertPosition("start")}
                      className={`btn-position ${insertPosition === "start" ? "active" : ""}`}
                      title="Insertar al inicio de la playlist"
                    >
                      ⬆️ Al inicio
                    </button>
                    <button
                      onClick={() => setInsertPosition("end")}
                      className={`btn-position ${insertPosition === "end" ? "active" : ""}`}
                      title="Insertar al final de la playlist"
                    >
                      ⬇️ Al final
                    </button>
                  </div>
                  <button
                    onClick={handleAddSelected}
                    disabled={isAdding}
                    className="btn-add-selected"
                  >
                    {isAdding ? "Agregando..." : `Agregar ${selectedUris.size}`}
                  </button>
                </div>
              )}
            </div>

            <div className="results-list">
              {results.map((track) => (
                <div
                  key={track.id}
                  className={`result-item ${selectedUris.has(track.uri) ? "selected" : ""}`}
                  onClick={() => toggleSelection(track.uri)}
                >
                  <label
                    className="checkbox-container"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUris.has(track.uri)}
                      onChange={() => toggleSelection(track.uri)}
                    />
                    <span className="checkmark"></span>
                  </label>

                  <img
                    src={track.album.images[0]?.url || "/placeholder.png"}
                    alt={track.name}
                    className="track-image"
                  />

                  <div className="track-info">
                    <p className="track-title">{track.name}</p>
                    <p className="track-artists">
                      {track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>

                  <span className="track-duration">
                    {formatDuration(track.duration_ms)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {!isSearching && query.trim() && results.length === 0 && (
          <div className="no-results">
            <p>No se encontraron resultados para "{query}"</p>
          </div>
        )}

        {!query.trim() && (
          <div className="no-results">
            <p>Escribe algo para buscar canciones</p>
          </div>
        )}
      </div>

      <style>{`
        .search-container {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          border: 1px solid #333;
          border-radius: 8px;
          background: #121212;
          color: #fff;
          outline: none;
        }

        .search-input:focus {
          border-color: #1db954;
        }

        .search-container .loading-spinner {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          animation: spin 1s linear infinite;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #333;
          margin-bottom: 1rem;
        }

        .add-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .position-selector {
          display: flex;
          gap: 0.5rem;
          background: #181818;
          padding: 4px;
          border-radius: 20px;
        }

        .btn-position {
          padding: 0.4rem 1rem;
          background: transparent;
          color: #b3b3b3;
          border: none;
          border-radius: 16px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-position:hover {
          color: #fff;
        }

        .btn-position.active {
          background: #1db954;
          color: #000;
        }

        .btn-add-selected {
          padding: 0.5rem 1.5rem;
          background: #1db954;
          color: white;
          border: none;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-selected:hover:not(:disabled) {
          background: #1ed760;
          transform: scale(1.05);
        }

        .btn-add-selected:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .results-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .result-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .result-item.selected {
          background: rgba(29, 185, 84, 0.2);
        }

        .track-image {
          width: 48px;
          height: 48px;
          border-radius: 4px;
          object-fit: cover;
        }

        .track-info {
          flex: 1;
          min-width: 0;
        }

        .track-title {
          font-weight: 600;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-artists {
          font-size: 0.875rem;
          color: #b3b3b3;
          margin: 0.25rem 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-duration {
          font-size: 0.875rem;
          color: #b3b3b3;
        }

        .no-results {
          text-align: center;
          padding: 3rem 1rem;
          color: #b3b3b3;
        }

        @keyframes spin {
          from {
            transform: translateY(-50%) rotate(0deg);
          }
          to {
            transform: translateY(-50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
