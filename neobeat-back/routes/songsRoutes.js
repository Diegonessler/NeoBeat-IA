const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");


// =========================
// 🎵 LISTAR MÚSICAS
// =========================
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("songs").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// 🎤 LETRA
// =========================
router.get("/:id/lyrics", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("songs")
    .select("lyrics")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ error: "Música não encontrada" });

  res.json({ lyrics: data?.lyrics || "" });
});

// =========================
// ❤️ LIKES (contagem)
// =========================
router.get("/:id/likes", async (req, res) => {
  const { id } = req.params;

  const { count } = await supabase
    .from("song_likes")
    .select("*", { count: "exact", head: true })
    .eq("song_id", id);

  res.json({ count: count || 0 });
});

// =========================
// 💬 COMENTÁRIOS
// =========================
rrouter.post("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ error: "Comentário vazio" });
    }

    const { data, error } = await supabase
      .from("song_comments")
      .insert({
        song_id: Number(id),
        user_id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro Supabase ao comentar:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("Erro na rota de comentário:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/songs/:id/plays
// GET /api/songs/:id/plays (CORRIGIDO)
router.get("/:id/plays", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("top_songs")
    .select("play_count")
    .eq("id", id)
    .single();

  if (error) {
    return res.json({ count: 0 });
  }

  res.json({ count: data.play_count || 0 });
});



router.post("/:id/like", authenticate, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const { data: existing } = await supabase
    .from("song_likes")
    .select("id")
    .eq("song_id", id)
    .eq("user_id", user_id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("song_likes")
      .delete()
      .eq("song_id", id)
      .eq("user_id", user_id);

    return res.json({ liked: false });
  }

  await supabase.from("song_likes").insert({ song_id: id, user_id });
  res.json({ liked: true });
});



router.post("/:id/comments", authenticate, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const user_id = req.user.id;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Comentário vazio" });
  }

  const { data, error } = await supabase
    .from("song_comments")
    .insert({
      song_id: id,
      user_id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: "Erro ao comentar" });
  }

  res.status(201).json(data);
});
module.exports = router;