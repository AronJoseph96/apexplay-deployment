import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

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

export default function ForgotPassword() {
  const navigate = useNavigate();

  // step 1 = enter email, step 2 = enter OTP + new password
  const [step,       setStep]       = useState(1);
  const [email,      setEmail]      = useState("");
  const [otp,        setOtp]        = useState(["","","","","",""]);
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [showCon,    setShowCon]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState(null); // {type:"ok"|"err", text}

  const inputRefs = Array.from({ length: 6 }, () => React.createRef());

  // ── Step 1: Send OTP ──
  const sendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setMsg({ type:"err", text:"Enter your email." });
    setLoading(true); setMsg(null);
    try {
      const res  = await fetch(`${API}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type:"ok", text: data.message });
      setStep(2);
    } catch (err) {
      setMsg({ type:"err", text: err.message });
    }
    setLoading(false);
  };

  // ── OTP input box handling ──
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) inputRefs[idx + 1].current?.focus();
  };
  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) inputRefs[idx - 1].current?.focus();
  };
  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs[5].current?.focus();
    }
  };

  // ── Step 2: Reset password ──
  const resetPassword = async (e) => {
    e.preventDefault();
    const otpStr = otp.join("");
    if (otpStr.length < 6) return setMsg({ type:"err", text:"Enter the full 6-digit OTP." });
    if (!newPw)            return setMsg({ type:"err", text:"Enter a new password." });
    if (newPw.length < 6)  return setMsg({ type:"err", text:"Password must be at least 6 characters." });
    if (newPw !== confirmPw) return setMsg({ type:"err", text:"Passwords do not match." });
    setLoading(true); setMsg(null);
    try {
      const res  = await fetch(`${API}/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpStr, newPassword: newPw })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type:"ok", text: data.message });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMsg({ type:"err", text: err.message });
    }
    setLoading(false);
  };

  const inputStyle = {
    width:"100%", padding:"11px 14px", background:"var(--bg-elevated)",
    color:"var(--text-primary)", border:"1px solid var(--border)",
    borderRadius:10, fontFamily:"Outfit", fontSize:15, outline:"none",
    boxSizing:"border-box"
  };
  const labelStyle = { color:"var(--text-secondary)", fontSize:"13px", fontWeight:600, display:"block", marginBottom:6 };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ width:52, height:52, background:"rgba(229,9,20,0.12)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3 style={{ margin:0, fontFamily:"Outfit", fontWeight:800 }}>
            {step === 1 ? "Forgot Password?" : "Enter OTP"}
          </h3>
          <p style={{ color:"var(--text-muted)", fontSize:14, margin:"6px 0 0" }}>
            {step === 1
              ? "We'll send a 6-digit OTP to your email."
              : `OTP sent to ${email}. Check your inbox.`}
          </p>
        </div>

        {/* Message */}
        {msg && (
          <div style={{ padding:"10px 14px", borderRadius:10, fontSize:14, fontWeight:600, marginBottom:16,
            background: msg.type==="ok" ? "rgba(74,222,128,0.12)" : "rgba(229,9,20,0.12)",
            color:       msg.type==="ok" ? "#4ade80" : "#f87171" }}>
            {msg.type==="ok" ? "✓ " : "✕ "}{msg.text}
          </div>
        )}

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <form onSubmit={sendOTP} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input style={inputStyle} type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading}
              className="btn btn-danger w-100"
              style={{ borderRadius:10, fontWeight:700, padding:11, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <form onSubmit={resetPassword} style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* OTP boxes */}
            <div>
              <label style={labelStyle}>6-Digit OTP</label>
              <div style={{ display:"flex", gap:8, justifyContent:"center" }} onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input key={idx} ref={inputRefs[idx]}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, idx)}
                    onKeyDown={e => handleOtpKeyDown(e, idx)}
                    style={{ width:44, height:52, textAlign:"center", fontSize:22, fontWeight:800,
                      background:"var(--bg-elevated)", color:"var(--text-primary)",
                      border: digit ? "2px solid var(--accent)" : "1px solid var(--border)",
                      borderRadius:10, fontFamily:"Outfit", outline:"none" }}
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div>
              <label style={labelStyle}>New Password</label>
              <div style={{ position:"relative" }}>
                <input style={{ ...inputStyle, paddingRight:44 }}
                  type={showPw ? "text" : "password"} placeholder="Min 6 characters"
                  value={newPw} onChange={e => setNewPw(e.target.value)} />
                <button type="button" onClick={() => setShowPw(p=>!p)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:0 }}>
                  <EyeIcon show={showPw} />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position:"relative" }}>
                <input style={{ ...inputStyle, paddingRight:44 }}
                  type={showCon ? "text" : "password"} placeholder="Repeat password"
                  value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                <button type="button" onClick={() => setShowCon(p=>!p)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:0 }}>
                  <EyeIcon show={showCon} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn btn-danger w-100"
              style={{ borderRadius:10, fontWeight:700, padding:11, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Resetting…" : "Reset Password"}
            </button>

            <button type="button" onClick={() => { setStep(1); setMsg(null); setOtp(["","","","","",""]); }}
              style={{ background:"none", border:"none", color:"var(--text-muted)", fontFamily:"Outfit", fontSize:13, cursor:"pointer" }}>
              ← Use a different email
            </button>
          </form>
        )}

        <p style={{ textAlign:"center", marginTop:16, marginBottom:0, fontSize:14, color:"var(--text-muted)" }}>
          Remember your password?{" "}
          <Link to="/login" style={{ color:"var(--accent)", textDecoration:"none", fontWeight:600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}