import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EyeIcon = ({ show }) => show ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Invalid login credentials");
      login(data.user, data.token);
      navigate(data.user.role === "ADMIN" ? "/admin/dashboard" : "/profiles");
    } catch {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h3 className="mb-1 text-center">Welcome back</h3>
        <p className="text-center mb-4" style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Sign in to ApexPlay
        </p>

        {error && (
          <div className="alert alert-danger py-2" style={{ fontSize: "14px", borderRadius: "10px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600 }}>Email</label>
          <input className="form-control mb-3 mt-1" placeholder="you@example.com"
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

          <label style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600 }}>Password</label>
          <div style={{ position: "relative" }} className="mb-4 mt-1">
            <input className="form-control" placeholder="••••••••"
              type={show ? "text" : "password"} required
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShow(p => !p)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", padding: 0, outline: "none", lineHeight: 0 }}>
              <EyeIcon show={show} />
            </button>
          </div>

          <div style={{ textAlign:"right", marginBottom:12 }}>
            <Link to="/forgot-password" style={{ color:"var(--text-muted)", fontSize:13, textDecoration:"none" }}>
              Forgot password?
            </Link>
          </div>

          <button className="btn btn-danger w-100" style={{ borderRadius: "10px", fontWeight: 700, padding: "11px" }}>
            Login
          </button>
        </form>

        <p className="text-center mt-3 mb-0" style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;