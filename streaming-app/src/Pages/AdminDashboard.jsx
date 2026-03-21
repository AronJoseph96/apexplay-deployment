import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5000";

function useGenresLanguages() {
  const [genresList, setGenresList] = useState([]);
  const [languages,  setLanguages]  = useState([]);
  useEffect(() => {
    fetch(`${API}/genres`).then(r=>r.json()).then(d=>setGenresList(d.map(g=>g.name))).catch(()=>{});
    fetch(`${API}/languages`).then(r=>r.json()).then(d=>setLanguages(d.map(l=>l.name))).catch(()=>{});
  }, []);
  return { genresList, languages };
}

function GenrePills({ list, selected, onToggle }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
      {list.map(g => (
        <button type="button" key={g} onClick={()=>onToggle(g)} style={{
          padding:"5px 14px", borderRadius:999, fontSize:13, fontFamily:"Outfit", cursor:"pointer",
          background: selected.includes(g) ? "var(--accent)" : "var(--bg-elevated)",
          color:      selected.includes(g) ? "#fff" : "var(--text-secondary)",
          border:     `1px solid ${selected.includes(g) ? "var(--accent)" : "var(--border)"}`
        }}>{g}</button>
      ))}
    </div>
  );
}

/* ── Tab 1: Upload Movie ── */
function UploadMovieTab({ genresList, languages }) {
  const blank = { title:"",description:"",releaseYear:"",duration:"",rating:"",ageRating:"U",language:"",category:"Movie",trailerUrl:"" };
  const [form,F]           = useState(blank);
  const [genres,G]         = useState([]);
  const [poster,setPoster] = useState(null);
  const [banner,setBanner] = useState(null);
  const [video,setVideo]   = useState(null);
  const [pPrev,setPPrev]   = useState(null);
  const [bPrev,setBPrev]   = useState(null);
  const [loading,setL]     = useState(false);
  const [msg,setMsg]       = useState("");
  const [progress,setProgress] = useState(0);

  const toggle = g => G(p => p.includes(g) ? p.filter(x=>x!==g) : [...p,g]);

  const submit = async e => {
    e.preventDefault(); setL(true); setMsg(""); setProgress(0);
    const fd = new FormData();
    Object.keys(form).forEach(k=>{ if(k!=="trailerUrl") fd.append(k,form[k]); });
    fd.append("genres",JSON.stringify(genres));
    fd.append("poster",poster); fd.append("banner",banner); fd.append("video",video);
    if(form.trailerUrl) fd.append("trailerUrl",form.trailerUrl);
    try {
      await axios.post(`${API}/movies/upload/movie`,fd,{
        onUploadProgress: e => setProgress(Math.round((e.loaded/e.total)*100))
      });
      setMsg("✓ Uploaded!"); setProgress(0); F(blank); G([]); setPoster(null); setBanner(null); setVideo(null); setPPrev(null); setBPrev(null);
    } catch(err){ setMsg("✗ "+(err.response?.data?.error||"Failed")); setProgress(0); }
    finally { setL(false); }
  };

  return (
    <form onSubmit={submit}>
      {msg && <div className={`alert ${msg[0]==="✓"?"alert-success":"alert-danger"}`}>{msg}</div>}
      <div className="row g-3">
        <div className="col-md-6"><input required placeholder="Title *" className="form-control" value={form.title} onChange={e=>F({...form,title:e.target.value})} /></div>
        <div className="col-md-3"><input type="number" placeholder="Year" min="1900" max="2030" className="form-control" value={form.releaseYear} onChange={e=>F({...form,releaseYear:e.target.value})} /></div>
        <div className="col-md-3"><input type="number" step="0.1" placeholder="Rating" min="0" max="10" className="form-control" value={form.rating} onChange={e=>F({...form,rating:e.target.value})} /></div>
        <div className="col-md-3"><select className="form-select" value={form.ageRating||"U"} onChange={e=>F({...form,ageRating:e.target.value})}><option value="U">U</option><option value="U/A 7+">U/A 7+</option><option value="U/A 13+">U/A 13+</option><option value="U/A 16+">U/A 16+</option><option value="R">R (Restricted)</option><option value="A">A (Adult)</option></select></div>
        <div className="col-12"><textarea rows="3" placeholder="Description" className="form-control" value={form.description} onChange={e=>F({...form,description:e.target.value})} /></div>
        <div className="col-md-4"><input placeholder='Duration e.g. "2h 15m"' className="form-control" value={form.duration} onChange={e=>F({...form,duration:e.target.value})} /></div>
        <div className="col-md-4">
          <select className="form-select" value={form.language} onChange={e=>F({...form,language:e.target.value})}>
            <option value="">Language</option>
            {languages.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <select className="form-select" value={form.category} onChange={e=>F({...form,category:e.target.value})}>
            <option value="Movie">Movie</option>
            <option value="Series">Series</option>
          </select>
        </div>
        <div className="col-12"><input placeholder="Trailer URL (optional — YouTube embed or direct URL)" className="form-control" value={form.trailerUrl||""} onChange={e=>F({...form,trailerUrl:e.target.value})} /></div>
      </div>
      <div className="mt-3 mb-3"><label className="form-label fw-semibold">Genres</label><GenrePills list={genresList} selected={genres} onToggle={toggle} /></div>
      <div className="row g-3">
        {[[poster,setPoster,pPrev,setPPrev,"Poster *"],[banner,setBanner,bPrev,setBPrev,"Banner *"]].map(([val,set,prev,setPrev,label])=>(
          <div className="col-md-4" key={label}>
            <label className="form-label">{label}</label>
            <input type="file" accept="image/*" className="form-control" onChange={e=>{set(e.target.files[0]);setPrev(URL.createObjectURL(e.target.files[0]));}} />
            {prev && <img src={prev} alt="" style={{maxHeight:130,width:"100%",objectFit:"cover",borderRadius:8,marginTop:6}} />}
          </div>
        ))}
        <div className="col-md-4">
          <label className="form-label">Video *</label>
          <input type="file" accept="video/*" className="form-control" onChange={e=>setVideo(e.target.files[0])} />
          {video && <small style={{color:"var(--text-muted)"}}>{video.name}</small>}
        </div>
      </div>
      {loading && progress > 0 && (
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13,color:"var(--text-muted)"}}>
            <span>Uploading to Cloudinary…</span><span>{progress}%</span>
          </div>
          <div style={{width:"100%",height:6,background:"var(--bg-elevated)",borderRadius:999}}>
            <div style={{height:"100%",width:`${progress}%`,background:"var(--accent)",borderRadius:999,transition:"width 0.3s"}} />
          </div>
        </div>
      )}
      <button className="btn btn-danger w-100 mt-4" disabled={loading} style={{borderRadius:12,fontFamily:"Outfit",fontWeight:600}}>{loading?"Uploading…":"🎬 Upload Movie"}</button>
    </form>
  );
}

