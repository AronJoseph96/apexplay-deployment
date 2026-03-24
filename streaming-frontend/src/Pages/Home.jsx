import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = "http://localhost:5000";
const AGE_ORDER = ["U", "U/A 7+", "U/A 13+", "U/A 16+", "R", "A"];

const filterByAge = (movies, profile) => {
  if (!profile) return movies;
  const maxIdx = AGE_ORDER.indexOf(profile.ageRating || "A");
  if (maxIdx === -1) return movies;
  return movies.filter(m => AGE_ORDER.indexOf(m.ageRating || "U") <= maxIdx);
};

export default function Home() {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();

  const [sections,         setSections]         = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [currentSlide,     setCurrentSlide]     = useState(0);
  const [recommendations,  setRecommendations]  = useState([]);
  const [recGenres,        setRecGenres]        = useState([]);
  const rowRefs = useRef({});

  /* ── Fetch sections from DB ── */
  useEffect(() => {
    fetch(`${API}/sections`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        // Filter movies in each section by age rating
        const filtered = arr.map(s => ({
          ...s,
          movies: filterByAge(s.movies || [], activeProfile)
        }));
        setSections(filtered);
      })
      .catch(console.error);
  }, [activeProfile]);

  /* ── Continue watching from localStorage ── */
  useEffect(() => {
    try {
      const user    = JSON.parse(localStorage.getItem("apexplay_user"));
      const profile = JSON.parse(localStorage.getItem("apexplay_profile") || "null");
      if (!user) return;
      const key = profile
        ? `apexplay_continue_${user._id}_${profile._id}`
        : `apexplay_continue_${user._id}`;
      setContinueWatching(JSON.parse(localStorage.getItem(key)) || []);
    } catch { /* ignore */ }
  }, []);

  /* ── Fetch recommendations ── */
  useEffect(() => {
    try {
      const user    = JSON.parse(localStorage.getItem("apexplay_user"));
      const profile = JSON.parse(localStorage.getItem("apexplay_profile") || "null");
      if (!user || !profile) return;

      // Pass continue watching IDs so backend can factor them in
      const key      = `apexplay_continue_${user._id}_${profile._id}`;
      const cwList   = JSON.parse(localStorage.getItem(key) || "[]");
      const cwIds    = cwList.map(m => m._id).filter(Boolean).join(",");
      const params   = cwIds ? `?watched=${cwIds}` : "";

      fetch(`http://localhost:5000/users/${user._id}/profiles/${profile._id}/recommendations${params}`)
        .then(r => r.json())
        .then(data => {
          if (data.movies) {
            setRecommendations(data.movies);
            setRecGenres(data.genres || []);
          }
        })
        .catch(() => {});
    } catch { /* ignore */ }
  }, []);

  /* ── Hero auto-rotate ── */
  const heroSection = sections.find(s => s.type === "hero");
  const heroItems   = heroSection?.movies?.slice(0, 5) || [];

  useEffect(() => {
    if (heroItems.length === 0) return;
    const iv = setInterval(() =>
      setCurrentSlide(p => p === heroItems.length - 1 ? 0 : p + 1)
    , 5000);
    return () => clearInterval(iv);
  }, [heroItems.length]);

  const scrollRow = (key, dir) => {
    const el = rowRefs.current[key];
    if (el) el.scrollBy({ left: dir * 500, behavior: "smooth" });
  };

  const hero = heroItems[currentSlide];
  const rowSections = sections.filter(s => s.type === "row" && s.movies?.length > 0);

  return (
    <>
      <style>{css}</style>
      <div className="home-page">

        {/* ══ HERO ══ */}
        {hero ? (
          <section className="home-hero"
            style={{ backgroundImage: `url(${hero.banner || hero.poster})` }}>
            <div className="home-hero-gradient" />
            <div className="home-hero-content">
              <h1 className="home-hero-title">{hero.title}</h1>
              <p className="home-hero-desc">{hero.description}</p>
              <div className="home-hero-actions">
                <button className="home-btn-play"
                  onClick={() => navigate(hero.category === "Series" ? `/series/${hero._id}` : `/movie/${hero._id}`)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Play
                </button>
                <button className="home-btn-info"
                  onClick={() => navigate(hero.category === "Series" ? `/series/${hero._id}` : `/movie/${hero._id}`)}>
                  More Info
                </button>
              </div>
            </div>
            {heroItems.length > 1 && (
              <div className="home-hero-dots">
                {heroItems.map((_, i) => (
                  <button key={i}
                    className={`home-hero-dot ${i === currentSlide ? "active" : ""}`}
                    onClick={() => setCurrentSlide(i)} />
                ))}
              </div>
            )}
          </section>
        ) : (
          /* Fallback hero if no sections configured */
          <div style={{ height:"40vh", background:"var(--bg-surface)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <p style={{ color:"var(--text-muted)", fontFamily:"Outfit", fontSize:16 }}>
              No hero section configured. Go to Admin → Sections to set up.
            </p>
          </div>
        )}

        {/* ══ CONTINUE WATCHING ══ */}
        {continueWatching.length > 0 && (
          <section className="home-section">
            <div className="container">
              <h4 className="home-section-title">Continue Watching</h4>
              <div className="d-flex gap-3 flex-nowrap overflow-auto hide-scrollbar pb-2">
                {continueWatching.map(item => (
                  <div key={item._id + (item.season||"")} style={{ minWidth:150, flexShrink:0 }}>
                    <div style={{ position:"relative", width:150, borderRadius:10, overflow:"hidden", cursor:"pointer" }}
                      onClick={() => navigate(
                        item.category === "Series" && item.season
                          ? `/watch/${item._id}?season=${item.season}&ep=${item.ep}`
                          : `/watch/${item._id}`
                      )}>
                      <img src={item.poster} alt={item.title}
                        style={{ width:150, height:225, objectFit:"cover", display:"block" }} />
                      {item.progress > 0 && (
                        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:"rgba(255,255,255,0.2)" }}>
                          <div style={{ height:"100%", width:`${item.progress}%`, background:"#e50914", borderRadius:2 }} />
                        </div>
                      )}
                    </div>
                    <p className="card-title-text mt-2 mb-0">{item.title}</p>
                    {item.season && <p style={{ fontSize:11, color:"var(--text-muted)", margin:0 }}>S{item.season} E{item.ep}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ RECOMMENDATIONS ══ */}
        {recommendations.length > 0 && (
          <section className="home-section">
            <div className="container">
              <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:16 }}>
                <h4 className="home-section-title" style={{ margin:0 }}>
                  ✨ Recommended For You
                </h4>
                {recGenres.length > 0 && (
                  <span style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"Outfit" }}>
                    based on {recGenres.slice(0,3).join(", ")}
                  </span>
                )}
              </div>
              <div className="row-strip">
                <button className="row-arrow-overlay left" onClick={() => scrollRow("rec", -1)}>‹</button>
                <div className="d-flex flex-row flex-nowrap overflow-auto hide-scrollbar pb-2"
                  ref={el => rowRefs.current["rec"] = el}>
                  {recommendations.map(item => (
                    <MovieCard key={item._id} item={item}
                      onClick={() => navigate(item.category === "Series" ? `/series/${item._id}` : `/movie/${item._id}`)} />
                  ))}
                </div>
                <button className="row-arrow-overlay right" onClick={() => scrollRow("rec", 1)}>›</button>
              </div>
            </div>
          </section>
        )}

        {/* ══ DYNAMIC SECTIONS (rows) ══ */}
        {rowSections.map(section => (
          <section key={section._id} className="home-section">
            <div className="container">
              <h4 className="home-section-title">{section.name}</h4>
              <div className="row-strip">
                <button className="row-arrow-overlay left" onClick={() => scrollRow(section._id, -1)}>‹</button>
                <div className="d-flex flex-row flex-nowrap overflow-auto hide-scrollbar pb-2"
                  ref={el => rowRefs.current[section._id] = el}>
                  {section.movies.map(item => (
                    <MovieCard key={item._id} item={item}
                      onClick={() => navigate(item.category === "Series" ? `/series/${item._id}` : `/movie/${item._id}`)} />
                  ))}
                </div>
                <button className="row-arrow-overlay right" onClick={() => scrollRow(section._id, 1)}>›</button>
              </div>
            </div>
          </section>
        ))}

        {/* Fallback if no row sections */}
        {rowSections.length === 0 && sections.length > 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:"var(--text-muted)", fontFamily:"Outfit" }}>
            <p>No row sections configured. Go to Admin → Sections to add content rows.</p>
          </div>
        )}

      </div>
    </>
  );
}

