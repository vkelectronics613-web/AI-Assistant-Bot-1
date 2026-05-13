import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListConversations,
  useGetConversation,
  useSendMessage,
  useTakeoverConversation,
  useReturnConversationToAi,
  usePauseConversationAi,
  useResumeConversationAi,
  getListConversationsQueryKey,
  getGetConversationQueryKey,
} from "@workspace/api-client-react";
import {
  MessageSquare, Search, BrainCircuit, User, AlertTriangle, Send,
  Pause, Play, UserCheck, Bot, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "ai" | "human" | "urgent" | "unread";

function EmotionBadge({ state }: { state: string }) {
  if (state === "angry") return <span className="flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />;
  if (state === "frustrated") return <span className="flex h-2 w-2 rounded-full bg-yellow-400" />;
  return <span className="flex h-2 w-2 rounded-full bg-primary/60" />;
}

export default function Chat() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: convLoading } = useListConversations(
    filter !== "all" ? { status: filter } : {},
    { query: { refetchInterval: 5000, queryKey: getListConversationsQueryKey(filter !== "all" ? { status: filter } : {}) } }
  );

  const { data: detail, isLoading: detailLoading } = useGetConversation(selectedId!, {
    query: { enabled: !!selectedId, queryKey: getGetConversationQueryKey(selectedId!), refetchInterval: 3000 },
  });

  const sendMessage = useSendMessage();
  const takeover = useTakeoverConversation();
  const returnToAi = useReturnConversationToAi();
  const pauseAi = usePauseConversationAi();
  const resumeAi = useResumeConversationAi();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    if (selectedId) queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(selectedId) });
  }

  function handleSend() {
    if (!message.trim() || !selectedId) return;
    sendMessage.mutate(
      { id: selectedId, data: { content: message } },
      {
        onSuccess: () => { setMessage(""); invalidate(); },
        onError: () => toast({ title: "Send failed", variant: "destructive" }),
      }
    );
  }

  const filteredConvs = (conversations ?? []).filter(c =>
    !search || c.customerPhone.includes(search) || (c.customerName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const filters: { label: string; value: FilterType; icon: React.ReactNode }[] = [
    { label: "All", value: "all", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { label: "AI", value: "ai", icon: <Bot className="h-3.5 w-3.5" /> },
    { label: "Human", value: "human", icon: <User className="h-3.5 w-3.5" /> },
    { label: "Urgent", value: "urgent", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Live Chat</h1>
        <p className="text-muted-foreground">Monitor and manage customer conversations in real time.</p>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Sidebar */}
        <Card className="glass-panel w-80 shrink-0 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                className="pl-8 h-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-chats"
              />
            </div>
            <div className="flex gap-1">
              {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors",
                    filter === f.value ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                  data-testid={`filter-${f.value}`}
                >
                  {f.icon}{f.label}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            {convLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : !filteredConvs.length ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-xs">
                <Filter className="h-6 w-6 mb-2 opacity-20" />
                No conversations
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredConvs.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "w-full text-left p-3 hover:bg-secondary/30 transition-colors",
                      selectedId === c.id && "bg-primary/10 border-r-2 border-primary"
                    )}
                    data-testid={`chat-item-${c.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative shrink-0">
                          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold">
                            {c.customerName?.charAt(0) ?? "?"}
                          </div>
                          <EmotionBadge state={c.emotionState} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{c.customerName ?? c.customerPhone}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{c.lastMessage ?? "No messages"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {c.isUrgent && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                        {c.unreadCount > 0 && (
                          <span className="h-4 w-4 bg-primary rounded-full text-[9px] text-primary-foreground flex items-center justify-center font-bold">
                            {c.unreadCount}
                          </span>
                        )}
                        {c.aiHandled ? (
                          <BrainCircuit className="h-3 w-3 text-primary/50" />
                        ) : (
                          <User className="h-3 w-3 text-yellow-400/70" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat Window */}
        <Card className="glass-panel flex-1 flex flex-col overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose a chat from the sidebar to view messages.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                {detailLoading ? <Skeleton className="h-8 w-48" /> : (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold">
                      {detail?.customerName?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{detail?.customerName ?? detail?.customerPhone}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{detail?.customerPhone}</p>
                        {detail?.aiHandled && <Badge variant="outline" className="text-[10px] h-4 bg-primary/10 text-primary border-primary/20"><Bot className="h-2.5 w-2.5 mr-0.5" />AI Active</Badge>}
                        {detail?.humanTakeover && <Badge variant="outline" className="text-[10px] h-4 bg-yellow-500/10 text-yellow-400 border-yellow-500/20"><UserCheck className="h-2.5 w-2.5 mr-0.5" />Human</Badge>}
                        {detail?.isUrgent && <Badge variant="destructive" className="text-[10px] h-4"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Urgent</Badge>}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  {detail?.aiPaused ? (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { resumeAi.mutate({ id: selectedId }, { onSuccess: invalidate }); }} data-testid="button-resume-ai">
                      <Play className="h-3 w-3 mr-1" /> Resume AI
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { pauseAi.mutate({ id: selectedId }, { onSuccess: invalidate }); }} data-testid="button-pause-ai">
                      <Pause className="h-3 w-3 mr-1" /> Pause AI
                    </Button>
                  )}
                  {detail?.humanTakeover ? (
                    <Button size="sm" variant="outline" className="text-xs h-7 text-primary border-primary/30" onClick={() => { returnToAi.mutate({ id: selectedId }, { onSuccess: invalidate }); }} data-testid="button-return-ai">
                      <Bot className="h-3 w-3 mr-1" /> Return to AI
                    </Button>
                  ) : (
                    <Button size="sm" className="text-xs h-7" onClick={() => { takeover.mutate({ id: selectedId }, { onSuccess: invalidate }); }} data-testid="button-takeover">
                      <UserCheck className="h-3 w-3 mr-1" /> Takeover
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {detailLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-3/4" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detail?.messages?.map((msg) => {
                      const isOwn = msg.senderType !== "customer";
                      return (
                        <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")} data-testid={`message-${msg.id}`}>
                          <div className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                            isOwn
                              ? msg.isAiGenerated
                                ? "bg-primary/20 text-primary-foreground border border-primary/30"
                                : "bg-primary text-primary-foreground"
                              : "bg-secondary/60 text-foreground border border-border/50"
                          )}>
                            {msg.isAiGenerated && (
                              <div className="flex items-center gap-1 mb-1 text-[10px] opacity-70">
                                <BrainCircuit className="h-3 w-3" /> AI Generated
                              </div>
                            )}
                            <p>{msg.content}</p>
                            <p className={cn("text-[10px] mt-1", isOwn ? "text-primary-foreground/60 text-right" : "text-muted-foreground")}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    data-testid="input-message"
                  />
                  <Button onClick={handleSend} disabled={!message.trim() || sendMessage.isPending} data-testid="button-send">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
