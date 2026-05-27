/* ============================================================
   SETTINGS PANEL — NeoBeat
   Tema GLOBAL (Home + Perfil + App inteiro)
   ============================================================ */

import React, { useEffect, useState } from "react";

interface SettingsPanelProps {
  onClose: () => void;
  getAuthHeaders: () => Record<string, string>;
  onLogout?: () => void;
}

type AudioQuality = "low" | "normal" | "high" | "lossless";
type Language = "pt-BR" | "en-US" | "es-ES";
type Theme = "dark" | "light";

const QUALITY_LABELS: Record<AudioQuality, string> = {
  low: "Baixa (96 kbps)",
  normal: "Normal (128 kbps)",
  high: "Alta (320 kbps)",
  lossless: "Lossless (FLAC)",
};

const LANG_LABELS: Record<Language, string> = {
  "pt-BR": "🇧🇷 Português (Brasil)",
  "en-US": "🇺🇸 English (US)",
  "es-ES": "🇪🇸 Español",
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  getAuthHeaders,
  onLogout,
}) => {
  /* =========================
     STATES
  ========================= */

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "dark";
  });

  const [language, setLanguage] =
    useState<Language>("pt-BR");

  const [quality, setQuality] =
    useState<AudioQuality>("high");

  const [oldPassword, setOldPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPass, setConfirmPass] =
    useState("");

  const [savingPass, setSavingPass] =
    useState(false);

  const [passMsg, setPassMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);

  const [activeSection, setActiveSection] =
    useState<"audio" | "appearance" | "account">(
      "audio"
    );

  /* =========================
     APLICA TEMA GLOBAL
  ========================= */

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    document.body.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
  };

  /* =========================
     SENHA
  ========================= */

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPass) {
      setPassMsg({
        text: "Preencha todos os campos.",
        ok: false,
      });
      return;
    }

    if (newPassword !== confirmPass) {
      setPassMsg({
        text: "As senhas não coincidem.",
        ok: false,
      });
      return;
    }

    if (newPassword.length < 6) {
      setPassMsg({
        text: "A senha deve ter ao menos 6 caracteres.",
        ok: false,
      });
      return;
    }

    setSavingPass(true);

    try {
      const res = await fetch("/api/me/password", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPassMsg({
          text: "Senha alterada com sucesso! ✅",
          ok: true,
        });

        setOldPassword("");
        setNewPassword("");
        setConfirmPass("");
      } else {
        setPassMsg({
          text:
            data.error ||
            "Erro ao alterar senha.",
          ok: false,
        });
      }
    } catch {
      setPassMsg({
        text: "Erro de conexão.",
        ok: false,
      });
    } finally {
      setSavingPass(false);

      setTimeout(() => {
        setPassMsg(null);
      }, 3000);
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    onLogout?.();
    onClose();
  };

  const sections = [
    { key: "audio", label: "🎧 Áudio" },
    { key: "appearance", label: "🎨 Aparência" },
    { key: "account", label: "🔐 Conta" },
  ] as const;

  /* =========================
     RENDER
  ========================= */

  return (
    <>
      <style>{`
        .nb-panel-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.65);
          backdrop-filter: blur(6px);
          z-index: 999;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nb-panel {
          width: min(540px, 94vw);

          background: var(--bg-card);
          color: var(--text-main);

          border: 1px solid var(--border-color);
          border-radius: 20px;

          overflow: hidden;

          box-shadow: 0 30px 80px rgba(0,0,0,.6);

          font-family: "Segoe UI", sans-serif;

          display: flex;
          flex-direction: column;
        }

        .nb-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 22px 24px 16px;

          border-bottom: 1px solid
            var(--border-color);
        }

        .nb-panel-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;

          color: #00d2ff;
        }

        .nb-close-btn {
          width: 32px;
          height: 32px;

          border: none;
          border-radius: 50%;

          background: var(--bg-main);
          color: var(--text-secondary);

          cursor: pointer;

          transition: .15s;
        }

        .nb-close-btn:hover {
          opacity: .8;
        }

        .nb-settings-layout {
          display: flex;
          min-height: 340px;
        }

        .nb-settings-nav {
          width: 150px;

          border-right: 1px solid
            var(--border-color);

          padding: 14px 0;
        }

        .nb-settings-nav-item {
          width: 100%;

          padding: 12px 18px;

          border: none;
          background: transparent;

          color: var(--text-secondary);

          text-align: left;

          cursor: pointer;

          transition: .15s;
        }

        .nb-settings-nav-item:hover {
          background: var(--bg-main);
          color: var(--text-main);
        }

        .nb-settings-nav-item.active {
          background: rgba(0,210,255,.12);
          color: #00d2ff;
        }

        .nb-settings-body {
          flex: 1;
          padding: 22px;
        }

        .nb-section-title {
          margin-bottom: 14px;

          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;

          color: var(--text-secondary);
        }

        .nb-quality-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;

          margin-bottom: 20px;
        }

        .nb-quality-pill,
        .nb-theme-btn {
          padding: 12px;

          border-radius: 12px;

          border: 1px solid
            var(--border-color);

          background: var(--bg-main);
          color: var(--text-main);

          cursor: pointer;

          transition: .15s;
        }

        .nb-quality-pill.active,
        .nb-theme-btn.active {
          border-color: #00d2ff;
          color: #00d2ff;
        }

        .nb-theme-row {
          display: flex;
          gap: 10px;

          margin-bottom: 24px;
        }

        .nb-select,
        .nb-input {
          width: 100%;

          padding: 12px 14px;
          margin-bottom: 12px;

          border-radius: 10px;

          border: 1px solid
            var(--border-color);

          background: var(--bg-main);
          color: var(--text-main);

          box-sizing: border-box;
        }

        .nb-select:focus,
        .nb-input:focus {
          outline: none;
          border-color: #00d2ff;
        }

        .nb-btn-primary {
          width: 100%;

          padding: 12px;

          border: none;
          border-radius: 10px;

          background: linear-gradient(
            135deg,
            #00d2ff,
            #0077ff
          );

          color: white;
          font-weight: 700;

          cursor: pointer;
        }

        .nb-btn-primary:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .nb-pass-msg {
          margin-top: 12px;
          padding: 10px;

          border-radius: 10px;

          text-align: center;
          font-size: 13px;
        }

        .nb-pass-msg.ok {
          background: #0d2b1f;
          color: #4ade80;
        }

        .nb-pass-msg.err {
          background: #2b0d0d;
          color: #f87171;
        }

        .nb-panel-footer {
          padding: 16px 24px;

          border-top: 1px solid
            var(--border-color);
        }

        .nb-btn-logout {
          width: 100%;

          padding: 12px;

          border-radius: 10px;

          border: 1px solid
            var(--border-color);

          background: var(--bg-main);

          color: #f87171;

          font-weight: 700;

          cursor: pointer;
        }

        .nb-btn-logout:hover {
          background: rgba(248,113,113,.1);
        }
      `}</style>

      <div
        className="nb-panel-overlay"
        onClick={onClose}
      >
        <div
          className="nb-panel"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="nb-panel-header">
            <span className="nb-panel-title">
              Configurações
            </span>

            <button
              className="nb-close-btn"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {/* BODY */}
          <div className="nb-settings-layout">
            <nav className="nb-settings-nav">
              {sections.map((s) => (
                <button
                  key={s.key}
                  className={`nb-settings-nav-item ${
                    activeSection === s.key
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveSection(s.key)
                  }
                >
                  {s.label}
                </button>
              ))}
            </nav>

            <div className="nb-settings-body">
              {/* AUDIO */}
              {activeSection === "audio" && (
                <>
                  <p className="nb-section-title">
                    Qualidade de streaming
                  </p>

                  <div className="nb-quality-grid">
                    {(
                      Object.keys(
                        QUALITY_LABELS
                      ) as AudioQuality[]
                    ).map((q) => (
                      <button
                        key={q}
                        className={`nb-quality-pill ${
                          quality === q
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setQuality(q)
                        }
                      >
                        {QUALITY_LABELS[q]}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* APPEARANCE */}
              {activeSection === "appearance" && (
                <>
                  <p className="nb-section-title">
                    Tema
                  </p>

                  <div className="nb-theme-row">
                    <button
                      className={`nb-theme-btn ${
                        theme === "dark"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleThemeChange(
                          "dark"
                        )
                      }
                    >
                      🌙 Escuro
                    </button>

                    <button
                      className={`nb-theme-btn ${
                        theme === "light"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleThemeChange(
                          "light"
                        )
                      }
                    >
                      ☀️ Claro
                    </button>
                  </div>

                  <p className="nb-section-title">
                    Idioma
                  </p>

                  <select
                    className="nb-select"
                    value={language}
                    onChange={(e) =>
                      setLanguage(
                        e.target
                          .value as Language
                      )
                    }
                  >
                    {(
                      Object.keys(
                        LANG_LABELS
                      ) as Language[]
                    ).map((l) => (
                      <option
                        key={l}
                        value={l}
                      >
                        {LANG_LABELS[l]}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {/* ACCOUNT */}
              {activeSection === "account" && (
                <>
                  <p className="nb-section-title">
                    Alterar senha
                  </p>

                  <input
                    type="password"
                    className="nb-input"
                    placeholder="Senha atual"
                    value={oldPassword}
                    onChange={(e) =>
                      setOldPassword(
                        e.target.value
                      )
                    }
                  />

                  <input
                    type="password"
                    className="nb-input"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                  />

                  <input
                    type="password"
                    className="nb-input"
                    placeholder="Confirmar nova senha"
                    value={confirmPass}
                    onChange={(e) =>
                      setConfirmPass(
                        e.target.value
                      )
                    }
                  />

                  <button
                    className="nb-btn-primary"
                    onClick={
                      handleChangePassword
                    }
                    disabled={savingPass}
                  >
                    {savingPass
                      ? "Salvando..."
                      : "Salvar senha"}
                  </button>

                  {passMsg && (
                    <div
                      className={`nb-pass-msg ${
                        passMsg.ok
                          ? "ok"
                          : "err"
                      }`}
                    >
                      {passMsg.text}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="nb-panel-footer">
            <button
              className="nb-btn-logout"
              onClick={handleLogout}
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;