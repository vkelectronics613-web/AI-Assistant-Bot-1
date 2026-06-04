import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Package, 
  ShoppingCart, 
  BrainCircuit, 
  Bell, 
  BarChart3, 
  Settings, 
  CreditCard,
  Building2,
  Smartphone,
  Bot,
  BotOff,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "WhatsApp Connect", href: "/connect", icon: Smartphone },
  { name: "Live Chat", href: "/chat", icon: MessageSquare },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Products", href: "/products", icon: Package },
  { name: "Business Profile", href: "/business", icon: Building2 },
  { name: "AI Training", href: "/ai-training", icon: BrainCircuit },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: settings } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();

  const aiEnabled = settings?.globalAiEnabled ?? true;

  function toggleAI() {
    if (!settings) return;
    const next = !aiEnabled;
    updateSettings.mutate(
      { data: { globalAiEnabled: next } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getSettings"] });
          toast.success(next ? "AI replies enabled for all chats" : "AI replies paused — manual mode active", {
            icon: next ? "🤖" : "🔕",
          });
        },
        onError: () => toast.error("Failed to update AI status"),
      }
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card/50 glass-panel">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer" data-testid="link-logo">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary group-hover:scale-105 transition-transform duration-200 shadow-[0_0_15px_rgba(37,211,102,0.3)]">
            <SiWhatsapp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Nexus AI
          </span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto pt-4 pb-4">
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
              >
                <div className="flex items-center">
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </div>
                {item.name === "Live Chat" && (
                  <Badge
                    variant={aiEnabled ? "default" : "secondary"}
                    className={cn("text-[10px] px-1.5 py-0", !aiEnabled && "opacity-60")}
                  >
                    {aiEnabled ? "AI On" : "AI Off"}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* AI Master Toggle */}
      <div className="px-3 pb-2">
        <button
          onClick={toggleAI}
          disabled={updateSettings.isPending}
          className={cn(
            "w-full flex items-center justify-between rounded-lg border px-3 py-3 transition-all duration-200 cursor-pointer",
            aiEnabled
              ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
              : "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
          )}
          data-testid="button-global-ai-toggle"
        >
          <div className="flex items-center gap-2.5">
            {aiEnabled
              ? <Bot className="h-4 w-4 text-primary shrink-0" />
              : <BotOff className="h-4 w-4 text-destructive shrink-0" />
            }
            <div className="text-left">
              <p className={cn("text-xs font-semibold leading-tight", aiEnabled ? "text-primary" : "text-destructive")}>
                AI Replies
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                {aiEnabled ? "Active — click to pause" : "Paused — click to enable"}
              </p>
            </div>
          </div>
          <Switch
            checked={aiEnabled}
            disabled={updateSettings.isPending}
            className="pointer-events-none scale-90"
            aria-label="Toggle global AI"
          />
        </button>
      </div>

      <div className="p-3 pt-2 border-t border-border">
        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3">
          <div className={cn(
            "h-2 w-2 rounded-full animate-pulse shrink-0",
            aiEnabled
              ? "bg-primary shadow-[0_0_5px_rgba(37,211,102,0.8)]"
              : "bg-muted-foreground"
          )} />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">
              {aiEnabled ? "AI Systems Active" : "AI Systems Paused"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {aiEnabled ? "All services operational" : "Manual replies only"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
