const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// Middleware de autenticação inline
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Token inválido" });
  req.user = data.user;
  next();
};

// 🎵 LISTAR MÚSICAS
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("songs").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🎤 LETRA
router.get("/:id/lyrics", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("songs").select("lyrics").eq("id", id).single();
  if (error) return res.status(404).json({ error: "Música não encontrada" });
  res.json({ lyrics: data?.lyrics || "" });
});

// ❤️ LIKES (contagem)
router.get("/:id/likes", async (req, res) => {
  const { id } = req.params;
  const { count } = await supabase
    .from("song_likes")
    .select("*", { count: "exact", head: true })
    .eq("song_id", id);
  res.json({ count: count || 0 });
});

// ❤️ LIKE/UNLIKE
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
    await supabase.from("song_likes").delete().eq("song_id", id).eq("user_id", user_id);
    return res.json({ liked: false });
  }
  await supabase.from("song_likes").insert({ song_id: id, user_id });
  res.json({ liked: true });
});

// 💬 POST COMENTÁRIO
router.post("/:id/comments", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;
    if (!content?.trim()) return res.status(400).json({ error: "Comentário vazio" });
    const { data, error } = await supabase
      .from("song_comments")
      .insert({ song_id: Number(id), user_id, content: content.trim() })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 💬 GET COMENTÁRIOS
router.get("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("song_comments")
      .select("*")
      .eq("song_id", id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const commentsWithNames = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: userData } = await supabase.auth.admin.getUserById(comment.user_id);
        const meta = userData?.user?.user_metadata;
        const email = userData?.user?.email || "";

        return {
          ...comment,
          // ✅ Pega o nome real, nunca mostra o email
          username: meta?.name
            || meta?.display_name
            || meta?.full_name
            || email.split("@")[0]
            || "Usuário",
        };
      })
    );

    res.json(commentsWithNames);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🎧 PLAYS
router.get("/:id/plays", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("top_songs")
    .select("play_count")
    .eq("id", id)
    .single();
  if (error) return res.json({ count: 0 });
  res.json({ count: data.play_count || 0 });
});

module.exports = router;