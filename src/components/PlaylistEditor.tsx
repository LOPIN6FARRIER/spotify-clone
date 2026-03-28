import { useState, useEffect } from "react";
import type { Song } from "../api/playlists/playlist.service";
import {
  removeSongFromPlaylist,
  reorderPlaylistSongs,
} from "../api/playlists/playlist.service";
import { PlaylistDetailsEditor } from "./PlaylistDetailsEditor";
import { AddSongsFromPlaylist } from "./AddSongsFromPlaylist";

interface PlaylistEditorProps {
  playlistId: string;
  initialSongs: Song[];
  initialName?: string;
  initialDescription?: string;
  initialImage?: string;
  accessToken: string;
  onUpdate?: () => void;
}

export function PlaylistEditor({
  playlistId,
  initialSongs,
  initialName = "",
  initialDescription = "",
  initialImage,
  accessToken,
  onUpdate,
}: PlaylistEditorProps) {
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [songsBeforeDrag, setSongsBeforeDrag] = useState<Song[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsEditor, setShowDetailsEditor] = useState(false);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [isMovingMode, setIsMovingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDeletePlaylist = async () => {
    if (
      !confirm(
        "⚠️ ¿Estás seguro de eliminar esta playlist?\n\nEsto la removerá de tu biblioteca de Spotify.",
      )
    ) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/spotify/playlists/${playlistId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
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
        alert("✅ Playlist eliminada de tu biblioteca exitosamente!");
        // Redirigir al home
        window.location.href = "/";
      } else {
        throw new Error(result.message || "Error al eliminar playlist");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar playlist",
      );
    }
  };

  useEffect(() => {
    setSongs(initialSongs);
  }, [initialSongs]);

  // Filtrar canciones basado en la búsqueda
  const filteredSongs = songs.filter((song) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(query) ||
      song.artists.some((artist) => artist.toLowerCase().includes(query))
    );
  });

  const toggleSelection = (songId: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === songs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(songs.map((s) => s.id)));
    }
  };

  const selectFilteredSongs = () => {
    const filteredIds = filteredSongs.map((s) => s.id);
    setSelectedIds(new Set(filteredIds));
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) return;

    // Obtener URIs de las canciones seleccionadas
    const songsToRemove = songs.filter((s) => selectedIds.has(s.id));
    const songsWithoutUri = songsToRemove.filter((s) => !s.uri);

    if (songsWithoutUri.length > 0) {
      setError(
        `No se pueden eliminar ${songsWithoutUri.length} canción(es) porque no tienen URI de Spotify`,
      );
      return;
    }

    if (!confirm(`¿Eliminar ${selectedIds.size} canción(es) de la playlist?`))
      return;

    setError(null);

    try {
      // Eliminar todas las canciones seleccionadas
      await Promise.all(
        songsToRemove.map((song) =>
          removeSongFromPlaylist(playlistId, song.uri!, accessToken),
        ),
      );

      setSongs(songs.filter((s) => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const handleCreatePlaylistFromSelected = async () => {
    if (selectedIds.size === 0) return;

    const selectedSongs = songs.filter((s) => selectedIds.has(s.id));
    const playlistName = prompt(
      `Nombre para la nueva playlist (${selectedIds.size} canciones):`,
    );

    if (!playlistName || !playlistName.trim()) return;

    const playlistDescription =
      prompt("Descripción (opcional):") || "Creada desde Spotify Clone";

    setError(null);

    try {
      // Obtener URIs de Spotify de las canciones seleccionadas
      const trackUris = selectedSongs
        .filter((song) => song.uri) // Solo canciones con URI de Spotify
        .map((song) => song.uri!);

      if (trackUris.length === 0) {
        throw new Error("Las canciones seleccionadas no tienen URI de Spotify");
      }

      if (trackUris.length < selectedIds.size) {
        const diff = selectedIds.size - trackUris.length;
        if (
          !confirm(
            `${diff} canción(es) no son de Spotify y no se incluirán. ¿Continuar?`,
          )
        ) {
          return;
        }
      }

      // Llamar a la API para crear la playlist
      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/spotify/playlists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: playlistName.trim(),
            description: playlistDescription,
            isPublic: true,
            trackUris: trackUris,
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
        alert(
          `✅ Playlist "${playlistName}" creada exitosamente con ${trackUris.length} canciones!`,
        );
        setSelectedIds(new Set());
        // Opcional: Redirigir a home para ver la nueva playlist
        // window.location.href = '/';
      } else {
        throw new Error(result.message || "Error al crear playlist");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear playlist");
    }
  };

  const handleDragStart = (index: number) => {
    // Guardar el orden actual antes de empezar a arrastrar
    setSongsBeforeDrag([...songs]);

    const song = songs[index];
    console.log("🎯 Drag START - Index:", index, "Song:", song.title);

    // Si la canción arrastrada está en la selección, arrastrar todas las seleccionadas
    if (selectedIds.has(song.id) && selectedIds.size > 1) {
      console.log("📦 Arrastrando múltiples:", selectedIds.size, "canciones");
      // Arrastrar múltiples canciones
      setDraggedIndex(index);
    } else {
      console.log("📄 Arrastrando una sola canción");
      // Arrastrar solo una canción
      setDraggedIndex(index);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    const draggedSong = songs[draggedIndex];
    const isDraggingMultiple =
      selectedIds.has(draggedSong.id) && selectedIds.size > 1;

    console.log("⬆️ Drag OVER - De:", draggedIndex, "→ A:", index);

    if (isDraggingMultiple) {
      // Arrastrar múltiples canciones seleccionadas
      const selectedSongs = songs.filter((s) => selectedIds.has(s.id));
      const unselectedSongs = songs.filter((s) => !selectedIds.has(s.id));

      // Calcular el índice real en las canciones no seleccionadas
      let targetIndex = 0;
      for (let i = 0; i < index; i++) {
        if (!selectedIds.has(songs[i].id)) {
          targetIndex++;
        }
      }

      // Insertar las seleccionadas en la nueva posición
      const newSongs = [...unselectedSongs];
      newSongs.splice(targetIndex, 0, ...selectedSongs);

      setSongs(newSongs);
      setDraggedIndex(index);
    } else {
      // Arrastrar una sola canción
      const newSongs = [...songs];
      const draggedSong = newSongs[draggedIndex];

      // Remover de la posición original
      newSongs.splice(draggedIndex, 1);
      // Insertar en la nueva posición
      newSongs.splice(index, 0, draggedSong);

      setSongs(newSongs);
      setDraggedIndex(index);
    }
  };

  const handleMoveSelectedTo = async (targetIndex: number) => {
    if (selectedIds.size === 0 || !isMovingMode) return;

    // Obtener canciones seleccionadas y no seleccionadas
    const selectedSongs = songs.filter((s) => selectedIds.has(s.id));
    const unselectedSongs = songs.filter((s) => !selectedIds.has(s.id));

    // Insertar las seleccionadas en la posición objetivo
    const newSongs = [...unselectedSongs];
    newSongs.splice(targetIndex, 0, ...selectedSongs);

    setSongs(newSongs);
    setIsReordering(true);
    setError(null);

    try {
      // Reordenar usando URIs de Spotify
      const uris = newSongs.filter((s) => s.uri).map((s) => s.uri!);

      if (uris.length === 0) {
        throw new Error("No hay URIs de Spotify disponibles para reordenar");
      }

      const response = await fetch(
        `${import.meta.env.PUBLIC_API_URL}/spotify/playlists/${playlistId}/tracks`,
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

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      onUpdate?.();
      setSelectedIds(new Set());
      setIsMovingMode(false);
      alert(`✅ ${selectedSongs.length} canción(es) movida(s) exitosamente!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al mover canciones");
      // Revertir cambios
      setSongs(initialSongs);
      setIsMovingMode(false);
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragEnd = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null) return;

    console.log("🏁 Drag END");
    setDraggedIndex(null);

    // Verificar si realmente cambió el orden
    const orderChanged = songs.some((song, index) => {
      return songsBeforeDrag[index]?.id !== song.id;
    });

    console.log("🔍 Orden cambió?", orderChanged);

    // Si no hubo cambios, no hacer nada
    if (!orderChanged || songsBeforeDrag.length === 0) {
      console.log("⏭️ Sin cambios, omitiendo petición");
      setSongsBeforeDrag([]);
      return;
    }

    setIsReordering(true);
    setError(null);

    try {
      // Enviar el nuevo orden usando URIs de Spotify
      const uris = songs
        .filter((song) => song.uri) // Solo canciones con URI de Spotify
        .map((song) => song.uri!);

      if (uris.length === 0) {
        throw new Error("No hay canciones con URI de Spotify para reordenar");
      }

      console.log("🔄 Enviando petición de reorden con", uris.length, "URIs");
      console.log("📋 URIs:", uris);

      await reorderPlaylistSongs(playlistId, uris, accessToken);

      console.log("✅ Reorden exitoso!");
      onUpdate?.();
    } catch (err) {
      console.log("❌ Error al reordenar:", err);
      setError(err instanceof Error ? err.message : "Error al reordenar");
      // Revertir cambios
      setSongs(songsBeforeDrag);
    } finally {
      setSongsBeforeDrag([]);
      setIsReordering(false);
    }
  };

  const handleRemoveSong = async (songId: number) => {
    const song = songs.find((s) => s.id === songId);

    if (!song?.uri) {
      setError(
        "No se puede eliminar esta canción porque no tiene URI de Spotify",
      );
      return;
    }

    if (!confirm("¿Eliminar esta canción de la playlist?")) return;

    setError(null);

    try {
      console.log("🗑️ Eliminando canción...");
      console.log("📋 PlaylistId:", playlistId);
      console.log("🎵 Song URI:", song.uri);
      console.log("🔑 Access Token:", accessToken ? "Present" : "Missing");
      
      await removeSongFromPlaylist(playlistId, song.uri, accessToken);
      
      console.log("✅ Canción eliminada exitosamente");
      setSongs(songs.filter((s) => s.id !== songId));
      onUpdate?.();
    } catch (err) {
      console.error("❌ Error al eliminar:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  return (
    <div className="playlist-editor">
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="editor-header">
        <div>
          <h3>
            Editar Playlist
            {isReordering && <span className="loading-spinner">⟳</span>}
          </h3>
          <p className="hint">
            Arrastra las canciones para reordenar o selecciónalas para acciones
            grupales
          </p>
        </div>

        <div className="editor-actions">
          <button
            onClick={() => setShowDetailsEditor(true)}
            className="btn-edit-details"
            title="Editar detalles de la playlist"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
            Editar Detalles
          </button>

          <button
            onClick={() => setShowAddSongs(true)}
            className="btn-add-songs"
            title="Agregar canciones desde otra playlist"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Agregar Canciones
          </button>

          <button
            onClick={handleDeletePlaylist}
            className="btn-delete-playlist"
            title="Eliminar playlist de tu biblioteca"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
            Eliminar Playlist
          </button>
        </div>
      </div>

      {/* Barra de acciones cuando hay selección */}
      {selectedIds.size > 0 && (
        <div className="selection-bar">
          <div className="selection-info">
            <span>{selectedIds.size} canción(es) seleccionada(s)</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn-clear"
            >
              Limpiar selección
            </button>
          </div>
          <div className="selection-actions">
            <button onClick={handleRemoveSelected} className="btn-delete">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
              Eliminar seleccionadas
            </button>
            <button
              onClick={handleCreatePlaylistFromSelected}
              className="btn-create"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Crear playlist
            </button>
            <button
              onClick={() => setIsMovingMode(!isMovingMode)}
              className={`btn-move ${isMovingMode ? "active" : ""}`}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M12 2L8 6h3v4H7V7L3 11l4 4v-3h4v4H8l4 4 4-4h-3v-4h4v3l4-4-4-4v3h-4V6h3z" />
              </svg>
              {isMovingMode ? "Cancelar mover" : "Mover a..."}
            </button>
          </div>
        </div>
      )}

      {/* Buscador local de canciones */}
      <div className="search-local-container">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
          className="search-icon"
        >
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar en esta playlist... (ej: peso pluma)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-local-input"
        />
        {searchQuery && (
          <>
            <button
              onClick={() => setSearchQuery("")}
              className="btn-clear-search"
            >
              ✕
            </button>
            {filteredSongs.length > 0 &&
              filteredSongs.length < songs.length && (
                <button
                  onClick={selectFilteredSongs}
                  className="btn-select-filtered"
                >
                  Seleccionar {filteredSongs.length} encontrada(s)
                </button>
              )}
          </>
        )}
      </div>

      {/* Control de selección global */}
      <div className="songs-header">
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={
              selectedIds.size === filteredSongs.length &&
              filteredSongs.length > 0
            }
            onChange={() => {
              if (selectedIds.size === filteredSongs.length) {
                setSelectedIds(new Set());
              } else {
                setSelectedIds(new Set(filteredSongs.map((s) => s.id)));
              }
            }}
          />
          <span className="checkmark"></span>
          <span className="label-text">
            Seleccionar todas ({filteredSongs.length}
            {searchQuery ? ` de ${songs.length}` : ""})
          </span>
        </label>
        {selectedIds.size > 1 && (
          <p className="drag-hint-header">
            💡 Arrastra cualquiera de las {selectedIds.size} seleccionadas para
            moverlas todas juntas
          </p>
        )}
      </div>

      <div className="songs-list">
        {isMovingMode && selectedIds.size > 0 && (
          <div className="move-hint">
            👆 Haz clic en una canción para mover ahí las {selectedIds.size}{" "}
            seleccionada(s)
          </div>
        )}
        {filteredSongs.length === 0 && searchQuery.trim() ? (
          <div className="no-results">
            <p>No se encontraron canciones con "{searchQuery}"</p>
          </div>
        ) : (
          filteredSongs.map((song) => {
            const index = songs.indexOf(song);
            return (
              <div
                key={`${song.id}-${index}`}
                draggable={!isMovingMode}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => {
                  e.preventDefault();
                  console.log("📍 Drop event triggered");
                  handleDragEnd(e);
                }}
                onClick={() => isMovingMode && handleMoveSelectedTo(index)}
                className={`song-item ${
                  draggedIndex === index ? "dragging" : ""
                } ${selectedIds.has(song.id) ? "selected" : ""} ${
                  isMovingMode && selectedIds.size > 0 ? "move-target" : ""
                }`}
              >
                <label
                  className="checkbox-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(song.id)}
                    onChange={() => toggleSelection(song.id)}
                  />
                  <span className="checkmark"></span>
                </label>

                <div className="drag-handle">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="currentColor"
                  >
                    <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
                  </svg>
                  {selectedIds.has(song.id) && selectedIds.size > 1 && (
                    <span className="drag-counter">{selectedIds.size}</span>
                  )}
                </div>

                <div className="song-info">
                  <img
                    src={song.image}
                    alt={song.title}
                    className="song-image"
                  />
                  <div className="song-details">
                    <p className="song-title">{song.title}</p>
                    <p className="song-artists">{song.artists.join(", ")}</p>
                  </div>
                </div>

                <div className="song-meta">
                  <span className="song-duration">{song.duration}</span>
                  <button
                    onClick={() => handleRemoveSong(song.id)}
                    className="btn-remove"
                    title="Eliminar canción"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modales */}
      {showDetailsEditor && (
        <PlaylistDetailsEditor
          playlistId={playlistId}
          initialName={initialName}
          initialDescription={initialDescription}
          initialImage={initialImage}
          accessToken={accessToken}
          onClose={() => setShowDetailsEditor(false)}
          onUpdate={() => {
            setShowDetailsEditor(false);
            onUpdate?.();
          }}
        />
      )}

      {showAddSongs && (
        <AddSongsFromPlaylist
          targetPlaylistId={playlistId}
          accessToken={accessToken}
          onClose={() => setShowAddSongs(false)}
          onUpdate={() => {
            setShowAddSongs(false);
            onUpdate?.();
          }}
        />
      )}
    </div>
  );
}
