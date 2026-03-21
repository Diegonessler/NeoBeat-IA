const express = require("express"); 
const router = express.Router();   
const supabase = require("../config/supabase");


router.post("/play", async (req, res) => {
  const { song_id } = req.body;

  // Validação básica
  if (!song_id) {
    return res.status(400).json({ error: "ID da música não enviado" });
  }

  try {
    const { error } = await supabase
      .from('play_history')
      .insert([{ song_id: Number(song_id) }]); // Garante que é um número
    
    if (error) {
      console.error("❌ ERRO NO SUPABASE:", error.message); // OLHE O TERMINAL DO VS CODE
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: "Sucesso" });
  } catch (err) {
    console.error("❌ ERRO INTERNO:", err.message);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

module.exports = router; 