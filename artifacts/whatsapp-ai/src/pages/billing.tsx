import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, Building2, Sparkles, CreditCard, Calendar } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Get started with basic WhatsApp automation.",
    features: ["100 AI responses/month", "1 WhatsApp number", "Basic FAQ training", "Email support"],
    current: false,
    cta: "Current Plan",
    icon: <Zap className="h-5 w-5" />,
    cls: "border-border",
    badgeCls: "",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing businesses with active customer engagement.",
    features: ["5,000 AI responses/month", "3 WhatsApp numbers", "Advanced AI training", "Emotion detection", "Order tracking", "Priority support"],
    current: true,
    cta: "Current Plan",
    icon: <Sparkles className="h-5 w-5" />,
    cls: "border-primary/50 shadow-[0_0_20px_rgba(37,211,102,0.1)]",
    badgeCls: "bg-primary/10 text-primary border-primary/20",
  },
  {
    name: "Business",
    price: "$99",
    period: "/month",
    description: "Enterprise-grade automation for high-volume operations.",
    features: ["Unlimited AI responses", "10 WhatsApp numbers", "Custom AI model training", "Advanced analytics", "API access", "Dedicated support", "SLA guarantee"],
    current: false,
    cta: "Upgrade",
    icon: <Building2 className="h-5 w-5" />,
    cls: "border-border",
    badgeCls: "",
  },
];

const paymentHistory = [
  { id: "INV-2026-05", date: "May 1, 2026", amount: "$29.00", status: "Paid", period: "May 2026" },
  { id: "INV-2026-04", date: "Apr 1, 2026", amount: "$29.00", status: "Paid", period: "Apr 2026" },
  { id: "INV-2026-03", date: "Mar 1, 2026", amount: "$29.00", status: "Paid", period: "Mar 2026" },
  { id: "INV-2026-02", date: "Feb 1, 2026", amount: "$29.00", status: "Paid", period: "Feb 2026" },
];

export default function Billing() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and usage.</p>
      </div>

      {/* Current Usage */}
      <Card className="glass-panel border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Pro Plan</CardTitle>
              <CardDescription>Your current billing period: May 1 — May 31, 2026</CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">AI Responses</span>
              <span className="font-medium">1,247 / 5,000</span>
            </div>
            <Progress value={24.9} className="h-2" />
            <p className="text-xs text-muted-foreground">3,753 remaining this month</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">WhatsApp Numbers</span>
              <span className="font-medium">1 / 3</span>
            </div>
            <Progress value={33} className="h-2" />
            <p className="text-xs text-muted-foreground">2 slots available</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Storage</span>
              <span className="font-medium">234 MB / 5 GB</span>
            </div>
            <Progress value={4.7} className="h-2" />
            <p className="text-xs text-muted-foreground">4.8 GB remaining</p>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Plans</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map(plan => (
            <Card key={plan.name} className={`glass-panel relative flex flex-col ${plan.cls}`} data-testid={`plan-${plan.name.toLowerCase()}`}>
              {plan.current && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge variant="outline" className="bg-primary text-primary-foreground border-primary text-xs px-3">Current Plan</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${plan.current ? "bg-primary/20 text-primary" : "bg-secondary/80 text-muted-foreground"}`}>
                  {plan.icon}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 shrink-0 ${plan.current ? "text-primary" : "text-muted-foreground"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-6 ${plan.current ? "" : plan.name === "Business" ? "bg-foreground text-background hover:bg-foreground/90" : "variant-outline"}`}
                  variant={plan.current ? "outline" : plan.name === "Free" ? "outline" : "default"}
                  disabled={plan.current}
                  data-testid={`button-plan-${plan.name.toLowerCase()}`}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <Card className="glass-panel">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-5 w-5 text-primary" /> Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {paymentHistory.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-3" data-testid={`invoice-${inv.id}`}>
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{inv.id}</p>
                    <p className="text-xs text-muted-foreground">{inv.period} — {inv.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{inv.amount}</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">{inv.status}</Badge>
                  <Button variant="ghost" size="sm" className="text-xs h-7" data-testid={`button-download-${inv.id}`}>
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
