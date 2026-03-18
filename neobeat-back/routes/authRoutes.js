const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        error: "Email e senha são obrigatórios"
      });
    }

    // Tentativa de login no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("Erro de autenticação Supabase:", error.message);
      return res.status(401).json({
        error: error.message || "Email ou senha inválidos"
      });
    }

    // Login bem-sucedido
    return res.status(200).json({
      message: "Login realizado com sucesso",
      user: data.user,
      session: data.session
    });

  } catch (err) {
    console.error("Erro inesperado no login:", err);
    return res.status(500).json({
      error: "Erro interno no servidor"
    });
  }
});

module.exports = router;