import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CollectionModal from "../Components/CollectionModal";

const API = "http://localhost:5000";

const toEmbed = (url) => {
  if (!url) return "";
  // Already embed
  if (url.includes("/embed/")) return url;
  // youtu.be short link
  const short = url.match(/youtu\.be\/([\w-]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  // watch?v=
  const watch = url.match(/[?&]v=([\w-]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  // Direct URL (Cloudinary etc)
  return url;
};


export default function SeriesDetails() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user, activeProfile } = useAuth();
  const [blocked, setBlocked] = useState(false);

  const [series,          setSeries]          = useState(null);
  const [activeSeason,    setActiveSeason]    = useState(0);
  const [collectionMovie, setCollectionMovie] = useState(null);

  useEffect(() => {
    fetch(`${API}/movies/${id}`)
      .then(r => r.json())
      .then(data => {
        setSeries(data);
        setActiveSeason(0);
        if (activeProfile) {
          const ORDER = ["U", "U/A 7+", "U/A 13+", "U/A 16+", "R", "A"];
          const contentIdx = ORDER.indexOf(data.ageRating || "U");
          const profileIdx = ORDER.indexOf(activeProfile.ageRating || "A");
          if (contentIdx > profileIdx) setBlocked(true);
        }
      })
      .catch(console.error);
  }, [id]);

  if (blocked) return (
    <div style={{ minHeight:"100vh", background:"var(--bg-base)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, fontFamily:"Outfit" }}>
      <div style={{ fontSize:64 }}>🔒</div>
      <h2 style={{ color:"var(--text-primary)" }}>Content Restricted</h2>
      <p style={{ color:"var(--text-muted)" }}>This content is not available for the <strong>{activeProfile?.name}</strong> profile.</p>
      <button onClick={() => navigate(-1)} className="btn btn-danger">← Go Back</button>
    </div>
  );

  if (!series) {
    return (
      <>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ height:"100vh", background:"var(--bg-base)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:40, height:40, border:"3px solid var(--border)", borderTop:"3px solid #e50914", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
        </div>
      </>
    );
  }

  const seasons       = series.seasons || [];
  const currentSeason = seasons[activeSeason] || null;

  return (
    <>
      <style>{css}</style>

      {/* ══ HERO BANNER ══ */}
      <div className="sd-hero" style={{ backgroundImage:`url(${series.banner || series.poster})` }}>
        <div className="sd-gradient" />

        {/* back */}
        <button className="sd-back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* content */}
        <div className="sd-hero-content">
          <div className="sd-meta-row">
            {series.rating > 0 && (
              <span className="sd-star">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#facc15" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                {series.rating}
              </span>
            )}
            {[series.releaseYear, series.language, ...(series.genres||[])].filter(Boolean).map((v,i) => (
              <span key={i} className="sd-pill">{v}</span>
            ))}
            <span className="sd-badge">Series</span>
          </div>

          <h1 className="sd-title">{series.title}</h1>

          {series.description && (
            <p className="sd-desc">{series.description}</p>
          )}

          <div className="sd-actions">
            {currentSeason?.episodes?.[0] ? (
              <button className="sd-btn-play"
                onClick={() => navigate(`/watch/${series._id}?season=${currentSeason.seasonNumber}&ep=1`)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Play S{currentSeason.seasonNumber} E1
              </button>
            ) : (
              <button className="sd-btn-play" disabled style={{ opacity:0.5 }}>
                No episodes yet
              </button>
            )}

            {/* + Watchlist → opens CollectionModal */}
            <button
              className="sd-btn-icon"
              title="Add to Watchlist"
              onClick={() => {
                if (!user) { navigate("/login"); return; }
                setCollectionMovie(series);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ══ SEASON + EPISODES ══ */}
      <div className="sd-body">

        {seasons.length === 0 ? (
          <p className="sd-empty">No seasons available yet.</p>
        ) : (
          <>
            {/* SEASON TABS */}
            <div className="sd-season-tabs">
              {seasons.map((season, idx) => (
                <button
                  key={season.seasonNumber}
                  className={`sd-season-tab ${activeSeason === idx ? "active" : ""}`}
                  onClick={() => setActiveSeason(idx)}
                >
                  Season {season.seasonNumber}
                  {season.title && season.title !== `Season ${season.seasonNumber}` && (
                    <span className="sd-season-subtitle"> — {season.title}</span>
                  )}
                </button>
              ))}
            </div>

            {currentSeason && (
              <p className="sd-ep-count">
                {currentSeason.episodes?.length || 0} episode{currentSeason.episodes?.length !== 1 ? "s" : ""}
              </p>
            )}

            {currentSeason?.episodes?.length === 0 && (
              <p className="sd-empty">No episodes in this season yet.</p>
            )}

            <div className="sd-ep-list">
              {currentSeason?.episodes?.map(ep => (
                <EpisodeCard
                  key={ep.episodeNumber}
                  ep={ep}
                  seasonNumber={currentSeason.seasonNumber}
                  seriesId={series._id}
                  navigate={navigate}
                />
              ))}
            </div>
          </>
        )}

        {/* TRAILER */}
        {series.trailerUrl && (
          <div className="sd-trailer">
            <h3 className="sd-section-heading">Trailer</h3>
            <div className="sd-iframe-wrap">
              <iframe
                src={toEmbed(series.trailerUrl)}
                title="Trailer"
                allowFullScreen
                style={{ width:"100%", height:"100%", border:"none", borderRadius:12 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* COLLECTION MODAL */}
      {collectionMovie && (
        <CollectionModal
          movie={collectionMovie}
          onClose={() => setCollectionMovie(null)}
        />
      )}
    </>
  );
}


/* ════════════════════════════════════════
   EPISODE CARD
════════════════════════════════════════ */
function EpisodeCard({ ep, seasonNumber, seriesId, navigate }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="sd-ep-card"
      style={{ background: hovered ? "var(--bg-elevated)" : "var(--bg-surface)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/watch/${seriesId}?season=${seasonNumber}&ep=${ep.episodeNumber}`)}
    >
      <div className="sd-ep-thumb">
        {ep.thumbnail ? (
          <img src={ep.thumbnail} alt={ep.title} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:8 }} />
        ) : (
          <div className="sd-ep-thumb-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        )}
        <div className="sd-ep-play-overlay" style={{ opacity: hovered ? 1 : 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" stroke="none">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      </div>

      <div className="sd-ep-info">
        <div className="sd-ep-num">E{ep.episodeNumber}</div>
        <div className="sd-ep-title">{ep.title}</div>
        {ep.description && (
          <div className="sd-ep-desc">{ep.description}</div>
        )}
      </div>

      {ep.duration && <div className="sd-ep-dur">{ep.duration}</div>}

      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  );
}


/* ════════════════════════════════════════
   CSS
════════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');

.sd-hero {
  position: relative;
  width: 100%;
  height: 88vh;
  min-height: 520px;
  background-size: cover;
  background-position: center top;
  font-family: 'Outfit', sans-serif;
  overflow: hidden;
}
.sd-gradient {
  position: absolute; inset: 0;
  background:
    linear-gradient(to right,  rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.05) 100%),
    linear-gradient(to top,    rgba(0,0,0,0.70) 0%, transparent 40%);
}
.sd-back {
  position: absolute; top: 88px; left: 32px; z-index: 20;
  width: 42px; height: 42px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.10); backdrop-filter: blur(10px);
  color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s, transform 0.15s;
}
.sd-back:hover { background: rgba(255,255,255,0.20); transform: scale(1.08); }

.sd-hero-content {
  position: absolute; bottom: 10%; left: 5%; max-width: 540px; z-index: 10;
}
.sd-meta-row {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin-bottom: 14px;
}
.sd-star {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 14px; font-weight: 700; color: #facc15;
  font-family: 'Outfit', sans-serif;
}
.sd-pill {
  font-size: 13px; color: rgba(255,255,255,0.72); font-family: 'Outfit', sans-serif;
}
.sd-pill + .sd-pill::before { content: ' · '; color: rgba(255,255,255,0.35); margin-right: 4px; }
.sd-badge {
  background: rgba(229,9,20,0.25); color: #ff6b7a;
  border: 1px solid rgba(229,9,20,0.4); border-radius: 999px;
  font-size: 11px; font-weight: 700; padding: 2px 10px; letter-spacing: 0.5px;
  font-family: 'Outfit', sans-serif; text-transform: uppercase;
}
.sd-title {
  font-size: clamp(40px, 6vw, 82px); font-weight: 900;
  color: #fff; letter-spacing: -2px; line-height: 0.95;
  margin: 0 0 16px; text-transform: uppercase;
  font-family: 'Outfit', sans-serif;
}
.sd-desc {
  font-size: 15px; color: rgba(255,255,255,0.68); line-height: 1.7;
  margin-bottom: 28px; font-weight: 300; font-family: 'Outfit', sans-serif;
  display: -webkit-box; -webkit-line-clamp: 3;
  -webkit-box-orient: vertical; overflow: hidden;
}
.sd-actions { display: flex; align-items: center; gap: 12px; }
.sd-btn-play {
  display: inline-flex; align-items: center; gap: 9px;
  background: #fff; color: #000; font-family: 'Outfit', sans-serif;
  font-size: 16px; font-weight: 700; border: none; border-radius: 8px;
  padding: 13px 28px; cursor: pointer; transition: background 0.18s, transform 0.12s;
}
.sd-btn-play:hover:not(:disabled) { background: #ddd; transform: scale(1.03); }
.sd-btn-icon {
  width: 50px; height: 50px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.45);
  background: rgba(255,255,255,0.07); backdrop-filter: blur(8px);
  color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: border-color 0.2s, background 0.2s, transform 0.15s;
}
.sd-btn-icon:hover { border-color: #fff; background: rgba(255,255,255,0.18); transform: scale(1.08); }

.sd-body {
  background: var(--bg-base);
  padding: 40px 5% 80px;
  font-family: 'Outfit', sans-serif;
}
.sd-empty {
  color: var(--text-muted); text-align: center; padding: 40px 0; font-size: 15px;
}

.sd-season-tabs {
  display: flex; gap: 8px; flex-wrap: wrap;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
}
.sd-season-tab {
  background: none; border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 15px;
  padding: 10px 18px; cursor: pointer; margin-bottom: -1px;
  transition: color 0.2s, border-color 0.2s;
}
.sd-season-tab:hover { color: var(--text-primary); }
.sd-season-tab.active { color: var(--text-primary); border-bottom: 2px solid var(--accent); }
.sd-season-subtitle { font-weight: 400; font-size: 13px; color: var(--text-muted); }

.sd-ep-count {
  color: var(--text-muted); font-size: 13px; margin: 10px 0 20px;
}

.sd-ep-list { display: flex; flex-direction: column; gap: 10px; max-width: 860px; }

.sd-ep-card {
  display: flex; align-items: center; gap: 16px;
  border: 1px solid var(--border); border-radius: 12px;
  padding: 14px 16px; cursor: pointer;
  transition: background 0.18s, border-color 0.18s;
}
.sd-ep-card:hover { border-color: var(--border-hover); }

.sd-ep-thumb {
  width: 120px; height: 70px; border-radius: 8px;
  overflow: hidden; flex-shrink: 0; position: relative;
  background: var(--bg-elevated);
}
.sd-ep-thumb-placeholder {
  width: 100%; height: 100%; display: flex;
  align-items: center; justify-content: center;
}
.sd-ep-play-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.2s;
}

.sd-ep-info { flex: 1; min-width: 0; }
.sd-ep-num {
  font-size: 11px; font-weight: 700; color: var(--accent);
  text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px;
}
.sd-ep-title {
  font-size: 15px; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sd-ep-desc {
  font-size: 12px; color: var(--text-muted); margin-top: 3px;
  display: -webkit-box; -webkit-line-clamp: 1;
  -webkit-box-orient: vertical; overflow: hidden;
}
.sd-ep-dur {
  font-size: 13px; color: var(--text-muted); flex-shrink: 0; white-space: nowrap;
}

.sd-trailer { margin-top: 52px; max-width: 760px; }
.sd-section-heading {
  font-size: 20px; font-weight: 700; color: var(--text-primary);
  margin-bottom: 16px; letter-spacing: -0.3px;
}
.sd-iframe-wrap {
  width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden;
  border: 1px solid var(--border);
}
`;