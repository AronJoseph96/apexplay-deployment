import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";

const PLANS = [
  {
    id: "basic", name: "Basic", price: 99, color: "#6366f1",
    features: ["HD streaming", "1 screen at a time", "All movies & series", "Cancel anytime"],
    badge: null
  },
  {
    id: "standard", name: "Standard", price: 199, color: "#e50914",
    features: ["Full HD streaming", "2 screens at a time", "All movies & series", "Downloads available", "Cancel anytime"],
    badge: "Most Popular"
  },
  {
    id: "premium", name: "Premium", price: 399, color: "#f59e0b",
    features: ["4K Ultra HD", "4 screens at a time", "All movies & series", "Unlimited downloads", "Priority support", "Cancel anytime"],
    badge: "Best Value"
  },
];

export default function Subscription() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [step,         setStep]         = useState("plans"); // plans | payment | success
  const [loading,      setLoading]      = useState(false);
  const [sub,          setSub]          = useState(null);

  // Card form
  const [cardName,   setCardName]   = useState("");
  const [cardNum,    setCardNum]    = useState("");
  const [cardExp,    setCardExp]    = useState("");
  const [cardCvv,    setCardCvv]    = useState("");
  const [cardError,  setCardError]  = useState("");

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/subscription/status/${user._id}`)
      .then(r => r.json())
      .then(data => setSub(data))
      .catch(() => {});
  }, [user]);

  const isActive = sub?.status === "active" && sub?.expiresAt && new Date() < new Date(sub.expiresAt);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" }) : "";

  const handlePayment = async (e) => {
    e.preventDefault();
    setCardError("");

    // Dummy validation
    if (!cardName.trim())             return setCardError("Enter cardholder name");
    if (cardNum.replace(/\s/g,"").length < 16) return setCardError("Enter valid 16-digit card number");
    if (!cardExp.match(/^\d{2}\/\d{2}$/))      return setCardError("Enter expiry as MM/YY");
    if (cardCvv.length < 3)           return setCardError("Enter valid CVV");

    setLoading(true);
    // Simulate payment delay
    await new Promise(r => setTimeout(r, 1800));

    try {
      const res  = await fetch(`${API}/subscription/subscribe`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, plan: selectedPlan })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      setSub(data.user.subscription);
      setStep("success");
    } catch (err) {
      setCardError(err.message);
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel your subscription? You'll lose access at the end of the billing period.")) return;
    const res  = await fetch(`${API}/subscription/cancel`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id })
    });
    const data = await res.json();
    setUser(data.user);
    setSub(data.user.subscription);
  };

  const plan = PLANS.find(p => p.id === selectedPlan);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-base)", paddingTop:90, fontFamily:"Outfit, sans-serif", color:"var(--text-primary)" }}>
      <div style={{ maxWidth:960, margin:"0 auto", padding:"32px 20px 80px" }}>

        {/* ── ALREADY SUBSCRIBED ── */}
        {isActive && step !== "success" ? (
          <div style={{ textAlign:"center", padding:"40px 0" }}>
            <h2 style={{ fontWeight:900, fontSize:28, marginBottom:8 }}>You're all set!</h2>
            <p style={{ color:"var(--text-muted)", fontSize:16, marginBottom:24 }}>
              You have an active <strong style={{ color:"var(--accent)" }}>{sub.plan?.charAt(0).toUpperCase()+sub.plan?.slice(1)}</strong> subscription.
            </p>
            <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:16, padding:24, maxWidth:380, margin:"0 auto 32px", textAlign:"left" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ color:"var(--text-muted)", fontSize:14 }}>Plan</span>
                <span style={{ fontWeight:700 }}>{sub.plan?.charAt(0).toUpperCase()+sub.plan?.slice(1)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ color:"var(--text-muted)", fontSize:14 }}>Status</span>
                <span style={{ color:"#4ade80", fontWeight:700 }}>● Active</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ color:"var(--text-muted)", fontSize:14 }}>Started</span>
                <span style={{ fontWeight:600, fontSize:14 }}>{formatDate(sub.startDate)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"var(--text-muted)", fontSize:14 }}>Renews on</span>
                <span style={{ fontWeight:600, fontSize:14 }}>{formatDate(sub.expiresAt)}</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <button onClick={() => navigate("/")} className="btn btn-danger"
                style={{ borderRadius:10, fontWeight:700, padding:"11px 28px" }}>
                Start Watching 
              </button>
              <button onClick={handleCancel}
                style={{ background:"none", border:"1px solid var(--border)", color:"var(--text-muted)",
                  borderRadius:10, padding:"11px 28px", fontFamily:"Outfit", fontWeight:600, cursor:"pointer", fontSize:15 }}>
                Cancel Subscription
              </button>
            </div>
          </div>

        ) : step === "success" ? (
          /* ── SUCCESS ── */
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <h2 style={{ fontWeight:900, fontSize:32, marginBottom:8 }}>Welcome to ApexPlay!</h2>
            <p style={{ color:"var(--text-muted)", fontSize:16, marginBottom:8 }}>
              Your <strong style={{ color:"var(--accent)" }}>{plan?.name}</strong> subscription is now active.
            </p>
            <p style={{ color:"var(--text-muted)", fontSize:14, marginBottom:32 }}>
              Valid until {formatDate(sub?.expiresAt)}
            </p>
            <button onClick={() => navigate("/")} className="btn btn-danger"
              style={{ borderRadius:10, fontWeight:700, padding:"13px 36px", fontSize:16 }}>
              Start Watching 
            </button>
          </div>

        ) : step === "plans" ? (
          /* ── PLANS ── */
          <>
            <div style={{ textAlign:"center", marginBottom:40 }}>
              <h1 style={{ fontWeight:900, fontSize:"clamp(28px,4vw,44px)", marginBottom:8 }}>
                Choose Your Plan
              </h1>
              <p style={{ color:"var(--text-muted)", fontSize:16 }}>
                Unlimited movies & series. Cancel anytime.
              </p>
            </div>

            <div className="sub-plans-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:20, marginBottom:36 }}>
              {PLANS.map(p => (
                <div key={p.id} onClick={() => setSelectedPlan(p.id)}
                  style={{ position:"relative", background:"var(--bg-surface)", border:`2px solid ${selectedPlan===p.id ? p.color : "var(--border)"}`,
                    borderRadius:16, padding:28, cursor:"pointer", transition:"border-color 0.2s, transform 0.15s",
                    transform: selectedPlan===p.id ? "scale(1.02)" : "scale(1)" }}>

                  {p.badge && (
                    <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
                      background:p.color, color:"#fff", borderRadius:999, padding:"3px 14px",
                      fontSize:12, fontWeight:700, whiteSpace:"nowrap" }}>
                      {p.badge}
                    </div>
                  )}

                  {selectedPlan === p.id && (
                    <div style={{ position:"absolute", top:14, right:14, width:22, height:22,
                      borderRadius:"50%", background:p.color, display:"flex", alignItems:"center",
                      justifyContent:"center", color:"#fff", fontSize:12, fontWeight:900 }}>✓</div>
                  )}

                  <h3 style={{ fontWeight:800, fontSize:22, margin:"0 0 4px" }}>{p.name}</h3>
                  <div style={{ marginBottom:20 }}>
                    <span style={{ fontSize:36, fontWeight:900, color:p.color }}>₹{p.price}</span>
                    <span style={{ color:"var(--text-muted)", fontSize:14 }}>/month</span>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {p.features.map(f => (
                      <div key={f} style={{ display:"flex", gap:8, alignItems:"center", fontSize:14 }}>
                        <span style={{ color:"#4ade80", fontWeight:700 }}>✓</span>
                        <span style={{ color:"var(--text-secondary)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign:"center" }}>
              <button onClick={() => setStep("payment")} className="btn btn-danger"
                style={{ borderRadius:10, fontWeight:700, padding:"13px 48px", fontSize:16 }}>
                Continue with {plan?.name} — ₹{plan?.price}/mo
              </button>
              <p style={{ color:"var(--text-muted)", fontSize:13, marginTop:12 }}>
                 Secure payment · No real charges
              </p>
            </div>
          </>

        ) : (
          /* ── PAYMENT ── */
          <div style={{ maxWidth:480, margin:"0 auto" }}>
            <button onClick={() => setStep("plans")}
              style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer",
                fontFamily:"Outfit", fontSize:14, marginBottom:24, display:"flex", alignItems:"center", gap:6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to plans
            </button>

            <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:16, padding:28 }}>
              {/* Order summary */}
              <div style={{ background:"var(--bg-elevated)", borderRadius:10, padding:"14px 16px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700 }}>{plan?.name} Plan</div>
                  <div style={{ fontSize:13, color:"var(--text-muted)" }}>Monthly subscription</div>
                </div>
                <div style={{ fontWeight:900, fontSize:20, color:"var(--accent)" }}>₹{plan?.price}</div>
              </div>

              <h4 style={{ fontWeight:800, marginBottom:20 }}>Payment Details</h4>

              <form onSubmit={handlePayment} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:"var(--text-muted)", display:"block", marginBottom:6 }}>Cardholder Name</label>
                  <input className="form-control" placeholder="Name on card"
                    value={cardName} onChange={e => setCardName(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:"var(--text-muted)", display:"block", marginBottom:6 }}>Card Number</label>
                  <input className="form-control" placeholder="1234 5678 9012 3456"
                    maxLength={19} value={cardNum}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g,"").slice(0,16);
                      setCardNum(v.replace(/(.{4})/g,"$1 ").trim());
                    }} />
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:12 }}>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:"var(--text-muted)", display:"block", marginBottom:6 }}>Expiry Date</label>
                    <input className="form-control" placeholder="MM/YY" maxLength={5}
                      value={cardExp} onChange={e => {
                        let v = e.target.value.replace(/\D/g,"");
                        if (v.length >= 2) v = v.slice(0,2)+"/"+v.slice(2,4);
                        setCardExp(v);
                      }} />
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:"var(--text-muted)", display:"block", marginBottom:6 }}>CVV</label>
                    <input className="form-control" placeholder="•••" maxLength={4} type="password"
                      value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,"").slice(0,4))} />
                  </div>
                </div>

                {cardError && (
                  <div style={{ background:"rgba(229,9,20,0.12)", color:"#f87171", borderRadius:10, padding:"10px 14px", fontSize:14 }}>
                    ✕ {cardError}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn btn-danger"
                  style={{ borderRadius:10, fontWeight:700, padding:"13px", fontSize:16, marginTop:4, opacity:loading?0.7:1 }}>
                  {loading ? (
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                      <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .8s linear infinite", display:"inline-block" }} />
                      Processing Payment…
                    </span>
                  ) : `Pay ₹${plan?.price}`}
                </button>

                <p style={{ textAlign:"center", color:"var(--text-muted)", fontSize:12, margin:0 }}>
                   This is a demo — no real payment is processed
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}