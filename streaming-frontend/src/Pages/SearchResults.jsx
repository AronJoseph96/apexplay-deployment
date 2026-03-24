import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CollectionModal from "../Components/CollectionModal";

const API = "http://localhost:5000";
const AGE_ORDER = ["U", "U/A 7+", "U/A 13+", "U/A 16+", "R", "A"];

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { activeProfile } = useAuth();

  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [collectionMovie, setCollectionMovie] = useState(null);

  const q       = searchParams.get("q")   || "";
  const genres  = searchParams.get("genres") || "";
  const lang    = searchParams.get("lang") || "";
  const yearFrom= searchParams.get("yearFrom") || "";
  const yearTo  = searchParams.get("yearTo") || "";

  useEffect(() => {
    if (!q && !genres && !lang && !yearFrom && !yearTo) { setResults([]); return; }
    setLoading(true);
    const params = new URLSearchParams();
    if (q)       params.set("q", q);
    if (genres)  params.set("genres", genres);
    if (lang)    params.set("lang", lang);
    if (yearFrom) params.set("yearFrom", yearFrom);
    if (yearTo)   params.set("yearTo", yearTo);

    fetch(`${API}/movies?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        let filtered = Array.isArray(data) ? data : [];
        // Age filter
        if (activeProfile) {
          const maxIdx = AGE_ORDER.indexOf(activeProfile.ageRating || "A");
          filtered = filtered.filter(m => AGE_ORDER.indexOf(m.ageRating || "U") <= maxIdx);
        }
        setResults(filtered);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q, genres, lang, yearFrom, yearTo]);

  const movies = results.filter(r => r.category === "Movie");
  const series = results.filter(r => r.category === "Series");

  const Card = ({ item }) => (
    <div style={{ position:"relative" }}>
      <img src={item.poster} alt={item.title}
        onClick={() => navigate(item.category === "Series" ? `/series/${item._id}` : `/movie/${item._id}`)}
        style={{ width:"100%", borderRadius:10, cursor:"pointer", display:"block",
          aspectRatio:"2/3", objectFit:"cover", transition:"transform 0.18s" }}
        onMouseOver={e => e.currentTarget.style.transform = "scale(1.04)"}
        onMouseOut={e  => e.currentTarget.style.transform = "scale(1)"} />
      <button onClick={e => { e.stopPropagation(); setCollectionMovie(item); }}
        style={{ position:"absolute", bottom:10, right:10, background:"rgba(13,13,18,0.85)",
          color:"#fff", border:"1px solid rgba(255,255,255,0.18)", borderRadius:8,
          fontSize:12, fontFamily:"Outfit", fontWeight:600, padding:"5px 10px",
          cursor:"pointer", backdropFilter:"blur(6px)" }}>
        + Watchlist
      </button>
      {item.rating > 0 && (
        <div style={{ position:"absolute", top:8, left:8, background:"rgba(0,0,0,0.75)",
          color:"#facc15", borderRadius:6, padding:"2px 7px", fontSize:11, fontWeight:700 }}>
          ★ {item.rating}
        </div>
      )}
      <p style={{ marginTop:8, fontSize:13, fontFamily:"Outfit", fontWeight:600,
        color:"var(--text-primary)", marginBottom:2 }}>{item.title}</p>
      <p style={{ fontSize:12, color:"var(--text-muted)", margin:0 }}>{item.releaseYear}</p>
    </div>
  );

  return (
    <div style={{ paddingTop:100, minHeight:"100vh", background:"var(--bg-base)", color:"var(--text-primary)" }}>
      <div className="container">

        {/* Header */}
        <div style={{ marginBottom:32 }}>
          {q ? (
            <h2 style={{ fontFamily:"Outfit", fontWeight:700, marginBottom:4 }}>
              Search results for "<span style={{ color:"var(--accent)" }}>{q}</span>"
            </h2>
          ) : (
            <h2 style={{ fontFamily:"Outfit", fontWeight:700, marginBottom:4 }}>Filtered Results</h2>
          )}
          {!loading && (
            <p style={{ color:"var(--text-muted)", fontSize:14 }}>
              {results.length} result{results.length !== 1 ? "s" : ""} found
              {genres && ` · ${genres}`}
              {lang && ` · ${lang}`}
              {(yearFrom || yearTo) && ` · ${yearFrom||""}${yearFrom&&yearTo?"–":""}${yearTo||""}`}
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
        ) : results.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text-muted)" }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🔍</div>
            <p style={{ fontSize:16 }}>No results found{q ? ` for "${q}"` : ""}.</p>
            <p style={{ fontSize:14 }}>Try a different keyword or adjust your filters.</p>
          </div>
        ) : (
          <>
            {/* Movies */}
            {movies.length > 0 && (
              <div style={{ marginBottom:48 }}>
                <h4 style={{ fontFamily:"Outfit", fontWeight:700, marginBottom:20 }}>
                   Movies <span style={{ color:"var(--text-muted)", fontSize:16, fontWeight:400 }}>({movies.length})</span>
                </h4>
                <div className="row g-3">
                  {movies.map(m => (
                    <div key={m._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                      <Card item={m} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Series */}
            {series.length > 0 && (
              <div style={{ marginBottom:48 }}>
                <h4 style={{ fontFamily:"Outfit", fontWeight:700, marginBottom:20 }}>
                   TV Series <span style={{ color:"var(--text-muted)", fontSize:16, fontWeight:400 }}>({series.length})</span>
                </h4>
                <div className="row g-3">
                  {series.map(s => (
                    <div key={s._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                      <Card item={s} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {collectionMovie && (
        <CollectionModal movie={collectionMovie} onClose={() => setCollectionMovie(null)} />
      )}
    </div>
  );
}