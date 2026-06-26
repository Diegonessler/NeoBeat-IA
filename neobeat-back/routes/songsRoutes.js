const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../config/supabase");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Token inválido" });
  req.user = data.user;
  next();
};

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("songs").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  "/import",
  authenticate,
  upload.fields([
    { name: "mp3", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, artist, genre, lyrics } = req.body;
      const mp3File = req.files?.mp3?.[0];
      const coverFile = req.files?.cover?.[0];

      console.log("📦 Import recebido:", { title, artist, genre, mp3File: !!mp3File, coverFile: !!coverFile, lyrics: !!lyrics });

      if (!title || !artist || !mp3File || !coverFile || !lyrics) {
        return res.status(400).json({ error: "Preencha todos os campos." });
      }

      const mp3Ext = mp3File.originalname.split(".").pop();
      const mp3Path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${mp3Ext}`;

      const { error: mp3UploadError } = await supabase.storage
        .from("songs")
        .upload(mp3Path, mp3File.buffer, {
          contentType: mp3File.mimetype,
          upsert: false,
        });

      if (mp3UploadError) {
        console.error("❌ Erro upload mp3:", mp3UploadError.message);
        return res.status(500).json({ error: "Erro ao enviar o arquivo de música." });
      }

      const { data: mp3UrlData } = supabase.storage.from("songs").getPublicUrl(mp3Path);

      const coverExt = coverFile.originalname.split(".").pop();
      const coverPath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${coverExt}`;

      const { error: coverUploadError } = await supabase.storage
        .from("imagen")
        .upload(coverPath, coverFile.buffer, {
          contentType: coverFile.mimetype,
          upsert: false,
        });

      if (coverUploadError) {
        console.error("❌ Erro upload capa:", coverUploadError.message);
        return res.status(500).json({ error: "Erro ao enviar a imagem de capa." });
      }

      const { data: coverUrlData } = supabase.storage.from("imagen").getPublicUrl(coverPath);

      const { data, error } = await supabase
        .from("songs")
        .insert({
          title,
          artist,
          genre,
          lyrics,
          audio_url: mp3UrlData.publicUrl,
          cover_url: coverUrlData.publicUrl,
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Erro insert DB:", error.message);
        return res.status(500).json({ error: error.message });
      }

      console.log("✅ Música importada:", data.id);
      res.status(201).json(data);
    } catch (err) {
      console.error("❌ Erro geral no import:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

router.get("/:id/lyrics", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("songs").select("lyrics").eq("id", id).single();
  if (error) return res.status(404).json({ error: "Música não encontrada" });
  res.json({ lyrics: data?.lyrics || "" });
});

router.get("/:id/likes", async (req, res) => {
  const { id } = req.params;
  const { count } = await supabase
    .from("song_likes")
    .select("*", { count: "exact", head: true })
    .eq("song_id", id);
  res.json({ count: count || 0 });
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
    await supabase.from("song_likes").delete().eq("song_id", id).eq("user_id", user_id);
    return res.json({ liked: false });
  }
  await supabase.from("song_likes").insert({ song_id: id, user_id });
  res.json({ liked: true });
});

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
          username: meta?.name || meta?.display_name || meta?.full_name || email.split("@")[0] || "Usuário",
        };
      })
    );
    res.json(commentsWithNames);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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