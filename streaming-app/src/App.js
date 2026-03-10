import React, { useState, useEffect, createContext, useContext } from "react";
import "./styles/theme.css";

import Navbar from "./Components/Navbar";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Home from "./Pages/Home";
import Movies from "./Pages/Movies";
import TVSeries from "./Pages/TVSeries";
import AdminDashboard from "./Pages/AdminDashboard";
import WatchMovie from "./Pages/WatchMovie";
import Watchlist from "./Pages/Watchlist";
import AdminUsers from "./Pages/AdminUsers";
import EmployeeDashboard from "./Pages/Employeedashboard";
import MovieDetails from "./Pages/MovieDetails";
import SeriesDetails from "./Pages/SeriesDetails";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

/* ── Theme Context ── */
export const ThemeContext = createContext();
export function useTheme() { return useContext(ThemeContext); }

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user || user.role !== "ADMIN") return <Navigate to="/" />;
  return children;
}

function EmployeeRoute({ children }) {
  const { user } = useAuth();
  if (!user || !["EMPLOYEE","employee"].includes(user.role)) return <Navigate to="/" />;
  return children;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" />;
  return children;
}

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("apx_theme");
    return saved ? saved === "dark" : true; // default dark
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light-mode");
    } else {
      document.documentElement.classList.add("light-mode");
    }
    localStorage.setItem("apx_theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className="App">
        <Navbar />
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Home />} />
          <Route path="/login"  element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
          <Route path="/movies"    element={<Movies />} />
          <Route path="/series"    element={<TVSeries />} />
          <Route path="/watchlist" element={<Watchlist />} />

          {/* MOVIE */}
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/watch/:id" element={<WatchMovie />} />

          {/* SERIES */}
          <Route path="/series/:id" element={<SeriesDetails />} />

          {/* EMPLOYEE */}
          <Route path="/employee/dashboard" element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>} />

          {/* ADMIN */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users"     element={<AdminRoute><AdminUsers /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={
            <div style={{ paddingTop: "80px", textAlign: "center", color: "var(--text-primary)" }}>
              <h2>Page not found</h2>
            </div>
          } />
        </Routes>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;