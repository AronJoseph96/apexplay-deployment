import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";

export default function Watchlist() {
  const navigate = useNavigate();
  const { user, activeProfile } = useAuth();

  const [collections, setCollections] = useState([]);
  const [activeTab,   setActiveTab]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [newName,     setNewName]     = useState("");
  const [creating,    setCreating]    = useState(false);
  const [error,       setError]       = useState("");

  // Safe setter — always ensures array
  const safeSet = (data) => {
    const arr = Array.isArray(data) ? data : [];
    setCollections(arr);
    return arr;
  };

  const fetchCollections = useCallback(async () => {
    if (!user || !activeProfile?._id) { setLoading(false); return; }
    try {
      const res  = await fetch(`${API}/users/${user._id}/profiles/${activeProfile._id}/collections`);
      const data = await res.json();
      const arr  = safeSet(data);
      if (arr.length > 0) setActiveTab(arr[0]._id);
    } catch (e) {
      console.error(e);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [user, activeProfile?._id]);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  // ── Guards ──
  if (!user) return (
    <div style={{ paddingTop: 120, minHeight: "100vh", background: "var(--bg-base)", textAlign: "center" }}>
      <h2 style={{ color: "var(--text-primary)", fontFamily: "Outfit" }}>Please log in to view your Watchlist</h2>
      <button className="btn btn-danger mt-3" onClick={() => navigate("/login")}>Login</button>
    </div>
  );

  if (!activeProfile) return (
    <div style={{ paddingTop: 120, minHeight: "100vh", background: "var(--bg-base)", textAlign: "center", fontFamily: "Outfit" }}>
      <p style={{ color: "var(--text-muted)", fontSize: 16, marginBottom: 16 }}>Select a profile to view your watchlist.</p>
      <button className="btn btn-danger" onClick={() => navigate("/profiles")}>Choose Profile →</button>
    </div>
  );

  const handleCreate = async () => {
    if (!newName.trim()) return setError("Enter a collection name");
    setCreating(true); setError("");
    try {
      const res  = await fetch(`${API}/users/${user._id}/profiles/${activeProfile._id}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed");
      const arr = safeSet(data);
      if (arr.length > 0) setActiveTab(arr[arr.length - 1]._id);
      setNewName("");
    } catch { setError("Server error"); }
    finally { setCreating(false); }
  };

  const handleRemoveMovie = async (collectionId, movieId) => {
    try {
      const res  = await fetch(`${API}/users/${user._id}/profiles/${activeProfile._id}/collections/${collectionId}/movies/${movieId}`, { method: "DELETE" });
      const data = await res.json();
      safeSet(data);
    } catch (e) { console.error(e); }
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!window.confirm("Delete this collection?")) return;
    try {
      const res  = await fetch(`${API}/users/${user._id}/profiles/${activeProfile._id}/collections/${collectionId}`, { method: "DELETE" });
      const data = await res.json();
      const arr  = safeSet(data);
      setActiveTab(arr.length > 0 ? arr[0]._id : null);
    } catch (e) { console.error(e); }
  };

  const activeCollection = Array.isArray(collections) ? collections.find(c => c._id === activeTab) : null;

  return (
    <div style={{ paddingTop: 90, minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="container py-4" style={{ maxWidth: 1100 }}>

        <h2 style={{ fontFamily: "Outfit", fontWeight: 700, marginBottom: 24 }}>My Collections</h2>

        {/* CREATE COLLECTION BAR */}
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "16px 20px", marginBottom: 28,
          display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap"
        }}>
          <input
            className="form-control"
            placeholder='e.g. "Comedy Night", "Watch Later"'
            value={newName}
            onChange={e => { setNewName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
            style={{ maxWidth: 320 }}
          />
          <button className="btn btn-danger" onClick={handleCreate} disabled={creating}
            style={{ borderRadius: 999, fontFamily: "Outfit", fontWeight: 600 }}>
            {creating ? "Creating…" : "+ New Collection"}
          </button>
          {error && <span style={{ color: "var(--accent)", fontSize: 13 }}>{error}</span>}
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
        ) : collections.length === 0 ? (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "56px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>📂</div>
            <h5 style={{ color: "var(--text-secondary)", fontFamily: "Outfit" }}>No collections yet</h5>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Create a collection above, then add movies from the Movies or TV Shows pages.
            </p>
          </div>
        ) : (
          <>
            {/* TABS */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              {collections.map(col => (
                <button key={col._id} onClick={() => setActiveTab(col._id)} style={{
                  padding: "8px 18px", borderRadius: 999,
                  border: `1px solid ${activeTab === col._id ? "var(--accent)" : "var(--border)"}`,
                  background: activeTab === col._id ? "var(--accent)" : "var(--bg-surface)",
                  color: activeTab === col._id ? "#fff" : "var(--text-primary)",
                  fontFamily: "Outfit", fontWeight: 600, fontSize: 14,
                  cursor: "pointer", transition: "all 0.15s"
                }}>
                  {col.name}
                  <span style={{ marginLeft: 6, background: "rgba(255,255,255,0.25)", borderRadius: 999, padding: "1px 7px", fontSize: 11 }}>
                    {col.movies?.length || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* ACTIVE COLLECTION */}
            {activeCollection && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h4 style={{ fontFamily: "Outfit", fontWeight: 700, margin: 0 }}>{activeCollection.name}</h4>
                  <button onClick={() => handleDeleteCollection(activeCollection._id)} style={{
                    background: "rgba(229,9,20,0.10)", color: "var(--accent)",
                    border: "1px solid rgba(229,9,20,0.25)", borderRadius: 8,
                    padding: "6px 14px", fontFamily: "Outfit", fontSize: 13,
                    fontWeight: 600, cursor: "pointer"
                  }}>🗑 Delete Collection</button>
                </div>

                {(activeCollection.movies?.length || 0) === 0 ? (
                  <div style={{ background: "var(--bg-surface)", border: "1px dashed var(--border)", borderRadius: 14, padding: "36px 24px", textAlign: "center" }}>
                    <p style={{ color: "var(--text-muted)", margin: 0, fontFamily: "Outfit" }}>
                      No movies here yet — add movies from the Movies or TV Shows pages.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                    {activeCollection.movies.map(movie => (
                      <div key={movie._id} style={{ width: "clamp(110px, 20vw, 150px)" }}>
                        <div style={{ position: "relative" }}>
                          <img src={movie.poster} alt={movie.title}
                            onClick={() => navigate(movie.category === "Series" ? `/series/${movie._id}` : `/movie/${movie._id}`)}
                            style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 10, cursor: "pointer", display: "block" }} />
                          <button onClick={() => handleRemoveMovie(activeCollection._id, movie._id)} title="Remove"
                            style={{ position: "absolute", top: 7, right: 7, width: 26, height: 26, borderRadius: "50%",
                              background: "rgba(229,9,20,0.90)", color: "#fff", border: "none", fontSize: 13, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                        </div>
                        <p style={{ marginTop: 8, fontSize: 13, fontFamily: "Outfit", fontWeight: 600, color: "var(--text-primary)" }}>
                          {movie.title}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -6 }}>{movie.releaseYear}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}