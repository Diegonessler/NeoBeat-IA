/* ============================================================
   SETTINGS PANEL — NeoBeat
   Props: onClose, getAuthHeaders, onLogout
   ============================================================ */
import React, { useState } from "react";

interface SettingsPanelProps {
  onClose: () => void;
  getAuthHeaders: () => Record<string, string>;
  onLogout?: () => void;
}

type AudioQuality = "low" | "normal" | "high" | "lossless";
type Language = "pt-BR" | "en-US" | "es-ES";
type Theme = "dark" | "light";

const QUALITY_LABELS: Record<AudioQuality, string> = {
  low:      "Baixa  (96 kbps)",
  normal:   "Normal (128 kbps)",
  high:     "Alta   (320 kbps)",
  lossless: "Lossless (FLAC)",
};

const LANG_LABELS: Record<Language, string> = {
  "pt-BR": "🇧🇷  Português (Brasil)",
  "en-US": "🇺🇸  English (US)",
  "es-ES": "🇪🇸  Español",
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  getAuthHeaders,
  onLogout,
}) => {
  /* ---- states ---- */
  const [theme, setTheme]             = useState<Theme>("dark");
  const [language, setLanguage]       = useState<Language>("pt-BR");
  const [quality, setQuality]         = useState<AudioQuality>("high");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg]         = useState<{ text: string; ok: boolean } | null>(null);
  const [savingPass, setSavingPass]   = useState(false);

  const [activeSection, setActiveSection] = useState<"audio" | "appearance" | "account">("audio");

  /* ---- handlers ---- */
  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPass) {
      setPassMsg({ text: "Preencha todos os campos.", ok: false }); return;
    }
    if (newPassword !== confirmPass) {
      setPassMsg({ text: "As senhas não coincidem.", ok: false }); return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ text: "A senha deve ter ao menos 6 caracteres.", ok: false }); return;
    }
    setSavingPass(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassMsg({ text: "Senha alterada com sucesso! ✅", ok: true });
        setOldPassword(""); setNewPassword(""); setConfirmPass("");
      } else {
        setPassMsg({ text: data.error || "Erro ao alterar senha.", ok: false });
      }
    } catch {
      setPassMsg({ text: "Erro de conexão.", ok: false });
    } finally {
      setSavingPass(false);
      setTimeout(() => setPassMsg(null), 3000);
    }
  };

  /* Chama o handler de logout vindo do Home (que limpa tudo e redireciona) */
  const handleLogout = () => {
    onLogout?.();
    onClose();
  };

  /* ---- render ---- */
  const sections = [
    { key: "audio",      label: "🎧  Áudio"    },
    { key: "appearance", label: "🎨  Aparência" },
    { key: "account",    label: "🔐  Conta"     },
  ] as const;

  return (
    <>
      <style>{`
        .nb-panel-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.65);
          backdrop-filter: blur(6px);
          z-index: 999;
          display: flex; align-items: center; justify-content: center;
          animation: nb-fade-in .2s ease;
        }
        @keyframes nb-fade-in { from { opacity:0 } to { opacity:1 } }

        .nb-panel {
          background: #111;
          border: 1px solid #222;
          border-radius: 20px;
          max-height: 88vh;
          overflow-y: auto;
          box-shadow: 0 30px 80px rgba(0,0,0,.8);
          animation: nb-slide-up .25s cubic-bezier(.34,1.56,.64,1);
          font-family: 'Segoe UI', sans-serif;
          color: #fff;
          display: flex;
          flex-direction: column;
        }
        @keyframes nb-slide-up {
          from { opacity:0; transform: translateY(30px) scale(.97) }
          to   { opacity:1; transform: translateY(0)    scale(1)   }
        }

        .nb-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 24px 16px;
          border-bottom: 1px solid #1e1e1e;
          flex-shrink: 0;
        }
        .nb-panel-title {
          font-size: 13px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #00d2ff;
        }
        .nb-close-btn {
          background: #1e1e1e; border: none; color: #888;
          width: 32px; height: 32px; border-radius: 50%;
          cursor: pointer; font-size: 16px; display: flex;
          align-items: center; justify-content: center;
          transition: background .15s, color .15s;
        }
        .nb-close-btn:hover { background: #2a2a2a; color: #fff; }

        .nb-settings-layout {
          display: flex; flex: 1; min-height: 320px;
        }
        .nb-settings-nav {
          width: 140px; flex-shrink: 0;
          border-right: 1px solid #1e1e1e;
          padding: 16px 0;
        }
        .nb-settings-nav-item {
          display: block; width: 100%;
          background: none; border: none; color: #666;
          font-size: 12px; font-weight: 600; letter-spacing: .5px;
          text-align: left; padding: 11px 18px;
          cursor: pointer; border-radius: 0;
          transition: color .15s, background .15s;
          white-space: nowrap;
        }
        .nb-settings-nav-item:hover  { color: #fff; background: #181818; }
        .nb-settings-nav-item.active { color: #00d2ff; background: #141414; }

        .nb-settings-body {
          flex: 1; padding: 20px 24px 28px; overflow-y: auto;
        }

        .nb-section-title {
          font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase;
          color: #555; margin: 0 0 14px; font-weight: 700;
        }

        .nb-quality-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 8px; margin-bottom: 24px;
        }
        .nb-quality-pill {
          background: #181818; border: 1.5px solid #282828;
          border-radius: 10px; color: #888; font-size: 12px;
          font-weight: 600; padding: 10px 12px; cursor: pointer;
          transition: border-color .15s, color .15s, background .15s;
          text-align: left; font-family: 'Segoe UI', sans-serif;
        }
        .nb-quality-pill:hover  { border-color: #444; color: #ddd; }
        .nb-quality-pill.active { border-color: #00d2ff; color: #00d2ff; background: #0d1f24; }

        .nb-select {
          width: 100%; background: #181818; border: 1.5px solid #282828;
          border-radius: 10px; color: #ccc; font-size: 13px;
          padding: 10px 14px; cursor: pointer; margin-bottom: 24px;
          transition: border-color .15s;
          font-family: 'Segoe UI', sans-serif;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
        }
        .nb-select:focus { outline: none; border-color: #00d2ff; }

        .nb-theme-row {
          display: flex; gap: 10px; margin-bottom: 24px;
        }
        .nb-theme-btn {
          flex: 1; padding: 12px 8px; border-radius: 12px; border: 1.5px solid #282828;
          background: #181818; color: #888; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all .15s;
          font-family: 'Segoe UI', sans-serif;
        }
        .nb-theme-btn:hover  { border-color: #444; color: #ddd; }
        .nb-theme-btn.active { border-color: #00d2ff; color: #00d2ff; background: #0d1f24; }

        .nb-input {
          width: 100%; background: #181818; border: 1.5px solid #282828;
          border-radius: 10px; color: #ccc; font-size: 13px;
          padding: 10px 14px; margin-bottom: 10px;
          transition: border-color .15s; box-sizing: border-box;
          font-family: 'Segoe UI', sans-serif;
        }
        .nb-input:focus { outline: none; border-color: #00d2ff; }
        .nb-input::placeholder { color: #444; }

        .nb-btn-primary {
          width: 100%; padding: 11px; border-radius: 10px;
          background: linear-gradient(135deg, #00d2ff, #0077ff);
          border: none; color: #fff; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: opacity .15s; margin-top: 2px;
          font-family: 'Segoe UI', sans-serif;
        }
        .nb-btn-primary:hover:not(:disabled) { opacity: .85; }
        .nb-btn-primary:disabled { opacity: .4; cursor: not-allowed; }

        .nb-pass-msg {
          font-size: 12px; padding: 8px 12px; border-radius: 8px;
          margin-top: 10px; text-align: center;
        }
        .nb-pass-msg.ok  { background: #0d2b1f; color: #4ade80; }
        .nb-pass-msg.err { background: #2b0d0d; color: #f87171; }

        .nb-divider {
          border: none; border-top: 1px solid #1e1e1e;
          margin: 20px 0;
        }

        /* Rodapé com logout — sempre visível */
        .nb-panel-footer {
          padding: 12px 24px 20px;
          border-top: 1px solid #1e1e1e;
          flex-shrink: 0;
        }

        .nb-btn-logout {
          width: 100%; padding: 11px; border-radius: 10px;
          background: #1e1e1e; border: 1.5px solid #2a2a2a;
          color: #f87171; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: background .15s, border-color .15s;
          font-family: 'Segoe UI', sans-serif;
        }
        .nb-btn-logout:hover { background: #2b0d0d; border-color: #f87171; }
      `}</style>

      <div className="nb-panel-overlay" onClick={onClose}>
        <div className="nb-panel" onClick={(e) => e.stopPropagation()} style={{ width: "min(540px, 94vw)" }}>

          {/* header */}
          <div className="nb-panel-header">
            <span className="nb-panel-title">Configurações</span>
            <button className="nb-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* corpo com nav lateral */}
          <div className="nb-settings-layout">

            <nav className="nb-settings-nav">
              {sections.map((s) => (
                <button
                  key={s.key}
                  className={`nb-settings-nav-item${activeSection === s.key ? " active" : ""}`}
                  onClick={() => setActiveSection(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </nav>

            <div className="nb-settings-body">

              {/* ===== ÁUDIO ===== */}
              {activeSection === "audio" && (
                <>
                  <p className="nb-section-title">Qualidade de streaming</p>
                  <div className="nb-quality-grid">
                    {(Object.keys(QUALITY_LABELS) as AudioQuality[]).map((q) => (
                      <button
                        key={q}
                        className={`nb-quality-pill${quality === q ? " active" : ""}`}
                        onClick={() => setQuality(q)}
                      >
                        {QUALITY_LABELS[q]}
                      </button>
                    ))}
                  </div>
                  <p style={{ color: "#444", fontSize: 12 }}>
                    * A qualidade efetiva depende do arquivo armazenado no servidor.
                  </p>
                </>
              )}

              {/* ===== APARÊNCIA ===== */}
              {activeSection === "appearance" && (
                <>
                  <p className="nb-section-title">Tema</p>
                  <div className="nb-theme-row">
                    <button
                      className={`nb-theme-btn${theme === "dark" ? " active" : ""}`}
                      onClick={() => handleThemeChange("dark")}
                    >🌙  Escuro</button>
                    <button
                      className={`nb-theme-btn${theme === "light" ? " active" : ""}`}
                      onClick={() => handleThemeChange("light")}
                    >☀️  Claro</button>
                  </div>

                  <p className="nb-section-title">Idioma</p>
                  <select
                    className="nb-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                  >
                    {(Object.keys(LANG_LABELS) as Language[]).map((l) => (
                      <option key={l} value={l}>{LANG_LABELS[l]}</option>
                    ))}
                  </select>

                  <p style={{ color: "#444", fontSize: 12 }}>
                    * Idioma aplicado apenas à interface — o conteúdo das músicas não é traduzido.
                  </p>
                </>
              )}

              {/* ===== CONTA ===== */}
              {activeSection === "account" && (
                <>
                  <p className="nb-section-title">Alterar senha</p>
                  <input
                    type="password"
                    className="nb-input"
                    placeholder="Senha atual"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="nb-input"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="nb-input"
                    placeholder="Confirmar nova senha"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                  />
                  <button
                    className="nb-btn-primary"
                    onClick={handleChangePassword}
                    disabled={savingPass}
                  >
                    {savingPass ? "Salvando…" : "Salvar senha"}
                  </button>
                  {passMsg && (
                    <div className={`nb-pass-msg ${passMsg.ok ? "ok" : "err"}`}>
                      {passMsg.text}
                    </div>
                  )}
                </>
              )}

            </div>
          </div>

          {/* ── Rodapé: botão de logout sempre visível em qualquer aba ── */}
          <div className="nb-panel-footer">
            <button className="nb-btn-logout" onClick={handleLogout}>
              Sair da conta
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default SettingsPanel;