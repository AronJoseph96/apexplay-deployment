import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";
const AGE_RATINGS = ["U", "U/A 7+", "U/A 13+", "U/A 16+", "R", "A"];
const AVATARS = Array.from({ length: 13 }, (_, i) => `/avatars/${i + 1}.jpg`);

export default function ProfileSelector() {
  const { user, setUser, setActiveProfile } = useAuth();
  const navigate = useNavigate();

  const [profiles,     setProfiles]     = useState([]);
  const [pinTarget,    setPinTarget]    = useState(null); // profile needing PIN
  const [pin,          setPin]          = useState(["","","",""]);
  const [pinError,     setPinError]     = useState("");
  const [showManage,   setShowManage]   = useState(false);
  const [showAdd,      setShowAdd]      = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const pinRef0 = useRef();
  const pinRef1 = useRef();
  const pinRef2 = useRef();
  const pinRef3 = useRef();
  const pinRefs = [pinRef0, pinRef1, pinRef2, pinRef3];

  // New/edit profile form
  const [formName,      setFormName]      = useState("");
  const [formAvatar,    setFormAvatar]    = useState("/avatars/1.jpg");
  const [formAgeRating, setFormAgeRating] = useState("A");
  const [formIsKids,    setFormIsKids]    = useState(false);
  const [formPin,       setFormPin]       = useState("");
  const [formEditPin,   setFormEditPin]   = useState("");
  const [formScreenTime,setFormScreenTime]= useState(60);
  const [formLoading,   setFormLoading]   = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // PIN-before-action state
  const [actionTarget,  setActionTarget]  = useState(null); // {type:"edit"|"delete", profile}
  const [actionPinVal,  setActionPinVal]  = useState(["","","",""]);
  const [actionPinErr,  setActionPinErr]  = useState("");
  const aRef0 = useRef(); const aRef1 = useRef();
  const aRef2 = useRef(); const aRef3 = useRef();
  const actionRefs = [aRef0, aRef1, aRef2, aRef3];

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const res  = await fetch(`${API}/users/${user._id}/profiles`);
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : []);
    } catch { setProfiles([]); }
  };

  // ── Select profile ──
  const selectProfile = (profile) => {
    // Check screen time limit
    if (profile.isKids && profile.screenTimeLimit) {
      const today = new Date().toISOString().slice(0, 10);
      if (profile.screenTimeDate === today &&
          profile.screenTimeUsed >= profile.screenTimeLimit) {
        alert(`⏱ Screen time limit reached for ${profile.name}. Daily limit: ${profile.screenTimeLimit} mins.`);
        return;
      }
    }
    // Check PIN
    if (profile.pin) {
      setPinTarget(profile);
      setPin(["","","",""]);
      setPinError("");
      setTimeout(() => pinRefs[0].current?.focus(), 100);
    } else {
      enterProfile(profile);
    }
  };

  const enterProfile = (profile) => {
    setActiveProfile(profile);
    navigate("/");
  };

  // ── PIN verify ──
  const handlePinChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...pin];
    next[idx] = val.slice(-1);
    setPin(next);
    if (val && idx < 3) pinRefs[idx + 1].current?.focus();
    if (idx === 3 && val) {
      setTimeout(() => verifyPin(next), 50);
    }
  };
  const handlePinKey = (e, idx) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) pinRefs[idx - 1].current?.focus();
  };

  const verifyPin = async (pinArr) => {
    const entered = pinArr.join("");
    try {
      const res  = await fetch(`${API}/auth/verify-pin`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, profileId: pinTarget._id, pin: entered })
      });
      const data = await res.json();
      if (data.valid) {
        enterProfile(pinTarget);
        setPinTarget(null);
      } else {
        setPinError("Incorrect PIN. Try again.");
        setPin(["","","",""]);
        pinRefs[0].current?.focus();
      }
    } catch {
      setPinError("Error verifying PIN.");
    }
  };

  // ── Action PIN (for edit/delete) ──
  const handleActionPin = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...actionPinVal];
    next[idx] = val.slice(-1);
    setActionPinVal(next);
    if (val && idx < 3) actionRefs[idx + 1].current?.focus();
    if (idx === 3 && val) setTimeout(() => verifyActionPin(next), 50);
  };
  const handleActionPinKey = (e, idx) => {
    if (e.key === "Backspace" && !actionPinVal[idx] && idx > 0) actionRefs[idx - 1].current?.focus();
  };

  const verifyActionPin = async (pinArr) => {
    const entered = pinArr.join("");
    try {
      const res  = await fetch(`${API}/auth/verify-pin`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, profileId: actionTarget.profile._id, pin: entered, type: "edit" })
      });
      const data = await res.json();
      if (data.valid) {
        if (actionTarget.type === "edit")   doEdit(actionTarget.profile);
        if (actionTarget.type === "delete") doDelete(actionTarget.profile);
      } else {
        setActionPinErr("Incorrect PIN. Try again.");
        setActionPinVal(["","","",""]);
        actionRefs[0].current?.focus();
      }
    } catch { setActionPinErr("Error verifying PIN."); }
  };

  // ── Add / Edit profile ──
  const openAdd = () => {
    setFormName(""); setFormAvatar("/avatars/1.jpg");
    setFormAgeRating("A"); setFormIsKids(false);
    setFormPin(""); setFormEditPin(""); setFormScreenTime(60);
    setEditTarget(null); setShowAdd(true);
  };

  const needsPin = (p) => p.editPin || p.isKids;

  const openEdit = (p) => {
    if (p.isKids && !p.editPin) {
      alert("This kids profile has no Edit Lock PIN. Set one to protect it from edits.");
      doEdit(p);
      return;
    }
    if (needsPin(p)) {
      setActionTarget({ type: "edit", profile: p });
      setActionPinVal(["","","",""]);
      setActionPinErr("");
      setTimeout(() => aRef0.current?.focus(), 100);
      return;
    }
    doEdit(p);
  };

  const doEdit = (p) => {
    setFormName(p.name); setFormAvatar(p.avatar);
    setFormAgeRating(p.ageRating); setFormIsKids(p.isKids);
    setFormPin(""); setFormEditPin(""); setFormScreenTime(p.screenTimeLimit || 60);
    setEditTarget(p); setShowAdd(true);
    setActionTarget(null);
  };

  const saveProfile = async () => {
    if (!formName.trim()) return alert("Enter a profile name");
    setFormLoading(true);
    try {
      const body = {
        name: formName, avatar: formAvatar,
        ageRating: formIsKids ? "U/A 7+" : formAgeRating,
        isKids: formIsKids,
        screenTimeLimit: formIsKids ? formScreenTime : null,
      };
      if (formPin)     body.pin     = formPin;
      if (formEditPin) body.editPin = formEditPin;

      const url    = editTarget
        ? `${API}/users/${user._id}/profiles/${editTarget._id}`
        : `${API}/users/${user._id}/profiles`;
      const method = editTarget ? "PUT" : "POST";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfiles(Array.isArray(data) ? data : []);
      setShowAdd(false);
    } catch (err) { alert(err.message); }
    setFormLoading(false);
  };

  const deleteProfile = (p) => {
    if (p.isKids && !p.editPin) {
      if (window.confirm(`Delete kids profile "${p.name}"? (No Edit Lock PIN was set)`)) doDelete(p);
      return;
    }
    if (needsPin(p)) {
      setActionTarget({ type: "delete", profile: p });
      setActionPinVal(["","","",""]);
      setActionPinErr("");
      setTimeout(() => aRef0.current?.focus(), 100);
      return;
    }
    doDelete(p);
  };

  const doDelete = async (p) => {
    if (!window.confirm(`Delete profile "${p.name}"?`)) return;
    await fetch(`${API}/users/${user._id}/profiles/${p._id}`, { method: "DELETE" });
    fetchProfiles();
    setActionTarget(null);
  };

  // ── Styles ──
  const overlay = { position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 };
  const modal   = { background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:18, padding:28, width:"100%", maxWidth:420, fontFamily:"Outfit" };
  const inp     = { width:"100%", padding:"10px 14px", background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)", borderRadius:10, fontFamily:"Outfit", fontSize:14, boxSizing:"border-box" };
  const lbl     = { fontSize:13, fontWeight:600, color:"var(--text-muted)", display:"block", marginBottom:4 };

  if (!user) return null;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-base)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"Outfit, sans-serif", padding:24 }}>

      <h1 style={{ color:"var(--text-primary)", fontWeight:900, fontSize:"clamp(24px,4vw,40px)", marginBottom:8 }}>
        {showManage ? "Manage Profiles" : "Who's watching?"}
      </h1>
      <p style={{ color:"var(--text-muted)", marginBottom:40, fontSize:15 }}>
        {showManage ? "Edit or delete profiles" : "Select your profile to continue"}
      </p>

      {/* PROFILE GRID */}
      <div style={{ display:"flex", gap:20, flexWrap:"wrap", justifyContent:"center", marginBottom:40 }}>
        {profiles.map(p => {
          const today = new Date().toISOString().slice(0,10);
          const timeLocked = p.isKids && p.screenTimeLimit &&
            p.screenTimeDate === today && p.screenTimeUsed >= p.screenTimeLimit;
          return (
            <div key={p._id} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, cursor: timeLocked ? "not-allowed" : "pointer" }}
              onClick={() => !showManage && selectProfile(p)}>
              <div style={{ position:"relative", width:120, height:120 }}>
                <img src={p.avatar} alt={p.name}
                  style={{ width:120, height:120, borderRadius:12, objectFit:"cover", border:"3px solid transparent",
                    filter: timeLocked ? "grayscale(1) brightness(0.5)" : "none",
                    transition:"border-color 0.2s" }}
                  onMouseEnter={e => { if (!timeLocked && !showManage) e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"} />
                {p.pin && !showManage && (
                  <div style={{ position:"absolute", bottom:6, right:6, background:"rgba(0,0,0,0.7)", borderRadius:6, padding:"2px 6px", fontSize:11, color:"#fff" }}>🔒</div>
                )}
                {p.isKids && (
                  <div style={{ position:"absolute", top:6, left:6, background:"#2563eb", borderRadius:6, padding:"2px 8px", fontSize:10, color:"#fff", fontWeight:700 }}>KIDS</div>
                )}
                {timeLocked && (
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:12 }}>
                    <span style={{ fontSize:28 }}>⏱</span>
                  </div>
                )}
                {showManage && (
                  <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <button onClick={() => openEdit(p)} style={{ background:"#fff", border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:12, fontWeight:700 }}>Edit</button>
                    <button onClick={() => deleteProfile(p)} style={{ background:"#e50914", color:"#fff", border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:12, fontWeight:700 }}>Del</button>
                  </div>
                )}
                {p.isKids && !showManage && (
                  <div style={{ position:"absolute", top:6, left:6, background:"#2563eb", borderRadius:6, padding:"2px 8px", fontSize:10, color:"#fff", fontWeight:700 }}>KIDS</div>
                )}
              </div>
              <span style={{ color:"var(--text-primary)", fontWeight:600, fontSize:14 }}>{p.name}</span>

              {timeLocked && <span style={{ fontSize:11, color:"#f87171" }}>Time limit reached</span>}
            </div>
          );
        })}

        {/* Add new profile */}
        {profiles.length < 5 && (
          <div onClick={openAdd}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, cursor:"pointer" }}>
            <div style={{ width:120, height:120, borderRadius:12, border:"2px dashed var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, color:"var(--text-muted)", transition:"border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
              +
            </div>
            <span style={{ color:"var(--text-muted)", fontWeight:600, fontSize:14 }}>Add Profile</span>
          </div>
        )}
      </div>

      {/* MANAGE / DONE button */}
      <button onClick={() => setShowManage(p => !p)}
        style={{ background:"none", border:"1px solid var(--text-muted)", color:"var(--text-muted)", borderRadius:8, padding:"8px 24px", fontFamily:"Outfit", fontWeight:700, fontSize:14, cursor:"pointer", letterSpacing:1 }}>
        {showManage ? "DONE" : "MANAGE PROFILES"}
      </button>

      {/* ── PIN MODAL ── */}
      {pinTarget && (
        <div style={overlay}>
          <div style={{ ...modal, textAlign:"center" }}>
            <img src={pinTarget.avatar} alt="" style={{ width:80, height:80, borderRadius:10, objectFit:"cover", marginBottom:12 }} />
            <h4 style={{ fontWeight:800, marginBottom:4 }}>Enter PIN for {pinTarget.name}</h4>
            <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:20 }}>This profile is PIN protected</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:16 }}>
              {pin.map((d, i) => (
                <input key={i} ref={pinRefs[i]} type="password" inputMode="numeric" maxLength={1}
                  value={d} onChange={e => handlePinChange(e.target.value, i)}
                  onKeyDown={e => handlePinKey(e, i)}
                  style={{ width:52, height:60, textAlign:"center", fontSize:24, fontWeight:900,
                    background:"var(--bg-elevated)", color:"var(--text-primary)",
                    border: d ? "2px solid var(--accent)" : "1px solid var(--border)",
                    borderRadius:10, outline:"none" }} />
              ))}
            </div>
            {pinError && <p style={{ color:"#f87171", fontSize:13, marginBottom:12 }}>{pinError}</p>}
            <button onClick={() => setPinTarget(null)}
              style={{ background:"none", border:"none", color:"var(--text-muted)", fontFamily:"Outfit", fontSize:13, cursor:"pointer" }}>
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT PROFILE MODAL ── */}
      {showAdd && (
        <div style={overlay}>
          <div style={{ ...modal, maxHeight:"90vh", overflowY:"auto" }}>
            <h4 style={{ fontWeight:800, marginBottom:20 }}>{editTarget ? "Edit Profile" : "New Profile"}</h4>

            {/* Avatar */}
            <label style={lbl}>Avatar</label>
            <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16 }}>
              <img src={formAvatar} alt="" style={{ width:60, height:60, borderRadius:10, objectFit:"cover", border:"2px solid var(--accent)" }} />
              <button onClick={() => setShowAvatarPicker(p=>!p)}
                style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", color:"var(--text-primary)", borderRadius:8, padding:"8px 14px", fontFamily:"Outfit", cursor:"pointer", fontSize:13 }}>
                Choose Avatar
              </button>
            </div>
            {showAvatarPicker && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(56px,1fr))", gap:8, marginBottom:16, padding:12, background:"var(--bg-elevated)", borderRadius:10 }}>
                {AVATARS.map(src => (
                  <img key={src} src={src} alt="" onClick={() => { setFormAvatar(src); setShowAvatarPicker(false); }}
                    style={{ width:56, height:56, borderRadius:8, objectFit:"cover", cursor:"pointer",
                      border: formAvatar===src ? "2px solid var(--accent)" : "2px solid transparent" }} />
                ))}
              </div>
            )}

            {/* Name */}
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Profile Name</label>
              <input style={inp} value={formName} onChange={e=>setFormName(e.target.value)} placeholder="e.g. Kids, Dad, Mom" />
            </div>

            {/* Kids toggle */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <input type="checkbox" id="isKids" checked={formIsKids} onChange={e=>setFormIsKids(e.target.checked)}
                style={{ width:16, height:16, accentColor:"var(--accent)" }} />
              <label htmlFor="isKids" style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)", cursor:"pointer" }}>
                Kids Profile (restricts to U/A 7+ content)
              </label>
            </div>

            {/* Age rating (adults) */}
            {!formIsKids && (
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Max Age Rating</label>
                <select style={inp} value={formAgeRating} onChange={e=>setFormAgeRating(e.target.value)}>
                  {AGE_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            {/* Screen time (kids) */}
            {formIsKids && (
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Daily Screen Time Limit (minutes)</label>
                <input style={inp} type="number" min={10} max={480} value={formScreenTime}
                  onChange={e=>setFormScreenTime(Number(e.target.value))} />
                <p style={{ fontSize:11, color:"var(--text-muted)", margin:"4px 0 0" }}>
                  ⚠️ Set a PIN below so children cannot edit this profile.
                </p>
              </div>
            )}

            {/* Entry PIN */}
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Entry PIN (optional) — required to switch to this profile</label>
              <input style={inp} type="password" inputMode="numeric" maxLength={4}
                placeholder="Leave blank for no entry PIN" value={formPin}
                onChange={e=>setFormPin(e.target.value.replace(/[^0-9]/g,"").slice(0,4))} />
            </div>

            {/* Edit Lock PIN */}
            <div style={{ marginBottom:20 }}>
              <label style={lbl}>
                🔒 Edit Lock PIN {editTarget ? "(leave blank to keep current)" : "(optional)"}
                {formIsKids && <span style={{color:"var(--accent)",marginLeft:4}}>— recommended for kids</span>}
              </label>
              <input style={inp} type="password" inputMode="numeric" maxLength={4}
                placeholder="Leave blank for no edit lock" value={formEditPin||""}
                onChange={e=>setFormEditPin(e.target.value.replace(/[^0-9]/g,"").slice(0,4))} />
              <p style={{fontSize:11,color:"var(--text-muted)",margin:"4px 0 0"}}>
                If set, this PIN is required to edit or delete this profile.
              </p>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={saveProfile} disabled={formLoading}
                style={{ flex:1, padding:"11px 0", background:"var(--accent)", color:"#fff", border:"none", borderRadius:10, fontFamily:"Outfit", fontWeight:700, cursor:"pointer", opacity: formLoading ? 0.7 : 1 }}>
                {formLoading ? "Saving…" : editTarget ? "Save Changes" : "Create Profile"}
              </button>
              <button onClick={() => setShowAdd(false)}
                style={{ flex:1, padding:"11px 0", background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)", borderRadius:10, fontFamily:"Outfit", fontWeight:600, cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── ACTION PIN MODAL (edit/delete) ── */}
      {actionTarget && (
        <div style={overlay}>
          <div style={{ ...modal, textAlign:"center" }}>
            <img src={actionTarget.profile.avatar} alt="" style={{ width:72, height:72, borderRadius:10, objectFit:"cover", marginBottom:12 }} />
            <h4 style={{ fontWeight:800, marginBottom:4 }}>
              {actionTarget.type === "edit" ? "Edit" : "Delete"} — {actionTarget.profile.name}
            </h4>
            <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:20 }}>
              Enter the PIN to {actionTarget.type === "edit" ? "edit" : "delete"} this profile
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:12 }}>
              {actionPinVal.map((d, i) => (
                <input key={i} ref={actionRefs[i]} type="password" inputMode="numeric" maxLength={1}
                  value={d} onChange={e => handleActionPin(e.target.value, i)}
                  onKeyDown={e => handleActionPinKey(e, i)}
                  style={{ width:52, height:60, textAlign:"center", fontSize:24, fontWeight:900,
                    background:"var(--bg-elevated)", color:"var(--text-primary)",
                    border: d ? "2px solid var(--accent)" : "1px solid var(--border)",
                    borderRadius:10, outline:"none" }} />
              ))}
            </div>
            {actionPinErr && <p style={{ color:"#f87171", fontSize:13, marginBottom:8 }}>{actionPinErr}</p>}
            <button onClick={() => setActionTarget(null)}
              style={{ background:"none", border:"none", color:"var(--text-muted)", fontFamily:"Outfit", fontSize:13, cursor:"pointer" }}>
              ← Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}