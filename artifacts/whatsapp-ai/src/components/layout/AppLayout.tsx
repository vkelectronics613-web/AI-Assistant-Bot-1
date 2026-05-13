import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useGetWhatsappStatus } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { SiWhatsapp } from "react-icons/si";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: whatsappStatus } = useGetWhatsappStatus();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/50 glass-panel px-6 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-medium text-muted-foreground">
              Command Center
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {whatsappStatus?.connected ? (
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary gap-1.5 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <SiWhatsapp className="h-3 w-3" />
                Connected {whatsappStatus.phone ? `(${whatsappStatus.phone})` : ""}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive gap-1.5 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                <SiWhatsapp className="h-3 w-3" />
                Disconnected
              </Badge>
            )}
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center border border-border">
              <span className="text-xs font-medium">JD</span>
            </div>
          </div>
        </header>
        
        {/* Abstract background decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none -z-10" />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}
