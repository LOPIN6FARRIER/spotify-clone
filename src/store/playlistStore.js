import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePlaylistStore = create(
  persist(
    (set, get) => ({
      playlists: [],
      songs: [],
      isLoading: false,
      error: null,
      lastFetch: null,

      // Setters
      setPlaylists: (playlists) => set({ playlists }),
      setSongs: (songs) => set({ songs }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Obtener todas las playlists (local + Spotify)
      getAllPlaylists: () => {
        return get().playlists;
      },

      // Obtener todas las canciones
      getAllSongs: () => {
        return get().songs;
      },

      // Verificar si necesita refetch (opcional: cache de 5 minutos)
      shouldRefetch: () => {
        const lastFetch = get().lastFetch;
        if (!lastFetch) return true;
        const fiveMinutes = 5 * 60 * 1000;
        return Date.now() - lastFetch > fiveMinutes;
      },

      // Marcar como fetched
      markAsFetched: () => set({ lastFetch: Date.now() }),
    }),
    {
      name: 'playlist-storage', // nombre único para localStorage
      partialize: (state) => ({
        playlists: state.playlists,
        songs: state.songs,
        lastFetch: state.lastFetch,
      }), // solo persistir estos campos
    }
  )
);
