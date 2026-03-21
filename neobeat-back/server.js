require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// MIDDLEWARES (Configuração obrigatória no topo)
app.use(cors()); 
app.use(express.json()); 

// ARQUIVOS ESTÁTICOS (Permite tocar o .mp3 no navegador)
// Certifique-se de que a pasta 'uploads' exista na raiz do seu backend
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 

// ROTAS DA API
app.use("/auth", require("./routes/authRoutes"));
app.use("/api/songs", require("./routes/songsRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));
app.use("/api/rankings", require("./routes/rankingRoutes"));

// INICIALIZAÇÃO
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor NeoBeat rodando na porta ${PORT}`);
  console.log(`📁 Músicas acessíveis em: http://localhost:${PORT}/uploads/`);
});
