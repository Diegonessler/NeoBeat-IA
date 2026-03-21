/* ============================================================
   1. IMPORTS E TIPOS
   ============================================================ */
import React, { useEffect, useState, useRef } from "react";
import "./Home.css";

/* Estrutura de uma música */
interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  cover_url: string;
  audio_url: string;
}

/* ============================================================
   2. COMPONENTE PRINCIPAL
   ============================================================ */
const Home: React.FC = () => {

  /* ============================================================
     3. STATES (DADOS DO APP)
     ============================================================ */

  // Todas músicas
  const [songs, setSongs] = useState<Song[]>([]);

  // Top músicas (ranking)
  const [topSongs, setTopSongs] = useState<Song[]>([]);

  // Resultado da busca
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);

  // Música atual tocando
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  // Texto da busca
  const [search, setSearch] = useState("");

  /* ============================================================
     4. REFS (ACESSO DIRETO AO DOM)
     ============================================================ */

  // Scroll horizontal dos cards
  const scrollRef = useRef<HTMLDivElement>(null);

  // Elemento de áudio
  const audioRef = useRef<HTMLAudioElement>(null);

  /* ============================================================
     5. STATES DO PLAYER
     ============================================================ */

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [volume, setVolume] = useState(1);

  /* URL base da API */
  const API_BASE_URL = "http://localhost:3000";

  /* ============================================================
     6. FUNÇÕES AUXILIARES
     ============================================================ */

  // Converte segundos em formato 0:00
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Corrige URL de imagem/áudio
  const formatUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}/uploads${url.startsWith("/") ? url : `/${url}`}`;
  };

  /* ============================================================
     7. CONTROLE DO PLAYER
     ============================================================ */

  // Play / Pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  // Atualiza tempo enquanto toca
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;

    const pct =
      (audioRef.current.currentTime / audioRef.current.duration) * 100;

    setProgress(pct || 0);
    setCurrentTime(formatTime(audioRef.current.currentTime));
  };

  // Pega duração da música
  const onLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(formatTime(audioRef.current.duration));
  };

  // Clicar na barra de progresso
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;

    const value = Number(e.target.value);
    audioRef.current.currentTime =
      (value / 100) * audioRef.current.duration;

    setProgress(value);
  };

  // Alterar volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setVolume(value);

    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  /* ============================================================
     8. BUSCAR DADOS DA API
     ============================================================ */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSongs, resTop] = await Promise.all([
          fetch(`${API_BASE_URL}/api/songs`),
          fetch(`${API_BASE_URL}/api/rankings/top-songs`)
        ]);

        const songsData = await resSongs.json();
        setSongs(songsData || []);
        setFilteredSongs(songsData || []);

        if (resTop.ok) {
          const topData = await resTop.json();
          setTopSongs(topData || []);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  /* ============================================================
     9. TOCAR MÚSICA
     ============================================================ */

  const handlePlay = async (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(false);
    setProgress(0);

    try {
      await fetch(`${API_BASE_URL}/api/stats/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: song.id })
      });
    } catch (err) {
      console.error(err);
    }
  };

  /* ============================================================
     10. FILTRO DE BUSCA
     ============================================================ */

  useEffect(() => {
    const term = search.toLowerCase();

    setFilteredSongs(
      songs.filter(
        (s) =>
          s.title?.toLowerCase().includes(term) ||
          s.artist?.toLowerCase().includes(term)
      )
    );
  }, [search, songs]);

  /* ============================================================
     11. SCROLL HORIZONTAL
     ============================================================ */

  const scrollRow = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "right" ? 300 : -300,
      behavior: "smooth"
    });
  };

  /* ============================================================
     12. ESCOLHA DA LISTA
     ============================================================ */

  const displayList = search
    ? filteredSongs
    : topSongs.length > 0
    ? topSongs
    : songs;

  /* ============================================================
     13. RENDER (TELA)
     ============================================================ */

  return (
     <div className="spotify-layout">

      {/* ============================================================
         14. TOP BAR
         ============================================================ */}
      <header className="top-bar">
        <div className="top-bar-left">NeoBeat-IA</div>
        <div className="top-bar-center">
          <input
            type="text"
            placeholder="O que você quer ouvir?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="top-bar-right">
          <button className="btn-profile">Perfil</button>
          <button className="btn-profile">Configuração</button>
        </div>
      </header>


      {/* ============================================================
         15. SIDEBAR ESQUERDA
         ============================================================ */}
        <aside className="sidebar-left">
        <div className="menu-item active">Início</div>
      </aside>


      {/* ============================================================
         16. CONTEÚDO PRINCIPAL
         ============================================================ */}
        <main className="main-content">
  
          {/* CONTAINER RELATIVO PARA AS SETAS */}
          <div className="songs-row-container">

            <h2>{search ? "Resultados" : "As Mais Ouvidas"}</h2>

            <button
              className="nav-arrow left"
              onClick={() => scrollRow("left")}
            >
              ◀
            </button>

            <button
              className="nav-arrow right"
              onClick={() => scrollRow("right")}
            >
              ▶
            </button>

            {/* GRID DE MÚSICAS */}
            <div className="scroll-grid" ref={scrollRef}>
              {displayList.map((song) => (
                <div
                  key={song.id}
                  className="spotify-card"
                  onClick={() => handlePlay(song)}
                >
                  {/* IMAGEM */}
                  <div className="img-container">
                    <img
                      src={formatUrl(song.cover_url)}
                      alt={song.title}
                    />
                  </div>

                  {/* TEXTO */}
                  <div className="card-info">
                    <strong>{song.title}</strong>
                    <p>{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>

      {/* ============================================================
         17. SIDEBAR DIREITA
         ============================================================ */}
      <aside className="sidebar-right">
        {currentSong && (
          <>
            <img src={formatUrl(currentSong.cover_url)} className="current-art" />
            <h3>{currentSong.title}</h3>
            <p>{currentSong.artist}</p>
          </>
        )}
      </aside>


      {/* ============================================================
         18. PLAYER
         ============================================================ */}
      {currentSong && (
        <footer className="player-bar-spotify">

          {/* ELEMENTO DE ÁUDIO */}
          <audio
            ref={audioRef}
            key={currentSong.id}
            src={formatUrl(currentSong.audio_url)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />

          {/* INFO ESQUERDA */}
          <div className="player-info">
            <strong>{currentSong.title}</strong>
            <p>{currentSong.artist}</p>
          </div>

          {/* CONTROLES CENTRAIS */}
          <div className="player-controls-spotify">

            {/* BOTÕES */}
            <div className="control-buttons">
              <button className="btn-icon">🔀</button>
              <button className="btn-icon">⏮</button>

              <button className="btn-main-play" onClick={togglePlay}>
                {isPlaying ? "⏸" : "▶"}
              </button>

              <button className="btn-icon">⏭</button>
              <button className="btn-icon">🔁</button>
            </div>

            {/* BARRA DE PROGRESSO */}
            <div className="progress-container-wrapper">
              <span className="time-text">{currentTime}</span>

              <div className="progress-bg">
                <input
                  type="range"
                  className="progress-slider"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleSeek}
                />

                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="time-text">{duration}</span>
            </div>
          </div>

          {/* DIREITA (VOLUME + LIKE) */}
          <div className="player-right">
            <button className="btn-heart">💜</button>

            <div className="volume-wrapper">
              <span>{volume === 0 ? "🔇" : "🔊"}</span>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Home;