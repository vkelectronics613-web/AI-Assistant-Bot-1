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
  Smartphone
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "WhatsApp Connect", href: "/connect", icon: Smartphone },
  { name: "Live Chat", href: "/chat", icon: MessageSquare, badge: "AI Active" },
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
                {item.badge && (
                  <Badge variant={isActive ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3">
          <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_5px_rgba(37,211,102,0.8)] animate-pulse"></div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">AI Systems Active</span>
            <span className="text-[10px] text-muted-foreground">All services operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
