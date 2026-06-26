import React, { useEffect, useRef, useState } from "react";
import i18n from "../i18n/index";

interface SettingsPanelProps {
  onClose: () => void;
  getAuthHeaders: () => Record<string, string>;
  onLogout?: () => void;
}

type Language = "pt-BR" | "en-US" | "es-ES";
type Theme = "dark" | "light";

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
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  const t = (key: string) => i18n.t(key);

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "dark";
  });

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("language") as Language) || "pt-BR";
  });

  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songGenre, setSongGenre] = useState("");
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [importingSong, setImportingSong] = useState(false);
  const [importMsg, setImportMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const mp3InputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [activeSection, setActiveSection] = useState<"audio" | "appearance" | "account">("audio");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    void i18n.changeLanguage(lang);
  };

  const handleMp3Select = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setMp3File(file);
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleImportSong = async () => {
    if (!songTitle || !songArtist || !mp3File || !coverFile || !lyrics) {
      setImportMsg({ text: t("messages.fill_all_fields"), ok: false });
      return;
    }

    setImportingSong(true);

    try {
      const formData = new FormData();
      formData.append("title", songTitle);
      formData.append("artist", songArtist);
      formData.append("genre", songGenre);
      formData.append("mp3", mp3File);
      formData.append("cover", coverFile);
      formData.append("lyrics", lyrics);

      const authHeaders = { ...getAuthHeaders() };
      delete authHeaders["Content-Type"];
      delete authHeaders["content-type"];

      const res = await fetch("/api/songs/import", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const data = await res.json() as { error?: string };

      if (res.ok) {
        setImportMsg({ text: t("messages.song_imported"), ok: true });
        setSongTitle("");
        setSongArtist("");
        setSongGenre("");
        setMp3File(null);
        setCoverFile(null);
        if (coverPreview) URL.revokeObjectURL(coverPreview);
        setCoverPreview(null);
        setLyrics("");
        if (mp3InputRef.current) mp3InputRef.current.value = "";
        if (coverInputRef.current) coverInputRef.current.value = "";
      } else {
        setImportMsg({ text: data.error ?? t("messages.song_import_error"), ok: false });
      }
    } catch {
      setImportMsg({ text: t("messages.connection_error"), ok: false });
    } finally {
      setImportingSong(false);
      setTimeout(() => setImportMsg(null), 3000);
    }
  };
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPass) {
      setPassMsg({ text: t("messages.fill_all_fields"), ok: false });
      return;
    }
    if (newPassword !== confirmPass) {
      setPassMsg({ text: t("messages.passwords_dont_match"), ok: false });
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ text: t("messages.password_too_short"), ok: false });
      return;
    }

    setSavingPass(true);

    try {
      const res = await fetch("/api/me/password", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      const data = await res.json() as { error?: string };

      if (res.ok) {
        setPassMsg({ text: t("messages.password_changed"), ok: true });
        setOldPassword("");
        setNewPassword("");
        setConfirmPass("");
      } else {
        setPassMsg({ text: data.error ?? t("messages.password_error"), ok: false });
      }
    } catch {
      setPassMsg({ text: t("messages.connection_error"), ok: false });
    } finally {
      setSavingPass(false);
      setTimeout(() => setPassMsg(null), 3000);
    }
  };

  const handleLogout = () => {
    onLogout?.();
    onClose();
  };

  const sections = [
    { key: "audio",      label: t("settings.audio") },
    { key: "appearance", label: t("settings.appearance") },
    { key: "account",    label: t("settings.account") },
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
        }
        .nb-panel {
          width: min(540px, 94vw);
          background: var(--bg-card); color: var(--text-main);
          border: 1px solid var(--border-color); border-radius: 20px;
          overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.6);
          font-family: "Segoe UI", sans-serif; display: flex; flex-direction: column;
        }
        .nb-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 24px 16px; border-bottom: 1px solid var(--border-color);
        }
        .nb-panel-title { font-size: 13px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #00d2ff; }
        .nb-close-btn { width: 32px; height: 32px; border: none; border-radius: 50%; background: var(--bg-main); color: var(--text-secondary); cursor: pointer; transition: .15s; }
        .nb-close-btn:hover { opacity: .8; }
        .nb-settings-layout { display: flex; min-height: 340px; }
        .nb-settings-nav { width: 150px; border-right: 1px solid var(--border-color); padding: 14px 0; }
        .nb-settings-nav-item { width: 100%; padding: 12px 18px; border: none; background: transparent; color: var(--text-secondary); text-align: left; cursor: pointer; transition: .15s; }
        .nb-settings-nav-item:hover { background: var(--bg-main); color: var(--text-main); }
        .nb-settings-nav-item.active { background: rgba(0,210,255,.12); color: #00d2ff; }
        .nb-settings-body { flex: 1; padding: 22px; }
        .nb-section-title { margin-bottom: 14px; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--text-secondary); }
        .nb-theme-btn { padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main); cursor: pointer; transition: .15s; }
        .nb-theme-btn.active { border-color: #00d2ff; color: #00d2ff; }
        .nb-theme-row { display: flex; gap: 10px; margin-bottom: 24px; }
        .nb-select, .nb-input, .nb-textarea { width: 100%; padding: 12px 14px; margin-bottom: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main); box-sizing: border-box; font-family: inherit; }
        .nb-select:focus, .nb-input:focus, .nb-textarea:focus { outline: none; border-color: #00d2ff; }
        .nb-textarea { resize: vertical; min-height: 90px; }
        .nb-input-row { display: flex; gap: 10px; }
        .nb-input-row .nb-input { flex: 1; }
        .nb-file-row { display: flex; gap: 12px; margin-bottom: 12px; }
        .nb-file-drop {
          flex: 1; padding: 14px 12px; border-radius: 12px; border: 1px dashed var(--border-color);
          background: var(--bg-main); color: var(--text-secondary); cursor: pointer; transition: .15s;
          display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; font-size: 12px;
        }
        .nb-file-drop:hover { border-color: #00d2ff; color: #00d2ff; }
        .nb-file-drop.has-file { border-style: solid; border-color: #00d2ff; color: var(--text-main); }
        .nb-file-drop-icon { font-size: 20px; }
        .nb-file-drop-name { font-weight: 600; word-break: break-all; max-width: 100%; }
        .nb-cover-preview { width: 100%; height: 64px; object-fit: cover; border-radius: 8px; }
        .nb-btn-primary { width: 100%; padding: 12px; border: none; border-radius: 10px; background: linear-gradient(135deg, #00d2ff, #0077ff); color: white; font-weight: 700; cursor: pointer; }
        .nb-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .nb-pass-msg { margin-top: 12px; padding: 10px; border-radius: 10px; text-align: center; font-size: 13px; }
        .nb-pass-msg.ok { background: #0d2b1f; color: #4ade80; }
        .nb-pass-msg.err { background: #2b0d0d; color: #f87171; }
        .nb-panel-footer { padding: 16px 24px; border-top: 1px solid var(--border-color); }
        .nb-btn-logout { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-main); color: #f87171; font-weight: 700; cursor: pointer; }
        .nb-btn-logout:hover { background: rgba(248,113,113,.1); }
      `}</style>

      <div className="nb-panel-overlay" onClick={onClose}>
        <div className="nb-panel" onClick={(e) => e.stopPropagation()}>

          <div className="nb-panel-header">
            <span className="nb-panel-title">{t("settings.title")}</span>
            <button className="nb-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="nb-settings-layout">
            <nav className="nb-settings-nav">
              {sections.map((s) => (
                <button
                  key={s.key}
                  className={`nb-settings-nav-item ${activeSection === s.key ? "active" : ""}`}
                  onClick={() => setActiveSection(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </nav>

            <div className="nb-settings-body">

              {activeSection === "audio" && (
                <>
                  <p className="nb-section-title">{t("settings.import_song")}</p>

                  <input
                    type="text"
                    className="nb-input"
                    placeholder={t("settings.song_title")}
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                  />

                  <div className="nb-input-row">
                    <input
                      type="text"
                      className="nb-input"
                      placeholder={t("settings.song_artist")}
                      value={songArtist}
                      onChange={(e) => setSongArtist(e.target.value)}
                    />
                    <input
                      type="text"
                      className="nb-input"
                      placeholder={t("settings.song_genre")}
                      value={songGenre}
                      onChange={(e) => setSongGenre(e.target.value)}
                    />
                  </div>

                  <div className="nb-file-row">
                    <input
                      ref={mp3InputRef}
                      type="file"
                      accept="audio/mpeg,.mp3"
                      style={{ display: "none" }}
                      onChange={handleMp3Select}
                    />
                    <button
                      type="button"
                      className={`nb-file-drop ${mp3File ? "has-file" : ""}`}
                      onClick={() => mp3InputRef.current?.click()}
                    >
                      <span className="nb-file-drop-icon">🎵</span>
                      <span className="nb-file-drop-name">
                        {mp3File ? mp3File.name : t("settings.choose_mp3")}
                      </span>
                    </button>

                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleCoverSelect}
                    />
                    <button
                      type="button"
                      className={`nb-file-drop ${coverFile ? "has-file" : ""}`}
                      onClick={() => coverInputRef.current?.click()}
                    >
                      {coverPreview ? (
                        <img src={coverPreview} alt="" className="nb-cover-preview" />
                      ) : (
                        <span className="nb-file-drop-icon">🖼️</span>
                      )}
                      <span className="nb-file-drop-name">
                        {coverFile ? coverFile.name : t("settings.choose_cover")}
                      </span>
                    </button>
                  </div>

                  <textarea
                    className="nb-textarea"
                    placeholder={t("settings.lyrics_placeholder")}
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                  />

                  <button className="nb-btn-primary" onClick={handleImportSong} disabled={importingSong}>
                    {importingSong ? t("settings.importing") : t("settings.import_song_button")}
                  </button>

                  {importMsg && (
                    <div className={`nb-pass-msg ${importMsg.ok ? "ok" : "err"}`}>
                      {importMsg.text}
                    </div>
                  )}
                </>
              )}

              {activeSection === "appearance" && (
                <>
                  <p className="nb-section-title">{t("settings.theme")}</p>
                  <div className="nb-theme-row">
                    <button
                      className={`nb-theme-btn ${theme === "dark" ? "active" : ""}`}
                      onClick={() => setTheme("dark")}
                    >
                      {t("settings.theme_dark")}
                    </button>
                    <button
                      className={`nb-theme-btn ${theme === "light" ? "active" : ""}`}
                      onClick={() => setTheme("light")}
                    >
                      {t("settings.theme_light")}
                    </button>
                  </div>

                  <p className="nb-section-title">{t("settings.language")}</p>
                  <select
                    className="nb-select"
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  >
                    {(Object.keys(LANG_LABELS) as Language[]).map((l) => (
                      <option key={l} value={l}>{LANG_LABELS[l]}</option>
                    ))}
                  </select>
                </>
              )}

              {activeSection === "account" && (
                <>
                  <p className="nb-section-title">{t("settings.change_password")}</p>
                  <input type="password" className="nb-input" placeholder={t("settings.current_password")} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                  <input type="password" className="nb-input" placeholder={t("settings.new_password")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <input type="password" className="nb-input" placeholder={t("settings.confirm_password")} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
                  <button className="nb-btn-primary" onClick={handleChangePassword} disabled={savingPass}>
                    {savingPass ? t("settings.saving") : t("settings.save_password")}
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

          <div className="nb-panel-footer">
            <button className="nb-btn-logout" onClick={handleLogout}>
              {t("settings.logout")}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default SettingsPanel;