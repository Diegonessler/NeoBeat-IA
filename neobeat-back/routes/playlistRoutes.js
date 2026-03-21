const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const supabase = require("../config/supabase");

/* ============================================================
   MULTER — salva imagens em uploads/playlists/
   ============================================================ */
const uploadsDir = path.join(__dirname, "../uploads/playlists");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

/* ============================================================
   HELPER — extrai user_id do token JWT
   ============================================================ */
const getUserId = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
};

/* ============================================================
   GET /api/playlists
   ============================================================ */
router.get("/", async (req, res) => {
  try {
    const user_id = await getUserId(req);
    if (!user_id) return res.status(401).json({ error: "Não autorizado" });

    const { data, error } = await supabase
      .from("playlist")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar playlists:", error.message);
      return res.status(500).json({ error: "Erro ao buscar playlists" });
    }

    return res.status(200).json(data || []);
  } catch (err) {
    console.error("Erro inesperado:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

/* ============================================================
   POST /api/playlists
   ============================================================ */
router.post("/", upload.single("cover"), async (req, res) => {
  try {
    const user_id = await getUserId(req);
    if (!user_id) return res.status(401).json({ error: "Não autorizado" });

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Nome da playlist é obrigatório" });
    }

    const cover_url = req.file ? `/playlists/${req.file.filename}` : null;

    const { data, error } = await supabase
      .from("playlist")
      .insert({ name: name.trim(), user_id, cover_url })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar playlist:", error.message);
      return res.status(500).json({ error: "Erro ao criar playlist" });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("Erro inesperado:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

/* ============================================================
   GET /api/playlists/:id/songs
   ============================================================ */
router.get("/:id/songs", async (req, res) => {
  try {
    const user_id = await getUserId(req);
    if (!user_id) return res.status(401).json({ error: "Não autorizado" });

    const { id: playlist_id } = req.params;

    const { data: playlist, error: playlistError } = await supabase
      .from("playlist")
      .select("id")
      .eq("id", playlist_id)
      .eq("user_id", user_id)
      .single();

    if (playlistError || !playlist) {
      return res.status(403).json({ error: "Playlist não encontrada ou sem permissão" });
    }

    const { data, error } = await supabase
      .from("playlist_songs")
      .select("*, songs(*)")
      .eq("playlist_id", playlist_id)
      .order("position", { ascending: true });

    if (error) {
      console.error("Erro ao buscar músicas:", error.message);
      return res.status(500).json({ error: "Erro ao buscar músicas da playlist" });
    }

    return res.status(200).json(data || []);
  } catch (err) {
    console.error("Erro inesperado:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

/* ============================================================
   POST /api/playlists/:id/songs
   ============================================================ */
router.post("/:id/songs", async (req, res) => {
  try {
    const user_id = await getUserId(req);
    if (!user_id) return res.status(401).json({ error: "Não autorizado" });

    const { id: playlist_id } = req.params;
    const { song_id } = req.body;

    if (!song_id) {
      return res.status(400).json({ error: "song_id é obrigatório" });
    }

    const { data: playlist, error: playlistError } = await supabase
      .from("playlist")
      .select("id")
      .eq("id", playlist_id)
      .eq("user_id", user_id)
      .single();

    if (playlistError || !playlist) {
      return res.status(403).json({ error: "Playlist não encontrada ou sem permissão" });
    }

    const { data: existing } = await supabase
      .from("playlist_songs")
      .select("id")
      .eq("playlist_id", playlist_id)
      .eq("song_id", song_id)
      .single();

    if (existing) {
      return res.status(409).json({ error: "Música já está nesta playlist" });
    }

    const { data, error } = await supabase
      .from("playlist_songs")
      .insert({ playlist_id, song_id })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar música:", error.message);
      return res.status(500).json({ error: "Erro ao adicionar música à playlist" });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("Erro inesperado:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

/* ============================================================
   DELETE /api/playlists/:id/songs/:songId
   Remove uma música específica da playlist
   IMPORTANTE: deve vir ANTES do DELETE /:id
   ============================================================ */
router.delete("/:id/songs/:songId", async (req, res) => {
  console.log("🎯 DELETE song chamado:", req.params);
  try {
    const user_id = await getUserId(req);
    if (!user_id) return res.status(401).json({ error: "Não autorizado" });

    const { id: playlist_id, songId: song_id } = req.params;

    // Garante que a playlist pertence ao usuário
    const { data: playlist, error: playlistError } = await supabase
      .from("playlist")
      .select("id")
      .eq("id", playlist_id)
      .eq("user_id", user_id)
      .single();

    if (playlistError || !playlist) {
      return res.status(403).json({ error: "Playlist não encontrada ou sem permissão" });
    }

    // Converte song_id para número (vem como string na URL)
    const { error } = await supabase
      .from("playlist_songs")
      .delete()
      .eq("playlist_id", playlist_id)
      .eq("song_id", Number(song_id));

    if (error) {
      console.error("Erro ao remover música:", error.message);
      return res.status(500).json({ error: "Erro ao remover música da playlist" });
    }

    return res.status(200).json({ message: "Música removida da playlist" });
  } catch (err) {
    console.error("Erro inesperado:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

/* ============================================================
   DELETE /api/playlists/:id — remove a playlist inteira
   ============================================================ */
router.delete("/:id", async (req, res) => {
  try {
    const user_id = await getUserId(req);
    if (!user_id) return res.status(401).json({ error: "Não autorizado" });

    const { error } = await supabase
      .from("playlist")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", user_id);

    if (error) {
      console.error("Erro ao deletar playlist:", error.message);
      return res.status(500).json({ error: "Erro ao deletar playlist" });
    }

    return res.status(200).json({ message: "Playlist removida com sucesso" });
  } catch (err) {
    console.error("Erro inesperado:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

module.exports = router;