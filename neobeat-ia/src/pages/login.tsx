import React, { useState } from "react";

// 1. Adicione o goToHome aqui na interface
interface LoginProps {
  goToRegister: () => void;
  goToHome: () => void; 
}

// 2. Desestruture o goToHome aqui
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
        setSuccessMessage(data.message);
        
        // 3. Redireciona para a Home após o sucesso!
        // Você pode colocar um pequeno delay se quiser que o usuário leia a mensagem de sucesso
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