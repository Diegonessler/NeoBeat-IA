import React from "react";

interface RegisterProps {
  goToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ goToLogin }) => {
  return (
    <div className="register-form">
      <h2>Cadastro</h2>
      <label htmlFor="name">Nome</label>
      <input id="name" type="text" placeholder="Seu nome" />

      <label htmlFor="email">E-mail</label>
      <input id="email" type="email" placeholder="seu@email.com" />

      <label htmlFor="password">Senha</label>
      <input id="password" type="password" placeholder="••••••••" />

      <button>Cadastrar</button>

      {/* Botão para voltar ao login */}
      <button 
        onClick={goToLogin} 
        style={{ marginTop: "10px", backgroundColor: "#007bff", color: "#fff" }}
      >
        Já tenho conta
      </button>
    </div>
  );
};

export default Register;
