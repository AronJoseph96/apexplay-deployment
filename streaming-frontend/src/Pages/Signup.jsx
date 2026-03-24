import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const EyeIcon = ({ show }) => show ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// Map age to age rating
const ageToRating = (age) => {
  const n = parseInt(age);
  if (n < 7)  return "U";
  if (n < 13) return "U/A 7+";
  if (n < 16) return "U/A 13+";
  if (n < 18) return "U/A 16+";
  return "A";
};

function Signup() {
  const navigate = useNavigate();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [age,      setAge]      = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [showCon,  setShowCon]  = useState(false);

  const isStrong = (pwd) =>
    pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) &&
    /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim())         return setError("Username is required");
    if (!email.trim())        return setError("Email is required");
    if (!age || isNaN(age) || age < 1 || age > 120)
                              return setError("Enter a valid age");
    if (password !== confirm) return setError("Passwords do not match");
    if (!isStrong(password))  return setError("Password must be 8+ chars with upper, lower, number & symbol");
    try {
      const res = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, age: parseInt(age), password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Signup failed");
      alert("Account created! Please login.");
      navigate("/login");
    } catch {
      setError("Server error. Please try again.");
    }
  };

  const rating = age ? ageToRating(age) : null;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h3 className="mb-1 text-center">Create account</h3>
        <p className="text-center mb-4" style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Join ApexPlay today
        </p>

        {error && (
          <div className="alert alert-danger py-2" style={{ fontSize: "14px", borderRadius: "10px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-3">
            <label style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600 }}>Username</label>
            <input className="form-control mt-1" placeholder="Your name"
              type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600 }}>Email</label>
            <input className="form-control mt-1" placeholder="you@example.com"
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {/* Age */}
          <div className="mb-3">
            <label style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600 }}>Your Age</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }} className="mt-1">
              <input className="form-control" placeholder="e.g. 25" type="number"
                min={1} max={120} value={age} onChange={(e) => setAge(e.target.value)}
                style={{ maxWidth: 120 }} />
              {rating && (
                <span style={{
                  background: "rgba(229,9,20,0.12)", color: "var(--accent)",
                  border: "1px solid rgba(229,9,20,0.3)", borderRadius: 8,
                  padding: "4px 12px", fontSize: 13, fontWeight: 700
                }}>
                  {rating} profile
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
              This sets what content your profile can access.
            </p>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600 }}>Password</label>
            <div style={{ position: "relative" }} className="mt-1">
              <input className="form-control" placeholder="Min 8 chars"
                type={showPw ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPw(p => !p)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <EyeIcon show={showPw} />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600 }}>Confirm Password</label>
            <div style={{ position: "relative" }} className="mt-1">
              <input className="form-control" placeholder="Repeat password"
                type={showCon ? "text" : "password"} value={confirm}
                onChange={(e) => setConfirm(e.target.value)} style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowCon(p => !p)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <EyeIcon show={showCon} />
              </button>
            </div>
          </div>

          <button className="btn btn-danger w-100 mt-1"
            style={{ borderRadius: "10px", fontWeight: 700, padding: "11px" }}>
            Create Account
          </button>
        </form>

        <p className="text-center mt-3 mb-0" style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;