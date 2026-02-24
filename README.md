# 🎵 NeoBeat IA

Plataforma web para compartilhamento e descoberta de músicas geradas por Inteligência Artificial.

---

## 📌 Sobre o Projeto

Ferramentas como a Suno permitem que usuários criem músicas utilizando Inteligência Artificial. No entanto, essas plataformas são focadas principalmente na geração do conteúdo, não na experiência social e de descoberta musical.

O **NeoBeat IA** surge como uma solução para esse cenário, oferecendo uma plataforma dedicada exclusivamente ao compartilhamento, organização e descoberta de músicas criadas por IA em um formato semelhante ao Spotify.

---

## 🎯 Problema Identificado

- Falta de um ambiente social voltado para músicas geradas por IA  
- Ausência de sistema de ranking, curtidas e playlists específicas  
- Dificuldade de descoberta de novos criadores de música por IA  

---

## 💡 Solução Proposta

Desenvolver uma plataforma web onde:

- Usuários possam publicar músicas geradas em ferramentas externas (ex: Suno)
- Outros usuários possam ouvir, curtir, salvar em playlists e seguir criadores
- O sistema apresente ranking e feed personalizado

---

## 👥 Público-Alvo

- Criadores de música com IA  
- Entusiastas de tecnologia  
- Usuários interessados em novas experiências musicais  

---

# 📌 Requisitos do Sistema

## 📍 Requisitos Funcionais (RF)

- **RF01** – Permitir cadastro de usuários  
- **RF02** – Permitir login e autenticação segura  
- **RF03** – Publicação de músicas (upload ou link externo)  
- **RF04** – Reprodução das músicas  
- **RF05** – Curtir músicas  
- **RF06** – Salvar músicas em playlists  
- **RF07** – Seguir outros usuários  
- **RF08** – Exibir ranking das músicas mais curtidas  
- **RF09** – Permitir busca por nome, gênero ou criador  

---

## 📍 Requisitos Não Funcionais (RNF)

- **RNF01** – Aplicação responsiva (desktop e mobile)  
- **RNF02** – Tempo de carregamento inferior a 3 segundos  
- **RNF03** – Autenticação segura utilizando JWT  
- **RNF04** – Integridade e consistência no banco de dados  
- **RNF05** – Escalabilidade para múltiplos usuários simultâneos  

---

# 🏗️ Arquitetura do Sistema

O sistema seguirá o padrão **Cliente-Servidor**:

- **Frontend** → Interface web para interação do usuário  
- **Backend** → API REST para gerenciamento de dados  
- **Banco de Dados** → Armazenamento de usuários, músicas e playlists  

---

# 🛠️ Tecnologias Utilizadas

## 🎨 Frontend
- React.js  
Justificativa: Criação de interfaces modernas, reativas e similares a plataformas de streaming.

## ⚙️ Backend
- Node.js + Express  
Justificativa: Desenvolvimento de API REST rápida e escalável.

## 🗄️ Banco de Dados
- PostgreSQL  
Justificativa: Banco relacional robusto, ideal para relacionamentos complexos.

## ☁️ Armazenamento
- AWS S3 ou Cloudinary  
Justificativa: Armazenamento seguro e escalável de arquivos de áudio.

---

# 👨‍💻 Organização das Tarefas

## 👥 Desenvolvimento em individual

### 🔹 Integrante 1 – Backend
- Interface do usuário  
- Player de música  
- Tela de feed  
- Sistema de playlists  

- Modelagem do banco de dados  
- Desenvolvimento da API  
- Sistema de autenticação  
- Integração com armazenamento  

---

# 📊 Funcionalidades Futuras

- Sistema de recomendação baseado em curtidas  
- Dashboard do criador com estatísticas  
- Sistema de comentários  
- Algoritmo de tendências (Trending)  

---

# 🚀 Objetivo Acadêmico

Este projeto tem como objetivo aplicar conceitos de:

- Engenharia de Software  
- Levantamento de requisitos  
- Arquitetura Web  
- Banco de Dados  
- Desenvolvimento Full Stack  

---

## 📌 Status do Projeto

🚧 Em desenvolvimento
