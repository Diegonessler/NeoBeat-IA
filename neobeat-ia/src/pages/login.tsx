import React, { useState } from "react";

interface LoginProps {
  goToRegister: () => void;
  goToHome: () => void;
}

const Login: React.FC<LoginProps> = ({ goToRegister, goToHome }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Erro ao fazer login");
      } else {
        // SALVA O TOKEN — isso faz as rotas protegidas funcionarem
        if (data.session?.access_token) {
          localStorage.setItem("neobeat_token", data.session.access_token);
        }

        setSuccessMessage(data.message);
        setTimeout(() => {
          goToHome();
        }, 1000);
      }

      console.log("Login:", data);
    } catch (error) {
      console.error("Erro no login", error);
      setErrorMessage("Erro inesperado. Tente novamente.");
    }
  };

  return (
    <div className="login-container">
      <h2>Entrar</h2>

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
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="login-btn" onClick={handleLogin}>
        Acessar
      </button>

      <button className="register-btn" onClick={goToRegister}>
        Cadastrar
      </button>

      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
    </div>
  );
};

export default Login;