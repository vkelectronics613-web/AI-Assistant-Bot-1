import { useEffect, useRef, useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { motion, useInView } from "framer-motion";

/* ── inject keyframes once ── */
const CSS_KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500&display=swap');
  :root{--wa-green:#25D366;--wa-teal:#128C7E;--wa-navy:#1A1A2E;--wa-body:#4A4A68;}
  .lp *{font-family:'DM Sans',sans-serif;}
  .lp h1,.lp h2,.lp h3,.lp h4,.lp .heading-font{font-family:'Plus Jakarta Sans',sans-serif;}
  @keyframes gradientShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
  @keyframes floatPhone{0%,100%{transform:translateY(0px)}50%{transform:translateY(-14px)}}
  @keyframes typingDot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
  @keyframes particle{0%{transform:translateY(0) scale(1);opacity:.6}100%{transform:translateY(-120px) scale(0.5);opacity:0}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes fadeSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes drawLine{from{width:0}to{width:100%}}
  @keyframes countUp{from{opacity:0}to{opacity:1}}
  .lp .shimmer-btn:hover{background:linear-gradient(90deg,#25D366,#128C7E,#25D366);background-size:200% auto;animation:shimmer 1.4s linear infinite}
  .lp .float-phone{animation:floatPhone 3s ease-in-out infinite}
  .lp .typing-dot{animation:typingDot .9s ease infinite}
  .lp .typing-dot:nth-child(2){animation-delay:.15s}
  .lp .typing-dot:nth-child(3){animation-delay:.3s}
  .lp .draw-line::after{content:'';position:absolute;top:50%;left:0;height:2px;background:linear-gradient(90deg,#25D366,#128C7E);animation:drawLine 1.2s ease forwards;animation-delay:.4s}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:#fff}
  ::-webkit-scrollbar-thumb{background:#25D366;border-radius:4px}
`;

function useTyping(phrases: string[], speed = 70, pause = 1600) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = phrases[phraseIdx];
    const delay = deleting ? speed / 2 : charIdx === current.length ? pause : speed;
    const t = setTimeout(() => {
      if (!deleting && charIdx < current.length) {
        setDisplayed(current.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      } else if (!deleting && charIdx === current.length) {
        setDeleting(true);
      } else if (deleting && charIdx > 0) {
        setDisplayed(current.slice(0, charIdx - 1));
        setCharIdx(c => c - 1);
      } else {
        setDeleting(false);
        setPhraseIdx(i => (i + 1) % phrases.length);
      }
    }, delay);
    return () => clearTimeout(t);
  });
  return displayed;
}

const CHAT_MSGS = [
  { from: "user", text: "Hi! Do you have the iPhone 15 Pro in stock?" },
  { from: "ai", text: "Yes! We have the iPhone 15 Pro in Black, White, and Natural Titanium. Would you like to place an order? 😊" },
  { from: "user", text: "What's the price?" },
  { from: "ai", text: "The iPhone 15 Pro starts at $999. We also offer 12-month installments at $83/mo with 0% interest. 🎉" },
  { from: "user", text: "Great, I'll take the Black one!" },
  { from: "ai", text: "Perfect choice! I've created your order. You'll receive a confirmation on WhatsApp shortly. Thank you! ✅" },
];

function ChatDemo() {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setVisible(0);
      for (let i = 0; i < CHAT_MSGS.length; i++) {
        if (cancelled) return;
        if (CHAT_MSGS[i].from === "ai") { setTyping(true); await delay(900); }
        if (cancelled) return;
        setTyping(false);
        setVisible(i + 1);
        await delay(1200);
      }
      await delay(2000);
      if (!cancelled) run();
    }
    run();
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="float-phone lp" style={{ width: 280, background: "#ECE5DD", borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 64px rgba(37,211,102,.18)" }}>
      <div style={{ background: "#075E54", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 14 }}>V</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Virat AI Assistant</div>
          <div style={{ color: "rgba(255,255,255,.7)", fontSize: 11 }}>Online</div>
        </div>
      </div>
      <div style={{ padding: "12px 10px", minHeight: 280, display: "flex", flexDirection: "column", gap: 6 }}>
        {CHAT_MSGS.slice(0, visible).map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}
            style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "80%", padding: "8px 12px", borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.from === "user" ? "#25D366" : "#fff",
              color: m.from === "user" ? "#fff" : "#1A1A2E",
              fontSize: 12, lineHeight: 1.5, boxShadow: "0 1px 3px rgba(0,0,0,.08)"
            }}>{m.text}</div>
          </motion.div>
        ))}
        {typing && (
          <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "#fff", borderRadius: "16px 16px 16px 4px", width: "fit-content", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
            {[0, 1, 2].map(i => <div key={i} className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#128C7E" }} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 50;
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); } else { setVal(Math.floor(start)); }
    }, 25);
    return () => clearInterval(t);
  }, [inView, target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

const FEATURES = [
  { icon: "🤖", title: "AI-Powered Replies", desc: "Smart, context-aware responses using your product catalog, FAQs, and custom tone." },
  { icon: "⚡", title: "Instant Response", desc: "Zero delays, 24/7 uptime. Never miss a customer message again." },
  { icon: "🌍", title: "Multi-Language", desc: "Automatically detects and replies in the customer's language. 50+ languages supported." },
  { icon: "📊", title: "Analytics Dashboard", desc: "Track conversations, AI resolution rates, emotion trends, and customer insights." },
  { icon: "🔗", title: "Easy Integration", desc: "Connect your WhatsApp via QR code in under 5 minutes. No Business API needed." },
  { icon: "🔒", title: "Secure & Private", desc: "End-to-end encryption. Your business data and customer chats stay protected." },
];

const STEPS = [
  { n: "01", icon: "💼", title: "Create Your Account", desc: "Sign up and set up your business profile — name, products, FAQs, working hours, and reply tone." },
  { n: "02", icon: "📱", title: "Scan the QR Code", desc: "Open WhatsApp on your phone, go to Linked Devices, and scan the QR code from your dashboard." },
  { n: "03", icon: "🚀", title: "AI Goes Live!", desc: "Your AI assistant starts replying to customers automatically. Monitor and take over anytime." },
];

const PLANS = [
  { name: "Starter", price: "Free", desc: "Perfect for small shops", features: ["1 WhatsApp number", "100 AI replies/mo", "Basic analytics", "Email support"] },
  { name: "Pro", price: "$9", desc: "For growing businesses", features: ["1 WhatsApp number", "Unlimited AI replies", "Advanced analytics", "Priority support", "Custom AI tone"], highlight: true },
  { name: "Business", price: "$29", desc: "For teams and agencies", features: ["3 WhatsApp numbers", "Unlimited AI replies", "Full analytics suite", "Dedicated support", "Custom integrations"] },
];

const TESTIMONIALS = [
  { name: "Sara M.", role: "E-commerce Owner", quote: "Virat AI handles 90% of our WhatsApp queries automatically. Our response time went from hours to seconds!", stars: 5, initials: "SM" },
  { name: "Ahmed K.", role: "Restaurant Manager", quote: "Setup took literally 3 minutes. Now my AI assistant takes orders and answers questions 24/7. Incredible.", stars: 5, initials: "AK" },
  { name: "Priya S.", role: "Boutique Owner", quote: "The smart escalation feature is brilliant — it knows when a human needs to step in. My customers love it.", stars: 5, initials: "PS" },
];

export default function Landing() {
  const { login } = useAuth();
  const typed = useTyping(["WhatsApp Assistant", "Sales Agent", "Support Bot", "24/7 Assistant"]);
  const [navShadow, setNavShadow] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = CSS_KEYFRAMES;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    const onScroll = () => setNavShadow(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  };

  return (
    <div className="lp" style={{ background: "#fff", color: "#1A1A2E", overflowX: "hidden", scrollBehavior: "smooth" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        backdropFilter: "blur(20px)", background: "rgba(255,255,255,0.85)",
        boxShadow: navShadow ? "0 4px 24px rgba(37,211,102,.10)" : "none",
        transition: "box-shadow .3s",
        borderBottom: navShadow ? "1px solid rgba(37,211,102,.12)" : "1px solid transparent",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
            <span className="heading-font" style={{ fontWeight: 800, fontSize: 18, color: "#1A1A2E" }}>Virat AI</span>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }} className="lp-nav-links">
            {[["features", "Features"], ["how-it-works", "How It Works"], ["pricing", "Pricing"]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4A4A68", fontWeight: 500, fontSize: 15, transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#25D366")} onMouseLeave={e => (e.currentTarget.style.color = "#4A4A68")}>{label}</button>
            ))}
          </div>
          <button onClick={login} className="shimmer-btn" style={{
            background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff", border: "none", borderRadius: 50,
            padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
            boxShadow: "0 4px 16px rgba(37,211,102,.3)", transition: "transform .2s,box-shadow .2s",
          }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,211,102,.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,211,102,.3)"; }}>
            Try for Free ✨
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", paddingTop: 68, display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
        {/* Animated gradient mesh background */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "linear-gradient(120deg,#f0fff4,#fff,#f0fdf4,#ecfdf5,#fff,#f0fff4)",
          backgroundSize: "400% 400%", animation: "gradientShift 10s ease infinite",
        }} />
        {/* Floating particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute", zIndex: 0, borderRadius: "50%",
            width: 4 + (i % 4) * 3, height: 4 + (i % 4) * 3,
            background: i % 2 === 0 ? "rgba(37,211,102,.35)" : "rgba(18,140,126,.25)",
            left: `${8 + i * 7.5}%`, bottom: `${10 + (i % 5) * 15}%`,
            animation: `particle ${3 + i * .4}s ease-in-out ${i * .3}s infinite alternate`,
          }} />
        ))}

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", position: "relative", zIndex: 1, width: "100%" }}>
          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .6 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 50, background: "rgba(37,211,102,.1)", border: "1px solid rgba(37,211,102,.25)", color: "#128C7E", fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
              ⭐ Trusted by 500+ businesses
            </div>
            <h1 className="heading-font" style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.1, marginBottom: 20, color: "#1A1A2E" }}>
              Your Smartest<br />
              <span style={{ background: "linear-gradient(135deg,#25D366,#128C7E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {typed}<span style={{ WebkitTextFillColor: "#25D366", animation: "typingDot .8s step-end infinite" }}>|</span>
              </span><br />
              <span style={{ fontSize: 52 }}>Powered by AI ⚡</span>
            </h1>
            <p style={{ fontSize: 18, color: "#4A4A68", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              Automate replies, answer questions, and delight your customers — 24/7 on WhatsApp. No Business API. No coding.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button onClick={login} className="shimmer-btn" style={{
                background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff", border: "none",
                borderRadius: 50, padding: "14px 32px", fontWeight: 700, fontSize: 16, cursor: "pointer",
                boxShadow: "0 6px 28px rgba(37,211,102,.35)", fontFamily: "'Plus Jakarta Sans',sans-serif",
                transition: "transform .2s",
              }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                Get Started Free 🚀
              </button>
              <button onClick={login} style={{
                background: "transparent", color: "#25D366", border: "2px solid rgba(37,211,102,.4)",
                borderRadius: 50, padding: "14px 28px", fontWeight: 700, fontSize: 16, cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all .2s",
              }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(37,211,102,.07)"; e.currentTarget.style.borderColor = "#25D366"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(37,211,102,.4)"; }}>
                ▶ Watch Demo
              </button>
            </div>
            <p style={{ marginTop: 16, fontSize: 13, color: "#4A4A68" }}>No credit card required · Setup in 5 minutes</p>
          </motion.div>

          {/* Right — Phone mockup */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .6, delay: .2 }} style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: -24, background: "radial-gradient(circle,rgba(37,211,102,.15),transparent 70%)", borderRadius: "50%", filter: "blur(20px)" }} />
              <ChatDemo />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: "linear-gradient(135deg,#25D366,#128C7E)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, textAlign: "center" }}>
          {[{ n: 500, s: "+", label: "Businesses" }, { n: 99, s: "%", label: "Uptime" }, { n: 50, s: "+", label: "Languages" }, { n: 10, s: "M+", label: "Messages Sent" }].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }}>
              <div className="heading-font" style={{ fontSize: 40, fontWeight: 800, color: "#fff" }}>
                <CountUp target={s.n} suffix={s.s} />
              </div>
              <div style={{ color: "rgba(255,255,255,.85)", fontSize: 14, fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 50, background: "rgba(37,211,102,.1)", color: "#128C7E", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>FEATURES</div>
              <h2 className="heading-font" style={{ fontSize: 42, fontWeight: 700, color: "#1A1A2E", marginBottom: 12 }}>Everything You Need</h2>
              <p style={{ fontSize: 17, color: "#4A4A68", maxWidth: 520, margin: "0 auto" }}>A complete WhatsApp AI platform built for modern businesses that want to scale support.</p>
            </motion.div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }}
                whileHover={{ y: -8 }}
                style={{
                  background: "#fff", borderRadius: 20, padding: 32, border: "1.5px solid rgba(37,211,102,.12)",
                  boxShadow: "0 4px 24px rgba(37,211,102,.05)", cursor: "default", transition: "box-shadow .2s,border-color .2s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 48px rgba(37,211,102,.18)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,211,102,.35)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(37,211,102,.05)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,211,102,.12)"; }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 className="heading-font" style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#4A4A68", lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "100px 24px", background: "#F8F9FA" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 50, background: "rgba(37,211,102,.1)", color: "#128C7E", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>HOW IT WORKS</div>
              <h2 className="heading-font" style={{ fontSize: 42, fontWeight: 700, color: "#1A1A2E", marginBottom: 12 }}>Get Started in 3 Simple Steps</h2>
              <p style={{ fontSize: 17, color: "#4A4A68" }}>No technical knowledge required. Be up and running in under 5 minutes.</p>
            </motion.div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 40, position: "relative" }}>
            <div style={{ position: "absolute", top: 36, left: "16.5%", right: "16.5%", height: 2, background: "linear-gradient(90deg,rgba(37,211,102,.4),rgba(18,140,126,.4))", borderRadius: 2 }} />
            {STEPS.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .15 }} style={{ textAlign: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 6px 24px rgba(37,211,102,.3)", position: "relative", zIndex: 1 }}>
                  <span style={{ fontSize: 28 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#25D366", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Step {s.n}</div>
                <h3 className="heading-font" style={{ fontSize: 19, fontWeight: 700, color: "#1A1A2E", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#4A4A68", lineHeight: 1.7 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHAT DEMO SECTION ── */}
      <section style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
          <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: -32, background: "radial-gradient(circle,rgba(37,211,102,.1),transparent 70%)", borderRadius: "50%" }} />
              <ChatDemo />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 50, background: "rgba(37,211,102,.1)", color: "#128C7E", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>LIVE DEMO</div>
            <h2 className="heading-font" style={{ fontSize: 42, fontWeight: 700, color: "#1A1A2E", marginBottom: 16 }}>See It In Action</h2>
            <p style={{ fontSize: 16, color: "#4A4A68", lineHeight: 1.8, marginBottom: 28 }}>
              Watch Virat AI handle a real customer conversation — from product inquiry to order confirmation — completely automatically, 24/7.
            </p>
            {["Understands context across the whole conversation", "Replies in the customer's own language", "Knows your products, pricing, and policies", "Hands over to a human when needed"].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(37,211,102,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#25D366", fontSize: 12 }}>✓</span>
                </div>
                <span style={{ fontSize: 15, color: "#4A4A68" }}>{item}</span>
              </div>
            ))}
            <button onClick={login} className="shimmer-btn" style={{
              marginTop: 20, background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff", border: "none",
              borderRadius: 50, padding: "13px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans',sans-serif", boxShadow: "0 4px 20px rgba(37,211,102,.3)", transition: "transform .2s",
            }} onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
              Try It Free →
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "100px 24px", background: "#F8F9FA" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 50, background: "rgba(37,211,102,.1)", color: "#128C7E", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>PRICING</div>
              <h2 className="heading-font" style={{ fontSize: 42, fontWeight: 700, color: "#1A1A2E", marginBottom: 12 }}>Simple, Transparent Pricing</h2>
              <p style={{ fontSize: 17, color: "#4A4A68" }}>Start free. Upgrade when you're ready to scale.</p>
            </motion.div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
            {PLANS.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}
                style={{
                  background: "#fff", borderRadius: 24, padding: 36, border: p.highlight ? "2px solid #25D366" : "1.5px solid rgba(37,211,102,.15)",
                  boxShadow: p.highlight ? "0 12px 48px rgba(37,211,102,.18)" : "0 4px 20px rgba(0,0,0,.05)",
                  position: "relative", transform: p.highlight ? "scale(1.04)" : "scale(1)",
                }}>
                {p.highlight && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff", padding: "4px 20px", borderRadius: 50, fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif", whiteSpace: "nowrap" }}>
                    Most Popular ⭐
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 600, color: "#4A4A68", marginBottom: 4 }}>{p.name}</div>
                <div className="heading-font" style={{ fontSize: 48, fontWeight: 800, color: "#1A1A2E", lineHeight: 1 }}>
                  {p.price}<span style={{ fontSize: 16, fontWeight: 400, color: "#4A4A68" }}>{p.price !== "Free" ? "/mo" : ""}</span>
                </div>
                <div style={{ fontSize: 13, color: "#4A4A68", marginTop: 4, marginBottom: 24 }}>{p.desc}</div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, marginBottom: 28 }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: j < p.features.length - 1 ? "1px solid rgba(37,211,102,.08)" : "none" }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(37,211,102,.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#25D366", fontSize: 10, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 14, color: "#4A4A68" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={login} style={{
                  width: "100%", padding: "12px 0", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all .2s",
                  background: p.highlight ? "linear-gradient(135deg,#25D366,#128C7E)" : "transparent",
                  color: p.highlight ? "#fff" : "#25D366",
                  border: p.highlight ? "none" : "2px solid rgba(37,211,102,.4)",
                  boxShadow: p.highlight ? "0 4px 20px rgba(37,211,102,.3)" : "none",
                }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                  Get Started {p.price === "Free" ? "— It's Free" : `for ${p.price}/mo`}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 50, background: "rgba(37,211,102,.1)", color: "#128C7E", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>TESTIMONIALS</div>
              <h2 className="heading-font" style={{ fontSize: 42, fontWeight: 700, color: "#1A1A2E", marginBottom: 12 }}>Loved by Businesses Worldwide</h2>
            </motion.div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}
                style={{ background: "#fff", borderRadius: 20, padding: 32, border: "1.5px solid rgba(37,211,102,.12)", boxShadow: "0 4px 24px rgba(0,0,0,.05)" }}>
                <div style={{ color: "#25D366", fontSize: 18, marginBottom: 16 }}>{"★".repeat(t.stars)}</div>
                <p style={{ fontSize: 15, color: "#4A4A68", lineHeight: 1.75, marginBottom: 24, fontStyle: "italic" }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t.initials}</div>
                  <div>
                    <div className="heading-font" style={{ fontWeight: 700, fontSize: 15, color: "#1A1A2E" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#4A4A68" }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(135deg,#25D366 0%,#128C7E 100%)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 className="heading-font" style={{ fontSize: 44, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Ready to Automate Your WhatsApp?</h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.9)", marginBottom: 36, lineHeight: 1.7 }}>Join 500+ businesses using Virat AI to respond faster and serve more customers — 24/7, automatically.</p>
          <button onClick={login} style={{
            background: "#fff", color: "#25D366", border: "none", borderRadius: 50, padding: "16px 40px",
            fontWeight: 800, fontSize: 17, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
            boxShadow: "0 8px 32px rgba(0,0,0,.15)", transition: "transform .2s",
          }} onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
            Start for Free — No Credit Card 🚀
          </button>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0D0D0D", padding: "56px 24px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40, flexWrap: "wrap", gap: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
                <span className="heading-font" style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>Virat AI</span>
              </div>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, maxWidth: 260, lineHeight: 1.7 }}>The smartest WhatsApp AI assistant for modern businesses. 24/7 support, zero effort.</p>
              <p style={{ color: "#25D366", fontSize: 13, marginTop: 12 }}>Made with ❤️ by Virat Kumar</p>
            </div>
            <div style={{ display: "flex", gap: 60, flexWrap: "wrap" }}>
              {[
                { title: "Product", links: ["Features", "How It Works", "Pricing", "Demo"] },
                { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
                { title: "Legal", links: ["Privacy Policy", "Terms of Service"] },
              ].map(col => (
                <div key={col.title}>
                  <div className="heading-font" style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{col.title}</div>
                  {col.links.map(l => (
                    <div key={l} style={{ color: "rgba(255,255,255,.45)", fontSize: 14, marginBottom: 10, cursor: "pointer", transition: "color .2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#25D366")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.45)")}>{l}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ color: "rgba(255,255,255,.35)", fontSize: 13 }}>© 2025 Virat AI Assistant. All rights reserved.</p>
            <p style={{ color: "rgba(255,255,255,.35)", fontSize: 13 }}>🔒 Your data is safe with us</p>
          </div>
        </div>
      </footer>

      {/* ── WhatsApp FAB ── */}
      <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 1000,
        width: 56, height: 56, borderRadius: "50%",
        background: "linear-gradient(135deg,#25D366,#128C7E)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
        boxShadow: "0 6px 28px rgba(37,211,102,.45)", textDecoration: "none",
        transition: "transform .2s, box-shadow .2s",
      }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.12)"; e.currentTarget.style.boxShadow = "0 8px 36px rgba(37,211,102,.6)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(37,211,102,.45)"; }}>
        💬
      </a>

    </div>
  );
}
