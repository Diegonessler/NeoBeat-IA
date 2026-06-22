const express = require("express");
const router = express.Router();
const  supabase = require("../config/supabase");

router.get("/top-songs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('songs')// Nome da View no banco
      .select('*')
      .limit(10);
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;