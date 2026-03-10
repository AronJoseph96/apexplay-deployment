import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

export default function Home() {
  const navigate = useNavigate();

  const [movies,         setMovies]         = useState([]);
  const [seriesList,     setSeriesList]      = useState([]);
  const [heroItems,      setHeroItems]       = useState([]);
  const [currentSlide,   setCurrentSlide]    = useState(0);
  const [continueWatching, setContinueWatching] = useState([]);

  const rowRefs = useRef({});

  /* ── fetch movies only ── */
  useEffect(() => {
    axios.get("http://localhost:5000/movies?category=Movie")
      .then(res => {
        setMovies(res.data);
        setHeroItems(res.data.slice(0, 5));
      })
      .catch(console.error);
  }, []);

  /* ── fetch series only ── */
  useEffect(() => {
    axios.get(`${API}/movies?category=Series`)
      .then(res => setSeriesList(res.data))
      .catch(console.error);
  }, []);

  /* ── continue watching from localStorage ── */
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("reelstream_user"));
      if (!user) return;
      const key  = `continue_${user._id}`;
      setContinueWatching(JSON.parse(localStorage.getItem(key)) || []);
    } catch { /* ignore */ }
  }, []);

  /* ── auto-rotate hero ── */
  useEffect(() => {
    if (heroItems.length === 0) return;
    const iv = setInterval(() =>
      setCurrentSlide(p => p === heroItems.length - 1 ? 0 : p + 1)
    , 5000);
    return () => clearInterval(iv);
  }, [heroItems]);

  const scrollRow = (key, dir) => {
    const el = rowRefs.current[key];
    if (el) el.scrollBy({ left: dir * 500, behavior: "smooth" });
  };

  const hero = heroItems[currentSlide];

  return (
    <>
      <style>{css}</style>
      <div className="home-page">

        {/* ══ HERO ══ */}
        {hero && (
          <section
            className="home-hero"
            style={{ backgroundImage: `url(${hero.banner || hero.poster})` }}
          >
            <div className="home-hero-gradient" />
            <div className="home-hero-content">
              <h1 className="home-hero-title">{hero.title}</h1>
              <p className="home-hero-desc">{hero.description}</p>
              <div className="home-hero-actions">
                <button className="home-btn-play"
                  onClick={() => navigate(`/movie/${hero._id}`)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Play
                </button>
                <button className="home-btn-info"
                  onClick={() => navigate(`/movie/${hero._id}`)}>
                  More Info
                </button>
              </div>
            </div>

            {/* slide dots */}
            {heroItems.length > 1 && (
              <div className="home-hero-dots">
                {heroItems.map((_, i) => (
                  <button
                    key={i}
                    className={`home-hero-dot ${i === currentSlide ? "active" : ""}`}
                    onClick={() => setCurrentSlide(i)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ══ CONTINUE WATCHING ══ */}
        {continueWatching.length > 0 && (
          <section className="home-section">
            <div className="container">
              <h4 className="home-section-title">Continue Watching</h4>
              <div className="d-flex gap-3 flex-nowrap overflow-auto hide-scrollbar pb-2">
                {continueWatching.map(item => (
                  <div key={item._id} style={{ minWidth: 150, flexShrink: 0 }}>
                    <img
                      src={item.poster}
                      alt={item.title}
                      style={{ width: 150, height: 225, objectFit: "cover", borderRadius: 10, cursor: "pointer", display: "block" }}
                      onClick={() => navigate(
                        item.category === "Series"
                          ? `/series/${item._id}`
                          : `/watch/${item._id}`
                      )}
                    />
                    <p className="card-title-text mt-2 mb-0">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ TRENDING MOVIES ══ */}
        {movies.length > 0 && (
          <section className="home-section">
            <div className="container">
              <h4 className="home-section-title">Trending Now</h4>
              <div className="row-strip">
                <button className="row-arrow-overlay left" onClick={() => scrollRow("trending", -1)}>‹</button>
                <div
                  className="d-flex flex-row flex-nowrap overflow-auto hide-scrollbar pb-2"
                  ref={el => rowRefs.current["trending"] = el}
                >
                  {movies.map(movie => (
                    <MovieCard key={movie._id} item={movie}
                      onClick={() => navigate(`/movie/${movie._id}`)} />
                  ))}
                </div>
                <button className="row-arrow-overlay right" onClick={() => scrollRow("trending", 1)}>›</button>
              </div>
            </div>
          </section>
        )}

        {/* ══ TV SERIES ROW ══ */}
        {seriesList.length > 0 && (
          <section className="home-section">
            <div className="container">
              <h4 className="home-section-title">TV Series</h4>
              <div className="row-strip">
                <button className="row-arrow-overlay left" onClick={() => scrollRow("series", -1)}>‹</button>
                <div
                  className="d-flex flex-row flex-nowrap overflow-auto hide-scrollbar pb-2"
                  ref={el => rowRefs.current["series"] = el}
                >
                  {seriesList.map(s => (
                    <MovieCard key={s._id} item={s}
                      onClick={() => navigate(`/series/${s._id}`)} />
                  ))}
                </div>
                <button className="row-arrow-overlay right" onClick={() => scrollRow("series", 1)}>›</button>
              </div>
            </div>
          </section>
        )}

      </div>
    </>
  );
}

/* ── shared card ── */
function MovieCard({ item, onClick }) {
  return (
    <div className="me-3" style={{ minWidth: 160, flexShrink: 0 }}>
      <div
        className="movie-card"
        onClick={onClick}
        style={{
          width: 150, height: 225,
          backgroundImage: `url(${item.poster})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 10,
          cursor: "pointer",
        }}
      />
      <p className="card-title-text mt-2 mb-0">{item.title}</p>
      <p className="card-year-text">{item.releaseYear}</p>
    </div>
  );
}

/* ════════════════════════════════════════
   CSS — hero styles (everything else comes from theme.css)
════════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');

.home-page {
  background: var(--bg-base);
  min-height: 100vh;
  font-family: 'Outfit', sans-serif;
}

/* ── HERO ── */
.home-hero {
  position: relative;
  width: 100%;
  height: 85vh;
  min-height: 500px;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.home-hero-gradient {
  position: absolute; inset: 0;
  background:
    linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%),
    linear-gradient(to top,   rgba(0,0,0,0.75) 0%, transparent 50%);
}

.home-hero-content {
  position: absolute;
  bottom: 14%;
  left: 5%;
  max-width: 560px;
  z-index: 10;
}

.home-hero-title {
  font-size: clamp(36px, 5.5vw, 72px);
  font-weight: 900;
  color: #fff;
  letter-spacing: -1.5px;
  line-height: 1.0;
  margin: 0 0 14px;
}

.home-hero-desc {
  font-size: 15px;
  color: rgba(255,255,255,0.72);
  line-height: 1.7;
  margin-bottom: 24px;
  font-weight: 300;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-hero-actions { display: flex; gap: 12px; align-items: center; }

.home-btn-play {
  display: inline-flex; align-items: center; gap: 8px;
  background: #fff; color: #000;
  font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700;
  border: none; border-radius: 8px; padding: 12px 28px;
  cursor: pointer; transition: background 0.18s, transform 0.12s;
}
.home-btn-play:hover { background: #ddd; transform: scale(1.03); }

.home-btn-info {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.35);
  color: #fff;
  font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 600;
  border-radius: 8px; padding: 12px 28px;
  cursor: pointer; transition: background 0.18s;
  backdrop-filter: blur(6px);
}
.home-btn-info:hover { background: rgba(255,255,255,0.25); }

/* slide dots */
.home-hero-dots {
  position: absolute; bottom: 24px; left: 5%; z-index: 10;
  display: flex; gap: 8px;
}
.home-hero-dot {
  width: 8px; height: 8px; border-radius: 50%;
  border: none; background: rgba(255,255,255,0.35);
  cursor: pointer; padding: 0;
  transition: background 0.2s, transform 0.2s;
}
.home-hero-dot.active {
  background: #fff; transform: scale(1.3);
}

/* ── SECTIONS ── */
.home-section { padding: 32px 0 8px; }

.home-section-title {
  color: var(--text-primary);
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: -0.3px;
}
`;