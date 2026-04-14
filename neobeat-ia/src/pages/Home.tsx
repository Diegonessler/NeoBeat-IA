/* ============================================================
   1. IMPORTS E TIPOS
   ============================================================ */
import React, { useEffect, useState, useRef } from "react";
import "./home.css";

interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  cover_url: string;
  audio_url: string;

  // extras
  lyrics?: string;
  like_count?: number;
  comment_count?: number;
  play_count?: number; 
}

interface Playlist {
  id: string;
  name: string;
  cover_url?: string;
}

interface PlaylistSong {
  id: string;
  song_id: number;
  songs: Song;
}

/* ============================================================
   2. HELPER — token do localStorage
   ============================================================ */
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("neobeat_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const getAuthToken = (): string | null => localStorage.getItem("neobeat_token");

/* ============================================================
   3. COMPONENTE PRINCIPAL
   ============================================================ */
const Home: React.FC = () => {

  /* ---- States gerais ---- */
  const [songs, setSongs] = useState<Song[]>([]);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  /* ---- Refs de áudio e UI ---- */
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  /* ---- States do player ---- */
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [volume, setVolume] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  /* ---- States de playlist ---- */
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistCover, setNewPlaylistCover] = useState<File | null>(null);
  const [newPlaylistCoverPreview, setNewPlaylistCoverPreview] = useState<string | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  /* ---- Estado da tela de playlist aberta ---- */
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [activePlaylistSongs, setActivePlaylistSongs] = useState<Song[]>([]);
  const [loadingPlaylistSongs, setLoadingPlaylistSongs] = useState(false);

  /* ============================================================
     REFS para evitar closure stale nos callbacks do player
     ============================================================ */
  const activePlaylistRef = useRef(activePlaylist);
  const activePlaylistSongsRef = useRef(activePlaylistSongs);
  const currentSongRef = useRef(currentSong);
  const isShuffleRef = useRef(isShuffle);
  const isRepeatRef = useRef(isRepeat);
  const songsRef = useRef(songs);
  const topSongsRef = useRef(topSongs);
  const filteredSongsRef = useRef(filteredSongs);
  const searchRef = useRef(search);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);







  useEffect(() => { activePlaylistRef.current = activePlaylist; }, [activePlaylist]);
  useEffect(() => { activePlaylistSongsRef.current = activePlaylistSongs; }, [activePlaylistSongs]);
  useEffect(() => { currentSongRef.current = currentSong; }, [currentSong]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { isRepeatRef.current = isRepeat; }, [isRepeat]);
  useEffect(() => { songsRef.current = songs; }, [songs]);
  useEffect(() => { topSongsRef.current = topSongs; }, [topSongs]);
  useEffect(() => { filteredSongsRef.current = filteredSongs; }, [filteredSongs]);
  useEffect(() => { searchRef.current = search; }, [search]);

  /* ============================================================
     4. FUNÇÕES AUXILIARES
     ============================================================ */
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const formatUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `/uploads${url.startsWith("/") ? url : `/${url}`}`;
  };

  const getDisplayList = () => {
    if (search) return filteredSongs;
    if (topSongs.length > 0) return topSongs;
    return songs;
  };

  /* Versão via refs — segura para usar dentro de callbacks */
  const getDisplayListRef = () => {
    if (searchRef.current) return filteredSongsRef.current;
    if (topSongsRef.current.length > 0) return topSongsRef.current;
    return songsRef.current;
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewPlaylistName("");
    setNewPlaylistCover(null);
    setNewPlaylistCoverPreview(null);
  };

  /* ============================================================
     5. CONTROLE DO PLAYER
     ============================================================ */
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(pct || 0);
    setCurrentTime(formatTime(audioRef.current.currentTime));
  };

  const onLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(formatTime(audioRef.current.duration));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const value = Number(e.target.value);
    audioRef.current.currentTime = (value / 100) * audioRef.current.duration;
    setProgress(value);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value;
  };

  /* ============================================================
     playNext / playPrev / handleEnded — usam refs para evitar
     closure stale (valores "congelados" do momento do registro)
     ============================================================ */
  const playNext = () => {
    const list = activePlaylistRef.current
      ? activePlaylistSongsRef.current
      : getDisplayListRef();
    const song = currentSongRef.current;
    if (!song || list.length === 0) return;
    if (isShuffleRef.current) {
      handlePlay(list[Math.floor(Math.random() * list.length)]);
      return;
    }
    const idx = list.findIndex((s) => s.id === song.id);
    handlePlay(list[(idx + 1) % list.length]);
  };

  const playPrev = () => {
    const list = activePlaylistRef.current
      ? activePlaylistSongsRef.current
      : getDisplayListRef();
    const song = currentSongRef.current;
    if (!song || list.length === 0) return;
    const idx = list.findIndex((s) => s.id === song.id);
    handlePlay(list[(idx - 1 + list.length) % list.length]);
  };

  const handleEnded = () => {
    if (isRepeatRef.current && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      playNext();
    }
  };

  /* ============================================================
     6. BUSCAR DADOS DA API
     ============================================================ */
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [resSongs, resTop, resPlaylists] = await Promise.all([
          fetch("/api/songs"),
          fetch("/api/rankings/top-songs"),
          fetch("/api/playlists", { headers: getAuthHeaders() }),
        ]);

        const songsData = await resSongs.json();
        setSongs(songsData || []);
        setFilteredSongs(songsData || []);

        if (resTop.ok) setTopSongs((await resTop.json()) || []);
        if (resPlaylists.ok) setPlaylists((await resPlaylists.json()) || []);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ============================================================
     7. TOCAR MÚSICA
     ============================================================ */
  const handlePlay = async (song: Song) => {
  setCurrentSong(song);
  setIsPlaying(true);
  setProgress(0);
  setCurrentTime("0:00");
  setDuration("0:00");

  // Dá play no áudio
  setTimeout(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, 0);

  try {
    // Busca dados em paralelo
    const [lyricsRes, likesRes, commentsRes, playsRes] = await Promise.all([
      fetch(`/api/songs/${song.id}/lyrics`),
      fetch(`/api/songs/${song.id}/likes`),
      fetch(`/api/songs/${song.id}/comments`),
      fetch(`/api/songs/${song.id}/plays`), 
]);

    const [lyricsData, likesData, commentsData, playsData] = await Promise.all([
  lyricsRes.json(),
  likesRes.json(),
  commentsRes.json(),
  playsRes.json(), // 
]);

    // Atualiza música com dados extras
      setCurrentSong(prev =>
    prev
      ? {
          ...prev,
          lyrics: lyricsData.lyrics,
          like_count: likesData.count,
          comment_count: commentsData.length,
          play_count: playsData.count, // 👈 AGORA FUNCIONA
        }
      : null
  );

    // Registra play
    await fetch("/api/stats/play", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ song_id: song.id }),
    });

  } catch (err) {
    console.error("Erro no handlePlay:", err);
  }
};

  /* ============================================================
     8. ABRIR PLAYLIST
     ============================================================ */
  const openPlaylist = async (pl: Playlist) => {
    setActivePlaylist(pl);
    setLoadingPlaylistSongs(true);
    try {
      const res = await fetch(`/api/playlists/${pl.id}/songs`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data: PlaylistSong[] = await res.json();
        setActivePlaylistSongs(data.map((ps) => ps.songs));
      }
    } catch (err) {
      console.error("Erro ao carregar músicas da playlist:", err);
    } finally {
      setLoadingPlaylistSongs(false);
    }
  };

  const closePlaylist = () => {
    setActivePlaylist(null);
    setActivePlaylistSongs([]);
  };

  /* ============================================================
     9. DELETAR PLAYLIST INTEIRA
     ============================================================ */
  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("Tem certeza que quer deletar esta playlist?")) return;
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
        closePlaylist();
        showFeedback("Playlist deletada.");
      }
    } catch (err) {
      console.error("Erro ao deletar playlist:", err);
    }
  };

  /* ============================================================
     10. REMOVER MÚSICA DA PLAYLIST
     ============================================================ */
  const handleRemoveSongFromPlaylist = async (song: Song) => {
    if (!activePlaylist) return;
    try {
      const res = await fetch(`/api/playlists/${activePlaylist.id}/songs/${song.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setActivePlaylistSongs((prev) => prev.filter((s) => s.id !== song.id));
        showFeedback("Música removida da playlist.");
      } else {
        const data = await res.json();
        showFeedback(data.error || "Erro ao remover música.");
      }
    } catch (err) {
      console.error("Erro ao remover música:", err);
    }
  };

  /* ============================================================
     11. FUNÇÕES DE CRIAR PLAYLIST
     ============================================================ */
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewPlaylistCover(file);
    setNewPlaylistCoverPreview(URL.createObjectURL(file));
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      let res: Response;
      if (newPlaylistCover) {
        const formData = new FormData();
        formData.append("name", newPlaylistName.trim());
        formData.append("cover", newPlaylistCover);
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        res = await fetch("/api/playlists", { method: "POST", headers, body: formData });
      } else {
        res = await fetch("/api/playlists", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ name: newPlaylistName.trim() }),
        });
      }
      const created = await res.json();
      if (!res.ok) { showFeedback(created.error || "Erro ao criar playlist"); return; }
      setPlaylists((prev) => [created, ...prev]);
      closeCreateModal();
      showFeedback("Playlist criada! 🎵");
    } catch (err) {
      console.error("Erro ao criar playlist:", err);
    }
  };

  const handleAddToPlaylist = async (playlistId: string, songId: number) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ song_id: songId }),
      });
      const data = await res.json();
      if (!res.ok) { showFeedback(data.error || "Erro ao adicionar música"); return; }
      setShowAddToPlaylist(null);
      showFeedback("Música adicionada à playlist! ✅");
    } catch (err) {
      console.error("Erro ao adicionar à playlist:", err);
    }
  };

  /* ============================================================
     12. FILTRO DE BUSCA
     ============================================================ */
  useEffect(() => {
    const term = search.toLowerCase();
    setFilteredSongs(
      songs.filter(
        (s) =>
          s.title?.toLowerCase().includes(term) ||
          s.artist?.toLowerCase().includes(term) ||
          s.genre?.toLowerCase().includes(term)
      )
    );
  }, [search, songs]);

  const scrollRow = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  };

  /* ============================================================
     13. comentários (modal)
     ============================================================ */
  const loadComments = async (songId: number) => {
  try {
    const res = await fetch(`/api/songs/${songId}/comments`);
    const data = await res.json();
    setComments(data || []);
  } catch (err) {
    console.error("Erro ao carregar comentários:", err);
  }
};

  const openCommentsModal = async () => {
    if (!currentSong) return;
    await loadComments(currentSong.id);
    setShowCommentsModal(true);
  };

  const handleSendComment = async () => {
  if (!currentSong || !newComment.trim()) return;

  try {
    const res = await fetch(`/api/songs/${currentSong.id}/comments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content: newComment.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      showFeedback(data.error || "Erro ao comentar");
      return;
    }

    setNewComment("");
    await loadComments(currentSong.id);

    setCurrentSong((prev) =>
      prev
        ? {
            ...prev,
            comment_count: (prev.comment_count ?? 0) + 1,
          }
        : null
    );
  } catch (err) {
    console.error("Erro ao comentar:", err);
  }
};