/* ── Tab 2: Create Series ── */
function CreateSeriesTab({ genresList, languages }) {
  const blank = { title:"",description:"",releaseYear:"",rating:"",ageRating:"U",language:"",trailerUrl:"" };
  const [form,F]           = useState(blank);
  const [genres,G]         = useState([]);
  const [poster,setPoster] = useState(null);
  const [banner,setBanner] = useState(null);
  const [pPrev,setPPrev]   = useState(null);
  const [bPrev,setBPrev]   = useState(null);
  const [loading,setL]     = useState(false);
  const [msg,setMsg]       = useState("");
  const [progress,setProgress] = useState(0);

  const toggle = g => G(p => p.includes(g) ? p.filter(x=>x!==g) : [...p,g]);

  const submit = async e => {
    e.preventDefault(); setL(true); setMsg(""); setProgress(0);
    const fd = new FormData();
    Object.keys(form).forEach(k=>fd.append(k,form[k]));
    fd.append("genres",JSON.stringify(genres));
    fd.append("poster",poster); fd.append("banner",banner);
    try {
      await axios.post(`${API}/movies/upload/series`,fd,{
        onUploadProgress: e => setProgress(Math.round((e.loaded/e.total)*100))
      });
      setMsg("✓ Series created!"); setProgress(0); F(blank); G([]); setPoster(null); setBanner(null); setPPrev(null); setBPrev(null);
    } catch(err){ setMsg("✗ "+(err.response?.data?.error||"Failed")); setProgress(0); }
    finally { setL(false); }
  };

  return (
    <form onSubmit={submit}>
      {msg && <div className={`alert ${msg[0]==="✓"?"alert-success":"alert-danger"}`}>{msg}</div>}
      <div className="row g-3">
        <div className="col-md-6"><input required placeholder="Series Title *" className="form-control" value={form.title} onChange={e=>F({...form,title:e.target.value})} /></div>
        <div className="col-md-3"><input type="number" placeholder="Year" min="1900" max="2030" className="form-control" value={form.releaseYear} onChange={e=>F({...form,releaseYear:e.target.value})} /></div>
        <div className="col-md-3"><input type="number" step="0.1" placeholder="Rating" className="form-control" value={form.rating} onChange={e=>F({...form,rating:e.target.value})} /></div>
        <div className="col-md-3"><select className="form-select" value={form.ageRating||"U"} onChange={e=>F({...form,ageRating:e.target.value})}><option value="U">U</option><option value="U/A 7+">U/A 7+</option><option value="U/A 13+">U/A 13+</option><option value="U/A 16+">U/A 16+</option><option value="R">R (Restricted)</option><option value="A">A (Adult)</option></select></div>
        <div className="col-12"><textarea rows="3" placeholder="Description" className="form-control" value={form.description} onChange={e=>F({...form,description:e.target.value})} /></div>
        <div className="col-md-6">
          <select className="form-select" value={form.language} onChange={e=>F({...form,language:e.target.value})}>
            <option value="">Language</option>
            {languages.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="col-md-6"><input placeholder="Trailer URL (optional)" className="form-control" value={form.trailerUrl} onChange={e=>F({...form,trailerUrl:e.target.value})} /></div>
      </div>
      <div className="mt-3 mb-3"><label className="form-label fw-semibold">Genres</label><GenrePills list={genresList} selected={genres} onToggle={toggle} /></div>
      <div className="row g-3">
        {[[poster,setPoster,pPrev,setPPrev,"Poster *"],[banner,setBanner,bPrev,setBPrev,"Banner *"]].map(([val,set,prev,setPrev,label])=>(
          <div className="col-md-6" key={label}>
            <label className="form-label">{label}</label>
            <input type="file" accept="image/*" className="form-control" onChange={e=>{set(e.target.files[0]);setPrev(URL.createObjectURL(e.target.files[0]));}} />
            {prev && <img src={prev} alt="" style={{maxHeight:130,width:"100%",objectFit:"cover",borderRadius:8,marginTop:6}} />}
          </div>
        ))}
      </div>
      {loading && progress > 0 && (
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13,color:"var(--text-muted)"}}>
            <span>Uploading to Cloudinary…</span><span>{progress}%</span>
          </div>
          <div style={{width:"100%",height:6,background:"var(--bg-elevated)",borderRadius:999}}>
            <div style={{height:"100%",width:`${progress}%`,background:"var(--accent)",borderRadius:999,transition:"width 0.3s"}} />
          </div>
        </div>
      )}
      <button className="btn btn-danger w-100 mt-4" disabled={loading} style={{borderRadius:12,fontFamily:"Outfit",fontWeight:600}}>{loading?"Uploading…":"📺 Create Series"}</button>
    </form>
  );
}

