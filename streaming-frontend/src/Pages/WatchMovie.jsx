import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";



/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function WatchMovie() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const seasonParam = Number(searchParams.get("season")) || null;
  const epParam     = Number(searchParams.get("ep"))     || null;

  const [content,  setContent]  = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [title,    setTitle]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const videoRef    = useRef();
  const { user, activeProfile } = useAuth();
  const continueKey = (user && activeProfile) ? `apexplay_continue_${user._id}_${activeProfile._id}` : null;
  // unique key per movie/episode for resume
  const progressKey = user
    ? `apexplay_progress_${user._id}_${id}${seasonParam ? `_s${seasonParam}e${epParam}` : ""}`
    : null;

  /* ── fetch content ── */
  useEffect(() => {
    setLoading(true); setError("");
    axios.get(`${API}/movies/${id}`)
      .then(({ data }) => {
        setContent(data);

        // ── Subscription check ──
        const subStatus = user?.subscription?.status;
        const subExpiry = user?.subscription?.expiresAt;
        const isSubscribed = subStatus === "active" && subExpiry && new Date() < new Date(subExpiry);
        const isAdminOrEmployee = ["ADMIN","admin","EMPLOYEE","employee"].includes(user?.role);
        if (!isSubscribed && !isAdminOrEmployee) {
          setError("SUBSCRIPTION_REQUIRED");
          setLoading(false);
          return;
        }

        // ── Age rating check ──
        if (activeProfile) {
          const ORDER = ["U", "U/A 7+", "U/A 13+", "U/A 16+", "R", "A"];
          const contentIdx = ORDER.indexOf(data.ageRating || "U");
          const profileIdx = ORDER.indexOf(activeProfile.ageRating || "A");
          if (contentIdx > profileIdx) {
            setError(`This content is rated "${data.ageRating}" and is restricted for the "${activeProfile.name}" profile.`);
            setLoading(false);
            return;
          }
        }

        if (data.category === "Series" && seasonParam && epParam) {
          const season  = data.seasons?.find(s => s.seasonNumber === seasonParam);
          const episode = season?.episodes?.find(e => e.episodeNumber === epParam);
          setVideoUrl(episode?.videoUrl || "");
          setTitle(`${data.title} — S${seasonParam} E${epParam}${episode?.title ? `: ${episode.title}` : ""}`);
        } else {
          setVideoUrl(data.videoUrl || "");
          setTitle(data.title);
        }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load content."); setLoading(false); });
  }, [id, seasonParam, epParam]);

  /* ── resume from saved position ── */
  useEffect(() => {
    if (!videoRef.current || !progressKey) return;
    const saved = parseFloat(localStorage.getItem(progressKey));
    if (saved && saved > 5) {
      videoRef.current.currentTime = saved;
    }
  }, [videoUrl, progressKey]);

  /* ── save progress every 5s + save to continue watching ── */
  useEffect(() => {
    if (!content || !continueKey) return;
    const save = () => {
      const vid = videoRef.current;
      // Save timestamp for resume
      if (progressKey && vid && vid.currentTime > 5) {
        localStorage.setItem(progressKey, vid.currentTime.toString());
      }
      // Save to continue watching list with progress %
      let list = JSON.parse(localStorage.getItem(continueKey)) || [];
      const progress = vid ? Math.round((vid.currentTime / vid.duration) * 100) || 0 : 0;
      const entry = {
        _id: content._id, title, poster: content.poster,
        category: content.category,
        progress,
        season: seasonParam, ep: epParam,
        watchedAt: Date.now()
      };
      list = list.filter(m => m._id !== content._id || m.season !== seasonParam || m.ep !== epParam);
      list.unshift(entry);
      list = list.slice(0, 20);
      localStorage.setItem(continueKey, JSON.stringify(list));
    };
    const interval = setInterval(save, 5000);

    // Screen time — update every 5 mins
    const screenTimeInterval = setInterval(async () => {
      if (activeProfile && user && activeProfile.isKids) {
        try {
          const res = await fetch(`${API}/users/${user._id}/profiles/${activeProfile._id}/screentime`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ minutesWatched: 5 })
          });
          const data = await res.json();
          if (data.limitReached) {
            alert(`⏱ Screen time limit reached for ${activeProfile.name}!`);
            window.location.href = "/profiles";
          }
        } catch {}
      }
    }, 5 * 60 * 1000); // every 5 minutes

    return () => { clearInterval(interval); clearInterval(screenTimeInterval); };
  }, [content, continueKey, progressKey, title, seasonParam, epParam, activeProfile, user]);

  if (loading) return (
    <div style={{ height:"100vh", background:"#000", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="spinner-border text-danger" />
    </div>
  );

  if (error === "SUBSCRIPTION_REQUIRED") return (
    <div style={{ height:"100vh", background:"var(--bg-base)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, fontFamily:"Outfit", textAlign:"center", padding:24 }}>
      <div style={{ fontSize:72 }}>🔒</div>
      <h2 style={{ color:"var(--text-primary)", fontWeight:900 }}>Subscription Required</h2>
      <p style={{ color:"var(--text-muted)", fontSize:16, maxWidth:400 }}>Subscribe to ApexPlay to watch unlimited movies and series.</p>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
        <button onClick={() => navigate("/subscription")} className="btn btn-danger"
          style={{ borderRadius:10, fontWeight:700, padding:"12px 28px", fontSize:15 }}>
          View Plans →
        </button>
        <button onClick={() => navigate(-1)}
          style={{ background:"none", border:"1px solid var(--border)", color:"var(--text-muted)", borderRadius:10, padding:"12px 20px", fontFamily:"Outfit", fontWeight:600, cursor:"pointer" }}>
          ← Go Back
        </button>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ height:"100vh", background:"#000", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#fff", gap:16 }}>
      <p style={{ fontFamily:"Outfit" }}>{error}</p>
      <button onClick={() => navigate(-1)} style={{ color:"#e50914", background:"none", border:"none", cursor:"pointer", fontFamily:"Outfit" }}>← Go Back</button>
    </div>
  );

  return (
    <div style={{ background:"#000", minHeight:"100vh", display:"flex", flexDirection:"column" }}>

      {/* TOP BAR */}
      <div style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 28px", background:"rgba(0,0,0,0.92)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(255,255,255,0.06)", position:"sticky", top:0, zIndex:50 }}>
        <button onClick={() => navigate(-1)} style={{
          width:42, height:42, borderRadius:"50%", border:"none",
          background:"rgba(255,255,255,0.10)", backdropFilter:"blur(10px)",
          color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", flexShrink:0, transition:"background 0.2s"
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ color:"#fff", fontFamily:"Outfit", fontWeight:700, fontSize:"clamp(13px,2vw,16px)", flex:1, textAlign:"center", letterSpacing:"-0.3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", padding:"0 8px" }}>{title}</span>
        <div style={{ width:42 }} />
      </div>

      {/* VIDEO PLAYER */}
      {videoUrl ? (
        <CustomPlayer videoRef={videoRef} src={videoUrl} />
      ) : (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.4)", gap:12 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <p style={{ fontFamily:"Outfit", fontSize:16 }}>No video available for this content.</p>
        </div>
      )}

      {/* EPISODE NAV */}
      {content?.category === "Series" && seasonParam && epParam && (
        <EpisodeNav content={content} currentSeason={seasonParam} currentEp={epParam} navigate={navigate} id={id} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CUSTOM PLAYER
══════════════════════════════════════════════════════════ */
function CustomPlayer({ videoRef, src }) {
  const containerRef = useRef();
  const progressRef  = useRef();
  const hideTimer    = useRef();

  const [playing,       setPlaying]       = useState(false);
  const [currentTime,   setCurrentTime]   = useState(0);
  const [duration,      setDuration]      = useState(0);
  const [volume,        setVolume]        = useState(1);
  const [muted,         setMuted]         = useState(false);
  const [speed,         setSpeed]         = useState(1);
  const [fullscreen,    setFullscreen]    = useState(false);
  const [showControls,  setShowControls]  = useState(true);
  const [showSpeed,     setShowSpeed]     = useState(false);
  const [buffered,      setBuffered]      = useState(0);

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  /* ── show/hide controls on mouse move ── */
  const resetHide = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
  }, [playing]);

  useEffect(() => { return () => clearTimeout(hideTimer.current); }, []);

  /* ── video event listeners ── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime   = () => { setCurrentTime(v.currentTime); updateBuffered(v); };
    const onMeta   = () => setDuration(v.duration);
    const onPlay   = () => setPlaying(true);
    const onPause  = () => setPlaying(false);
    const onEnded  = () => setPlaying(false);
    v.addEventListener("timeupdate",      onTime);
    v.addEventListener("loadedmetadata",  onMeta);
    v.addEventListener("play",            onPlay);
    v.addEventListener("pause",           onPause);
    v.addEventListener("ended",           onEnded);
    return () => {
      v.removeEventListener("timeupdate",     onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("play",           onPlay);
      v.removeEventListener("pause",          onPause);
      v.removeEventListener("ended",          onEnded);
    };
  }, [videoRef]);

  /* ── fullscreen change listener ── */
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      const v = videoRef.current;
      if (!v) return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "ArrowRight") skip(10);
      if (e.code === "ArrowLeft")  skip(-10);
      if (e.code === "ArrowUp")    { e.preventDefault(); changeVolume(Math.min(1, v.volume + 0.1)); }
      if (e.code === "ArrowDown")  { e.preventDefault(); changeVolume(Math.max(0, v.volume - 0.1)); }
      if (e.code === "KeyF")       toggleFullscreen();
      if (e.code === "KeyM")       toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const updateBuffered = (v) => {
    if (v.buffered.length > 0 && v.duration) {
      setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    playing ? v.pause() : v.play();
    resetHide();
  };

  const skip = (secs) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + secs));
    resetHide();
  };

  const seek = (e) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
    resetHide();
  };

  const changeVolume = (val) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    setMuted(val === 0);
    resetHide();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    resetHide();
  };

  const changeSpeed = (s) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
    setShowSpeed(false);
    resetHide();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    resetHide();
  };

  const fmt = (s) => {
    if (isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={containerRef}
      style={{ position:"relative", background:"#000", flex:1, display:"flex", alignItems:"center", justifyContent:"center", cursor: showControls ? "default" : "none" }}
      onMouseMove={resetHide}
      onMouseLeave={() => playing && setShowControls(false)}>

      <video
        onClick={togglePlay}
        style={{ cursor: "pointer" }}
        ref={videoRef}
        src={src}
        style={{ width:"100%", maxHeight:"calc(100vh - 56px)", display:"block" }}
      />

      {/* CONTROLS OVERLAY */}
      <div onClick={e => e.stopPropagation()}
        style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:"flex-end",
          background: showControls ? "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 40%)" : "transparent",
          transition:"opacity 0.3s", opacity: showControls ? 1 : 0, pointerEvents: showControls ? "all" : "none" }}>

        {/* CENTER PLAY/PAUSE — clickable */}
        <div onClick={togglePlay}
          style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
            cursor:"pointer", zIndex:10 }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(0,0,0,0.5)",
            display:"flex", alignItems:"center", justifyContent:"center",
            opacity: !playing ? 1 : 0, transition:"opacity 0.2s" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>

        {/* SKIP BUTTONS */}
        <div style={{ position:"absolute", top:"50%", left:"10%", transform:"translateY(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <button onClick={() => skip(-10)} style={skipBtnStyle}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.87"/>
            </svg>
            <span style={{ fontSize:10, color:"#fff", fontFamily:"Outfit" }}>-10</span>
          </button>
        </div>
        <div style={{ position:"absolute", top:"50%", right:"10%", transform:"translateY(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <button onClick={() => skip(10)} style={skipBtnStyle}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-.49-3.87"/>
            </svg>
            <span style={{ fontSize:10, color:"#fff", fontFamily:"Outfit" }}>+10</span>
          </button>
        </div>

        {/* BOTTOM CONTROLS */}
        <div style={{ padding:"0 16px 12px" }}>
          {/* PROGRESS BAR */}
          <div ref={progressRef} onClick={seek}
            style={{ width:"100%", height:4, background:"rgba(255,255,255,0.25)", borderRadius:2, cursor:"pointer", marginBottom:10, position:"relative" }}>
            {/* buffered */}
            <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${buffered}%`, background:"rgba(255,255,255,0.3)", borderRadius:2 }} />
            {/* played */}
            <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${pct}%`, background:"#e50914", borderRadius:2 }} />
            {/* thumb */}
            <div style={{ position:"absolute", top:"50%", left:`${pct}%`, transform:"translate(-50%,-50%)", width:14, height:14, borderRadius:"50%", background:"#e50914", boxShadow:"0 0 4px rgba(0,0,0,0.5)" }} />
          </div>

          {/* CONTROL ROW */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {/* Play/Pause */}
            <button onClick={togglePlay} style={ctrlBtnStyle}>
              {playing
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
            </button>

            {/* Volume */}
            <button onClick={toggleMute} style={ctrlBtnStyle}>
              {muted || volume === 0
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>}
            </button>
            <input type="range" min={0} max={1} step={0.02} value={muted ? 0 : volume}
              onChange={e => changeVolume(parseFloat(e.target.value))}
              style={{ width:72, accentColor:"#e50914", cursor:"pointer" }} />

            {/* Time */}
            <span style={{ color:"#fff", fontFamily:"Outfit", fontSize:13, whiteSpace:"nowrap" }}>
              {fmt(currentTime)} / {fmt(duration)}
            </span>

            <div style={{ flex:1 }} />

            {/* Speed */}
            <div style={{ position:"relative" }}>
              <button onClick={() => setShowSpeed(p => !p)} style={{ ...ctrlBtnStyle, fontSize:13, fontFamily:"Outfit", fontWeight:700, color:"#fff", minWidth:44 }}>
                {speed}x
              </button>
              {showSpeed && (
                <div style={{ position:"absolute", bottom:36, right:0, background:"rgba(20,20,20,0.97)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, overflow:"hidden", minWidth:80 }}>
                  {SPEEDS.map(s => (
                    <button key={s} onClick={() => changeSpeed(s)}
                      style={{ display:"block", width:"100%", padding:"8px 16px", background: speed===s ? "rgba(229,9,20,0.2)" : "none",
                        border:"none", color: speed===s ? "#e50914" : "#fff", fontFamily:"Outfit", fontWeight: speed===s ? 700 : 400, fontSize:14, cursor:"pointer", textAlign:"center" }}>
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} style={ctrlBtnStyle}>
              {fullscreen
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ctrlBtnStyle = { background:"none", border:"none", cursor:"pointer", padding:"4px 6px", display:"flex", alignItems:"center", justifyContent:"center" };
const skipBtnStyle = { background:"rgba(0,0,0,0.4)", border:"none", cursor:"pointer", borderRadius:"50%", width:52, height:52, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2 };

/* ══════════════════════════════════════════════════════════
   EPISODE NAV
══════════════════════════════════════════════════════════ */
function EpisodeNav({ content, currentSeason, currentEp, navigate, id }) {
  const season   = content.seasons?.find(s => s.seasonNumber === currentSeason);
  if (!season) return null;
  const episodes = season.episodes?.sort((a,b) => a.episodeNumber - b.episodeNumber) || [];
  const idx      = episodes.findIndex(e => e.episodeNumber === currentEp);
  const prev     = episodes[idx - 1];
  const next     = episodes[idx + 1];

  const goTo = (ep) => navigate(`/watch/${id}?season=${currentSeason}&ep=${ep.episodeNumber}`);

  return (
    <div style={{ background:"#0a0a0a", borderTop:"1px solid rgba(255,255,255,0.08)", padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"Outfit" }}>
      <button onClick={() => prev && goTo(prev)} disabled={!prev}
        style={{ background: prev ? "rgba(255,255,255,0.08)" : "transparent", color: prev ? "#fff" : "rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"8px 18px", cursor: prev ? "pointer" : "default", fontFamily:"Outfit", fontSize:14 }}>
        ← E{prev?.episodeNumber} {prev?.title}
      </button>
      <span style={{ color:"rgba(255,255,255,0.5)", fontSize:13 }}>
        S{currentSeason} · E{currentEp} of {episodes.length}
      </span>
      <button onClick={() => next && goTo(next)} disabled={!next}
        style={{ background: next ? "rgba(255,255,255,0.08)" : "transparent", color: next ? "#fff" : "rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"8px 18px", cursor: next ? "pointer" : "default", fontFamily:"Outfit", fontSize:14 }}>
        E{next?.episodeNumber} {next?.title} →
      </button>
    </div>
  );
}