/* ============================================================
     14. curtir música
=============================================================== */



  const handleLikeSong = async () => {
    if (!currentSong || isLiking) return;

    try {
      setIsLiking(true);

      const res = await fetch(`/api/songs/${currentSong.id}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        showFeedback(data.error || "Erro ao curtir música");
        return;
      }

      setCurrentSong((prev) =>
        prev
          ? {
              ...prev,
              like_count: data.liked
                ? (prev.like_count ?? 0) + 1
                : Math.max((prev.like_count ?? 0) - 1, 0),
            }
          : null
      );
    } catch (err) {
      console.error("Erro ao curtir música:", err);
    } finally {
      setIsLiking(false);
    }
  };

/* ============================================================
     15. download música
     ============================================================ */

  const handleDownloadSong = async () => {
    if (!currentSong) return;

    try {
      const audioUrl = formatUrl(currentSong.audio_url);
      const response = await fetch(audioUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentSong.title} - ${currentSong.artist}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao baixar música:", err);
      showFeedback("Erro ao baixar música.");
    }
  };

  /* ============================================================
     16. RENDER
     ============================================================ */
  const displayList = getDisplayList();

  return (
    <div className="spotify-layout">

      {/* TOP BAR */}
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

      {/* SIDEBAR ESQUERDA */}
      <aside className="sidebar-left">
        <div
          className={`menu-item${!activePlaylist ? " active" : ""}`}
          onClick={closePlaylist}
          style={{ cursor: "pointer" }}
        >
          Início
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>Suas Playlists</span>
            <button className="btn-add-playlist" onClick={() => setShowCreateModal(true)} title="Nova playlist">+</button>
          </div>

          {playlists.length === 0 && <p className="sidebar-empty">Nenhuma playlist ainda.</p>}

          {playlists.map((pl) => (
            <div
              key={pl.id}
              className={`menu-item playlist-item${activePlaylist?.id === pl.id ? " active" : ""}`}
              onClick={() => openPlaylist(pl)}
              style={{ cursor: "pointer" }}
            >
              {pl.cover_url
                ? <img src={formatUrl(pl.cover_url)} className="playlist-thumb" alt={pl.name} />
                : <span className="playlist-icon">🎵</span>
              }
              {pl.name}
            </div>
          ))}
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-content">

        {/* ===== TELA DE PLAYLIST ===== */}
        {activePlaylist ? (
          <div className="playlist-view">

            <div className="playlist-view-header">
              <div className="playlist-view-cover">
                {activePlaylist.cover_url
                  ? <img src={formatUrl(activePlaylist.cover_url)} alt={activePlaylist.name} />
                  : <div className="playlist-view-cover-placeholder">🎵</div>
                }
              </div>
              <div className="playlist-view-info">
                <span className="playlist-view-label">Playlist</span>
                <h1 className="playlist-view-title">{activePlaylist.name}</h1>
                <span className="playlist-view-count">
                  {activePlaylistSongs.length} {activePlaylistSongs.length === 1 ? "música" : "músicas"}
                </span>
              </div>
            </div>

            <div className="playlist-view-actions">
              <button
                className="playlist-play-btn"
                onClick={() => activePlaylistSongs.length > 0 && handlePlay(activePlaylistSongs[0])}
                disabled={activePlaylistSongs.length === 0}
                title="Tocar playlist"
              >▶</button>
              <button
                className="playlist-delete-btn"
                onClick={() => handleDeletePlaylist(activePlaylist.id)}
                title="Deletar playlist"
              >🗑 Deletar</button>
            </div>

            {loadingPlaylistSongs ? (
              <p style={{ color: "#b3b3b3", padding: "20px" }}>Carregando músicas...</p>
            ) : activePlaylistSongs.length === 0 ? (
              <p style={{ color: "#b3b3b3", padding: "20px" }}>Nenhuma música nesta playlist ainda.</p>
            ) : (
              <table className="playlist-songs-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Título</th>
                    <th>Artista</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {activePlaylistSongs.map((song, idx) => (
                    <tr
                      key={song.id}
                      className={`playlist-song-row${currentSong?.id === song.id ? " playing" : ""}`}
                    >
                      <td className="song-num" onClick={() => handlePlay(song)}>
                        {currentSong?.id === song.id
                          ? <span className="playing-indicator">♫</span>
                          : idx + 1
                        }
                      </td>
                      <td className="song-title-cell" onClick={() => handlePlay(song)}>
                        <img src={formatUrl(song.cover_url)} className="song-row-thumb" alt={song.title} />
                        <span>{song.title}</span>
                      </td>
                      <td className="song-artist-cell" onClick={() => handlePlay(song)}>
                        {song.artist}
                      </td>
                      <td className="song-remove-cell">
                        <button
                          className="btn-remove-song"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSongFromPlaylist(song);
                          }}
                          title="Remover da playlist"
                        >✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        ) : (
          /* ===== TELA INICIAL ===== */
          <div className="songs-row-container">
            <h2>{search ? "Resultados" : "As Mais Ouvidas"}</h2>

            <div className="scroll-wrapper">
              <button className="nav-arrow left" onClick={() => scrollRow("left")}>◀</button>
              <button className="nav-arrow right" onClick={() => scrollRow("right")}>▶</button>

              {isLoading && <p style={{ color: "#b3b3b3", padding: "20px 0" }}>Carregando músicas...</p>}

              {!isLoading && displayList.length === 0 && (
                <p style={{ color: "#b3b3b3", padding: "20px 0" }}>
                  {search ? "Nenhuma música encontrada." : "Nenhuma música disponível."}
                </p>
              )}

              <div className="scroll-grid" ref={scrollRef}>
                {displayList.map((song) => (
                  <div
                    key={song.id}
                    className={`spotify-card${currentSong?.id === song.id ? " playing" : ""}`}
                    onClick={() => handlePlay(song)}
                  >
                    <div className="img-container">
                      <img src={formatUrl(song.cover_url)} alt={song.title} />
                      <button
                        className="btn-add-to-playlist"
                        onClick={(e) => { e.stopPropagation(); setShowAddToPlaylist(song.id); }}
                        title="Adicionar à playlist"
                      >+</button>
                    </div>
                    <div className="card-info">
                      <strong>{song.title}</strong>
                      <p>{song.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SIDEBAR DIREITA */}
      <aside className="sidebar-right">
  {currentSong && (
    <div className="song-details">

      {/* IMAGEM */}
      <img
        src={formatUrl(currentSong.cover_url)}
        className="current-art"
        alt={currentSong.title}
      />

      {/* CONTROLES */}
     <div className="song-actions">
  <button className="action-pill">
    ▶ {currentSong.play_count ?? 0}
  </button>

  <button className="action-pill" onClick={handleLikeSong}>
    👍 {currentSong.like_count ?? 0}
  </button>

  <button className="action-pill" onClick={openCommentsModal}>
    💬 {currentSong.comment_count ?? 0}
  </button>

  <button className="action-pill" onClick={handleDownloadSong}>
    ⬇
  </button>
</div>

      {/* INFO */}
      <h2>{currentSong.title}</h2>
      <p>{currentSong.artist}</p>

      <p style={{ color: "#aaa" }}>
        {currentSong.genre}
      </p>

      {/* LETRA */}
      {currentSong.lyrics && (
        <div className="lyrics-box">
          <pre>{currentSong.lyrics}</pre>
        </div>
      )}

    </div>
  )}
</aside>

      {/* PLAYER */}
      {currentSong && (
        <footer className="player-bar-spotify">
          <audio
            ref={audioRef}
            key={currentSong.id}
            src={formatUrl(currentSong.audio_url)}
            autoPlay      
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={handleEnded}
          />
          <div className="player-info">
            <strong>{currentSong.title}</strong>
            <p>{currentSong.artist}</p>
          </div>
          <div className="player-controls-spotify">
            <div className="control-buttons">
              <button className="btn-icon" onClick={() => setIsShuffle(!isShuffle)}
                style={{ color: isShuffle ? "#00d2ff" : undefined }} title="Aleatório">🔀</button>
              <button className="btn-icon" onClick={playPrev} title="Anterior">⏮</button>
              <button
                className="btn-main-play"
                onClick={togglePlay}
                style={{ paddingLeft: isPlaying ? '0' : '3px' }}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button className="btn-icon" onClick={playNext} title="Próxima">⏭</button>
              <button className="btn-icon" onClick={() => setIsRepeat(!isRepeat)}
                style={{ color: isRepeat ? "#00d2ff" : undefined }} title="Repetir">🔁</button>
            </div>
            <div className="progress-container-wrapper">
              <span className="time-text">{currentTime}</span>
              <div className="progress-bg">
                <input type="range" className="progress-slider" min="0" max="100"
                  value={progress} onChange={handleSeek} />
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="time-text">{duration}</span>
            </div>
          </div>
          <div className="player-right">
            <button className="btn-heart">💜</button>
            <div className="volume-wrapper">
              <span>{volume === 0 ? "🔇" : "🔊"}</span>
              <input type="range" min="0" max="1" step="0.01" value={volume}
                onChange={handleVolumeChange} className="volume-slider" />
            </div>
          </div>
        </footer>
      )}

      {/* TOAST */}
      {feedbackMsg && <div className="toast-feedback">{feedbackMsg}</div>}

      {/* MODAL: CRIAR PLAYLIST */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-box modal-create-playlist" onClick={(e) => e.stopPropagation()}>
            <h3>Nova Playlist</h3>
            <div className="cover-upload-area" onClick={() => coverInputRef.current?.click()}>
              {newPlaylistCoverPreview
                ? <img src={newPlaylistCoverPreview} className="cover-preview" alt="Capa" />
                : <div className="cover-placeholder"><span className="cover-icon">🖼️</span><span className="cover-label">Adicionar capa</span></div>
              }
              {newPlaylistCoverPreview && (
                <button className="cover-remove" onClick={(e) => { e.stopPropagation(); setNewPlaylistCover(null); setNewPlaylistCoverPreview(null); }}>✕</button>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
            <input
              type="text"
              placeholder="Nome da playlist"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={closeCreateModal}>Cancelar</button>
              <button className="btn-confirm" onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}>Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR À PLAYLIST */}
      {showAddToPlaylist !== null && (
        <div className="modal-overlay" onClick={() => setShowAddToPlaylist(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Adicionar à Playlist</h3>
            {playlists.length === 0
              ? <p style={{ color: "#b3b3b3" }}>Nenhuma playlist criada ainda.</p>
              : playlists.map((pl) => (
                <div key={pl.id} className="playlist-option"
                  onClick={() => handleAddToPlaylist(pl.id, showAddToPlaylist)}>
                  {pl.cover_url
                    ? <img src={formatUrl(pl.cover_url)} className="playlist-option-thumb" alt={pl.name} />
                    : <span>🎵</span>
                  }
                  {pl.name}
                </div>
              ))
            }
            <div className="modal-actions">
              <button onClick={() => setShowAddToPlaylist(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
{showCommentsModal && (
      <div className="modal-overlay" onClick={() => setShowCommentsModal(false)}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <h3>Comentários</h3>

          {comments.length === 0 ? (
            <p>Nenhum comentário ainda.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id}>
                <p>{c.content}</p>
              </div>
            ))
          )}

          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Comentar..."
          />

          <button onClick={handleSendComment}>Enviar</button>

          <button onClick={() => setShowCommentsModal(false)}>
            Fechar
          </button>
        </div>
      </div>
    )}
    </div>
  );
};



export default Home;