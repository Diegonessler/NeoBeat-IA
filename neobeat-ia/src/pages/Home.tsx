import React, { useEffect, useState, useRef } from "react";
import "./Home.css";

interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string; // Adicionado para suportar a nova coluna
  cover_url: string;
  audio_url: string;
}

const Home: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/songs");
        const data: Song[] = await res.json();
        setSongs(data);
        setFilteredSongs(data);
      } catch (error) {
        console.error("Erro ao buscar músicas:", error);
      }
    };
    fetchSongs();
  }, []);

  // 🔍 Filtro de busca (Título, Artista ou Gênero)
  useEffect(() => {
    const filtered = songs.filter(
      (song) =>
        song.title.toLowerCase().includes(search.toLowerCase()) ||
        song.artist.toLowerCase().includes(search.toLowerCase()) ||
        (song.genre && song.genre.toLowerCase().includes(search.toLowerCase()))
    );
    setFilteredSongs(filtered);
  }, [search, songs]);

  const scrollRow = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "right" ? 300 : -300;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="spotify-layout">
      {/* TOP BAR - Classes sincronizadas com o CSS */}
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
          <button className="btn-config">Config</button>
        </div>
      </header>

      {/* SIDEBAR LEFT */}
      <aside className="sidebar-left">
        <div className="logo-text">EchoFlow</div>
        <nav className="side-menu">
          <div className="menu-item active">Início</div>
          <div className="menu-item">Buscar</div>
          <div className="menu-item">Sua Biblioteca</div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <section className="hero-banner">
          <h1>Descubra novas músicas</h1>
        </section>

        <section className="songs-row-container">
          <h2>As Mais Ouvidas</h2>

          <button className="nav-arrow left" onClick={() => scrollRow("left")}>
            ◀
          </button>
          <button className="nav-arrow right" onClick={() => scrollRow("right")}>
            ▶
          </button>

          <div className="scroll-grid" ref={scrollRef}>
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                className="spotify-card"
                onClick={() => setCurrentSong(song)}
              >
                <div className="img-container">
                  <img src={song.cover_url} alt={song.title} />
                </div>

                <div className="card-info">
                  <strong>{song.title}</strong>
                  <p>{song.artist}</p>
                  {song.genre && <span className="genre-tag">{song.genre}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* SIDEBAR RIGHT */}
      <aside className="sidebar-right">
        {currentSong && (
          <div className="info-wrapper">
            <img src={currentSong.cover_url} className="current-art" alt="Capa" />
            <h3>{currentSong.title}</h3>
            <p>{currentSong.artist}</p>
          </div>
        )}
      </aside>

      {/* PLAYER BAR */}
      {currentSong && (
        <footer className="player-bar">
          <div className="player-info">
            <strong>{currentSong.title}</strong>
            <span>{currentSong.artist}</span>
          </div>
          <audio controls src={currentSong.audio_url} />
        </footer>
      )}
    </div>
  );
};

export default Home;