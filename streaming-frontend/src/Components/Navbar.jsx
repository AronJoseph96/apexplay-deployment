import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../App";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout, activeProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [q, setQ] = useState("");
  const [suggestions, setSuggestions]   = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSugg,  setLoadingSugg]  = useState(false);
  const dropdownRef = useRef();
  const searchTimer = useRef();
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [genres, setGenres] = useState([]);
  const [language, setLanguage] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/languages")
      .then((r) => r.json())
      .then((d) => setLanguages(d.map((l) => l.name)))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/genres")
      .then((r) => r.json())
      .then((d) => setGenres(d.map((g) => g.name)))
      .catch(console.error);
  }, []);

  // Live search
  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setLoadingSugg(true);
      try {
        const fuzzy = q.trim().split("").join(".*");
        const res   = await fetch(`http://localhost:5000/movies?q=${encodeURIComponent(q.trim())}`);
        const data  = await res.json();
        setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
        setShowDropdown(true);
      } catch { setSuggestions([]); }
      finally { setLoadingSugg(false); }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [q]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleGenre = (g) =>
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );

  const clearFilters = () => {
    setSelectedGenres([]); setLanguage("");
    setYearFrom(""); setYearTo(""); setQ("");
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (selectedGenres.length) params.set("genres", selectedGenres.join(","));
    if (language) params.set("lang", language);
    if (yearFrom) params.set("yearFrom", yearFrom);
    if (yearTo) params.set("yearTo", yearTo);
    navigate(`/search?${params.toString()}`);
  };

  const onSearchSubmit = (e) => { e.preventDefault(); applyFilters(); };

  const isAdmin    = user && ["ADMIN",    "admin"].includes(user.role);
  const isEmployee = user && ["EMPLOYEE", "employee"].includes(user.role);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-overlay">
        <div className="container-fluid px-3">

          {/* BRAND */}
          <Link className="navbar-brand me-4" to="/">ApexPlay</Link>

          <button className="navbar-toggler border-0" type="button"
            data-bs-toggle="collapse" data-bs-target="#navbarMain"
            style={{ color: "var(--text-primary)" }}>
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarMain">

            {/* LEFT LINKS */}
            <ul className="navbar-nav me-3">
              <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/movies">Movies</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/series">TV Shows</Link></li>
              {user && (
                <li className="nav-item"><Link className="nav-link" to="/watchlist">Watchlist</Link></li>
              )}
            </ul>

            {/* SEARCH */}
            <form className="d-flex flex-grow-1 my-2 my-lg-0 gap-2 flex-wrap flex-lg-nowrap" onSubmit={onSearchSubmit} style={{ position:"relative", zIndex:100 }}>
              <div ref={dropdownRef} style={{ position:"relative", flex:1 }}>
                <input
                  className="form-control nav-search"
                  type="search"
                  placeholder="Search movies, series..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                  style={{ width:"100%" }}
                />
                {/* LIVE DROPDOWN */}
                {showDropdown && (q.trim().length >= 2) && (
                  <div style={{
                    position:"absolute", top:"calc(100% + 6px)", left:0, right:0,
                    background:"var(--bg-surface)", border:"1px solid var(--border)",
                    borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
                    zIndex:9999, overflow:"hidden", maxHeight:400, overflowY:"auto"
                  }}>
                    {loadingSugg ? (
                      <div style={{ padding:"12px 16px", color:"var(--text-muted)", fontSize:14, textAlign:"center" }}>
                        Searching…
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div style={{ padding:"12px 16px", color:"var(--text-muted)", fontSize:14, textAlign:"center" }}>
                        No results for "{q}"
                      </div>
                    ) : (
                      <>
                        {suggestions.map(item => (
                          <div key={item._id}
                            onClick={() => {
                              setShowDropdown(false);
                              setQ("");
                              navigate(item.category === "Series" ? `/series/${item._id}` : `/movie/${item._id}`);
                            }}
                            style={{
                              display:"flex", alignItems:"center", gap:12,
                              padding:"10px 14px", cursor:"pointer",
                              borderBottom:"1px solid var(--border)",
                              transition:"background 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <img src={item.poster} alt={item.title}
                              style={{ width:36, height:52, objectFit:"cover", borderRadius:6, flexShrink:0 }} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontFamily:"Outfit", fontWeight:600, fontSize:14,
                                color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                {item.title}
                              </div>
                              <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>
                                {item.category} · {item.releaseYear} {item.language && `· ${item.language}`}
                              </div>
                            </div>
                            <span style={{
                              fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999,
                              background: item.category === "Series" ? "rgba(99,102,241,0.15)" : "rgba(229,9,20,0.12)",
                              color: item.category === "Series" ? "#818cf8" : "var(--accent)",
                              flexShrink:0
                            }}>{item.category}</span>
                          </div>
                        ))}
                        {/* See all results */}
                        <div onClick={() => { setShowDropdown(false); applyFilters(); }}
                          style={{ padding:"10px 16px", textAlign:"center", fontSize:13,
                            fontFamily:"Outfit", fontWeight:600, color:"var(--accent)",
                            cursor:"pointer", background:"var(--bg-elevated)" }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        >
                          See all results for "{q}" →
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button type="button" className="btn btn-outline-light flex-shrink-0 d-none d-sm-block"
                data-bs-toggle="offcanvas" data-bs-target="#filtersOffcanvas">
                Filters
              </button>
              <button className="btn btn-danger flex-shrink-0" type="submit">Search</button>
            </form>

            {/* RIGHT — theme + user */}
            <ul className="navbar-nav ms-3 align-items-center gap-2">

              {/* THEME TOGGLE */}
              <li className="nav-item">
                <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
                  {isDark ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/>
                      <line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  )}
                </button>
              </li>

              {!user ? (
                <>
                  <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/signup">Sign Up</Link></li>
                </>
              ) : (
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle d-flex align-items-center gap-2"
                    href="/" role="button" data-bs-toggle="dropdown">
                    {/* Show active profile avatar or user avatar */}
                    {(activeProfile?.avatar || user.avatar) ? (
                      <img src={activeProfile?.avatar || user.avatar} alt="avatar" style={{
                        width: 28, height: 28, borderRadius: "50%",
                        objectFit: "cover", border: "2px solid var(--accent)"
                      }} />
                    ) : (
                      <span style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "var(--accent)", display: "inline-flex",
                        alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 13, color: "#fff", flexShrink: 0
                      }}>
                        {user.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                    {activeProfile ? activeProfile.name : user.name}
                  </a>

                  <ul className="dropdown-menu dropdown-menu-end">

                    {/* Active profile + switch */}
                    {activeProfile && <li><span className="dropdown-item disabled" style={{fontSize:12,opacity:0.6}}>Profile: {activeProfile.name}</span></li>}
                    <li><Link className="dropdown-item" to="/profiles"> Switch Profile</Link></li>
                    <li><Link className="dropdown-item" to="/profile"> My Account</Link></li>
                    <li><Link className="dropdown-item" to="/subscription">
                      {user?.subscription?.status === "active" ? " Subscription" : " Subscribe"}
                    </Link></li>
                    <li><hr className="dropdown-divider" style={{ borderColor: "var(--border)" }} /></li>

                    {/* Admin links */}
                    {isAdmin && (
                      <>
                        <li><Link className="dropdown-item" to="/admin/dashboard"> Admin Dashboard</Link></li>
                        <li><Link className="dropdown-item" to="/admin/users"> Manage Users</Link></li>
                        <li><hr className="dropdown-divider" style={{ borderColor: "var(--border)" }} /></li>
                      </>
                    )}

                    {/* Employee link */}
                    {isEmployee && (
                      <>
                        <li><Link className="dropdown-item" to="/employee/dashboard"> My Dashboard</Link></li>
                        <li><hr className="dropdown-divider" style={{ borderColor: "var(--border)" }} /></li>
                      </>
                    )}

                    <li>
                      <button className="dropdown-item text-danger"
                        onClick={() => { logout(); navigate("/"); }}>
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* FILTER OFFCANVAS */}
      <div className="offcanvas offcanvas-end apx-offcanvas" tabIndex="-1" id="filtersOffcanvas">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Filters</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas"
            style={{ filter: "var(--bs-btn-close-filter, none)" }}></button>
        </div>
        <div className="offcanvas-body">

          <div className="mb-3">
            <div className="fw-semibold mb-2">Genres</div>
            {genres.map((g) => (
              <div className="form-check" key={g}>
                <input className="form-check-input" type="checkbox"
                  id={`genre-${g}`} checked={selectedGenres.includes(g)}
                  onChange={() => toggleGenre(g)} />
                <label className="form-check-label" htmlFor={`genre-${g}`}>{g}</label>
              </div>
            ))}
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Language</label>
            <select className="form-select" value={language}
              onChange={(e) => setLanguage(e.target.value)}>
              <option value="">Any</option>
              {languages.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="row g-2 mb-4">
            <div className="col">
              <input type="number" className="form-control" placeholder="Year from"
                min="1900" max="2026" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} />
            </div>
            <div className="col">
              <input type="number" className="form-control" placeholder="Year to"
                min="1900" max="2026" value={yearTo} onChange={(e) => setYearTo(e.target.value)} />
            </div>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary w-50" onClick={clearFilters}>Clear</button>
            <button className="btn btn-danger w-50" onClick={applyFilters}
              data-bs-dismiss="offcanvas">Apply</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;