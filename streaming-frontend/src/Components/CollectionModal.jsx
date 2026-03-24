import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";

export default function CollectionModal({ movie, onClose }) {
  const { user, activeProfile } = useAuth();
  const navigate = useNavigate();

  const [collections, setCollections] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [newName,     setNewName]     = useState("");
  const [creating,    setCreating]    = useState(false);
  const [feedback,    setFeedback]    = useState({});

  // Build API base using active profile
  const colBase = user && activeProfile
    ? `${API}/users/${user._id}/profiles/${activeProfile._id}/collections`
    : null;

  useEffect(() => {
    if (!user || !activeProfile) { setLoading(false); return; }
    fetch(colBase)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCollections(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, activeProfile]);

  const handleBackdrop = e => { if (e.target === e.currentTarget) onClose(); };

  const handleAdd = async colId => {
    try {
      const res  = await fetch(`${colBase}/${colId}/movies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId: movie._id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(f => ({ ...f, [colId]: data.error === "Already in collection" ? "exists" : "error" }));
      } else {
        if (Array.isArray(data)) setCollections(data);
        setFeedback(f => ({ ...f, [colId]: "added" }));
      }
    } catch {
      setFeedback(f => ({ ...f, [colId]: "error" }));
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res  = await fetch(colBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCollections(data);
        setNewName("");
        const newCol = data[data.length - 1];
        if (newCol) handleAdd(newCol._id);
      }
    } catch {}
    finally { setCreating(false); }
  };

  const fb = colId => {
    const f = feedback[colId];
    if (f === "added")  return { text: "✓ Added",       color: "#4ade80" };
    if (f === "exists") return { text: "Already added", color: "var(--text-muted)" };
    if (f === "error")  return { text: "Error",         color: "var(--accent)" };
    return null;
  };

  return (
    <div onClick={handleBackdrop} style={{
      position:"fixed",inset:0,zIndex:9999,
      background:"rgba(0,0,0,0.70)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16
    }}>
      <div style={{
        background:"var(--bg-surface)",border:"1px solid var(--border)",
        borderRadius:18,padding:28,width:"100%",maxWidth:420,
        color:"var(--text-primary)",fontFamily:"Outfit",
        boxShadow:"0 20px 60px rgba(0,0,0,0.6)"
      }}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <h5 style={{margin:0,fontWeight:700}}>Add to Collection</h5>
            <p style={{margin:0,fontSize:13,color:"var(--text-muted)"}}>{movie.title}</p>
            {activeProfile && (
              <p style={{margin:"2px 0 0",fontSize:12,color:"var(--accent)"}}>
                Profile: {activeProfile.name}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{
            background:"var(--bg-elevated)",border:"none",borderRadius:"50%",
            width:32,height:32,cursor:"pointer",color:"var(--text-primary)",
            fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"
          }}>✕</button>
        </div>

        {!user ? (
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <p style={{color:"var(--text-muted)",marginBottom:16}}>Please log in to save to collections.</p>
            <button className="btn btn-danger w-100" onClick={()=>{onClose();navigate("/login");}}
              style={{borderRadius:10,fontFamily:"Outfit",fontWeight:600}}>
              Go to Login
            </button>
          </div>
        ) : !activeProfile ? (
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <p style={{color:"var(--text-muted)",marginBottom:16}}>Select a profile first to save to collections.</p>
            <button className="btn btn-danger w-100" onClick={()=>{onClose();navigate("/profiles");}}
              style={{borderRadius:10,fontFamily:"Outfit",fontWeight:600}}>
              Select Profile
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-danger"/></div>
        ) : (
          <>
            {collections.length === 0 ? (
              <p style={{color:"var(--text-muted)",fontSize:14,textAlign:"center",marginBottom:16}}>
                No collections yet. Create one below.
              </p>
            ) : (
              <div style={{marginBottom:16,maxHeight:220,overflowY:"auto"}}>
                {collections.map(col => {
                  const f = fb(col._id);
                  const already = col.movies?.some(m => (m._id||m).toString() === movie._id?.toString());
                  return (
                    <div key={col._id} style={{
                      display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"10px 14px",borderRadius:10,marginBottom:6,
                      background:"var(--bg-elevated)",border:"1px solid var(--border)"
                    }}>
                      <div>
                        <span style={{fontWeight:600,fontSize:14}}>{col.name}</span>
                        <span style={{fontSize:12,color:"var(--text-muted)",marginLeft:8}}>
                          {col.movies?.length||0} item{col.movies?.length!==1?"s":""}
                        </span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {f && <span style={{fontSize:12,color:f.color}}>{f.text}</span>}
                        <button
                          onClick={()=>handleAdd(col._id)}
                          disabled={f?.text==="✓ Added"||already}
                          style={{
                            background:(f?.text==="✓ Added"||already)?"var(--bg-elevated)":"var(--accent)",
                            color:(f?.text==="✓ Added"||already)?"var(--text-muted)":"#fff",
                            border:"none",borderRadius:8,padding:"5px 14px",
                            fontSize:13,fontWeight:600,fontFamily:"Outfit",
                            cursor:(f?.text==="✓ Added"||already)?"default":"pointer"
                          }}
                        >
                          {(f?.text==="✓ Added"||already)?"Added":"+ Add"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{borderTop:"1px solid var(--border)",paddingTop:16}}>
              <p style={{fontSize:13,color:"var(--text-muted)",marginBottom:8}}>Create a new collection:</p>
              <div style={{display:"flex",gap:8}}>
                <input className="form-control" placeholder='"Horror Night", "Watch Later"…'
                  value={newName} onChange={e=>setNewName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleCreate()} style={{flex:1}} />
                <button onClick={handleCreate} disabled={creating||!newName.trim()}
                  className="btn btn-danger"
                  style={{borderRadius:10,fontFamily:"Outfit",fontWeight:600,whiteSpace:"nowrap"}}>
                  {creating?"…":"Create & Add"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}