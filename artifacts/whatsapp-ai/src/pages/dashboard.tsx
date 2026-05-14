import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAnalyticsSummary, useGetWhatsappStatus, useListConversations, useListNotifications, getGetWhatsappStatusQueryKey, getListConversationsQueryKey, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { SiWhatsapp } from "react-icons/si";
import { MessageSquare, Users, BrainCircuit, AlertTriangle, ArrowRight, Activity, Clock, HeartHandshake } from "lucide-react";

export default function Dashboard() {
  const { data: status, isLoading: statusLoading } = useGetWhatsappStatus({ query: { refetchInterval: 10000, queryKey: getGetWhatsappStatusQueryKey() } });
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalyticsSummary();
  const { data: conversations, isLoading: conversationsLoading } = useListConversations(undefined, { query: { refetchInterval: 5000, queryKey: getListConversationsQueryKey() } });
  const { data: notifications, isLoading: notificationsLoading } = useListNotifications({ unreadOnly: true }, { query: { refetchInterval: 10000, queryKey: getListNotificationsQueryKey({ unreadOnly: true }) } });

  const activeConversations = conversations?.filter(c => c.status === "active") || [];
  const urgentConversations = conversations?.filter(c => c.isUrgent) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Monitor your WhatsApp automation and customer interactions.</p>
      </div>

      {!statusLoading && (
        <Card className={`border-l-4 ${status?.connected ? 'border-l-primary' : 'border-l-destructive'} glass-panel`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${status?.connected ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                <SiWhatsapp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">{status?.connected ? "WhatsApp Connected" : "WhatsApp Disconnected"}</h3>
                <p className="text-sm text-muted-foreground">
                  {status?.connected 
                    ? `Active session on ${status.phone || 'your device'}` 
                    : "Connect your device to enable AI assistant"}
                </p>
              </div>
            </div>
            {!status?.connected && (
              <Link href="/connect" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" data-testid="link-connect">
                Connect Now
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{analytics?.activeChats || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-primary font-medium">{analytics?.aiHandledChats || 0}</span> handled by AI
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Automation</CardTitle>
            <BrainCircuit className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{analytics?.aiHandledPercent || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Resolution rate today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel border-warning/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Human Takeovers</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold text-yellow-500">{analytics?.humanTakeoverChats || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-yellow-500/80 font-medium">{analytics?.escalationRate || 0}%</span> escalation rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analyticsLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{analytics?.totalCustomers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-primary font-medium">+{analytics?.newCustomersToday || 0}</span> new today
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 glass-panel flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Urgent & Active Chats</CardTitle>
              <CardDescription>Conversations requiring attention</CardDescription>
            </div>
            <Link href="/chat" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {conversationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {urgentConversations.length === 0 && activeConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p>No active conversations</p>
                  </div>
                ) : (
                  [...urgentConversations, ...activeConversations].slice(0, 5).map(chat => (
                    <div key={chat.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-medium text-primary">
                            {chat.customerName?.charAt(0) || '?'}
                          </div>
                          {chat.isUrgent && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2 text-sm">
                            {chat.customerName || chat.customerPhone}
                            {chat.emotionState === 'angry' && <Badge variant="destructive" className="text-[10px] h-4 px-1">Angry</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{chat.lastMessage || 'No messages'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {chat.aiHandled ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">AI Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px]">Human</Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">{new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 glass-panel flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>System and customer notifications</CardDescription>
            </div>
            <Link href="/notifications" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {notificationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {!notifications?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p>All caught up!</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map(notif => (
                    <div key={notif.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-background/50">
                      <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${notif.priority === 'high' ? 'bg-destructive/20 text-destructive' : notif.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-primary/20 text-primary'}`}>
                        {notif.priority === 'high' ? <AlertTriangle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
