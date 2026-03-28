import { usePlayerStore } from "@/store/playerStore";
import { useEffect, useRef, useState } from "react";
import { Slider } from "./Slider";
import { io } from "socket.io-client";

export const Pause = ({ className }) => (
  <svg
    className={className}
    role="img"
    height="16"
    width="16"
    aria-hidden="true"
    viewBox="0 0 16 16"
  >
    <path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"></path>
  </svg>
);

export const Play = ({ className }) => (
  <svg
    className={className}
    role="img"
    height="16"
    width="16"
    aria-hidden="true"
    viewBox="0 0 16 16"
  >
    <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"></path>
  </svg>
);

export const VolumeSilence = () => (
  <svg
    fill="currentColor"
    role="presentation"
    height="16"
    width="16"
    aria-hidden="true"
    aria-label="Volumen apagado"
    viewBox="0 0 16 16"
  >
    <path d="M13.86 5.47a.75.75 0 0 0-1.061 0l-1.47 1.47-1.47-1.47A.75.75 0 0 0 8.8 6.53L10.269 8l-1.47 1.47a.75.75 0 1 0 1.06 1.06l1.47-1.47 1.47 1.47a.75.75 0 0 0 1.06-1.06L12.39 8l1.47-1.47a.75.75 0 0 0 0-1.06z"></path>
    <path d="M10.116 1.5A.75.75 0 0 0 8.991.85l-6.925 4a3.642 3.642 0 0 0-1.33 4.967 3.639 3.639 0 0 0 1.33 1.332l6.925 4a.75.75 0 0 0 1.125-.649v-1.906a4.73 4.73 0 0 1-1.5-.694v1.3L2.817 9.852a2.141 2.141 0 0 1-.781-2.92c.187-.324.456-.594.78-.782l5.8-3.35v1.3c.45-.313.956-.55 1.5-.694V1.5z"></path>
  </svg>
);

export const Volume = () => (
  <svg
    fill="currentColor"
    role="presentation"
    height="16"
    width="16"
    aria-hidden="true"
    aria-label="Volumen alto"
    id="volume-icon"
    viewBox="0 0 16 16"
  >
    <path d="M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.139 2.139 0 0 0 0 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 0 1 0 4.88z"></path>
    <path d="M11.5 13.614a5.752 5.752 0 0 0 0-11.228v1.55a4.252 4.252 0 0 1 0 8.127v1.55z"></path>
  </svg>
);

const CurrentSong = ({ image, title, artists, isSpotify, countdown }) => {
  return (
    <div className="flex items-center gap-3 relative overflow-hidden min-w-[200px] max-w-[300px]">
      <picture className="w-14 h-14 min-w-[56px] bg-zinc-800 rounded-md shadow-lg overflow-hidden flex-shrink-0">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </picture>

      <div className="flex flex-col min-w-0 flex-1">
        <h3 className="font-semibold text-sm block truncate">{title}</h3>
        <span className="text-xs opacity-80 truncate">
          {artists?.join(", ")}
        </span>
        {countdown !== null ? (
          <span className="text-xs text-green-500 mt-0.5 flex items-center gap-1 font-semibold">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Volviendo a Spotify en {countdown}s
          </span>
        ) : isSpotify ? (
          <span className="text-xs text-green-500 mt-0.5 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Spotify
          </span>
        ) : null}
      </div>
    </div>
  );
};

