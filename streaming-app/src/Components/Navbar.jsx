import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../App";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [q, setQ] = useState("");
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
    navigate(`/movies?${params.toString()}`);
  };

  const onSearchSubmit = (e) => { e.preventDefault(); applyFilters(); };

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
            <form className="d-flex flex-grow-1 my-2 my-lg-0 gap-2" onSubmit={onSearchSubmit}>
              <input
                className="form-control nav-search"
                type="search"
                placeholder="Search movies, series..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button type="button" className="btn btn-outline-light flex-shrink-0"
                data-bs-toggle="offcanvas" data-bs-target="#filtersOffcanvas">
                Filters
              </button>
              <button className="btn btn-danger flex-shrink-0" type="submit">Search</button>
            </form>

            {/* RIGHT — theme toggle + user */}
            <ul className="navbar-nav ms-3 align-items-center gap-2">

              {/* THEME TOGGLE */}
              <li className="nav-item">
                <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
                  {isDark ? (
                    /* Sun icon */
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
                    /* Moon icon */
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
                  <a className="nav-link dropdown-toggle" href="/" role="button"
                    data-bs-toggle="dropdown">
                    {user.name}{user.role === "ADMIN" && " (Admin)"}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    {user.role === "ADMIN" && (
                      <>
                        <li><Link className="dropdown-item" to="/admin/dashboard">Admin Dashboard</Link></li>
                        <li><Link className="dropdown-item" to="/admin/users">Manage Users</Link></li>
                        <li><hr className="dropdown-divider" style={{ borderColor: "var(--border)" }} /></li>
                      </>
                    )}
                    {(user.role === "EMPLOYEE" || user.role === "employee") && (
                      <>
                        <li><Link className="dropdown-item" to="/employee/dashboard">My Dashboard</Link></li>
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
                value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} />
            </div>
            <div className="col">
              <input type="number" className="form-control" placeholder="Year to"
                value={yearTo} onChange={(e) => setYearTo(e.target.value)} />
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