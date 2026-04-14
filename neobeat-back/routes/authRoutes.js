  const express = require("express");
  const router = express.Router();
  const supabase = require("../config/supabase");

  // LOGIN
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error("Erro de autenticação Supabase:", error.message);
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      return res.status(200).json({
        message: "Login realizado com sucesso",
        user: data.user,
        session: data.session
      });

    } catch (err) {
      console.error("Erro inesperado no login:", err);
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
  });

  // REGISTRO
  router.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Nome, email e senha são obrigatórios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres" });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });

      if (error) {
        console.error("Erro ao registrar:", error.message);
        return res.status(400).json({ error: error.message });
      }

      return res.status(201).json({
        message: "Cadastro realizado com sucesso! Verifique seu email.",
        user: data.user
      });

    } catch (err) {
      console.error("Erro inesperado no registro:", err);
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
  });

  module.exports = router;