/* ── Tab 3: Add Episodes ── */
function AddEpisodesTab() {
  const [seriesList,setSeriesList]       = useState([]);
  const [selected,setSelected]           = useState(null);
  const [seasonNum,setSeasonNum]         = useState(1);
  const [seasonTitle,setSeasonTitle]     = useState("");
  const [expanded,setExpanded]           = useState(null);
  const [epForm,setEpForm]               = useState({episodeNumber:"",title:"",description:"",duration:""});
  const [video,setVideo]                 = useState(null);
  const [thumb,setThumb]                 = useState(null);
  const [uploading,setUploading]         = useState(false);
  const [msg,setMsg]                     = useState("");
  const [epProgress,setEpProgress]       = useState(0);

  useEffect(()=>{ fetch(`${API}/movies?category=Series`).then(r=>r.json()).then(setSeriesList); },[]);

  const refresh = async id => { const r = await fetch(`${API}/movies/${id}`); setSelected(await r.json()); };

  const addSeason = async () => {
    if (!selected) return;
    try { await axios.post(`${API}/movies/${selected._id}/seasons`,{seasonNumber:seasonNum,title:seasonTitle}); await refresh(selected._id); setSeasonTitle(""); setMsg("✓ Season added"); }
    catch(e){ setMsg("✗ "+(e.response?.data?.error||"Failed")); }
  };

  const delSeason = async sNum => {
    if(!window.confirm(`Delete Season ${sNum}?`)) return;
    await axios.delete(`${API}/movies/${selected._id}/seasons/${sNum}`);
    await refresh(selected._id);
  };

  const addEpisode = async sNum => {
    if(!video) return setMsg("✗ Video required");
    setUploading(true); setMsg("");
    const fd = new FormData();
    Object.keys(epForm).forEach(k=>fd.append(k,epForm[k]));
    fd.append("video",video); if(thumb) fd.append("thumbnail",thumb);
    try {
      await axios.post(`${API}/movies/${selected._id}/seasons/${sNum}/episodes`,fd,{
        onUploadProgress: e => setEpProgress(Math.round((e.loaded/e.total)*100))
      });
      setEpProgress(0);
      await refresh(selected._id);
      setEpForm({episodeNumber:"",title:"",description:"",duration:""}); setVideo(null); setThumb(null);
      setMsg("✓ Episode added");
    } catch(e){ setMsg("✗ "+(e.response?.data?.error||"Failed")); setEpProgress(0); }
    finally { setUploading(false); }
  };

  const delEpisode = async (sNum,epNum) => {
    if(!window.confirm(`Delete Episode ${epNum}?`)) return;
    await axios.delete(`${API}/movies/${selected._id}/seasons/${sNum}/episodes/${epNum}`);
    await refresh(selected._id);
  };

  return (
    <div>
      {msg && <div className={`alert ${msg[0]==="✓"?"alert-success":"alert-danger"} mb-3`}>{msg}</div>}
      <div className="mb-4">
        <label className="form-label fw-semibold">Select Series</label>
        <select className="form-select" onChange={async e=>{ const s=seriesList.find(x=>x._id===e.target.value); if(s){const r=await fetch(`${API}/movies/${s._id}`);setSelected(await r.json());}else setSelected(null); }}>
          <option value="">-- Choose a series --</option>
          {seriesList.map(s=><option key={s._id} value={s._id}>{s.title}</option>)}
        </select>
      </div>
      {selected && (
        <>
          <div style={{display:"flex",gap:14,alignItems:"center",background:"var(--bg-elevated)",borderRadius:12,padding:14,marginBottom:20}}>
            <img src={selected.poster} alt="" style={{width:50,height:70,objectFit:"cover",borderRadius:8}} />
            <div><div style={{fontWeight:700}}>{selected.title}</div><div style={{color:"var(--text-muted)",fontSize:13}}>{selected.seasons?.length||0} season(s)</div></div>
          </div>
          <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:16,marginBottom:20}}>
            <div className="fw-semibold mb-2">Add New Season</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <input type="number" min="1" className="form-control" style={{width:100}} value={seasonNum} onChange={e=>setSeasonNum(Number(e.target.value))} />
              <input placeholder="Season title (optional)" className="form-control" style={{flex:1}} value={seasonTitle} onChange={e=>setSeasonTitle(e.target.value)} />
              <button className="btn btn-danger" onClick={addSeason} style={{borderRadius:10,fontFamily:"Outfit",fontWeight:600}}>+ Add Season</button>
            </div>
          </div>
          {!selected.seasons?.length ? <p style={{color:"var(--text-muted)",textAlign:"center"}}>No seasons yet.</p> :
            selected.seasons.sort((a,b)=>a.seasonNumber-b.seasonNumber).map(s=>(
              <div key={s.seasonNumber} style={{border:"1px solid var(--border)",borderRadius:12,marginBottom:10,overflow:"hidden"}}>
                <div onClick={()=>setExpanded(expanded===s.seasonNumber?null:s.seasonNumber)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"var(--bg-elevated)",cursor:"pointer"}}>
                  <span style={{fontWeight:700}}>Season {s.seasonNumber}: {s.title}</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"var(--text-muted)"}}>{s.episodes?.length||0} ep</span>
                    <button onClick={e=>{e.stopPropagation();delSeason(s.seasonNumber);}} style={{background:"rgba(229,9,20,0.1)",color:"var(--accent)",border:"none",borderRadius:6,padding:"3px 10px",fontSize:12,cursor:"pointer"}}>Delete</button>
                    <span>{expanded===s.seasonNumber?"▲":"▼"}</span>
                  </div>
                </div>
                {expanded===s.seasonNumber && (
                  <div style={{padding:16}}>
                    {s.episodes?.map(ep=>(
                      <div key={ep.episodeNumber} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"var(--bg-elevated)",borderRadius:8,marginBottom:6}}>
                        <span style={{fontSize:14}}>Ep {ep.episodeNumber}: {ep.title} <span style={{color:"var(--text-muted)",fontSize:12}}>— {ep.duration}</span></span>
                        <button onClick={()=>delEpisode(s.seasonNumber,ep.episodeNumber)} style={{background:"none",color:"var(--accent)",border:"none",cursor:"pointer",fontSize:13}}>✕</button>
                      </div>
                    ))}
                    <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:10,padding:14,marginTop:12}}>
                      <div className="fw-semibold mb-2" style={{fontSize:14}}>Add Episode to Season {s.seasonNumber}</div>
                      <div className="row g-2">
                        <div className="col-md-2"><input type="number" placeholder="Ep #" className="form-control" value={epForm.episodeNumber} onChange={e=>setEpForm({...epForm,episodeNumber:e.target.value})} /></div>
                        <div className="col-md-4"><input placeholder="Title" className="form-control" value={epForm.title} onChange={e=>setEpForm({...epForm,title:e.target.value})} /></div>
                        <div className="col-md-2"><input placeholder="Duration" className="form-control" value={epForm.duration} onChange={e=>setEpForm({...epForm,duration:e.target.value})} /></div>
                        <div className="col-md-4"><input placeholder="Description" className="form-control" value={epForm.description} onChange={e=>setEpForm({...epForm,description:e.target.value})} /></div>
                        <div className="col-md-6"><label className="form-label" style={{fontSize:13}}>Video *</label><input type="file" accept="video/*" className="form-control" onChange={e=>setVideo(e.target.files[0])} /></div>
                        <div className="col-md-6"><label className="form-label" style={{fontSize:13}}>Thumbnail</label><input type="file" accept="image/*" className="form-control" onChange={e=>setThumb(e.target.files[0])} /></div>
                      </div>
                      {uploading && epProgress > 0 && (<div style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--text-muted)",marginBottom:3}}><span>Uploading…</span><span>{epProgress}%</span></div><div style={{height:4,background:"var(--bg-elevated)",borderRadius:999}}><div style={{height:"100%",width:`${epProgress}%`,background:"var(--accent)",borderRadius:999,transition:"width 0.3s"}}/></div></div>)}<button className="btn btn-danger mt-3" onClick={()=>addEpisode(s.seasonNumber)} disabled={uploading} style={{borderRadius:10,fontFamily:"Outfit",fontWeight:600}}>{uploading?"Uploading…":`+ Add Episode to Season ${s.seasonNumber}`}</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          }
        </>
      )}
    </div>
  );
}

