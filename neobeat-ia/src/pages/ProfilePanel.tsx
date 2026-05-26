/* ============================================================
   PROFILE PANEL — NeoBeat
   ============================================================ */

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

interface Song {
  id: number;
  title: string;
  artist: string;
  cover_url: string;
}

interface ProfileData {
  id?: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  created_at?: string;
}

interface ProfilePanelProps {
  onClose: () => void;
  formatUrl: (
    url?: string | null
  ) => string;

  getAuthHeaders: () => Record<
    string,
    string
  >;

  onPlaySong?: (
    song: Song
  ) => void;
}

const API_URL =
  "http://localhost:3000";

const ProfilePanel: React.FC<
  ProfilePanelProps
> = ({
  onClose,
  formatUrl,
  getAuthHeaders,
  onPlaySong,
}) => {
  const [profile, setProfile] =
    useState<ProfileData | null>(
      null
    );

  const [likedSongs, setLikedSongs] =
    useState<Song[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [avatarPreview, setAvatarPreview] =
    useState<string | null>(null);

  const [avatarError, setAvatarError] =
    useState(false);

  const avatarInputRef =
    useRef<HTMLInputElement>(null);

  // =========================================================
  // CARREGAR PERFIL
  // =========================================================

  useEffect(() => {
    const fetchProfile =
      async () => {
        try {
          const headers =
            getAuthHeaders();

          // PERFIL
          const resProfile =
            await fetch(
              `${API_URL}/api/me`,
              {
                headers,
              }
            );

          if (!resProfile.ok) {
            const txt =
              await resProfile.text();

            console.error(
              "Erro perfil:",
              txt
            );
          } else {
            const profileData =
              await resProfile.json();

            setProfile(
              profileData
            );
          }

          // MUSICAS CURTIDAS
          const resLiked =
            await fetch(
              `${API_URL}/api/me/liked-songs`,
              {
                headers,
              }
            );

          if (!resLiked.ok) {
            const txt =
              await resLiked.text();

            console.error(
              "Erro liked songs:",
              txt
            );
          } else {
            const likedData =
              await resLiked.json();

            setLikedSongs(
              likedData
            );
          }
        } catch (err) {
          console.error(
            "Erro carregar perfil:",
            err
          );
        } finally {
          setLoading(false);
        }
      };

    fetchProfile();
  }, []);

  // =========================================================
  // UPLOAD AVATAR
  // =========================================================

  const handleAvatarChange =
    async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        e.target.files?.[0];

      if (!file) return;

      setAvatarError(false);

      // preview local
      setAvatarPreview(
        URL.createObjectURL(file)
      );

      try {
        const formData =
          new FormData();

        formData.append(
          "avatar",
          file
        );

        const token =
          localStorage.getItem(
            "neobeat_token"
          );

        const headers: Record<
          string,
          string
        > = {};

        if (token) {
          headers[
            "Authorization"
          ] = `Bearer ${token}`;
        }

        const response =
          await fetch(
            `${API_URL}/api/me/avatar`,
            {
              method: "POST",
              headers,
              body: formData,
            }
          );

        const data =
          await response.json();

        console.log(
          "Avatar response:",
          data
        );

        if (
          data.avatar_url
        ) {
          setProfile(
            (prev) => ({
              ...prev!,
              avatar_url:
                data.avatar_url,
            })
          );
        }
      } catch (err) {
        console.error(
          "Erro upload avatar:",
          err
        );
      }
    };

  // =========================================================
  // AVATAR
  // =========================================================

  const avatarSrc =
    avatarPreview ||
    (profile?.avatar_url
      ? profile.avatar_url
      : null);

  const initials =
    profile?.username
      ?.slice(0, 2)
      .toUpperCase() ||
    "NB";

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      <style>{`
        .nb-panel-overlay{
          position:fixed;
          inset:0;
          background:rgba(0,0,0,.7);
          backdrop-filter:blur(6px);
          z-index:999;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .nb-panel{
          width:min(480px,94vw);
          max-height:88vh;
          overflow-y:auto;
          background:#111;
          border:1px solid #222;
          border-radius:22px;
          color:#fff;
          box-shadow:0 20px 60px rgba(0,0,0,.7);
        }

        .nb-panel-header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:24px;
        }

        .nb-close-btn{
          background:#1e1e1e;
          border:none;
          color:#fff;
          width:34px;
          height:34px;
          border-radius:50%;
          cursor:pointer;
        }

        .nb-avatar-section{
          display:flex;
          flex-direction:column;
          align-items:center;
          padding:10px 24px 24px;
        }

        .nb-avatar-wrap{
          position:relative;
          width:100px;
          height:100px;
          cursor:pointer;
        }

        .nb-avatar{
          width:100%;
          height:100%;
          border-radius:50%;
          object-fit:cover;
          border:3px solid #00d2ff;
        }

        .nb-avatar-initials{
          width:100%;
          height:100%;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          background:linear-gradient(
            135deg,
            #00d2ff,
            #0077ff
          );
          font-size:32px;
          font-weight:800;
        }

        .nb-avatar-overlay{
          position:absolute;
          inset:0;
          border-radius:50%;
          background:rgba(0,0,0,.45);
          display:flex;
          align-items:center;
          justify-content:center;
          opacity:0;
          transition:.2s;
          font-size:22px;
        }

        .nb-avatar-wrap:hover
        .nb-avatar-overlay{
          opacity:1;
        }

        .nb-username{
          margin-top:14px;
          font-size:22px;
          font-weight:700;
        }

        .nb-email{
          color:#777;
          margin-top:4px;
          font-size:14px;
        }

        .nb-section-label{
          padding:0 24px 14px;
          color:#666;
          font-size:12px;
          text-transform:uppercase;
          letter-spacing:2px;
          font-weight:700;
        }

        .nb-liked-list{
          padding:0 16px 24px;
        }

        .nb-liked-item{
          display:flex;
          align-items:center;
          gap:12px;
          padding:10px;
          border-radius:12px;
          cursor:pointer;
          transition:.15s;
        }

        .nb-liked-item:hover{
          background:#1b1b1b;
        }

        .nb-liked-thumb{
          width:44px;
          height:44px;
          border-radius:8px;
          object-fit:cover;
        }

        .nb-liked-thumb-placeholder{
          width:44px;
          height:44px;
          border-radius:8px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#1e1e1e;
        }

        .nb-liked-heart{
          margin-left:auto;
          opacity:.7;
        }

        .nb-loading{
          text-align:center;
          padding:40px;
          color:#666;
        }

        .nb-empty{
          color:#666;
          text-align:center;
          padding:20px;
        }
      `}</style>

      <div
        className="nb-panel-overlay"
        onClick={onClose}
      >
        <div
          className="nb-panel"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <div className="nb-panel-header">
            <span>
              Perfil
            </span>

            <button
              className="nb-close-btn"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {loading ? (
            <p className="nb-loading">
              Carregando...
            </p>
          ) : (
            <>
              {/* AVATAR */}

              <div className="nb-avatar-section">
                <div
                  className="nb-avatar-wrap"
                  onClick={() =>
                    avatarInputRef.current?.click()
                  }
                >
                  {avatarSrc &&
                  !avatarError ? (
                    <img
                      src={avatarSrc}
                      className="nb-avatar"
                      alt="Avatar"
                      onError={() =>
                        setAvatarError(
                          true
                        )
                      }
                    />
                  ) : (
                    <div className="nb-avatar-initials">
                      {initials}
                    </div>
                  )}

                  <div className="nb-avatar-overlay">
                    📷
                  </div>
                </div>

                <input
                  ref={
                    avatarInputRef
                  }
                  type="file"
                  accept="image/*"
                  style={{
                    display:
                      "none",
                  }}
                  onChange={
                    handleAvatarChange
                  }
                />

                <div className="nb-username">
                  {profile?.username ||
                    "Usuário"}
                </div>

                <div className="nb-email">
                  {profile?.email}
                </div>
              </div>

              {/* MUSICAS CURTIDAS */}

              <div className="nb-section-label">
                Músicas Curtidas
              </div>

              <div className="nb-liked-list">
                {likedSongs.length ===
                0 ? (
                  <p className="nb-empty">
                    Nenhuma música curtida.
                  </p>
                ) : (
                  likedSongs.map(
                    (song) => (
                      <div
                        key={
                          song.id
                        }
                        className="nb-liked-item"
                        onClick={() => {
                          onPlaySong?.(
                            song
                          );

                          onClose();
                        }}
                      >
                        {song.cover_url ? (
                          <img
                            src={formatUrl(
                              song.cover_url
                            )}
                            className="nb-liked-thumb"
                            alt={
                              song.title
                            }
                          />
                        ) : (
                          <div className="nb-liked-thumb-placeholder">
                            🎵
                          </div>
                        )}

                        <div>
                          <strong>
                            {
                              song.title
                            }
                          </strong>

                          <div
                            style={{
                              fontSize: 12,
                              color:
                                "#777",
                            }}
                          >
                            {
                              song.artist
                            }
                          </div>
                        </div>

                        <span className="nb-liked-heart">
                          ♥
                        </span>
                      </div>
                    )
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePanel;