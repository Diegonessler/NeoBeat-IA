require("dotenv").config();
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabase");

const upload = multer({ storage: multer.memoryStorage() });

// Middleware auth
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Sem token" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Token inválido" });

  req.user = data.user;
  next();
};

// GET /api/me
router.get("/me", authMiddleware, async (req, res) => {
  const user = req.user;
  return res.json({
    id: user.id,
    email: user.email,
    username: user.user_metadata?.username || user.email?.split("@")[0],
    avatar_url: user.user_metadata?.avatar_url || null,
    created_at: user.created_at,
  });
});

// GET /api/me/liked-songs
router.get("/me/liked-songs", authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from("song_likes")
    .select("songs(id, title, artist, cover_url)")
    .eq("user_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });

  const songs = data.map((row) => row.songs);
  return res.json(songs);
});

// POST /api/me/avatar
router.post("/me/avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

  const fileName = `${req.user.id}_${Date.now()}${path.extname(req.file.originalname)}`;

  const { error: uploadError } = await supabase.storage
    .from("Avatars")
    .upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: urlData } = supabase.storage
    .from("Avatars")
    .getPublicUrl(fileName);

  const avatarUrl = urlData.publicUrl;

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    req.user.id,
    { user_metadata: { avatar_url: avatarUrl } }
  );

  if (updateError) return res.status(500).json({ error: updateError.message });

  return res.json({ avatar_url: avatarUrl });
});

module.exports = router;