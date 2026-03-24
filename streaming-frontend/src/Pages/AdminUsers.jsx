import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

const COLORS = ["#e50914","#7c3aed","#2563eb","#059669","#d97706","#db2777","#0891b2"];
const avatarColor = name => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

const isAdmin    = r => ["ADMIN","admin"].includes(r);
const isEmployee = r => ["EMPLOYEE","employee"].includes(r);
const isUser     = r => ["USER","user"].includes(r);

export default function AdminUsers() {
  const [tab,           setTab]           = useState("users");
  const [users,         setUsers]         = useState([]);
  const [languages,     setLanguages]     = useState([]);
  const [loading,       setLoading]       = useState(true);

  // Promote modal
  const [promoteTarget, setPromoteTarget] = useState(null);
  const [promoteLang,   setPromoteLang]   = useState("");
  const [promoting,     setPromoting]     = useState(false);

  // Edit language modal
  const [editTarget,    setEditTarget]    = useState(null);
  const [editLang,      setEditLang]      = useState("");
  const [editing,       setEditing]       = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, l] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/languages`)
      ]);
      setUsers(u.data);
      setLanguages(l.data.map(l => l.name));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const normalUsers = users.filter(u => isUser(u.role));
  const employees   = users.filter(u => isEmployee(u.role));

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await axios.delete(`${API}/users/${id}`);
    fetchAll();
  };

  const handlePromote = async () => {
    if (!promoteLang) return alert("Select a language");
    setPromoting(true);
    try {
      await axios.put(`${API}/users/makeEmployee/${promoteTarget._id}`, { language: promoteLang });
      setPromoteTarget(null); setPromoteLang("");
      fetchAll();
    } catch { alert("Failed to promote"); }
    finally { setPromoting(false); }
  };

  const handleDemote = async (id, name) => {
    if (!window.confirm(`Remove "${name}" as employee?`)) return;
    await axios.put(`${API}/users/demote/${id}`);
    fetchAll();
  };

  const handleUpdateLang = async () => {
    if (!editLang) return alert("Select a language");
    setEditing(true);
    try {
      await axios.put(`${API}/users/updateLang/${editTarget._id}`, { language: editLang });
      setEditTarget(null); setEditLang("");
      fetchAll();
    } catch { alert("Failed to update"); }
    finally { setEditing(false); }
  };

  // ── styles ──
  const input = { background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", fontFamily:"Outfit", fontSize:14, width:"100%" };

  return (
    <div style={{ paddingTop:90, minHeight:"100vh", background:"var(--bg-base)", color:"var(--text-primary)", fontFamily:"Outfit, sans-serif" }}>
      <div style={{ maxWidth:1000, margin:"0 auto", padding:"0 24px 60px" }}>

        <h2 style={{ fontWeight:800, fontSize:28, marginBottom:28 }}>User Management</h2>

        {/* TABS */}
        <div style={{ display:"flex", gap:4, borderBottom:"1px solid var(--border)", marginBottom:28 }}>
          {[["users", `👤 Users (${normalUsers.length})`], ["employees", `🎬 Employees (${employees.length})`]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background:"none", border:"none",
              borderBottom:`2px solid ${tab===key ? "var(--accent)" : "transparent"}`,
              color: tab===key ? "var(--text-primary)" : "var(--text-muted)",
              fontFamily:"Outfit", fontWeight:700, fontSize:15,
              padding:"10px 22px", cursor:"pointer", marginBottom:-1, transition:"all 0.15s"
            }}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:60 }}>
            <div className="spinner-border text-danger" />
          </div>
        ) : tab === "users" ? (

          /* ══ USERS TAB ══ */
          normalUsers.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 0", color:"var(--text-muted)" }}>No regular users found.</div>
          ) : normalUsers.map(u => (
            <div key={u._id} style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:"16px 20px", marginBottom:10 }}>
              {/* Avatar */}
              <div style={{ width:44, height:44, borderRadius:"50%", background:avatarColor(u.name), display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color:"#fff", flexShrink:0 }}>
                {u.name?.[0]?.toUpperCase()}
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:140 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{u.name}</div>
                <div style={{ fontSize:13, color:"var(--text-muted)" }}>{u.email}</div>
              </div>
              {/* Role badge */}
              <span style={{ background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", borderRadius:999, padding:"2px 12px", fontSize:12, fontWeight:700 }}>
                User
              </span>
              {/* Actions */}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => { setPromoteTarget(u); setPromoteLang(""); }} style={{ background:"#16a34a", color:"#fff", border:"none", borderRadius:8, padding:"7px 16px", fontFamily:"Outfit", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  ↑ Make Employee
                </button>
                <button onClick={() => handleDelete(u._id, u.name)} style={{ background:"none", color:"var(--accent)", border:"1px solid var(--accent)", borderRadius:8, padding:"7px 14px", fontFamily:"Outfit", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))

        ) : (

          /* ══ EMPLOYEES TAB ══ */
          employees.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 0", color:"var(--text-muted)" }}>
              No employees yet. Promote users from the Users tab.
            </div>
          ) : employees.map(emp => (
            <div key={emp._id} style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:"16px 20px", marginBottom:10 }}>
              {/* Avatar */}
              <div style={{ width:44, height:44, borderRadius:"50%", background:avatarColor(emp.name), display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color:"#fff", flexShrink:0 }}>
                {emp.name?.[0]?.toUpperCase()}
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:140 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{emp.name}</div>
                <div style={{ fontSize:13, color:"var(--text-muted)" }}>{emp.email}</div>
              </div>
              {/* Employee badge */}
              <span style={{ background:"rgba(74,222,128,0.12)", color:"#4ade80", borderRadius:999, padding:"2px 12px", fontSize:12, fontWeight:700 }}>
                Employee
              </span>
              {/* Language tag */}
              {emp.language && (
                <span style={{ background:"var(--bg-elevated)", color:"var(--text-secondary)", borderRadius:8, padding:"3px 10px", fontSize:12, fontWeight:600 }}>
                  🌐 {emp.language}
                </span>
              )}
              {/* Actions */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <button onClick={() => { setEditTarget(emp); setEditLang(emp.language||""); }} style={{ background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)", borderRadius:8, padding:"7px 14px", fontFamily:"Outfit", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  ✏ Change Language
                </button>
                <button onClick={() => handleDemote(emp._id, emp.name)} style={{ background:"var(--bg-elevated)", color:"var(--text-muted)", border:"1px solid var(--border)", borderRadius:8, padding:"7px 14px", fontFamily:"Outfit", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  ↓ Demote
                </button>
                <button onClick={() => handleDelete(emp._id, emp.name)} style={{ background:"none", color:"var(--accent)", border:"1px solid var(--accent)", borderRadius:8, padding:"7px 14px", fontFamily:"Outfit", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ══ PROMOTE MODAL ══ */}
      {promoteTarget && (
        <div onClick={e => e.target===e.currentTarget && setPromoteTarget(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:18, padding:28, width:"100%", maxWidth:400, fontFamily:"Outfit" }}>
            <h5 style={{ fontWeight:800, marginBottom:6 }}>Make Employee</h5>
            <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:20 }}>
              Promoting <strong>{promoteTarget.name}</strong> — assign a language they will manage.
            </p>
            <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>Language</label>
            <select style={{ ...input, marginBottom:20 }} value={promoteLang} onChange={e => setPromoteLang(e.target.value)}>
              <option value="">Select language…</option>
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handlePromote} disabled={promoting} style={{ flex:1, padding:"11px 0", background:"#16a34a", color:"#fff", border:"none", borderRadius:10, fontFamily:"Outfit", fontWeight:700, cursor:"pointer" }}>
                {promoting ? "…" : "Confirm Promote"}
              </button>
              <button onClick={() => setPromoteTarget(null)} style={{ flex:1, padding:"11px 0", background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)", borderRadius:10, fontFamily:"Outfit", fontWeight:600, cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT LANGUAGE MODAL ══ */}
      {editTarget && (
        <div onClick={e => e.target===e.currentTarget && setEditTarget(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:18, padding:28, width:"100%", maxWidth:400, fontFamily:"Outfit" }}>
            <h5 style={{ fontWeight:800, marginBottom:6 }}>Change Language</h5>
            <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:20 }}>
              Update language assignment for <strong>{editTarget.name}</strong>.
            </p>
            <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>New Language</label>
            <select style={{ ...input, marginBottom:20 }} value={editLang} onChange={e => setEditLang(e.target.value)}>
              <option value="">Select language…</option>
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handleUpdateLang} disabled={editing} style={{ flex:1, padding:"11px 0", background:"var(--accent)", color:"#fff", border:"none", borderRadius:10, fontFamily:"Outfit", fontWeight:700, cursor:"pointer" }}>
                {editing ? "…" : "Save Changes"}
              </button>
              <button onClick={() => setEditTarget(null)} style={{ flex:1, padding:"11px 0", background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)", borderRadius:10, fontFamily:"Outfit", fontWeight:600, cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}