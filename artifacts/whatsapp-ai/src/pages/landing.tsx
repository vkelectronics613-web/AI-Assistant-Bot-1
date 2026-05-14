import { useAuth } from "@workspace/replit-auth-web";
import { motion } from "framer-motion";
import { MessageSquare, Bot, BarChart3, Shield, Zap, Users, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: <Bot className="h-6 w-6 text-primary" />,
    title: "AI Auto-Replies",
    desc: "Instantly responds to customer messages 24/7 using your business info, product catalog, and custom tone.",
  },
  {
    icon: <MessageSquare className="h-6 w-6 text-primary" />,
    title: "Real WhatsApp Integration",
    desc: "Connect your WhatsApp account via QR code — no Business API required. Works with your existing number.",
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    title: "Live Analytics",
    desc: "Track response times, AI resolution rates, customer satisfaction, and conversation trends in real time.",
  },
  {
    icon: <Shield className="h-6 w-6 text-primary" />,
    title: "Smart Escalation",
    desc: "Detects frustrated or angry customers and automatically flags conversations for human takeover.",
  },
  {
    icon: <Zap className="h-6 w-6 text-primary" />,
    title: "Instant Setup",
    desc: "Connect in under a minute. Scan a QR code and your AI assistant starts handling messages immediately.",
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Customer Management",
    desc: "Full CRM: VIP tags, block lists, per-customer AI controls, conversation history, and emotion tracking.",
  },
];

const plans = [
  { name: "Starter", price: "Free", desc: "Perfect for small shops", features: ["1 WhatsApp number", "100 AI replies/mo", "Basic analytics", "Email support"] },
  { name: "Pro", price: "$29", desc: "For growing businesses", features: ["1 WhatsApp number", "Unlimited AI replies", "Advanced analytics", "Priority support", "Custom AI tone"], highlight: true },
  { name: "Business", price: "$99", desc: "For teams and agencies", features: ["3 WhatsApp numbers", "Unlimited AI replies", "Full analytics suite", "Dedicated support", "Custom integrations"] },
];

export default function Landing() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">Nexus AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={login}>Log in</Button>
            <Button size="sm" onClick={login} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-6">
              <Zap className="h-3 w-3" /> Now with GPT-powered replies
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
              Your WhatsApp,{" "}
              <span className="text-primary">automated</span>.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Connect your WhatsApp number and let AI handle customer replies — using your products, FAQs, and business tone. No coding. No Business API.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={login} className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base gap-2">
                Start for free <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-sm text-muted-foreground">No credit card required</p>
            </div>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur p-1 shadow-2xl shadow-primary/5">
              <div className="rounded-xl border border-border/30 bg-background/60 p-6">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Active Chats", val: "24", sub: "18 AI handled" },
                    { label: "AI Rate", val: "92%", sub: "Resolution today" },
                    { label: "Takeovers", val: "2", sub: "0.08% rate" },
                    { label: "Customers", val: "143", sub: "+12 today" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border/40 bg-secondary/20 p-3 text-left">
                      <p className="text-[10px] text-muted-foreground mb-1">{s.label}</p>
                      <p className="text-2xl font-bold text-primary">{s.val}</p>
                      <p className="text-[9px] text-muted-foreground">{s.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg border border-border/40 bg-secondary/10 p-3">
                    <p className="text-[10px] text-muted-foreground mb-2 font-medium">Recent Conversations</p>
                    {["Sara M. — 'When will my order arrive?'", "Ahmed K. — 'Do you have this in blue?'", "Priya S. — 'What's your return policy?'"].map((m, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] text-primary font-bold shrink-0">{m[0]}</div>
                        <p className="text-[10px] text-foreground/70 truncate">{m}</p>
                        <span className="ml-auto text-[9px] text-primary shrink-0">AI ✓</span>
                      </div>
                    ))}
                  </div>
                  <div className="w-32 rounded-lg border border-border/40 bg-secondary/10 p-3">
                    <p className="text-[10px] text-muted-foreground mb-2 font-medium">AI Activity</p>
                    <div className="space-y-1">
                      {[80, 65, 90, 55, 75, 88, 70].map((h, i) => (
                        <div key={i} className="flex items-end gap-0.5 h-2">
                          <div className="bg-primary/40 rounded-sm w-full" style={{ height: `${h}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow */}
            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-3xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Everything you need</h2>
            <p className="text-muted-foreground">A complete WhatsApp automation platform for modern businesses.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="rounded-xl border border-border/40 bg-card/30 p-5 hover:border-primary/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Up and running in minutes</h2>
          <p className="text-muted-foreground mb-12">No technical setup required.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create your account", desc: "Sign up and set up your business profile — name, products, FAQs, and reply tone." },
              { step: "2", title: "Scan the QR code", desc: "Open WhatsApp on your phone, go to Linked Devices, and scan the QR code in your dashboard." },
              { step: "3", title: "AI handles the rest", desc: "Your AI assistant starts replying to customers automatically. Monitor and take over anytime." },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="h-12 w-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Simple pricing</h2>
            <p className="text-muted-foreground">Start free. Scale when you're ready.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-xl border p-6 ${p.highlight ? "border-primary/50 bg-primary/5 relative" : "border-border/40 bg-card/20"}`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-3 py-1 rounded-full bg-primary text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <p className="font-semibold text-sm text-muted-foreground mb-1">{p.name}</p>
                <p className="text-4xl font-bold mb-1">{p.price}<span className="text-base font-normal text-muted-foreground">{p.price !== "Free" ? "/mo" : ""}</span></p>
                <p className="text-sm text-muted-foreground mb-5">{p.desc}</p>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={login}
                  className={`w-full ${p.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                  variant={p.highlight ? "default" : "outline"}
                >
                  Get started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to automate your WhatsApp?</h2>
          <p className="text-muted-foreground mb-8">Join businesses using Nexus AI to respond faster and serve more customers.</p>
          <Button size="lg" onClick={login} className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-10 text-base gap-2">
            Start for free <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="font-medium">Nexus AI</span>
          </div>
          <p>© 2025 Nexus AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
