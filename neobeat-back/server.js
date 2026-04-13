require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json());

// ARQUIVOS ESTÁTICOS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ROTAS DA API
app.use("/auth",          require("./routes/authRoutes"));
app.use("/api/songs",     require("./routes/songsRoutes"));
app.use("/api/stats",     require("./routes/statsRoutes"));
app.use("/api/rankings",  require("./routes/rankingRoutes"));
app.use("/api/playlists", require("./routes/playlistRoutes"));

// SERVIR O FRONTEND REACT (deve ficar APÓS as rotas de API)
app.use(express.static(path.join(__dirname, "../neobeat-ia/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../neobeat-ia/dist", "index.html"));
});

// INICIALIZAÇÃO
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor NeoBeat rodando na porta ${PORT}`);
  console.log(`📁 Músicas acessíveis em: http://localhost:${PORT}/uploads/`);
});