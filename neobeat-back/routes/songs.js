const express = require("express");
const router = express.Router();
const supabase = require("../supabase"); // seu client que usa service key

// GET /api/songs → retorna todas as músicas
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("songs").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