const SongControl = ({
  audio,
  isSpotify,
  spotifyProgress,
  spotifyDuration,
}) => {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!isSpotify && audio.current) {
      audio.current.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        audio.current.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [isSpotify]);

  // Si es Spotify, usar el progreso del socket
  useEffect(() => {
    if (isSpotify && spotifyProgress !== null) {
      setCurrentTime(spotifyProgress / 1000); // Convertir ms a segundos
    }
  }, [isSpotify, spotifyProgress]);

  const handleTimeUpdate = () => {
    if (!isSpotify) {
      setCurrentTime(audio.current.currentTime);
    }
  };

  const formatTime = (time) => {
    if (time == null) return `0:00`;
    const seconds = Math.floor(time % 60);
    const minutes = Math.floor(time / 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const duration = isSpotify
    ? spotifyDuration / 1000
    : (audio?.current?.duration ?? 0);

  return (
    <div className="flex gap-x-3 text-xs pt-2">
      <span className="opacity-50 w-12 text-right">
        {formatTime(currentTime)}
      </span>

      <Slider
        value={[currentTime]}
        max={duration}
        min={0}
        className={`w-[400px] ${isSpotify ? "cursor-not-allowed opacity-70" : ""}`}
        onValueChange={(value) => {
          if (!isSpotify) {
            const [newCurrentTime] = value;
            audio.current.currentTime = newCurrentTime;
          }
        }}
        disabled={isSpotify}
      />

      <span className="opacity-50 w-12">
        {duration ? formatTime(duration) : "0:00"}
      </span>
    </div>
  );
};

const VolumeControl = () => {
  const volume = usePlayerStore((state) => state.volume);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const previousVolumeRef = useRef(volume);

  const isVolumeSilenced = volume < 0.1;

  const handleClickVolumen = () => {
    if (isVolumeSilenced) {
      setVolume(previousVolumeRef.current);
    } else {
      previousVolumeRef.current = volume;
      setVolume(0);
    }
  };

  return (
    <div className="flex justify-center gap-x-2 text-white">
      <button
        className="opacity-70 hover:opacity-100 transition"
        onClick={handleClickVolumen}
      >
        {isVolumeSilenced ? <VolumeSilence /> : <Volume />}
      </button>

      <Slider
        defaultValue={[100]}
        max={100}
        min={0}
        value={[volume * 100]}
        className="w-[95px]"
        onValueChange={(value) => {
          const [newVolume] = value;
          const volumeValue = newVolume / 100;
          setVolume(volumeValue);
        }}
      />
    </div>
  );
};

const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8888";
// Socket.io está en la raíz, no en /api
const SOCKET_URL = API_URL.replace("/api", "");

export function SpotifyPlayer() {
  const { currentMusic, isPlaying, setIsPlaying, volume } = usePlayerStore(
    (state) => state,
  );
  const audioRef = useRef();

  // Estado para Spotify socket
  const [spotifyTrack, setSpotifyTrack] = useState(null);
  const [isSpotifyMode, setIsSpotifyMode] = useState(true);
  const [spotifyIsPlaying, setSpotifyIsPlaying] = useState(false);
  const localPlayTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  // Contador visual para volver a Spotify
  const [countdown, setCountdown] = useState(null);
  const countdownIntervalRef = useRef(null);

  // Conectar al socket de Spotify
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      randomizationFactor: 0.5,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", "spotify");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Error de conexión:", error);
    });

    socket.on("joined", (message) => {
      // Socket listo
    });

    socket.on("spotify-current-track", (track) => {
      // Mappear TrackInfo a formato del player
      const mappedTrack = {
        id: track.id,
        title: track.titulo,
        artists: [track.artista],
        image: track.imagenPortada,
        album: track.album,
        progress: track.progresoMs,
        duration: track.duracionMs,
        isPlaying: track.isPlaying ?? false,
      };

      setSpotifyTrack(mappedTrack);
      setSpotifyIsPlaying(track.isPlaying ?? false);

      // Si estamos en modo Spotify, sincronizar
      if (isSpotifyMode) {
        // Already in Spotify mode
      }
    });

    socket.on("disconnect", () => {
      // Socket desconectado
    });

    return () => {
      socket.disconnect();
    };
  }, [isSpotifyMode]);

  // Cuando cambia currentMusic del store (reproducción local)
  useEffect(() => {
    const { song, playlist } = currentMusic;

    if (!song || !playlist) {
      return;
    }

    // Cambiar a modo local
    setIsSpotifyMode(false);

    const src = `/music/${playlist.id}/0${song.id}.mp3`;
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.volume = volume;

      // Timeout de 15 segundos: si no le da play, volver a Spotify
      clearTimeout(localPlayTimeoutRef.current);
      setCountdown(15);

      let secondsLeft = 15;
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        secondsLeft--;
        setCountdown(secondsLeft);
        if (secondsLeft <= 0) {
          clearInterval(countdownIntervalRef.current);
        }
      }, 1000);

      localPlayTimeoutRef.current = setTimeout(() => {
        if (!isPlaying) {
          setIsSpotifyMode(true);
          setCountdown(null);
          clearInterval(countdownIntervalRef.current);
        }
      }, 15000);
    }
  }, [currentMusic]);

  // Control de reproducción local
  useEffect(() => {
    if (!isSpotifyMode && audioRef.current && audioRef.current.src) {
      if (isPlaying) {
        audioRef.current
          .play()
          .catch((err) => console.error("Error al reproducir:", err));
        clearTimeout(localPlayTimeoutRef.current);
        clearInterval(countdownIntervalRef.current);
        setCountdown(null);
      } else {
        audioRef.current.pause();

        // Timeout de 15 segundos: si sigue pausado, volver a Spotify
        clearTimeout(localPlayTimeoutRef.current);
        setCountdown(15);

        let secondsLeft = 15;
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
          secondsLeft--;
          setCountdown(secondsLeft);
          if (secondsLeft <= 0) {
            clearInterval(countdownIntervalRef.current);
          }
        }, 1000);

        localPlayTimeoutRef.current = setTimeout(() => {
          setIsSpotifyMode(true);
          setCountdown(null);
          clearInterval(countdownIntervalRef.current);
        }, 15000);
      }
    }
  }, [isPlaying, isSpotifyMode]);

  // Control de volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleClick = () => {
    // Si está en modo Spotify puro (sin canción local cargada)
    if (isSpotifyMode && !currentMusic.song) {
      return;
    }

    // Si está en modo Spotify pero hay canción local cargada, cambiar a modo local
    if (isSpotifyMode && currentMusic.song) {
      setIsSpotifyMode(false);
      setIsPlaying(true); // Empezar a reproducir
      return;
    }

    // Toggle play/pause en modo local
    setIsPlaying(!isPlaying);
  };

  // Determinar qué mostrar
  const displaySong =
    isSpotifyMode && spotifyTrack ? spotifyTrack : currentMusic.song;

  const showPlayButton = isSpotifyMode ? !spotifyIsPlaying : !isPlaying;

  if (!displaySong) {
    return (
      <div className="flex flex-row justify-center items-center w-full px-1 z-50">
        <p className="text-gray-400 text-sm">
          Selecciona una canción para reproducir
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-row justify-between items-center w-full px-4 z-50 gap-4 h-full max-h-[80px]">
      <div className="flex-shrink-0">
        <CurrentSong
          {...displaySong}
          isSpotify={isSpotifyMode && spotifyTrack !== null}
          countdown={countdown}
        />
      </div>

      <div className="flex-1 flex justify-center">
        <div className="flex justify-center flex-col items-center gap-2">
          <button
            className={`bg-white rounded-full p-2 transition-all ${
              isSpotifyMode && !currentMusic.song
                ? "opacity-30 cursor-not-allowed"
                : "hover:scale-105"
            }`}
            onClick={handleClick}
            title={
              isSpotifyMode && spotifyTrack
                ? "Mostrando Spotify (selecciona una canción para control local)"
                : ""
            }
          >
            {showPlayButton ? <Play /> : <Pause />}
          </button>

          <SongControl
            audio={audioRef}
            isSpotify={isSpotifyMode}
            spotifyProgress={spotifyTrack?.progress}
            spotifyDuration={spotifyTrack?.duration}
          />
          <audio ref={audioRef} />
        </div>
      </div>

      {!isSpotifyMode && (
        <div className="flex-shrink-0">
          <VolumeControl />
        </div>
      )}
      {isSpotifyMode && <div className="flex-shrink-0 w-[140px]"></div>}
    </div>
  );
}
