import React, { useState } from "react";

interface RegisterProps {
  goToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ goToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name || !email || !password) {
      setErrorMessage("Preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Erro ao cadastrar.");
      } else {
        setSuccessMessage(data.message);
        setTimeout(() => goToLogin(), 2000);
      }
    } catch {
      setErrorMessage("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Cadastro</h2>

      <label htmlFor="name">Nome</label>
      <input
        id="name"
        type="text"
        placeholder="Seu nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label htmlFor="email">E-mail</label>
      <input
        id="email"
        type="email"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="password">Senha</label>
      <input
        id="password"
        type="password"
        placeholder="mínimo 6 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="login-btn" onClick={handleRegister} disabled={loading}>
        {loading ? "Cadastrando..." : "Cadastrar"}
      </button>

      <button className="register-btn" onClick={goToLogin}>
        Já tenho conta
      </button>

      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
    </div>
  );
};

export default Register;