/* ── Tab 4: Manage ── */
function ManageTab({ genresList, languages }) {
  const [items,setItems]         = useState([]);
  const [filter,setFilter]       = useState("All");
  const [search,setSearch]       = useState("");
  const [editTarget,setEdit]     = useState(null);
  const [editForm,setEF]         = useState({});
  const [editGenres,setEG]       = useState([]);
  const [editPoster,setEP]       = useState(null);
  const [editBanner,setEB]       = useState(null);
  const [saving,setSaving]       = useState(false);
  const [msg,setMsg]             = useState("");

  useEffect(()=>{ fetch(`${API}/movies`).then(r=>r.json()).then(setItems); },[]);

  const filtered = items.filter(m=>(filter==="All"||m.category===filter)&&m.title.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id,title) => {
    if(!window.confirm(`Delete "${title}"?`)) return;
    await axios.delete(`${API}/movies/${id}`);
    setItems(p=>p.filter(m=>m._id!==id));
  };

  const openEdit = m => {
    setEdit(m);
    setEF({title:m.title,description:m.description||"",releaseYear:m.releaseYear||"",duration:m.duration||"",rating:m.rating||"",ageRating:m.ageRating||"U",language:m.language||"",trailerUrl:m.trailerUrl||""});
    setEG(m.genres||[]); setEP(null); setEB(null); setMsg("");
  };

  const handleSave = async () => {
    setSaving(true); setMsg("");
    const fd = new FormData();
    Object.keys(editForm).forEach(k=>fd.append(k,editForm[k]));
    fd.append("genres",JSON.stringify(editGenres));
    if(editPoster) fd.append("poster",editPoster);
    if(editBanner) fd.append("banner",editBanner);
    try {
      const res = await axios.patch(`${API}/movies/${editTarget._id}`,fd);
      setItems(p=>p.map(m=>m._id===editTarget._id?res.data.movie:m));
      setMsg("✓ Saved!"); setTimeout(()=>setEdit(null),1000);
    } catch(e){ setMsg("✗ "+(e.response?.data?.error||"Failed")); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {["All","Movie","Series"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 18px",borderRadius:999,border:"1px solid",borderColor:filter===f?"var(--accent)":"var(--border)",background:filter===f?"var(--accent)":"var(--bg-elevated)",color:filter===f?"#fff":"var(--text-primary)",fontFamily:"Outfit",fontWeight:600,fontSize:13,cursor:"pointer"}}>{f}</button>
        ))}
        <input className="form-control" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:220}} />
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"Outfit",fontSize:14}}>
          <thead>
            <tr style={{borderBottom:"1px solid var(--border)",color:"var(--text-muted)"}}>
              {["Poster","Title","Type","Year","Rating","Actions"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left"}}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m=>(
              <tr key={m._id} style={{borderBottom:"1px solid var(--border)"}}>
                <td style={{padding:"8px 12px"}}><img src={m.poster} alt="" style={{width:38,height:54,objectFit:"cover",borderRadius:6}} /></td>
                <td style={{padding:"8px 12px",fontWeight:600,color:"var(--text-primary)"}}>{m.title}</td>
                <td style={{padding:"8px 12px"}}>
                  <span style={{padding:"2px 10px",borderRadius:999,fontSize:12,background:m.category==="Series"?"rgba(99,102,241,0.15)":"rgba(229,9,20,0.12)",color:m.category==="Series"?"#818cf8":"var(--accent)"}}>{m.category}</span>
                </td>
                <td style={{padding:"8px 12px",color:"var(--text-muted)"}}>{m.releaseYear}</td>
                <td style={{padding:"8px 12px",color:"var(--text-muted)"}}>{m.rating}</td>
                <td style={{padding:"8px 12px"}}>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>openEdit(m)} style={{background:"rgba(99,102,241,0.15)",color:"#818cf8",border:"none",borderRadius:8,padding:"5px 14px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Outfit"}}>✏ Edit</button>
                    <button onClick={()=>handleDelete(m._id,m.title)} style={{background:"rgba(229,9,20,0.10)",color:"var(--accent)",border:"none",borderRadius:8,padding:"5px 14px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Outfit"}}>🗑 Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && <p style={{color:"var(--text-muted)",textAlign:"center",padding:"32px 0"}}>No items found.</p>}
      </div>

      {/* EDIT MODAL */}
      {editTarget && (
        <div onClick={e=>{if(e.target===e.currentTarget)setEdit(null);}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.70)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:18,padding:28,width:"100%",maxWidth:640,maxHeight:"90vh",overflowY:"auto",color:"var(--text-primary)",fontFamily:"Outfit"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h5 style={{margin:0,fontWeight:700}}>Edit — {editTarget.title}</h5>
              <button onClick={()=>setEdit(null)} style={{background:"var(--bg-elevated)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",color:"var(--text-primary)",fontSize:16}}>✕</button>
            </div>
            {msg && <div className={`alert ${msg[0]==="✓"?"alert-success":"alert-danger"}`}>{msg}</div>}
            <div className="row g-3">
              <div className="col-md-8"><input placeholder="Title" className="form-control" value={editForm.title} onChange={e=>setEF({...editForm,title:e.target.value})} /></div>
              <div className="col-md-4"><input type="number" placeholder="Year" className="form-control" value={editForm.releaseYear} onChange={e=>setEF({...editForm,releaseYear:e.target.value})} /></div>
              <div className="col-12"><textarea rows="3" placeholder="Description" className="form-control" value={editForm.description} onChange={e=>setEF({...editForm,description:e.target.value})} /></div>
              <div className="col-md-4"><input type="number" step="0.1" placeholder="Rating" className="form-control" value={editForm.rating} onChange={e=>setEF({...editForm,rating:e.target.value})} /></div>
              <div className="col-md-4"><select className="form-select" value={editForm.ageRating||"U"} onChange={e=>setEF({...editForm,ageRating:e.target.value})}><option value="U">U</option><option value="U/A 7+">U/A 7+</option><option value="U/A 13+">U/A 13+</option><option value="U/A 16+">U/A 16+</option><option value="R">R (Restricted)</option><option value="A">A (Adult)</option></select></div>
              <div className="col-md-4"><input placeholder="Duration" className="form-control" value={editForm.duration} onChange={e=>setEF({...editForm,duration:e.target.value})} /></div>
              <div className="col-md-4">
                <select className="form-select" value={editForm.language} onChange={e=>setEF({...editForm,language:e.target.value})}>
                  <option value="">Language</option>
                  {languages.map(l=><option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="col-12"><input placeholder="Trailer URL (optional — YouTube embed or direct URL)" className="form-control" value={editForm.trailerUrl||""} onChange={e=>setEF({...editForm,trailerUrl:e.target.value})} /></div>
            </div>
            <div className="mt-3 mb-3">
              <label className="form-label fw-semibold">Genres</label>
              <GenrePills list={genresList} selected={editGenres} onToggle={g=>setEG(p=>p.includes(g)?p.filter(x=>x!==g):[...p,g])} />
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Replace Poster</label>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <img src={editTarget.poster} alt="" style={{width:38,height:54,objectFit:"cover",borderRadius:6}} />
                  <input type="file" accept="image/*" className="form-control" onChange={e=>setEP(e.target.files[0])} />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Replace Banner</label>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <img src={editTarget.banner} alt="" style={{width:80,height:40,objectFit:"cover",borderRadius:6}} />
                  <input type="file" accept="image/*" className="form-control" onChange={e=>setEB(e.target.files[0])} />
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-danger flex-grow-1" onClick={handleSave} disabled={saving} style={{borderRadius:12,fontFamily:"Outfit",fontWeight:600}}>{saving?"Saving…":"💾 Save Changes"}</button>
              <button onClick={()=>setEdit(null)} style={{background:"var(--bg-elevated)",color:"var(--text-primary)",border:"1px solid var(--border)",borderRadius:12,padding:"8px 20px",cursor:"pointer",fontFamily:"Outfit"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main ── */
export default function AdminDashboard() {
  const [tab, setTab] = useState("upload-movie");
  const { genresList, languages } = useGenresLanguages();
  const tabs = [{id:"upload-movie",label:"🎬 Upload Movie"},{id:"create-series",label:"📺 Create Series"},{id:"add-episodes",label:"➕ Add Episodes"},{id:"manage",label:"⚙ Manage"}];

  return (
    <div style={{paddingTop:90,minHeight:"100vh",background:"var(--bg-base)",color:"var(--text-primary)"}}>
      <div className="container py-4" style={{maxWidth:860}}>
        <h2 style={{fontFamily:"Outfit",fontWeight:700,marginBottom:28}}>Admin Dashboard</h2>
        <div style={{display:"flex",gap:0,marginBottom:28,borderBottom:"1px solid var(--border)"}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 18px",background:"none",border:"none",borderBottom:tab===t.id?"2px solid var(--accent)":"2px solid transparent",color:tab===t.id?"var(--accent)":"var(--text-secondary)",fontFamily:"Outfit",fontWeight:600,fontSize:14,cursor:"pointer",marginBottom:-1}}>{t.label}</button>
          ))}
        </div>
        <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:16,padding:28}}>
          {tab==="upload-movie"  && <UploadMovieTab  genresList={genresList} languages={languages} />}
          {tab==="create-series" && <CreateSeriesTab genresList={genresList} languages={languages} />}
          {tab==="add-episodes"  && <AddEpisodesTab />}
          {tab==="manage"        && <ManageTab genresList={genresList} languages={languages} />}
        </div>
      </div>
    </div>
  );
}