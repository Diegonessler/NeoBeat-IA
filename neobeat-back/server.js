// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas existentes
app.use("/auth", require("./routes/authRoutes"));

// **Nova rota de músicas**
app.use("/api/songs", require("./routes/songsRoutes"));

// Porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
