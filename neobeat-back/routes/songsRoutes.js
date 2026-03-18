// routes/songsRoutes.js
const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// GET /api/songs - retorna todas as músicas
router.get("/", async (req, res) => {
  try {
    // Busca todas as músicas na tabela "songs"
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Erro ao buscar músicas:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Erro inesperado:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
