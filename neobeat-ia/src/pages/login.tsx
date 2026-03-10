import React from "react";

interface LoginProps {
  goToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ goToRegister }) => {
  return (
    <div className="login-container">
      <h2>Entrar</h2>

      <label htmlFor="email">E-mail</label>
      <input id="email" type="email" placeholder="seu@email.com" />

      <label htmlFor="password">Senha</label>
      <input id="password" type="password" placeholder="••••••••" />

      <button className="login-btn">Acessar</button>
      <button className="register-btn" onClick={goToRegister}>
        Cadastrar
      </button>
    </div>
  );
};

export default Login;
