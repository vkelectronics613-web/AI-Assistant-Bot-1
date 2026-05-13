import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import {
  Bell, AlertTriangle, RefreshCw, UserCheck, ShoppingCart, BrainCircuit,
  Wifi, WifiOff, CheckCheck, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: React.ReactNode; cls: string }> = {
  angry_customer: { icon: <AlertTriangle className="h-4 w-4" />, cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  refund_request: { icon: <RefreshCw className="h-4 w-4" />, cls: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  human_attention: { icon: <UserCheck className="h-4 w-4" />, cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  new_customer: { icon: <Circle className="h-4 w-4" />, cls: "bg-primary/10 text-primary border-primary/20" },
  order_received: { icon: <ShoppingCart className="h-4 w-4" />, cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  ai_disabled: { icon: <BrainCircuit className="h-4 w-4" />, cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  disconnected: { icon: <WifiOff className="h-4 w-4" />, cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  connected: { icon: <Wifi className="h-4 w-4" />, cls: "bg-green-500/10 text-green-400 border-green-500/20" },
};

const priorityLabel: Record<string, { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  high: { label: "High", cls: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  normal: { label: "Normal", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useListNotifications({}, { query: { refetchInterval: 10000, queryKey: getListNotificationsQueryKey({}) } });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  function handleMarkRead(id: number) {
    markRead.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  }

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast({ title: "All notifications marked as read" });
      },
    });
  }

  const urgent = notifications?.filter(n => n.priority === "urgent") ?? [];
  const rest = notifications?.filter(n => n.priority !== "urgent") ?? [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-destructive/80 text-destructive-foreground" data-testid="badge-unread-count">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Real-time alerts and system notifications.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} data-testid="button-mark-all-read">
            <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : !notifications?.length ? (
        <Card className="glass-panel">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm mt-1">You are all caught up.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {urgent.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-2 px-1">Urgent</p>
              <div className="space-y-2">
                {urgent.map(n => {
                  const cfg = typeConfig[n.type] ?? typeConfig.new_customer;
                  const pri = priorityLabel[n.priority] ?? priorityLabel.normal;
                  return (
                    <div
                      key={n.id}
                      className={cn("flex items-start gap-4 p-4 rounded-xl border transition-all", n.read ? "bg-background/30 border-border/40 opacity-60" : "bg-red-500/5 border-red-500/20")}
                      data-testid={`notification-${n.id}`}
                    >
                      <div className={`p-2 rounded-lg border shrink-0 ${cfg.cls}`}>{cfg.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{n.title}</p>
                          <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${pri.cls}`}>{pri.label}</Badge>
                          {!n.read && <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <Button variant="ghost" size="sm" className="shrink-0 h-7 text-xs" onClick={() => handleMarkRead(n.id)} data-testid={`button-mark-read-${n.id}`}>
                          Mark read
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            {urgent.length > 0 && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">All Notifications</p>}
            <div className="space-y-2">
              {rest.map(n => {
                const cfg = typeConfig[n.type] ?? typeConfig.new_customer;
                const pri = priorityLabel[n.priority] ?? priorityLabel.normal;
                return (
                  <div
                    key={n.id}
                    className={cn("flex items-start gap-4 p-4 rounded-xl border transition-all", n.read ? "bg-background/30 border-border/40 opacity-70" : "glass-panel border-border/60")}
                    data-testid={`notification-${n.id}`}
                  >
                    <div className={`p-2 rounded-lg border shrink-0 ${cfg.cls}`}>{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{n.title}</p>
                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${pri.cls}`}>{pri.label}</Badge>
                        {!n.read && <span className="flex h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <Button variant="ghost" size="sm" className="shrink-0 h-7 text-xs" onClick={() => handleMarkRead(n.id)} data-testid={`button-mark-read-${n.id}`}>
                        Mark read
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
