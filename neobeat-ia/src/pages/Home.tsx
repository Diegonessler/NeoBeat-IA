import React, { useEffect, useState, useRef } from "react";
import "./Home.css";

interface Song {
  id: number;
  title: string;
  artist: string;
  cover_url: string;
  audio_url: string;
}

const Home: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Busca músicas do backend
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/songs");
        const data: Song[] = await res.json();
        console.log("Músicas recebidas:", data);
        setSongs(data);
        if (data.length > 0) setCurrentSong(data[0]); // Toca a primeira por padrão
      } catch (err) {
        console.error("Erro ao buscar músicas:", err);
      }
    };
    fetchSongs();
  }, []);

  const scrollRow = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "right" ? 300 : -300;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="spotify-layout">
      {/* BARRA SUPERIOR FIXA */}
      <header className="top-bar">
        <div className="top-bar-left">NeoBeat-IA</div>
        <div className="top-bar-right">
          <button className="btn-top">Perfil</button>
          <button className="btn-top">Configurações</button>
        </div>
      </header>

      {/* COLUNA ESQUERDA */}
      <aside className="sidebar-left">
        <div className="logo-text">EchoFlow</div>
        <nav className="side-menu">
          <div className="menu-item active">Início</div>
          <div className="menu-item">Buscar</div>
          <div className="menu-item">Sua Biblioteca</div>
        </nav>
      </aside>

      {/* COLUNA CENTRAL */}
      <main className="main-content">
        {/* Barra de busca */}
        <header className="top-nav">
          <input
            type="text"
            placeholder="O que você quer ouvir?"
            className="search-input"
          />
        </header>

        {/* Hero Banner */}
        <section className="hero-banner">
          <h1>Descubra novas músicas</h1>
          <button className="btn-play-hero">Ouvir Agora</button>
        </section>

        {/* SEÇÃO DE CARDS */}
        <section className="songs-row-container">
          <div className="shelf-header">
            <h2>As Mais Ouvidas</h2>
          </div>

          {/* Setas de navegação */}
          <button className="nav-arrow left" onClick={() => scrollRow("left")}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <button className="nav-arrow right" onClick={() => scrollRow("right")}>
            <i className="fas fa-chevron-right"></i>
          </button>

          {/* Grid de músicas */}
          <div className="scroll-grid" ref={scrollRef}>
            {songs.map((song, index) => (
              <div
                key={song.id}
                className="spotify-card"
                onClick={() => setCurrentSong(song)}
              >
                <div className="img-container">
                  <img src={song.cover_url} alt={song.title} />
                  <span className="badge-number">{index + 1}</span>
                </div>
                <div className="card-info">
                  <strong>{song.artist}</strong>
                  <p>{song.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* COLUNA DIREITA */}
      <aside className="sidebar-right">
        {currentSong && (
          <div className="info-wrapper">
            <img src={currentSong.cover_url} alt="Capa" className="current-art" />
            <h3>{currentSong.title}</h3>
            <p>{currentSong.artist}</p>
            <button className="btn-follow">Seguir artista</button>
          </div>
        )}
      </aside>

      {/* PLAYER FIXO */}
      {currentSong && (
        <footer className="player-bar">
          <div className="player-track">
            {currentSong.title} - {currentSong.artist}
          </div>
          <audio controls src={currentSong.audio_url} autoPlay />
        </footer>
      )}
    </div>
  );
};

export default Home;
