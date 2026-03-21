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
function Movies() {
  const { activeProfile } = useAuth();
  const [movies,          setMovies]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [collectionMovie, setCollectionMovie] = useState(null);
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/movies?category=Movie")
      .then(r => r.json())
      .then(data => setMovies(filterByAge(data, activeProfile)))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = movies.filter(movie => {
    const q      = searchParams.get("q")?.toLowerCase() || "";
    const genres = searchParams.get("genres")?.split(",").filter(Boolean) || [];
    const lang   = searchParams.get("lang") || "";
    const from   = searchParams.get("yearFrom");
    const to     = searchParams.get("yearTo");

    if (q      && !movie.title.toLowerCase().includes(q))           return false;
    if (genres.length && !genres.every(g => movie.genres?.includes(g))) return false;
    if (lang   && movie.language !== lang)                           return false;
    if (from   && movie.releaseYear < Number(from))                  return false;
    if (to     && movie.releaseYear > Number(to))                    return false;
    return true;
  });

  return (
    <div style={{ paddingTop: 100, minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="container">

        <h2 style={{ fontFamily: "Outfit", fontWeight: 700, marginBottom: 28 }}>
          Movies ({filtered.length})
        </h2>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
            <p>No movies found.</p>
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map(movie => (
              <div key={movie._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                <div style={{ position: "relative" }}>

                  {/* POSTER */}
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    onClick={() => navigate(`/movie/${movie._id}`)}
                    style={{
                      width: "100%", borderRadius: 10,
                      cursor: "pointer", display: "block",
                      transition: "transform 0.18s",
                      aspectRatio: "2/3", objectFit: "cover"
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = "scale(1.04)"}
                    onMouseOut={e  => e.currentTarget.style.transform = "scale(1)"}
                  />

                  {/* WATCHLIST BUTTON */}
                  <button
                    onClick={e => { e.stopPropagation(); setCollectionMovie(movie); }}
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
                  {movie.rating && (
                    <div style={{
                      position: "absolute", top: 8, left: 8,
                      background: "rgba(0,0,0,0.75)", color: "#facc15",
                      borderRadius: 6, padding: "2px 7px",
                      fontSize: 11, fontWeight: 700, fontFamily: "Outfit"
                    }}>
                      ★ {movie.rating}
                    </div>
                  )}
                </div>

                {/* TITLE */}
                <p style={{
                  marginTop: 8, fontSize: 13, fontFamily: "Outfit",
                  fontWeight: 600, color: "var(--text-primary)", marginBottom: 2
                }}>
                  {movie.title}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  {movie.releaseYear}
                </p>
              </div>
            ))}
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
    </div>
  );
}

export default Movies;