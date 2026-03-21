import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CollectionModal from "../Components/CollectionModal";


// Filter movies by active profile's age rating
const filterByAge = (movies, profile) => {
  if (!profile) return movies;
  const ORDER = ["U", "U/A 7+", "U/A 13+", "U/A 16+", "R", "A"];
  const maxIdx = ORDER.indexOf(profile.ageRating);
  if (maxIdx === -1) return movies; // unknown rating = show all
  return movies.filter(m => {
    const idx = ORDER.indexOf(m.ageRating || "U");
    return idx <= maxIdx;
  });
};
function TVSeries() {
  const { activeProfile } = useAuth();
  const [series,          setSeries]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [collectionMovie, setCollectionMovie] = useState(null);
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/movies?category=Series")
      .then(r => r.json())
      .then(data => setSeries(filterByAge(data, activeProfile)))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = series.filter(s => {
    const q = searchParams.get("q")?.toLowerCase() || "";
    return !q || s.title.toLowerCase().includes(q);
  });

  return (
    <div style={{ paddingTop: 100, minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="container">

        <h2 style={{ fontFamily: "Outfit", fontWeight: 700, marginBottom: 28 }}>
          TV Series ({filtered.length})
        </h2>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📺</div>
            <p>No series found.</p>
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map(s => (
              <div key={s._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                <div style={{ position: "relative" }}>

                  {/* POSTER */}
                  <img
                    src={s.poster}
                    alt={s.title}
                    onClick={() => navigate(`/series/${s._id}`)}
                    style={{
                      width: "100%", borderRadius: 10,
                      cursor: "pointer", display: "block",
                      aspectRatio: "2/3", objectFit: "cover",
                      transition: "transform 0.18s"
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = "scale(1.04)"}
                    onMouseOut={e  => e.currentTarget.style.transform = "scale(1)"}
                  />

                  {/* WATCHLIST BUTTON */}
                  <button
                    onClick={e => { e.stopPropagation(); setCollectionMovie(s); }}
                    style={{
                      position: "absolute", bottom: 10, right: 10,
                      background: "rgba(13,13,18,0.85)", color: "#fff",
                      border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8,
                      fontSize: 12, fontFamily: "Outfit", fontWeight: 600,
                      padding: "5px 10px", cursor: "pointer",
                      backdropFilter: "blur(6px)"
                    }}
                  >
                    + Watchlist
                  </button>

                  {/* RATING BADGE */}
                  {s.rating && (
                    <div style={{
                      position: "absolute", top: 8, left: 8,
                      background: "rgba(0,0,0,0.75)", color: "#facc15",
                      borderRadius: 6, padding: "2px 7px",
                      fontSize: 11, fontWeight: 700, fontFamily: "Outfit"
                    }}>
                      ★ {s.rating}
                    </div>
                  )}
                </div>

                <p style={{
                  marginTop: 8, fontSize: 13, fontFamily: "Outfit",
                  fontWeight: 600, color: "var(--text-primary)", marginBottom: 2
                }}>
                  {s.title}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  {s.releaseYear}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {collectionMovie && (
        <CollectionModal
          movie={collectionMovie}
          onClose={() => setCollectionMovie(null)}
        />
      )}
    </div>
  );
}

export default TVSeries;