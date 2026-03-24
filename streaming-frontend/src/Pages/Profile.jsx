import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";

// All 15 inbuilt pixel avatars from public/avatars/
const INBUILT_AVATARS = Array.from({ length: 13 }, (_, i) => `/avatars/${i + 1}.jpg`);

const ROLE_BADGE = {
  ADMIN:    { label: "Admin",    color: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
  admin:    { label: "Admin",    color: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
  EMPLOYEE: { label: "Employee", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  employee: { label: "Employee", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  USER:     { label: "Member",   color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  user:     { label: "Member",   color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // ── tabs ──
  const [tab, setTab] = useState("profile"); // profile | password

  // ── profile form ──
  const [name,          setName]          = useState(user?.name || "");
  const [selectedAvatar,setSelectedAvatar] = useState(user?.avatar || "");
  const [showPicker,    setShowPicker]    = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [profileMsg,    setProfileMsg]    = useState(null); // { type: ok|err, text }

  // ── password form ──
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [pwSaving,   setPwSaving]   = useState(false);
  const [pwMsg,      setPwMsg]      = useState(null);
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showCon,    setShowCon]    = useState(false);

  // ── custom upload ──
  if (!user) { navigate("/login"); return null; }

  const badge = ROLE_BADGE[user.role] || ROLE_BADGE["USER"];

  // ── pick inbuilt avatar ──
  const pickAvatar = (url) => {
    setSelectedAvatar(url);
    setShowPicker(false);
  };

  // ── save profile (name + inbuilt avatar) ──
  const saveProfile = async () => {
    setSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`${API}/users/${user._id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl: selectedAvatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Use the full returned object so avatar URL is definitely fresh
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem("apexplay_user", JSON.stringify(updated));
      setProfileMsg({ type: "ok", text: "Profile saved successfully!" });
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setProfileMsg({ type: "err", text: err.message });
    }
    setSaving(false);
  };

  // ── change password ──
  const changePassword = async () => {
    setPwMsg(null);
    if (!currentPw || !newPw || !confirmPw) return setPwMsg({ type: "err", text: "All fields required" });
    if (newPw.length < 6) return setPwMsg({ type: "err", text: "Password must be at least 6 characters" });
    if (newPw !== confirmPw) return setPwMsg({ type: "err", text: "New passwords do not match" });
    setPwSaving(true);
    try {
      const res = await fetch(`${API}/users/${user._id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPwMsg({ type: "ok", text: "Password changed successfully!" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwMsg({ type: "err", text: err.message });
    }
    setPwSaving(false);
  };

  // ── shared styles ──
  const inputStyle = {
    width: "100%", padding: "11px 14px",
    background: "var(--bg-elevated)", color: "var(--text-primary)",
    border: "1px solid var(--border)", borderRadius: 10,
    fontFamily: "Outfit", fontSize: 15, outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 };
  const btnPrimary = {
    background: "var(--accent)", color: "#fff", border: "none",
    borderRadius: 10, padding: "12px 32px", fontFamily: "Outfit",
    fontWeight: 700, fontSize: 15, cursor: "pointer",
    transition: "opacity 0.15s",
  };

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingTop: 80, fontFamily: "Outfit, sans-serif", color: "var(--text-primary)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px 80px" }}>

          {/* ── PROFILE HEADER ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 36, flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", border: "3px solid var(--accent)", background: "var(--bg-elevated)" }}>
                {(selectedAvatar || user.avatar) ? (
                  <img src={selectedAvatar || user.avatar} alt="avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 900, color: "var(--accent)" }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Name + role */}
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 24, margin: 0 }}>{user.name}</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "4px 0 8px" }}>{user.email}</p>
              <span style={{ background: badge.bg, color: badge.color, borderRadius: 999, padding: "3px 14px", fontSize: 12, fontWeight: 700 }}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* ── TABS ── */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 28 }}>
            {[["profile", "Edit Profile"], ["password", "Change Password"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                background: "none", border: "none",
                borderBottom: `2px solid ${tab === key ? "var(--accent)" : "transparent"}`,
                color: tab === key ? "var(--text-primary)" : "var(--text-muted)",
                fontFamily: "Outfit", fontWeight: 700, fontSize: 15,
                padding: "10px 22px", cursor: "pointer", marginBottom: -1, transition: "all 0.15s"
              }}>{label}</button>
            ))}
          </div>

          {/* ══ EDIT PROFILE TAB ══ */}
          {tab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Avatar picker section */}
              <div>
                <label style={labelStyle}>Profile Avatar</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Current avatar preview */}
                  <div style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", border: "2px solid var(--accent)", background: "var(--bg-elevated)", flexShrink: 0 }}>
                    {(selectedAvatar || user.avatar) ? (
                      <img src={selectedAvatar || user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "var(--accent)" }}>
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button onClick={() => setShowPicker(p => !p)} style={{ ...btnPrimary, padding: "9px 18px", fontSize: 13, background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                       Choose Avatar
                    </button>

                  </div>
                </div>

                {/* Avatar Grid Picker */}
                {showPicker && (
                  <div style={{ marginTop: 16, padding: 16, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Pick your avatar:</p>
                    <div className="avatar-grid">
                      {INBUILT_AVATARS.map(src => (
                        <div key={src} onClick={() => pickAvatar(src)}
                          className={`avatar-thumb ${selectedAvatar === src ? "active" : ""}`}>
                          <img src={src} alt="avatar" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label style={labelStyle}>Display Name</label>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>

              {/* Email (read only) */}
              <div>
                <label style={labelStyle}>Email</label>
                <input style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} value={user.email} readOnly />
              </div>

              {/* Message */}
              {profileMsg && (
                <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: profileMsg.type === "ok" ? "rgba(74,222,128,0.12)" : "rgba(229,9,20,0.12)",
                  color: profileMsg.type === "ok" ? "#4ade80" : "#f87171" }}>
                  {profileMsg.type === "ok" ? "✓ " : "✕ "}{profileMsg.text}
                </div>
              )}

              <button onClick={saveProfile} disabled={saving} style={{ ...btnPrimary, alignSelf: "flex-start", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}

          {/* ══ CHANGE PASSWORD TAB ══ */}
          {tab === "password" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 440 }}>

              {[
                { label: "Current Password", val: currentPw, set: setCurrentPw, show: showCur, toggle: () => setShowCur(p=>!p) },
                { label: "New Password",     val: newPw,     set: setNewPw,     show: showNew, toggle: () => setShowNew(p=>!p) },
                { label: "Confirm New Password", val: confirmPw, set: setConfirmPw, show: showCon, toggle: () => setShowCon(p=>!p) },
              ].map(({ label, val, set, show, toggle }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={show ? "text" : "password"}
                      style={{ ...inputStyle, paddingRight: 44 }}
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button onClick={toggle} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16 }}>
                      {show ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
              ))}

              {pwMsg && (
                <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: pwMsg.type === "ok" ? "rgba(74,222,128,0.12)" : "rgba(229,9,20,0.12)",
                  color: pwMsg.type === "ok" ? "#4ade80" : "#f87171" }}>
                  {pwMsg.type === "ok" ? "✓ " : "✕ "}{pwMsg.text}
                </div>
              )}

              <button onClick={changePassword} disabled={pwSaving} style={{ ...btnPrimary, alignSelf: "flex-start", opacity: pwSaving ? 0.6 : 1 }}>
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

const css = `
.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 10px;
}
.avatar-thumb {
  width: 72px; height: 72px; border-radius: 10px; overflow: hidden;
  border: 2px solid transparent; cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}
.avatar-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-thumb:hover { transform: scale(1.06); border-color: var(--accent); }
.avatar-thumb.active { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(229,9,20,0.3); }
`;