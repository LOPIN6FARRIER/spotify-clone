import { usePlaylistStore } from "../store/playlistStore";

export function PlaylistList() {
  const playlists = usePlaylistStore((state) => state.playlists);
  const isLoading = usePlaylistStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>Cargando playlists...</p>
      </div>
    );
  }

  return (
    <>
      {playlists.map((playlist) => (
        <li key={playlist.id}>
          <a
            href={`/playlist/${playlist.id}`}
            className="playlist-item flex relative p-2 overflow-hidden items-center gap-5 rounded-md hover:bg-zinc-800"
          >
            <picture className="h-12 w-12 flex-none">
              <img
                src={playlist.cover}
                alt={`Cover of ${playlist.title}`}
                className="object-cover w-full h-full rounded-md"
              />
            </picture>
            <div className="flex flex-auto flex-col truncate">
              <h4 className="text-white text-sm">{playlist.title}</h4>
              <span className="text-xs text-gray-400">
                {playlist.artists.join(", ")}
              </span>
            </div>
          </a>
        </li>
      ))}
    </>
  );
}
