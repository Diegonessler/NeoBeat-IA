/* ============================================================
   1. IMPORTS E TIPOS
   ============================================================ */
import "./home.css";
import ProfilePanel from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";
import { useEffect, useRef, useState } from "react";
import i18n from "../i18n/index";

export const useI18n = () => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  return (key: string) => i18n.t(key);
};

interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  cover_url: string;
  audio_url: string;
  created_at?: string;
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

interface HomeProps {
  goToLogin: () => void;
  goToRegister: () => void;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("neobeat_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const getAuthToken = (): string | null => localStorage.getItem("neobeat_token");

const Home: React.FC<HomeProps> = ({ goToLogin, goToRegister }) => {

  const t = useI18n();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("neobeat_token"));
  const [songs, setSongs] = useState<Song[]>([]);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollArtistsRef = useRef<HTMLDivElement>(null);
  const scrollPublicPlaylistsRef = useRef<HTMLDivElement>(null);
  const scrollRecentRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [volume, setVolume] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistCover, setNewPlaylistCover] = useState<File | null>(null);
  const [newPlaylistCoverPreview, setNewPlaylistCoverPreview] = useState<string | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [activePlaylistSongs, setActivePlaylistSongs] = useState<Song[]>([]);
  const [loadingPlaylistSongs, setLoadingPlaylistSongs] = useState(false);

  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [showLiked, setShowLiked] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);

  const activePlaylistRef = useRef(activePlaylist);
  const activePlaylistSongsRef = useRef(activePlaylistSongs);
  const currentSongRef = useRef(currentSong);
  const isShuffleRef = useRef(isShuffle);
  const isRepeatRef = useRef(isRepeat);
  const songsRef = useRef(songs);
  const topSongsRef = useRef(topSongs);
  const filteredSongsRef = useRef(filteredSongs);
  const searchRef = useRef(search);
  const showLikedRef = useRef(showLiked);
  const likedSongsRef = useRef(likedSongs);

  useEffect(() => { activePlaylistRef.current = activePlaylist; }, [activePlaylist]);
  useEffect(() => { activePlaylistSongsRef.current = activePlaylistSongs; }, [activePlaylistSongs]);
  useEffect(() => { currentSongRef.current = currentSong; }, [currentSong]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { isRepeatRef.current = isRepeat; }, [isRepeat]);
  useEffect(() => { songsRef.current = songs; }, [songs]);
  useEffect(() => { topSongsRef.current = topSongs; }, [topSongs]);
  useEffect(() => { filteredSongsRef.current = filteredSongs; }, [filteredSongs]);
  useEffect(() => { searchRef.current = search; }, [search]);
  useEffect(() => { showLikedRef.current = showLiked; }, [showLiked]);
  useEffect(() => { likedSongsRef.current = likedSongs; }, [likedSongs]);

  useEffect(() => {
    const refreshSession = async () => {
      const refresh_token = localStorage.getItem("neobeat_refresh_token");
      if (!refresh_token) return;
      try {
        const res = await fetch("/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token }),
        });
        if (!res.ok) {
          localStorage.removeItem("neobeat_token");
          localStorage.removeItem("neobeat_refresh_token");
          setIsLoggedIn(false);
          return;
        }
        const data = await res.json();
        localStorage.setItem("neobeat_token", data.session.access_token);
        localStorage.setItem("neobeat_refresh_token", data.session.refresh_token);
        setIsLoggedIn(true);
      } catch (err) {
        console.error("Erro ao renovar sessão:", err);
      }
    };
    refreshSession();
  }, []);

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

  const getDisplayListRef = () => {
    if (searchRef.current) return filteredSongsRef.current;
    if (topSongsRef.current.length > 0) return topSongsRef.current;
    return songsRef.current;
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const requireLogin = (action: () => void) => {
    if (!isLoggedIn) { showFeedback(t("messages.login_required")); return; }
    action();
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewPlaylistName("");
    setNewPlaylistCover(null);
    setNewPlaylistCoverPreview(null);
  };

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

  const playNext = () => {
    const song = currentSongRef.current;
    let list: Song[];
    if (showLikedRef.current) list = likedSongsRef.current;
    else if (activePlaylistRef.current) list = activePlaylistSongsRef.current;
    else list = getDisplayListRef();
    if (!song || list.length === 0) return;
    if (isShuffleRef.current) { handlePlay(list[Math.floor(Math.random() * list.length)]); return; }
    const idx = list.findIndex((s) => s.id === song.id);
    handlePlay(list[(idx + 1) % list.length]);
  };

  const playPrev = () => {
    const song = currentSongRef.current;
    let list: Song[];
    if (showLikedRef.current) list = likedSongsRef.current;
    else if (activePlaylistRef.current) list = activePlaylistSongsRef.current;
    else list = getDisplayListRef();
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [resSongs, resTop, resPublicPlaylists] = await Promise.all([
          fetch("/api/songs"),
          fetch("/api/rankings/top-songs"),
          fetch("/api/playlists/public", { headers: getAuthHeaders() }),
        ]);
        const songsData = await resSongs.json();
        setSongs(songsData || []);
        setFilteredSongs(songsData || []);
        if (resTop.ok) setTopSongs((await resTop.json()) || []);
        if (resPublicPlaylists.ok) setPublicPlaylists((await resPublicPlaylists.json()) || []);
        if (isLoggedIn) {
          const [resPlaylists, resLiked] = await Promise.all([
            fetch("/api/playlists", { headers: getAuthHeaders() }),
            fetch("/api/playlists/liked", { headers: getAuthHeaders() }),
          ]);
          if (resPlaylists.ok) setPlaylists((await resPlaylists.json()) || []);
          if (resLiked.ok) setLikedSongs((await resLiked.json()) || []);
        }
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isLoggedIn]);

  const handlePlay = async (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime("0:00");
    setDuration("0:00");
    setTimeout(() => {
      if (audioRef.current) { audioRef.current.play(); setIsPlaying(true); }
    }, 0);
    try {
      const [lyricsRes, likesRes, commentsRes, playsRes] = await Promise.all([
        fetch(`/api/songs/${song.id}/lyrics`),
        fetch(`/api/songs/${song.id}/likes`),
        fetch(`/api/songs/${song.id}/comments`),
        fetch(`/api/songs/${song.id}/plays`),
      ]);
      const [lyricsData, likesData, commentsData, playsData] = await Promise.all([
        lyricsRes.json(), likesRes.json(), commentsRes.json(), playsRes.json(),
      ]);
      setCurrentSong(prev =>
        prev ? { ...prev, lyrics: lyricsData.lyrics, like_count: likesData.count, comment_count: commentsData.length, play_count: playsData.count } : null
      );
      if (isLoggedIn) {
        await fetch("/api/stats/play", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ song_id: song.id }) });
      }
    } catch (err) {
      console.error("Erro no handlePlay:", err);
    }
  };

  const openPlaylist = async (pl: Playlist) => {
    setActivePlaylist(pl);
    setShowLiked(false);
    setLoadingPlaylistSongs(true);
    try {
      const res = await fetch(`/api/playlists/${pl.id}/songs`, { headers: getAuthHeaders() });
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
    setShowLiked(false);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm(t("home.confirm_delete_playlist"))) return;
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) { setPlaylists((prev) => prev.filter((p) => p.id !== playlistId)); closePlaylist(); showFeedback(t("home.playlist_deleted")); }
    } catch (err) {
      console.error("Erro ao deletar playlist:", err);
    }
  };

  const handleRemoveSongFromPlaylist = async (song: Song) => {
    if (!activePlaylist) return;
    try {
      const res = await fetch(`/api/playlists/${activePlaylist.id}/songs/${song.id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) {
        setActivePlaylistSongs((prev) => prev.filter((s: Song) => s.id !== song.id));
        showFeedback(t("home.song_removed"));
      } else {
        const data = await res.json();
        showFeedback(data.error || t("home.song_removed"));
      }
    } catch (err) {
      console.error("Erro ao remover música:", err);
    }
  };

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
        res = await fetch("/api/playlists", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ name: newPlaylistName.trim() }) });
      }
      const created = await res.json();
      if (!res.ok) { showFeedback(created.error || t("home.playlist_created")); return; }
      setPlaylists((prev) => [created, ...prev]);
      closeCreateModal();
      showFeedback(t("home.playlist_created"));
    } catch (err) {
      console.error("Erro ao criar playlist:", err);
    }
  };

  const handleAddToPlaylist = async (playlistId: string, songId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ song_id: songId }) });
      const data = await res.json();
      if (!res.ok) { showFeedback(data.error || t("home.song_added")); return; }
      setShowAddToPlaylist(null);
      showFeedback(t("home.song_added"));
    } catch (err) {
      console.error("Erro ao adicionar à playlist:", err);
    }
  };

  useEffect(() => {
    const term = search.toLowerCase();
    setFilteredSongs(songs.filter(s =>
      s.title?.toLowerCase().includes(term) ||
      s.artist?.toLowerCase().includes(term) ||
      s.genre?.toLowerCase().includes(term)
    ));
  }, [search, songs]);

  const scrollRow = (dir: "left" | "right", ref?: React.RefObject<HTMLDivElement | null>) => {
    const target = ref?.current ?? scrollRef.current;
    target?.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  };

  const loadComments = async (songId: string) => {
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
      const res = await fetch(`/api/songs/${currentSong.id}/comments`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ content: newComment.trim() }) });
      const data = await res.json();
      if (!res.ok) { showFeedback(data.error || t("home.comments")); return; }
      setNewComment("");
      await loadComments(currentSong.id);
      setCurrentSong((prev) => prev ? { ...prev, comment_count: (prev.comment_count ?? 0) + 1 } : null);
    } catch (err) {
      console.error("Erro ao comentar:", err);
    }
  };

  const handleLikeSong = async () => {
    if (!currentSong || isLiking) return;
    try {
      setIsLiking(true);
      const res = await fetch(`/api/songs/${currentSong.id}/like`, { method: "POST", headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) { showFeedback(data.error || t("home.like")); return; }
      const songSnapshot = currentSong;
      setCurrentSong((prev) => prev ? { ...prev, like_count: data.liked ? (prev.like_count ?? 0) + 1 : Math.max((prev.like_count ?? 0) - 1, 0) } : null);
      setLikedSongs(prev => data.liked ? [songSnapshot, ...prev.filter(s => s.id !== songSnapshot.id)] : prev.filter(s => s.id !== songSnapshot.id));
    } catch (err) {
      console.error("Erro ao curtir música:", err);
    } finally {
      setIsLiking(false);
    }
  };

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
      showFeedback(t("home.download_error"));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("neobeat_token");
    localStorage.removeItem("neobeat_refresh_token");
    setIsLoggedIn(false);
    setPlaylists([]);
    setLikedSongs([]);
    setActivePlaylist(null);
    setActivePlaylistSongs([]);
    setShowLiked(false);
    setShowSettings(false);
    setShowProfile(false);
  };

  const SongCard = ({ song }: { song: Song }) => (
    <div
      className={`spotify-card${currentSong?.id === song.id ? " playing" : ""}`}
      onClick={() => handlePlay(song)}
    >
      <div className="img-container">
        <img src={formatUrl(song.cover_url)} alt={song.title} />
        {isLoggedIn && (
          <button
            className="btn-add-to-playlist"
            onClick={(e) => { e.stopPropagation(); setShowAddToPlaylist(song.id); }}
            title={t("home.add_to_playlist")}
          >+</button>
        )}
      </div>
      <div className="card-info">
        <strong>{song.title}</strong>
        <p>{song.artist}</p>
      </div>
    </div>
  );

  const displayList = getDisplayList();

  const artistMap = new Map<string, Song>();
  songs.forEach(s => { if (!artistMap.has(s.artist)) artistMap.set(s.artist, s); });
  const uniqueArtists: Song[] = [...artistMap.values()];

  const uniqueGenres: string[] = [...new Set(songs.map(s => s.genre).filter((g): g is string => Boolean(g)))];

  const songsByNewest = [...songs].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const last30DaysSongs = songsByNewest.filter((s) => {
    if (!s.created_at) return false;
    return now - new Date(s.created_at).getTime() <= THIRTY_DAYS_MS;
  });
  const recentSongs = (last30DaysSongs.length > 0 ? last30DaysSongs : songsByNewest).slice(0, 10);

  // Extraído para evitar inferência "never" dentro de condicional aninhada
  const publicPlaylistsTyped: Playlist[] = publicPlaylists;
  const activePlaylistId: string | null = activePlaylist?.id ?? null;

  return (
    <div className="spotify-layout">

      {/* TOP BAR */}
      <header className="top-bar">
        <div className="top-bar-left">NeoBeat-IA</div>
        <div className="top-bar-center">
          <input type="text" placeholder={t("nav.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="top-bar-right">
          {isLoggedIn ? (
            <>
              <button className="btn-profile" onClick={() => setShowProfile(true)}>{t("nav.profile")}</button>
              <button className="btn-profile" onClick={() => setShowSettings(true)}>{t("nav.settings")}</button>
            </>
          ) : (
            <>
              <button className="btn-profile" onClick={() => goToLogin()}>{t("nav.login")}</button>
              <button className="btn-profile" onClick={() => goToRegister()}>{t("nav.register")}</button>
            </>
          )}
        </div>
      </header>

      {/* SIDEBAR ESQUERDA */}
      <aside className="sidebar-left">
        <div className={`menu-item${!activePlaylist && !showLiked ? " active" : ""}`} onClick={closePlaylist} style={{ cursor: "pointer" }}>
          {t("nav.home")}
        </div>
        <div className="sidebar-section">
          {isLoggedIn ? (
            <>
              <div className="sidebar-section-header">
                <span>{t("home.playlists")}</span>
                <button className="btn-add-playlist" onClick={() => setShowCreateModal(true)} title={t("home.new_playlist")}>+</button>
              </div>
              <div
                className={`menu-item playlist-item${showLiked ? " active" : ""}`}
                onClick={() => { setShowLiked(true); setActivePlaylist(null); setActivePlaylistSongs([]); }}
                style={{ cursor: "pointer" }}
              >
                <span className="playlist-icon">❤️</span>
                {t("home.liked_songs")}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#aaa" }}>{likedSongs.length}</span>
              </div>
              {playlists.length === 0 && <p className="sidebar-empty">{t("home.no_playlists")}</p>}
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
            </>
          ) : (
            <div className="sidebar-empty" style={{ cursor: "pointer", color: "#00d2ff", padding: "12px 16px", fontSize: 13 }} onClick={() => goToLogin()}>
              🔐 {t("home.login_playlists")}
            </div>
          )}
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-content">

        {showLiked ? (
          /* ===== VIEW: CURTIDAS ===== */
          <div className="playlist-view">
            <div className="playlist-view-header">
              <div className="playlist-view-cover">
                <div className="playlist-view-cover-placeholder" style={{ fontSize: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #450a0a 0%, #991b1b 100%)", borderRadius: 8, width: "100%", height: "100%" }}>❤️</div>
              </div>
              <div className="playlist-view-info">
                <span className="playlist-view-label">Playlist</span>
                <h1 className="playlist-view-title">{t("home.liked_songs")}</h1>
                <span className="playlist-view-count">{likedSongs.length} {likedSongs.length === 1 ? t("home.song") : t("home.songs")}</span>
              </div>
            </div>
            <div className="playlist-view-actions">
              <button className="playlist-play-btn" onClick={() => likedSongs.length > 0 && handlePlay(likedSongs[0])} disabled={likedSongs.length === 0}>▶</button>
            </div>
            {likedSongs.length === 0 ? (
              <p style={{ color: "#b3b3b3", padding: "20px" }}>{t("home.no_liked_songs")}</p>
            ) : (
              <table className="playlist-songs-table">
                <thead><tr><th>#</th><th>{t("home.col_title")}</th><th>{t("home.col_artist")}</th></tr></thead>
                <tbody>
                  {likedSongs.map((song, idx) => (
                    <tr key={song.id} className={`playlist-song-row${currentSong?.id === song.id ? " playing" : ""}`} onClick={() => handlePlay(song)}>
                      <td className="song-num">{currentSong?.id === song.id ? <span className="playing-indicator">♫</span> : idx + 1}</td>
                      <td className="song-title-cell"><img src={formatUrl(song.cover_url)} className="song-row-thumb" alt={song.title} /><span>{song.title}</span></td>
                      <td className="song-artist-cell">{song.artist}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        ) : activePlaylist ? (
          /* ===== VIEW: PLAYLIST ===== */
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
                <span className="playlist-view-count">{activePlaylistSongs.length} {activePlaylistSongs.length === 1 ? t("home.song") : t("home.songs")}</span>
              </div>
            </div>
            <div className="playlist-view-actions">
              <button className="playlist-play-btn" onClick={() => activePlaylistSongs.length > 0 && handlePlay(activePlaylistSongs[0])} disabled={activePlaylistSongs.length === 0}>▶</button>
              {isLoggedIn && playlists.some((p: Playlist) => p.id === activePlaylist.id) && (
                <button className="playlist-delete-btn" onClick={() => handleDeletePlaylist(activePlaylist.id)}>🗑 {t("home.delete")}</button>
              )}
            </div>
            {loadingPlaylistSongs ? (
              <p style={{ color: "#b3b3b3", padding: "20px" }}>{t("home.loading_songs")}</p>
            ) : activePlaylistSongs.length === 0 ? (
              <p style={{ color: "#b3b3b3", padding: "20px" }}>{t("home.no_playlist_songs")}</p>
            ) : (
              <table className="playlist-songs-table">
                <thead><tr><th>#</th><th>{t("home.col_title")}</th><th>{t("home.col_artist")}</th><th></th></tr></thead>
                <tbody>
                  {activePlaylistSongs.map((song, idx) => (
                    <tr key={song.id} className={`playlist-song-row${currentSong?.id === song.id ? " playing" : ""}`}>
                      <td className="song-num" onClick={() => handlePlay(song)}>{currentSong?.id === song.id ? <span className="playing-indicator">♫</span> : idx + 1}</td>
                      <td className="song-title-cell" onClick={() => handlePlay(song)}><img src={formatUrl(song.cover_url)} className="song-row-thumb" alt={song.title} /><span>{song.title}</span></td>
                      <td className="song-artist-cell" onClick={() => handlePlay(song)}>{song.artist}</td>
                      <td className="song-remove-cell">
                        {isLoggedIn && playlists.some((p: Playlist) => p.id === activePlaylist.id) && (
                          <button className="btn-remove-song" onClick={(e) => { e.stopPropagation(); handleRemoveSongFromPlaylist(song); }}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        ) : (
          /* ===== VIEW: HOME ===== */
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

            {/* ARTISTAS */}
            <div className="songs-row-container">
              <h2>🎤 {t("home.artists")}</h2>
              <div className="scroll-wrapper">
                <button className="nav-arrow left" onClick={() => scrollRow("left", scrollArtistsRef)}>◀</button>
                <button className="nav-arrow right" onClick={() => scrollRow("right", scrollArtistsRef)}>▶</button>
                <div className="scroll-grid" ref={scrollArtistsRef}>
                  {uniqueArtists.map((song) => (
                    <div key={song.artist} className="spotify-card" style={{ textAlign: "center" }} onClick={() => setSearch(song.artist)}>
                      <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: "50%", overflow: "hidden", border: "2px solid #700061" }}>
                        <img src={formatUrl(song.cover_url)} alt={song.artist} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div className="card-info" style={{ marginTop: 10 }}>
                        <strong>{song.artist}</strong>
                        <p>{songs.filter(s => s.artist === song.artist).length} música(s)</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GÊNEROS */}
            <div className="songs-row-container">
              <h2>🎸 {t("home.genres")}</h2>
              <div className="genre-chips">
                <button className={`genre-chip${!search ? " active" : ""}`} onClick={() => setSearch("")}>
                  {t("home.all")}
                </button>
                {uniqueGenres.map(genre => (
                  <button key={genre} className={`genre-chip${search === genre ? " active" : ""}`} onClick={() => setSearch(genre)}>
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* MAIS OUVIDAS */}
            <div className="songs-row-container">
              <h2>{search ? t("home.results") : t("home.top_songs")}</h2>
              <div className="scroll-wrapper">
                <button className="nav-arrow left" onClick={() => scrollRow("left", scrollRef)}>◀</button>
                <button className="nav-arrow right" onClick={() => scrollRow("right", scrollRef)}>▶</button>
                {isLoading && <p style={{ color: "#b3b3b3", padding: "20px 0" }}>{t("home.loading")}</p>}
                {!isLoading && displayList.length === 0 && (
                  <p style={{ color: "#b3b3b3", padding: "20px 0" }}>{search ? t("home.no_results") : t("home.no_songs")}</p>
                )}
                <div className="scroll-grid" ref={scrollRef}>
                  {displayList.map((song) => <SongCard key={song.id} song={song} />)}
                </div>
              </div>
            </div>

            {/* RECÉM ADICIONADAS */}
            {!search && (
              <div className="songs-row-container">
                <h2>🆕 {t("home.recently_added")}</h2>
                <div className="scroll-wrapper">
                  <button className="nav-arrow left" onClick={() => scrollRow("left", scrollRecentRef)}>◀</button>
                  <button className="nav-arrow right" onClick={() => scrollRow("right", scrollRecentRef)}>▶</button>
                  <div className="scroll-grid" ref={scrollRecentRef}>
                    {recentSongs.map((song) => <SongCard key={song.id} song={song} />)}
                  </div>
                </div>
              </div>
            )}

            {/* PLAYLISTS DE OUTROS USUÁRIOS (COMUNIDADE) */}
            {publicPlaylistsTyped.length > 0 && !search && (
              <div className="songs-row-container">
                <h2>🌎 {t("home.community_playlists")}</h2>
                <div className="scroll-wrapper">
                  <button className="nav-arrow left" onClick={() => scrollRow("left", scrollPublicPlaylistsRef)}>◀</button>
                  <button className="nav-arrow right" onClick={() => scrollRow("right", scrollPublicPlaylistsRef)}>▶</button>
                  <div className="scroll-grid" ref={scrollPublicPlaylistsRef}>
                    {publicPlaylistsTyped.map((pl: Playlist) => {
                      const isActive = activePlaylistId === pl.id;
                      return (
                        <div key={pl.id} className={`spotify-card${isActive ? " playing" : ""}`} onClick={() => openPlaylist(pl)}>
                          <div className="img-container">
                            {pl.cover_url
                              ? <img src={formatUrl(pl.cover_url)} alt={pl.name} />
                              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #6200ff, #00d2ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🎵</div>
                            }
                          </div>
                          <div className="card-info">
                            <strong>{pl.name}</strong>
                            <p>Playlist</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* SIDEBAR DIREITA */}
      <aside className="sidebar-right">
        {currentSong && (
          <div className="song-details">
            <img src={formatUrl(currentSong.cover_url)} className="current-art" alt={currentSong.title} />
            <div className="song-actions">
              <button className="action-pill">▶ {currentSong.play_count ?? 0}</button>
              <button className="action-pill" onClick={() => requireLogin(handleLikeSong)}>👍 {currentSong.like_count ?? 0}</button>
              <button className="action-pill" onClick={() => requireLogin(openCommentsModal)}>💬 {currentSong.comment_count ?? 0}</button>
              <button className="action-pill" onClick={() => requireLogin(handleDownloadSong)}>⬇</button>
            </div>
            <h2>{currentSong.title}</h2>
            <p>{currentSong.artist}</p>
            <p style={{ color: "#aaa" }}>{currentSong.genre}</p>
            {currentSong.lyrics && (
              <div className="lyrics-box"><pre>{currentSong.lyrics}</pre></div>
            )}
          </div>
        )}
      </aside>

      {/* PLAYER */}
      {currentSong && (
        <footer className="player-bar-spotify">
          <audio ref={audioRef} key={currentSong.id} src={formatUrl(currentSong.audio_url)} autoPlay onTimeUpdate={handleTimeUpdate} onLoadedMetadata={onLoadedMetadata} onEnded={handleEnded} />
          <div className="player-info">
            <strong>{currentSong.title}</strong>
            <p>{currentSong.artist}</p>
          </div>
          <div className="player-controls-spotify">
            <div className="control-buttons">
              <button className="btn-icon" onClick={() => setIsShuffle(!isShuffle)} style={{ color: isShuffle ? "#00d2ff" : undefined }}>🔀</button>
              <button className="btn-icon" onClick={playPrev}>⏮</button>
              <button className="btn-main-play" onClick={togglePlay} style={{ paddingLeft: isPlaying ? '0' : '3px' }}>{isPlaying ? "⏸" : "▶"}</button>
              <button className="btn-icon" onClick={playNext}>⏭</button>
              <button className="btn-icon" onClick={() => setIsRepeat(!isRepeat)} style={{ color: isRepeat ? "#00d2ff" : undefined }}>🔁</button>
            </div>
            <div className="progress-container-wrapper">
              <span className="time-text">{currentTime}</span>
              <div className="progress-bg">
                <input type="range" className="progress-slider" min="0" max="100" value={progress} onChange={handleSeek} />
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="time-text">{duration}</span>
            </div>
          </div>
          <div className="player-right">
            <div className="volume-wrapper">
              <span>{volume === 0 ? "🔇" : "🔊"}</span>
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="volume-slider" />
            </div>
          </div>
        </footer>
      )}

      {feedbackMsg && <div className="toast-feedback">{feedbackMsg}</div>}

      {/* MODAL: CRIAR PLAYLIST */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-box modal-create-playlist" onClick={(e) => e.stopPropagation()}>
            <h3>{t("home.new_playlist")}</h3>
            <div className="cover-upload-area" onClick={() => coverInputRef.current?.click()}>
              {newPlaylistCoverPreview
                ? <img src={newPlaylistCoverPreview} className="cover-preview" alt="Capa" />
                : <div className="cover-placeholder"><span className="cover-icon">🖼️</span><span className="cover-label">{t("home.add_cover")}</span></div>
              }
              {newPlaylistCoverPreview && (
                <button className="cover-remove" onClick={(e) => { e.stopPropagation(); setNewPlaylistCover(null); setNewPlaylistCoverPreview(null); }}>✕</button>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
            <input type="text" placeholder={t("home.playlist_name")} value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()} autoFocus />
            <div className="modal-actions">
              <button onClick={closeCreateModal}>{t("home.cancel")}</button>
              <button className="btn-confirm" onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}>{t("home.create")}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR À PLAYLIST */}
      {showAddToPlaylist !== null && (
        <div className="modal-overlay" onClick={() => setShowAddToPlaylist(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{t("home.add_to_playlist")}</h3>
            {playlists.length === 0
              ? <p style={{ color: "#b3b3b3" }}>{t("home.no_playlists_created")}</p>
              : playlists.map((pl) => (
                <div key={pl.id} className="playlist-option" onClick={() => handleAddToPlaylist(pl.id, showAddToPlaylist)}>
                  {pl.cover_url ? <img src={formatUrl(pl.cover_url)} className="playlist-option-thumb" alt={pl.name} /> : <span>🎵</span>}
                  {pl.name}
                </div>
              ))
            }
            <div className="modal-actions">
              <button onClick={() => setShowAddToPlaylist(null)}>{t("home.close")}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMENTÁRIOS */}
      {showCommentsModal && (
        <div className="modal-overlay" onClick={() => setShowCommentsModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{t("home.comments")}</h3>
            {comments.length === 0 ? <p>{t("home.no_comments")}</p> : comments.map((c) => (
              <div key={c.id} className="comment-item">
                <strong>{c.username}</strong>
                <p>{c.content}</p>
              </div>
            ))}
            <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendComment()} placeholder={t("home.comment_placeholder")} />
            <button onClick={handleSendComment}>{t("home.send")}</button>
            <button onClick={() => setShowCommentsModal(false)}>{t("home.close")}</button>
          </div>
        </div>
      )}

      {showProfile && isLoggedIn && (
        <ProfilePanel
          onClose={() => setShowProfile(false)}
          formatUrl={formatUrl}
          getAuthHeaders={getAuthHeaders}
          onPlaySong={(song) => { handlePlay(song as unknown as Song); setShowProfile(false); }}
        />
      )}

      {showSettings && isLoggedIn && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          getAuthHeaders={getAuthHeaders}
          onLogout={handleLogout}
        />
      )}

    </div>
  );
};

export default Home;