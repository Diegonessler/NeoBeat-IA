require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/auth",          require("./routes/authRoutes"));
app.use("/api/songs",     require("./routes/songsRoutes"));
app.use("/api/stats",     require("./routes/statsRoutes"));
app.use("/api/rankings",  require("./routes/rankingRoutes"));
app.use("/api/playlists", require("./routes/playlistRoutes"));
app.use("/api",           require("./routes/userRoutes"));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../neobeat-ia/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../neobeat-ia/dist", "index.html"));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor NeoBeat rodando na porta ${PORT}`);
  console.log(`📁 Músicas acessíveis em: http://localhost:${PORT}/uploads/`);
});