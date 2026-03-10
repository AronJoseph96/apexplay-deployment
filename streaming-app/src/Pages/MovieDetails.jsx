import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CollectionModal from "../Components/CollectionModal";

const API = "http://localhost:5000";

export default function MovieDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie,           setMovie]           = useState(null);
  const [collectionMovie, setCollectionMovie] = useState(null);

  useEffect(() => {
    fetch(`${API}/movies/${id}`)
      .then(r => r.json())
      .then(data => setMovie(data))
      .catch(console.error);
  }, [id]);

  if (!movie) {
    return (
      <>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ height:"100vh", background:"var(--bg-base)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:40, height:40, border:"3px solid var(--border)", borderTop:"3px solid #e50914", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>

      {/* ══ HERO BANNER ══ */}
      <div className="sd-hero" style={{ backgroundImage:`url(${movie.banner || movie.poster})` }}>
        <div className="sd-gradient" />

        {/* Back */}
        <button className="sd-back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Content */}
        <div className="sd-hero-content">
          <div className="sd-meta-row">
            {movie.rating > 0 && (
              <span className="sd-star">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#facc15" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                {movie.rating}
              </span>
            )}
            {[movie.releaseYear, movie.duration, movie.language, ...(movie.genres||[])].filter(Boolean).map((v,i) => (
              <span key={i} className="sd-pill">{v}</span>
            ))}
            <span className="sd-badge">Movie</span>
          </div>

          <h1 className="sd-title">{movie.title}</h1>

          {movie.description && (
            <p className="sd-desc">{movie.description}</p>
          )}

          <div className="sd-actions">
            <button className="sd-btn-play"
              onClick={() => navigate(`/watch/${movie._id}`)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Play
            </button>

            <button className="sd-btn-icon" title="Add to Watchlist"
              onClick={() => {
                if (!user) { navigate("/login"); return; }
                setCollectionMovie(movie);
              }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ══ TRAILER ══ */}
      {movie.trailerUrl && (
        <div className="sd-body">
          <div className="sd-trailer">
            <h3 className="sd-section-heading">Trailer</h3>
            <div className="sd-iframe-wrap">
              <iframe
                src={movie.trailerUrl.replace("watch?v=","embed/").replace("youtu.be/","www.youtube.com/embed/")}
                title="Trailer" allowFullScreen
                style={{ width:"100%", height:"100%", border:"none", borderRadius:12 }}
              />
            </div>
          </div>
        </div>
      )}

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
   CSS — identical to SeriesDetails
════════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');

.sd-hero {
  position: relative; width: 100%; height: 88vh; min-height: 520px;
  background-size: cover; background-position: center top;
  font-family: 'Outfit', sans-serif; overflow: hidden;
}
.sd-gradient {
  position: absolute; inset: 0;
  background:
    linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.05) 100%),
    linear-gradient(to top,   rgba(0,0,0,0.70) 0%, transparent 40%);
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
  font-size: 14px; font-weight: 700; color: #facc15; font-family: 'Outfit', sans-serif;
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
  margin: 0 0 16px; text-transform: uppercase; font-family: 'Outfit', sans-serif;
}
.sd-desc {
  font-size: 15px; color: rgba(255,255,255,0.68); line-height: 1.7;
  margin-bottom: 28px; font-weight: 300; font-family: 'Outfit', sans-serif;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.sd-actions { display: flex; align-items: center; gap: 12px; }
.sd-btn-play {
  display: inline-flex; align-items: center; gap: 9px;
  background: #fff; color: #000; font-family: 'Outfit', sans-serif;
  font-size: 16px; font-weight: 700; border: none; border-radius: 8px;
  padding: 13px 28px; cursor: pointer; transition: background 0.18s, transform 0.12s;
}
.sd-btn-play:hover { background: #ddd; transform: scale(1.03); }
.sd-btn-icon {
  width: 50px; height: 50px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.45);
  background: rgba(255,255,255,0.07); backdrop-filter: blur(8px);
  color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: border-color 0.2s, background 0.2s, transform 0.15s;
}
.sd-btn-icon:hover { border-color: #fff; background: rgba(255,255,255,0.18); transform: scale(1.08); }

.sd-body {
  background: var(--bg-base); padding: 40px 5% 80px; font-family: 'Outfit', sans-serif;
}
.sd-trailer { margin-top: 0; max-width: 760px; }
.sd-section-heading {
  font-size: 20px; font-weight: 700; color: var(--text-primary);
  margin-bottom: 16px; letter-spacing: -0.3px;
}
.sd-iframe-wrap {
  width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden;
  border: 1px solid var(--border);
}
`;