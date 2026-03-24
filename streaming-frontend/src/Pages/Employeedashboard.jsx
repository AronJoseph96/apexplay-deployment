import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

export default function EmployeeDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const empLang    = user?.language || "";   // locked language

  const [tab, setTab] = useState("movie");  // movie | series | episodes | manage

  // ── shared genre state ──
  const [genresList,     setGenresList]     = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  const [uploadProgress, setUploadProgress] = useState(0);

  // ── movie form ──
  const [movieForm, setMovieForm] = useState({ title:"", description:"", releaseYear:"", duration:"", rating:"", ageRating:"U", category:"Movie", trailerUrl:"" });
  const [moviePoster,  setMoviePoster]  = useState(null);
  const [movieBanner,  setMovieBanner]  = useState(null);
  const [movieVideo,   setMovieVideo]   = useState(null);
  const [movieVideoUrl,setMovieVideoUrl]= useState("");
  const [epVideoUrl,   setEpVideoUrl]   = useState("");
  const [posterPrev,   setPosterPrev]   = useState(null);
  const [bannerPrev,   setBannerPrev]   = useState(null);

  // ── series form ──
  const [seriesForm,   setSeriesForm]   = useState({ title:"", description:"", releaseYear:"", duration:"", rating:"", ageRating:"U" });
  const [seriesPoster, setSeriesPoster] = useState(null);
  const [seriesBanner, setSeriesBanner] = useState(null);
  const [seriesPosterPrev, setSeriesPosterPrev] = useState(null);
  const [seriesBannerPrev, setSeriesBannerPrev] = useState(null);

  // ── episodes ──
  const [allSeries,       setAllSeries]       = useState([]);
  const [selectedSeries,  setSelectedSeries]  = useState("");
  const [seriesDetail,    setSeriesDetail]     = useState(null);
  const [selectedSeason,  setSelectedSeason]  = useState("");
  const [newSeasonNum,    setNewSeasonNum]     = useState("");
  const [epForm,          setEpForm]          = useState({ title:"", episodeNumber:"", duration:"" });
  const [epVideo,         setEpVideo]         = useState(null);
  const [editEp,          setEditEp]          = useState(null);
  const [editEpForm,      setEditEpForm]      = useState({title:"",description:"",duration:""});
  const [editEpVideo,     setEditEpVideo]     = useState(null);
  const [editEpVideoUrl,  setEditEpVideoUrl]  = useState("");
  const [editEpSaving,    setEditEpSaving]    = useState(false);

  // ── manage ──
  const [allContent,  setAllContent]  = useState([]);
  const [manageFilter,setManageFilter]= useState("All");
  const [manageSearch,setManageSearch]= useState("");
  const [editTarget,  setEditTarget]  = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [editGenres,  setEditGenres]  = useState([]);

  useEffect(() => {
    axios.get(`${API}/genres`).then(r => setGenresList(r.data.map(g => g.name)));
  }, []);

  useEffect(() => {
    if (tab === "episodes") fetchSeriesList();
    if (tab === "manage")   fetchContent();
  }, [tab]);

  const fetchSeriesList = () => {
    axios.get(`${API}/movies?category=Series&lang=${encodeURIComponent(empLang)}`)
      .then(r => setAllSeries(r.data));
  };

  const fetchContent = () => {
    axios.get(`${API}/movies?lang=${encodeURIComponent(empLang)}`)
      .then(r => setAllContent(r.data));
  };

  const fetchSeriesDetail = (id) => {
    axios.get(`${API}/movies/${id}`).then(r => setSeriesDetail(r.data));
  };

  const toggleGenre = (g, list, setList) =>
    setList(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  // ══ UPLOAD MOVIE ══
  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(movieForm).forEach(([k,v]) => data.append(k,v));
    data.append("language",  empLang);
    data.append("genres",    JSON.stringify(selectedGenres));
    if (moviePoster) data.append("poster", moviePoster);
    if (movieBanner) data.append("banner", movieBanner);
    if (movieVideo) data.append("video", movieVideo);
    if (movieVideoUrl.trim()) data.append("videoUrl", movieVideoUrl.trim());
    try {
      await axios.post(`${API}/movies/upload/movie`, data, {
        onUploadProgress: e => setUploadProgress(Math.round((e.loaded/e.total)*100))
      });
      setUploadProgress(0);
      alert("Movie uploaded!");
      setMovieForm({ title:"", description:"", releaseYear:"", duration:"", rating:"", ageRating:"U", category:"Movie", trailerUrl:"" });
      setSelectedGenres([]); setMoviePoster(null); setMovieBanner(null); setMovieVideo(null); setMovieVideoUrl("");
      setPosterPrev(null); setBannerPrev(null);
    } catch { setUploadProgress(0); alert("Upload failed"); }
  };

  // ══ CREATE SERIES ══
  const handleSeriesSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(seriesForm).forEach(([k,v]) => data.append(k,v));
    data.append("language", empLang);
    data.append("category", "Series");
    data.append("genres",   JSON.stringify(selectedGenres));
    data.append("poster",   seriesPoster);
    data.append("banner",   seriesBanner);
    try {
      await axios.post(`${API}/movies/upload/series`, data, {
        onUploadProgress: e => setUploadProgress(Math.round((e.loaded/e.total)*100))
      });
      setUploadProgress(0);
      alert("Series created!");
      setSeriesForm({ title:"", description:"", releaseYear:"", duration:"", rating:"", ageRating:"U" });
      setSelectedGenres([]); setSeriesPoster(null); setSeriesBanner(null);
      setSeriesPosterPrev(null); setSeriesBannerPrev(null);
    } catch { setUploadProgress(0); alert("Series creation failed"); }
  };

  // ══ ADD SEASON ══
  const handleAddSeason = async () => {
    if (!selectedSeries || !newSeasonNum) return alert("Select series and enter season number");
    try {
      await axios.post(`${API}/movies/${selectedSeries}/seasons`, { seasonNumber: Number(newSeasonNum), title: `Season ${newSeasonNum}` });
      alert(`Season ${newSeasonNum} added!`);
      setNewSeasonNum(""); fetchSeriesDetail(selectedSeries);
    } catch { alert("Failed to add season"); }
  };

  // ══ ADD EPISODE ══
  const handleAddEpisode = async () => {
    if (!selectedSeries || !selectedSeason) return alert("Select series and season");
    const data = new FormData();
    Object.entries(epForm).forEach(([k,v]) => data.append(k,v));
    if (epVideo) data.append("video", epVideo);
    if (epVideoUrl.trim()) data.append("videoUrl", epVideoUrl.trim());
    try {
      await axios.post(`${API}/movies/${selectedSeries}/seasons/${selectedSeason}/episodes`, data, {
        onUploadProgress: e => setUploadProgress(Math.round((e.loaded/e.total)*100))
      });
      setUploadProgress(0);
      alert("Episode added!");
      setEpForm({ title:"", episodeNumber:"", duration:"" }); setEpVideo(null); setEpVideoUrl("");
      fetchSeriesDetail(selectedSeries);
    } catch { setUploadProgress(0); alert("Failed to add episode"); }
  };

  // ══ EDIT EPISODE ══
  const openEditEp = (ep, seasonId) => {
    setEditEp({ ep, seasonId });
    setEditEpForm({ title:ep.title, description:ep.description||"", duration:ep.duration||"" });
    setEditEpVideo(null); setEditEpVideoUrl(ep.videoUrl||"");
  };

  const saveEditEp = async () => {
    if (!editEp) return;
    setEditEpSaving(true);
    const season = seriesDetail.seasons.find(s => s._id === editEp.seasonId);
    const fd = new FormData();
    fd.append("title", editEpForm.title);
    fd.append("description", editEpForm.description);
    fd.append("duration", editEpForm.duration);
    if (editEpVideo) fd.append("video", editEpVideo);
    else if (editEpVideoUrl.trim()) fd.append("videoUrl", editEpVideoUrl.trim());
    try {
      await axios.patch(`${API}/movies/${selectedSeries}/seasons/${season.seasonNumber}/episodes/${editEp.ep.episodeNumber}`, fd);
      await fetchSeriesDetail(selectedSeries);
      setEditEp(null);
    } catch { alert("Failed to update episode"); }
    setEditEpSaving(false);
  };

  // ══ DELETE EPISODE ══
  const handleDeleteEpisode = async (seasonId, epNum) => {
    if (!window.confirm(`Delete episode ${epNum}?`)) return;
    await axios.delete(`${API}/movies/${selectedSeries}/seasons/${seasonId}/episodes/${epNum}`);
    fetchSeriesDetail(selectedSeries);
  };

  // ══ DELETE CONTENT ══
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    await axios.delete(`${API}/movies/${id}`);
    fetchContent();
  };

  // ══ OPEN EDIT ══
  const openEdit = (item) => {
    setEditTarget(item);
    setEditForm({ title:item.title, description:item.description, releaseYear:item.releaseYear, duration:item.duration, rating:item.rating, trailerUrl:item.trailerUrl||"" });
    setEditGenres(item.genres||[]);
  };

  // ══ SAVE EDIT ══
  const handleEditSave = async () => {
    const data = new FormData();
    Object.entries(editForm).forEach(([k,v]) => data.append(k, v||""));
    data.append("language", empLang);
    data.append("genres",   JSON.stringify(editGenres));
    await axios.patch(`${API}/movies/${editTarget._id}`, data);
    setEditTarget(null); fetchContent();
  };

  const tabs = [
    { key:"movie",    label:"🎬 Upload Movie" },
    { key:"series",   label:"📺 Create Series" },
    { key:"episodes", label:"➕ Add Episodes" },
    { key:"manage",   label:"⚙ Manage" },
  ];

  const managedFiltered = allContent
    .filter(m => manageFilter==="All" || m.category===manageFilter)
    .filter(m => m.title?.toLowerCase().includes(manageSearch.toLowerCase()));

  // ── shared styles ──
  const inputStyle = { background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", fontFamily:"Outfit", fontSize:14, width:"100%" };
  const labelStyle = { fontSize:13, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:6 };

  return (
    <div style={{ paddingTop:90, minHeight:"100vh", background:"var(--bg-base)", color:"var(--text-primary)", fontFamily:"Outfit, sans-serif" }}>
      <div style={{ maxWidth:760, margin:"0 auto", padding:"0 20px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <h2 style={{ fontWeight:800, fontSize:26, marginBottom:4 }}>Employee Dashboard</h2>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:14, color:"var(--text-muted)" }}>Logged in as</span>
            <span style={{ fontWeight:700, fontSize:14 }}>{user?.name}</span>
            <span style={{ background:"rgba(74,222,128,0.15)", color:"#4ade80", borderRadius:999, padding:"2px 12px", fontSize:12, fontWeight:700 }}>
              🌐 {empLang}
            </span>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:"flex", gap:4, borderBottom:"1px solid var(--border)", marginBottom:28 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background:"none", border:"none", borderBottom:`2px solid ${tab===t.key?"var(--accent)":"transparent"}`,
              color: tab===t.key ? "var(--text-primary)" : "var(--text-muted)",
              fontFamily:"Outfit", fontWeight:700, fontSize:13, padding:"10px 14px",
              cursor:"pointer", marginBottom:-1, transition:"all 0.15s"
            }}>{t.label}</button>
          ))}
        </div>

        {/* ══ UPLOAD MOVIE ══ */}
        {tab === "movie" && (
          <form onSubmit={handleMovieSubmit}>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} placeholder="Movie title" value={movieForm.title} onChange={e=>setMovieForm({...movieForm,title:e.target.value})} required />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{...inputStyle,minHeight:80,resize:"vertical"}} placeholder="Description" value={movieForm.description} onChange={e=>setMovieForm({...movieForm,description:e.target.value})} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label style={labelStyle}>Year</label>
                <input style={inputStyle} type="number" min="1900" max="2030" placeholder="2024" value={movieForm.releaseYear} onChange={e=>setMovieForm({...movieForm,releaseYear:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Duration</label>
                <input style={inputStyle} placeholder="2h 10m" value={movieForm.duration} onChange={e=>setMovieForm({...movieForm,duration:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Rating</label>
                <input style={inputStyle} type="number" step="0.1" min="0" max="10" placeholder="7.5" value={movieForm.rating} onChange={e=>setMovieForm({...movieForm,rating:e.target.value})} />
                <label style={labelStyle}>Age Rating</label>
                <select style={inputStyle} value={movieForm.ageRating||"U"} onChange={e=>setMovieForm({...movieForm,ageRating:e.target.value})}>
                  <option value="U">U — Universal</option>
                  <option value="U/A 7+">U/A 7+</option>
                  <option value="U/A 13+">U/A 13+</option>
                  <option value="U/A 16+">U/A 16+</option>
                  <option value="R">R — Restricted</option>
                  <option value="A">A — Adults Only</option>
                </select>
              </div>
            </div>

            {/* Trailer URL */}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Trailer URL (optional)</label>
              <input style={inputStyle} placeholder="YouTube embed or direct URL" value={movieForm.trailerUrl||""} onChange={e=>setMovieForm({...movieForm,trailerUrl:e.target.value})} />
            </div>

            {/* Language — LOCKED */}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Language (locked to your assignment)</label>
              <div style={{...inputStyle, background:"var(--bg-surface)", color:"var(--text-muted)", cursor:"not-allowed", display:"flex", alignItems:"center", gap:8 }}>
                🔒 {empLang}
              </div>
            </div>

            {/* Genres */}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Genres</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {genresList.map(g => (
                  <button type="button" key={g} onClick={() => toggleGenre(g, selectedGenres, setSelectedGenres)} style={{
                    padding:"5px 14px", borderRadius:999, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"Outfit",
                    background: selectedGenres.includes(g) ? "var(--accent)" : "var(--bg-elevated)",
                    color: selectedGenres.includes(g) ? "#fff" : "var(--text-muted)",
                    border: `1px solid ${selectedGenres.includes(g) ? "var(--accent)" : "var(--border)"}`
                  }}>{g}</button>
                ))}
              </div>
            </div>

            {/* Files */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
              <div>
                <label style={labelStyle}>Poster</label>
                <input type="file" accept="image/*" style={inputStyle} onChange={e=>{setMoviePoster(e.target.files[0]);setPosterPrev(URL.createObjectURL(e.target.files[0]));}} />
                {posterPrev && <img src={posterPrev} alt="" style={{ width:"100%", borderRadius:8, marginTop:8, aspectRatio:"2/3", objectFit:"cover" }} />}
              </div>
              <div>
                <label style={labelStyle}>Banner</label>
                <input type="file" accept="image/*" style={inputStyle} onChange={e=>{setMovieBanner(e.target.files[0]);setBannerPrev(URL.createObjectURL(e.target.files[0]));}} />
                {bannerPrev && <img src={bannerPrev} alt="" style={{ width:"100%", borderRadius:8, marginTop:8, aspectRatio:"16/9", objectFit:"cover" }} />}
              </div>
              <div>
                <label style={labelStyle}>Video</label>
                <input type="file" accept="video/*" style={inputStyle} onChange={e=>{setMovieVideo(e.target.files[0]); setMovieVideoUrl("");}} disabled={!!movieVideoUrl} />
                {movieVideo && <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>✓ {movieVideo.name}</p>}
                <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 0"}}>
                  <hr style={{flex:1,borderColor:"var(--border)",margin:0}}/>
                  <span style={{fontSize:11,color:"var(--text-muted)",fontWeight:600}}>OR</span>
                  <hr style={{flex:1,borderColor:"var(--border)",margin:0}}/>
                </div>
                <input style={inputStyle} placeholder="Paste Cloudinary video URL" value={movieVideoUrl} onChange={e=>{setMovieVideoUrl(e.target.value); if(e.target.value) setMovieVideo(null);}} disabled={!!movieVideo} />
                {movieVideoUrl && <p style={{fontSize:12,color:"#4ade80",marginTop:4}}>✓ Using URL</p>}
              </div>
            </div>
            {uploadProgress > 0 && (
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"var(--text-muted)",marginBottom:4}}>
                  <span>Uploading to Cloudinary…</span><span>{uploadProgress}%</span>
                </div>
                <div style={{width:"100%",height:6,background:"var(--bg-elevated)",borderRadius:999}}>
                  <div style={{height:"100%",width:`${uploadProgress}%`,background:"var(--accent)",borderRadius:999,transition:"width 0.3s"}}/>
                </div>
              </div>
            )}
            <button type="submit" style={{ width:"100%", padding:"13px 0", background:"var(--accent)", color:"#fff", border:"none", borderRadius:12, fontFamily:"Outfit", fontWeight:800, fontSize:16, cursor:"pointer" }}>
              Upload Movie
            </button>
          </form>
        )}

        {/* ══ CREATE SERIES ══ */}
        {tab === "series" && (
          <form onSubmit={handleSeriesSubmit}>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Series Title</label>
              <input style={inputStyle} placeholder="Series title" value={seriesForm.title} onChange={e=>setSeriesForm({...seriesForm,title:e.target.value})} required />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{...inputStyle,minHeight:80,resize:"vertical"}} placeholder="Description" value={seriesForm.description} onChange={e=>setSeriesForm({...seriesForm,description:e.target.value})} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label style={labelStyle}>Year</label>
                <input style={inputStyle} type="number" placeholder="2024" value={seriesForm.releaseYear} onChange={e=>setSeriesForm({...seriesForm,releaseYear:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Duration</label>
                <input style={inputStyle} placeholder="45m/ep" value={seriesForm.duration} onChange={e=>setSeriesForm({...seriesForm,duration:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Rating</label>
                <input style={inputStyle} type="number" step="0.1" min="0" max="10" placeholder="8.2" value={seriesForm.rating} onChange={e=>setSeriesForm({...seriesForm,rating:e.target.value})} />
                <label style={labelStyle}>Age Rating</label>
                <select style={inputStyle} value={seriesForm.ageRating||"U"} onChange={e=>setSeriesForm({...seriesForm,ageRating:e.target.value})}>
                  <option value="U">U — Universal</option>
                  <option value="U/A 7+">U/A 7+</option>
                  <option value="U/A 13+">U/A 13+</option>
                  <option value="U/A 16+">U/A 16+</option>
                  <option value="R">R — Restricted</option>
                  <option value="A">A — Adults Only</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Language (locked)</label>
              <div style={{...inputStyle, background:"var(--bg-surface)", color:"var(--text-muted)", cursor:"not-allowed" }}>🔒 {empLang}</div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Genres</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {genresList.map(g => (
                  <button type="button" key={g} onClick={() => toggleGenre(g, selectedGenres, setSelectedGenres)} style={{
                    padding:"5px 14px", borderRadius:999, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"Outfit",
                    background: selectedGenres.includes(g) ? "var(--accent)" : "var(--bg-elevated)",
                    color: selectedGenres.includes(g) ? "#fff" : "var(--text-muted)",
                    border: `1px solid ${selectedGenres.includes(g) ? "var(--accent)" : "var(--border)"}`
                  }}>{g}</button>
                ))}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
              <div>
                <label style={labelStyle}>Poster</label>
                <input type="file" accept="image/*" style={inputStyle} onChange={e=>{setSeriesPoster(e.target.files[0]);setSeriesPosterPrev(URL.createObjectURL(e.target.files[0]));}} />
                {seriesPosterPrev && <img src={seriesPosterPrev} alt="" style={{ width:"100%", borderRadius:8, marginTop:8, aspectRatio:"2/3", objectFit:"cover" }} />}
              </div>
              <div>
                <label style={labelStyle}>Banner</label>
                <input type="file" accept="image/*" style={inputStyle} onChange={e=>{setSeriesBanner(e.target.files[0]);setSeriesBannerPrev(URL.createObjectURL(e.target.files[0]));}} />
                {seriesBannerPrev && <img src={seriesBannerPrev} alt="" style={{ width:"100%", borderRadius:8, marginTop:8, aspectRatio:"16/9", objectFit:"cover" }} />}
              </div>
            </div>
            {uploadProgress > 0 && (
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"var(--text-muted)",marginBottom:4}}>
                  <span>Uploading to Cloudinary…</span><span>{uploadProgress}%</span>
                </div>
                <div style={{width:"100%",height:6,background:"var(--bg-elevated)",borderRadius:999}}>
                  <div style={{height:"100%",width:`${uploadProgress}%`,background:"var(--accent)",borderRadius:999,transition:"width 0.3s"}}/>
                </div>
              </div>
            )}
            <button type="submit" style={{ width:"100%", padding:"13px 0", background:"var(--accent)", color:"#fff", border:"none", borderRadius:12, fontFamily:"Outfit", fontWeight:800, fontSize:16, cursor:"pointer" }}>
              Create Series
            </button>
          </form>
        )}

        {/* ══ ADD EPISODES ══ */}
        {tab === "episodes" && (
          <div>
            {/* Pick series */}
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Select Series ({empLang})</label>
              <select style={{...inputStyle}} value={selectedSeries} onChange={e=>{ setSelectedSeries(e.target.value); setSelectedSeason(""); if(e.target.value) fetchSeriesDetail(e.target.value); }}>
                <option value="">Choose a series…</option>
                {allSeries.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}
              </select>
            </div>

            {seriesDetail && (
              <>
                {/* Add season */}
                <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:16, marginBottom:16 }}>
                  <label style={labelStyle}>Add New Season</label>
                  <div style={{ display:"flex", gap:8 }}>
                    <input style={{...inputStyle, flex:1}} type="number" placeholder="Season number" value={newSeasonNum} onChange={e=>setNewSeasonNum(e.target.value)} />
                    <button onClick={handleAddSeason} style={{ padding:"10px 20px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:10, fontFamily:"Outfit", fontWeight:700, cursor:"pointer" }}>
                      + Season
                    </button>
                  </div>
                </div>

                {/* Season picker */}
                {seriesDetail.seasons?.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <label style={labelStyle}>Select Season to add episode</label>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                      {seriesDetail.seasons.sort((a,b)=>a.seasonNumber-b.seasonNumber).map(s => (
                        <button key={s._id} onClick={()=>setSelectedSeason(s._id)} style={{
                          padding:"7px 18px", borderRadius:999, fontFamily:"Outfit", fontWeight:600, fontSize:13, cursor:"pointer",
                          background: selectedSeason===s._id ? "var(--accent)" : "var(--bg-elevated)",
                          color: selectedSeason===s._id ? "#fff" : "var(--text-primary)",
                          border: `1px solid ${selectedSeason===s._id ? "var(--accent)" : "var(--border)"}`
                        }}>Season {s.seasonNumber}</button>
                      ))}
                    </div>

                    {selectedSeason && (
                      <>
                        {/* Episode list */}
                        {seriesDetail.seasons.find(s=>s._id===selectedSeason)?.episodes?.map(ep => (
                          <div key={ep.episodeNumber} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"var(--bg-elevated)", borderRadius:8, marginBottom:6 }}>
                            <span style={{ fontSize:12, fontWeight:700, color:"var(--accent)" }}>E{ep.episodeNumber}</span>
                            <span style={{ flex:1, fontSize:13 }}>{ep.title}</span>
                            <span style={{ fontSize:12, color:"var(--text-muted)" }}>{ep.duration}</span>
                            <button onClick={()=>openEditEp(ep, selectedSeason)} style={{ background:"rgba(99,102,241,0.15)", color:"#818cf8", border:"none", borderRadius:6, padding:"3px 8px", fontSize:12, cursor:"pointer", fontWeight:600 }}>✏</button>
                            <button onClick={()=>handleDeleteEpisode(selectedSeason, ep.episodeNumber)} style={{ background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontSize:16 }}>🗑</button>
                          </div>
                        ))}

                        {/* Add episode form */}
                        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:16, marginTop:12 }}>
                          <label style={{...labelStyle, marginBottom:12}}>Add Episode</label>
                          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10, marginBottom:10 }}>
                            <input style={inputStyle} placeholder="Episode title" value={epForm.title} onChange={e=>setEpForm({...epForm,title:e.target.value})} />
                            <input style={inputStyle} type="number" placeholder="Ep #" value={epForm.episodeNumber} onChange={e=>setEpForm({...epForm,episodeNumber:e.target.value})} />
                            <input style={inputStyle} placeholder="Duration" value={epForm.duration} onChange={e=>setEpForm({...epForm,duration:e.target.value})} />
                          </div>
                          <input type="file" accept="video/*" style={{...inputStyle, marginBottom:6}} onChange={e=>{setEpVideo(e.target.files[0]); setEpVideoUrl("");}} disabled={!!epVideoUrl} />
                          <div style={{display:"flex",alignItems:"center",gap:8,margin:"6px 0"}}>
                            <hr style={{flex:1,borderColor:"var(--border)",margin:0}}/>
                            <span style={{fontSize:11,color:"var(--text-muted)",fontWeight:600}}>OR</span>
                            <hr style={{flex:1,borderColor:"var(--border)",margin:0}}/>
                          </div>
                          <input style={{...inputStyle,marginBottom:10}} placeholder="Paste Cloudinary video URL" value={epVideoUrl} onChange={e=>{setEpVideoUrl(e.target.value); if(e.target.value) setEpVideo(null);}} disabled={!!epVideo} />
                          {epVideoUrl && <p style={{fontSize:12,color:"#4ade80",margin:"0 0 10px"}}>✓ Using URL</p>}
                          {uploadProgress > 0 && (
                            <div style={{marginBottom:8}}>
                              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--text-muted)",marginBottom:3}}><span>Uploading…</span><span>{uploadProgress}%</span></div>
                              <div style={{height:4,background:"var(--bg-elevated)",borderRadius:999}}><div style={{height:"100%",width:`${uploadProgress}%`,background:"var(--accent)",borderRadius:999,transition:"width 0.3s"}}/></div>
                            </div>
                          )}
                          <button onClick={handleAddEpisode} style={{ width:"100%", padding:"11px 0", background:"var(--accent)", color:"#fff", border:"none", borderRadius:10, fontFamily:"Outfit", fontWeight:700, cursor:"pointer" }}>
                            + Add Episode
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ MANAGE ══ */}
        {tab === "manage" && (
          <div>
            <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
              <input style={{...inputStyle, flex:1, minWidth:160}} placeholder="Search…" value={manageSearch} onChange={e=>setManageSearch(e.target.value)} />
              {["All","Movie","Series"].map(f => (
                <button key={f} onClick={()=>setManageFilter(f)} style={{
                  padding:"8px 18px", borderRadius:999, fontFamily:"Outfit", fontWeight:600, fontSize:13, cursor:"pointer",
                  background: manageFilter===f ? "var(--accent)" : "var(--bg-elevated)",
                  color: manageFilter===f ? "#fff" : "var(--text-muted)",
                  border: `1px solid ${manageFilter===f ? "var(--accent)" : "var(--border)"}`
                }}>{f}</button>
              ))}
            </div>

            {managedFiltered.length === 0 ? (
              <div style={{ textAlign:"center", padding:40, color:"var(--text-muted)" }}>No content found for {empLang}.</div>
            ) : managedFiltered.map(item => (
              <div key={item._id} style={{ display:"flex", gap:14, alignItems:"center", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:12, marginBottom:10 }}>
                <img src={item.poster} alt="" style={{ width:54, height:80, borderRadius:8, objectFit:"cover", flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{item.title}</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)" }}>{item.category} · {item.releaseYear} · {item.language}</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>openEdit(item)} style={{ background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 14px", fontFamily:"Outfit", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                    ✏ Edit
                  </button>
                  <button onClick={()=>handleDelete(item._id, item.title)} style={{ background:"none", color:"var(--accent)", border:"1px solid var(--accent)", borderRadius:8, padding:"6px 14px", fontFamily:"Outfit", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ EDIT MODAL ══ */}
      {editTarget && (
        <div onClick={e=>e.target===e.currentTarget&&setEditTarget(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:18, padding:28, width:"100%", maxWidth:500, maxHeight:"85vh", overflowY:"auto", fontFamily:"Outfit" }}>
            <h5 style={{ fontWeight:800, marginBottom:16 }}>Edit — {editTarget.title}</h5>
            {[["title","Title"],["description","Description"],["releaseYear","Year"],["duration","Duration"],["rating","Rating"],["trailerUrl","Trailer URL"]].map(([field,label]) => (
              <div key={field} style={{ marginBottom:12 }}>
                <label style={labelStyle}>{label}</label>
                {field==="description" ? (
                  <textarea style={{...inputStyle,minHeight:60,resize:"vertical"}} value={editForm[field]||""} onChange={e=>setEditForm({...editForm,[field]:e.target.value})} />
                ) : (
                  <input style={inputStyle} value={editForm[field]||""} onChange={e=>setEditForm({...editForm,[field]:e.target.value})} />
                )}
              </div>
            ))}
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Genres</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {genresList.map(g => (
                  <button type="button" key={g} onClick={()=>toggleGenre(g, editGenres, setEditGenres)} style={{
                    padding:"4px 12px", borderRadius:999, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"Outfit",
                    background: editGenres.includes(g) ? "var(--accent)" : "var(--bg-elevated)",
                    color: editGenres.includes(g) ? "#fff" : "var(--text-muted)",
                    border:`1px solid ${editGenres.includes(g)?"var(--accent)":"var(--border)"}`
                  }}>{g}</button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handleEditSave} style={{ flex:1, padding:"11px 0", background:"var(--accent)", color:"#fff", border:"none", borderRadius:10, fontFamily:"Outfit", fontWeight:700, cursor:"pointer" }}>Save</button>
              <button onClick={()=>setEditTarget(null)} style={{ flex:1, padding:"11px 0", background:"var(--bg-elevated)", color:"var(--text-primary)", border:"1px solid var(--border)", borderRadius:10, fontFamily:"Outfit", fontWeight:600, cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}