function MovieCard({ item, onClick }) {
  return (
    <div className="me-3" style={{ minWidth:160, flexShrink:0 }}>
      <div className="movie-card" onClick={onClick}
        style={{ width:150, height:225, backgroundImage:`url(${item.poster})`,
          backgroundSize:"cover", backgroundPosition:"center", borderRadius:10, cursor:"pointer" }} />
      <p className="card-title-text mt-2 mb-0">{item.title}</p>
      <p className="card-year-text">{item.releaseYear}</p>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');
.home-page { background: var(--bg-base); min-height: 100vh; font-family: 'Outfit', sans-serif; }
.home-hero { position:relative; width:100%; height:85vh; min-height:500px; background-size:cover; background-position:center; overflow:hidden; }
.home-hero-gradient { position:absolute; inset:0; background: linear-gradient(to right,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.4) 60%,rgba(0,0,0,0) 100%), linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 50%); }
.home-hero-content { position:absolute; bottom:14%; left:5%; max-width:560px; z-index:10; }
.home-hero-title { font-size:clamp(36px,5.5vw,72px); font-weight:900; color:#fff; letter-spacing:-1.5px; line-height:1.0; margin:0 0 14px; }
.home-hero-desc { font-size:15px; color:rgba(255,255,255,0.72); line-height:1.7; margin-bottom:24px; font-weight:300; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.home-hero-actions { display:flex; gap:12px; align-items:center; }
.home-btn-play { display:inline-flex; align-items:center; gap:8px; background:#fff; color:#000; font-family:'Outfit',sans-serif; font-size:15px; font-weight:700; border:none; border-radius:8px; padding:12px 28px; cursor:pointer; transition:background 0.18s,transform 0.12s; }
.home-btn-play:hover { background:#ddd; transform:scale(1.03); }
.home-btn-info { background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.35); color:#fff; font-family:'Outfit',sans-serif; font-size:15px; font-weight:600; border-radius:8px; padding:12px 28px; cursor:pointer; transition:background 0.18s; backdrop-filter:blur(6px); }
.home-btn-info:hover { background:rgba(255,255,255,0.25); }
.home-hero-dots { position:absolute; bottom:24px; left:5%; z-index:10; display:flex; gap:8px; }
.home-hero-dot { width:8px; height:8px; border-radius:50%; border:none; background:rgba(255,255,255,0.35); cursor:pointer; padding:0; transition:background 0.2s,transform 0.2s; }
.home-hero-dot.active { background:#fff; transform:scale(1.3); }
.home-section { padding:32px 0 8px; }
.home-section-title { color:var(--text-primary); font-family:'Outfit',sans-serif; font-size:20px; font-weight:700; margin-bottom:16px; letter-spacing:-0.3px; }
`;