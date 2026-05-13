import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useGetAnalyticsSummary,
  useGetDailyAnalytics,
  useGetTopQuestions,
} from "@workspace/api-client-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp, Users, MessageSquare, Zap, Star, Clock } from "lucide-react";

function StatCard({ title, value, sub, icon, cls = "" }: { title: string; value: string | number; sub?: string; icon: React.ReactNode; cls?: string }) {
  return (
    <Card className="glass-panel">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${cls || "bg-primary/10 text-primary"}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = {
  ai: "hsl(142, 71%, 45%)",
  human: "hsl(48, 96%, 53%)",
  escalations: "hsl(0, 84%, 60%)",
  total: "hsl(217, 91%, 60%)",
};

export default function Analytics() {
  const { data: summary, isLoading: sumLoading } = useGetAnalyticsSummary();
  const { data: daily, isLoading: dailyLoading } = useGetDailyAnalytics();
  const { data: topQ, isLoading: topQLoading } = useGetTopQuestions();

  const pieData = summary ? [
    { name: "AI Handled", value: summary.aiHandledChats, color: CHART_COLORS.ai },
    { name: "Human Handled", value: summary.humanTakeoverChats, color: CHART_COLORS.human },
  ] : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Track performance and customer interaction patterns.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sumLoading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />) : (
          <>
            <StatCard
              title="Total Customers"
              value={summary?.totalCustomers ?? 0}
              sub={`+${summary?.newCustomersToday ?? 0} today`}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              title="AI Resolution Rate"
              value={`${summary ? Math.round(summary.aiHandledPercent * 100) : 0}%`}
              sub={`${summary?.aiHandledChats ?? 0} chats automated`}
              icon={<Zap className="h-4 w-4" />}
              cls="bg-green-500/10 text-green-400"
            />
            <StatCard
              title="Escalation Rate"
              value={`${summary ? Math.round(summary.escalationRate * 100) : 0}%`}
              sub={`${summary?.humanTakeoverChats ?? 0} human takeovers`}
              icon={<TrendingUp className="h-4 w-4" />}
              cls="bg-yellow-500/10 text-yellow-400"
            />
            <StatCard
              title="Satisfaction Score"
              value={`${summary?.satisfactionScore ?? 0}/5`}
              sub={`Avg response ${summary?.avgResponseTime ?? 0}s`}
              icon={<Star className="h-4 w-4" />}
              cls="bg-blue-500/10 text-blue-400"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Daily Chart */}
        <Card className="glass-panel lg:col-span-3">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Daily Conversations</CardTitle>
            <CardDescription>Last 14 days — AI vs human interactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyLoading ? <Skeleton className="h-56 w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={daily ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.ai} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.ai} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="humanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.human} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.human} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area type="monotone" dataKey="aiHandled" stroke={CHART_COLORS.ai} fill="url(#aiGrad)" name="AI Handled" strokeWidth={2} />
                  <Area type="monotone" dataKey="humanHandled" stroke={CHART_COLORS.human} fill="url(#humanGrad)" name="Human Handled" strokeWidth={2} />
                  <Area type="monotone" dataKey="escalations" stroke={CHART_COLORS.escalations} fill="none" name="Escalations" strokeWidth={1.5} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="glass-panel lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Chat Breakdown</CardTitle>
            <CardDescription>AI vs human distribution.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {sumLoading ? <Skeleton className="h-44 w-44 rounded-full" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="grid grid-cols-2 gap-4 mt-2 w-full">
              {sumLoading ? [...Array(2)].map((_, i) => <Skeleton key={i} className="h-10" />) : (
                <>
                  <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-lg font-bold text-green-400">{summary?.aiHandledChats ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">AI Handled</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-lg font-bold text-yellow-400">{summary?.humanTakeoverChats ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Human Handled</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Questions */}
      <Card className="glass-panel">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Most Asked Questions</CardTitle>
          <CardDescription>Common customer inquiries detected by AI.</CardDescription>
        </CardHeader>
        <CardContent>
          {topQLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <div className="space-y-2">
              {topQ?.map((q, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border border-border/40 hover:bg-secondary/20 transition-colors" data-testid={`top-question-${idx}`}>
                  <span className="text-xl font-bold text-primary/30 w-6 text-right shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{q.question}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{q.category}</Badge>
                    <span className="text-sm font-semibold text-primary">{q.count}x</span>
                    <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(q.count / (topQ[0]?.count ?? 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
