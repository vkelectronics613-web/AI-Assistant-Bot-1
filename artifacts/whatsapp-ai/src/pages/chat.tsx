import { useState, useRef, useEffect } from "react";
import { SiWhatsapp } from "react-icons/si";
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
  useGetWhatsappStatus,
  getGetWhatsappStatusQueryKey,
  getListConversationsQueryKey,
  getGetConversationQueryKey,
} from "@workspace/api-client-react";
import {
  MessageSquare, Search, BrainCircuit, User, AlertTriangle, Send,
  Pause, Play, UserCheck, Bot, Filter, Users, Phone, List, X, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "ai" | "human" | "urgent";
type SidebarTab = "conversations" | "contacts";

interface WaContact { phone: string; name: string | null; }

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function msgTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function cleanPhone(phone: string): string {
  return phone.replace(/@[\w.]+$/, "");
}

function Avatar({ name, size = "md" }: { name?: string | null; size?: "sm" | "md" | "lg" }) {
  const cls = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-10 w-10 text-sm" : "h-9 w-9 text-sm";
  return (
    <div className={cn("rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold shrink-0", cls)}>
      {name ? name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
    </div>
  );
}

function EmotionDot({ state }: { state: string }) {
  const col = state === "angry" ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.7)]"
    : state === "frustrated" ? "bg-amber-400"
    : "bg-emerald-400";
  return <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background", col)} />;
}

export default function Chat() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("conversations");
  const [contacts, setContacts] = useState<WaContact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const [listTitle, setListTitle] = useState("");
  const [listBody, setListBody] = useState("");
  const [listOptions, setListOptions] = useState([{ title: "", description: "" }]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: waStatus } = useGetWhatsappStatus({
    query: { refetchInterval: 10000, queryKey: getGetWhatsappStatusQueryKey() },
  });
  const isConnected = waStatus?.connected ?? false;

  useEffect(() => {
    if (!isConnected) { setSelectedId(null); setContacts([]); }
  }, [isConnected]);

  const filterParam = filter !== "all" ? { status: filter } : undefined;
  const { data: conversations, isLoading: convLoading } = useListConversations(filterParam, {
    query: { refetchInterval: 5000, queryKey: getListConversationsQueryKey(filterParam) },
  });

  const { data: detail, isLoading: detailLoading } = useGetConversation(selectedId!, {
    query: { enabled: !!selectedId, queryKey: getGetConversationQueryKey(selectedId!), refetchInterval: 3000 },
  });

  const sendMessage  = useSendMessage();
  const takeover     = useTakeoverConversation();
  const returnToAi   = useReturnConversationToAi();
  const pauseAi      = usePauseConversationAi();
  const resumeAi     = useResumeConversationAi();

  useEffect(() => {
    if (!isConnected) return;
    fetch("/api/whatsapp/contacts", { credentials: "include" })
      .then(r => r.json())
      .then((d: { connected: boolean; contacts: WaContact[] }) => { if (d.connected) setContacts(d.contacts); })
      .catch(() => {});
  }, [isConnected]);

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
      { onSuccess: () => { setMessage(""); invalidate(); }, onError: () => toast({ title: "Send failed", variant: "destructive" }) },
    );
  }

  async function handleSendList() {
    if (!selectedId || !listTitle.trim()) return;
    const opts = listOptions.filter(o => o.title.trim());
    if (!opts.length) return;
    try {
      const res = await fetch(`/api/conversations/${selectedId}/list-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: listTitle, body: listBody || "Choose an option:", options: opts }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowList(false);
      setListTitle("");
      setListBody("");
      setListOptions([{ title: "", description: "" }]);
      invalidate();
    } catch {
      toast({ title: "Failed to send list message", variant: "destructive" });
    }
  }

  const filteredConvs = (conversations ?? []).filter(c =>
    !search || c.customerPhone.includes(search) || (c.customerName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );
  const filteredContacts = contacts.filter(c =>
    !contactSearch || c.phone.includes(contactSearch) || (c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ?? false)
  );

  const filters: { label: string; value: FilterType }[] = [
    { label: "All",    value: "all" },
    { label: "AI",     value: "ai" },
    { label: "Human",  value: "human" },
    { label: "Urgent", value: "urgent" },
  ];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col max-w-[1400px] mx-auto">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Live Chat</h1>
        <p className="text-sm text-muted-foreground">Monitor and manage customer conversations in real time.</p>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">

        {/* ── Sidebar ── */}
        <div className="w-72 shrink-0 flex flex-col rounded-xl border border-border overflow-hidden bg-card">

          {/* Tab bar */}
          <div className="flex border-b border-border shrink-0">
            <button
              onClick={() => setSidebarTab("conversations")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
                sidebarTab === "conversations" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chats
              {filteredConvs.length > 0 && (
                <span className="h-4 min-w-4 px-1 bg-primary text-primary-foreground rounded-full text-[9px] font-bold flex items-center justify-center">
                  {filteredConvs.length}
                </span>
              )}
            </button>
            {isConnected && (
              <button
                onClick={() => setSidebarTab("contacts")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
                  sidebarTab === "contacts" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Users className="h-3.5 w-3.5" />
                Contacts
                {contacts.length > 0 && (
                  <span className="h-4 min-w-4 px-1 bg-secondary text-muted-foreground rounded-full text-[9px] font-bold flex items-center justify-center">
                    {contacts.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {sidebarTab === "conversations" ? (
            <>
              {/* Search + filters */}
              <div className="p-2.5 border-b border-border space-y-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations…"
                    className="pl-8 h-7 text-xs bg-secondary/30"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-1">
                  {filters.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={cn(
                        "flex-1 py-1 rounded text-[10px] font-medium transition-colors",
                        filter === f.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <ScrollArea className="flex-1">
                {!isConnected ? (
                  <div className="flex flex-col items-center justify-center gap-3 h-52 px-4 text-center">
                    <SiWhatsapp className="h-10 w-10 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground leading-relaxed">Connect WhatsApp to<br />see conversations</p>
                  </div>
                ) : convLoading ? (
                  <div className="p-3 space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                  </div>
                ) : !filteredConvs.length ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                    <Filter className="h-5 w-5 opacity-20" />
                    <p className="text-xs">No conversations</p>
                  </div>
                ) : (
                  <div>
                    {filteredConvs.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={cn(
                          "w-full text-left px-3 py-3 hover:bg-secondary/40 transition-colors border-b border-border/30 last:border-b-0",
                          selectedId === c.id && "bg-primary/10 border-l-2 border-l-primary",
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="relative shrink-0 mt-0.5">
                            <Avatar name={c.customerName} size="sm" />
                            <EmotionDot state={c.emotionState} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-semibold truncate">{c.customerName ?? c.customerPhone}</p>
                              <span className="text-[10px] text-muted-foreground shrink-0">{relativeTime(c.updatedAt)}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{c.lastMessage ?? "No messages yet"}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {c.aiHandled && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-primary bg-primary/10 rounded px-1 py-0.5">
                                  <BrainCircuit className="h-2.5 w-2.5" /> AI
                                </span>
                              )}
                              {c.humanTakeover && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-amber-400 bg-amber-400/10 rounded px-1 py-0.5">
                                  <UserCheck className="h-2.5 w-2.5" /> Human
                                </span>
                              )}
                              {c.isUrgent && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-red-400 bg-red-400/10 rounded px-1 py-0.5">
                                  <AlertTriangle className="h-2.5 w-2.5" /> Urgent
                                </span>
                              )}
                              {c.unreadCount > 0 && (
                                <span className="ml-auto h-4 min-w-4 px-1 bg-primary rounded-full text-[9px] text-primary-foreground flex items-center justify-center font-bold">
                                  {c.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            /* Contacts tab */
            <>
              <div className="p-2.5 border-b border-border shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts…"
                    className="pl-8 h-7 text-xs bg-secondary/30"
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {!filteredContacts.length ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                    <Users className="h-5 w-5 opacity-20" />
                    <p className="text-xs">{contacts.length === 0 ? "No contacts synced yet" : "No matches"}</p>
                  </div>
                ) : (
                  <div>
                    {filteredContacts.map(c => (
                      <div key={c.phone} className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/30 transition-colors border-b border-border/30 last:border-b-0">
                        <Avatar name={c.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{c.name ?? c.phone}</p>
                          <p className="text-[10px] text-muted-foreground">+{cleanPhone(c.phone)}</p>
                        </div>
                        <Phone className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 ml-auto" />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>

        {/* ── Chat Window ── */}
        <div className="flex-1 flex flex-col rounded-xl border border-border overflow-hidden bg-card min-w-0">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 opacity-30" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">No conversation selected</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Pick a chat from the sidebar to start</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 shrink-0 bg-card/80 backdrop-blur-sm">
                {detailLoading ? (
                  <Skeleton className="h-10 w-56" />
                ) : (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar name={detail?.customerName} size="lg" />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-background" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{detail?.customerName ?? detail?.customerPhone}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{detail?.customerPhone ? cleanPhone(detail.customerPhone) : ""}</span>
                        {detail?.aiHandled && (
                          <Badge className="text-[10px] h-4 px-1.5 bg-primary/15 text-primary border-primary/20 hover:bg-primary/15">
                            <Bot className="h-2.5 w-2.5 mr-0.5" />AI Active
                          </Badge>
                        )}
                        {detail?.humanTakeover && (
                          <Badge className="text-[10px] h-4 px-1.5 bg-amber-400/10 text-amber-400 border-amber-400/20 hover:bg-amber-400/10">
                            <UserCheck className="h-2.5 w-2.5 mr-0.5" />Human
                          </Badge>
                        )}
                        {detail?.isUrgent && (
                          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Urgent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  {detail?.aiPaused ? (
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                      onClick={() => resumeAi.mutate({ id: selectedId }, { onSuccess: invalidate })}>
                      <Play className="h-3.5 w-3.5 text-primary" /> Resume AI
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                      onClick={() => pauseAi.mutate({ id: selectedId }, { onSuccess: invalidate })}>
                      <Pause className="h-3.5 w-3.5" /> Pause AI
                    </Button>
                  )}
                  {detail?.humanTakeover ? (
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                      onClick={() => returnToAi.mutate({ id: selectedId }, { onSuccess: invalidate })}>
                      <Bot className="h-3.5 w-3.5" /> Return to AI
                    </Button>
                  ) : (
                    <Button size="sm" className="h-8 text-xs gap-1.5"
                      onClick={() => takeover.mutate({ id: selectedId }, { onSuccess: invalidate })}>
                      <UserCheck className="h-3.5 w-3.5" /> Take Over
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-4">
                {detailLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                        <Skeleton className={cn("h-12 rounded-2xl", i % 2 === 0 ? "w-48" : "w-56")} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail?.messages?.map((msg) => {
                      const isOwn = msg.senderType !== "customer";
                      return (
                        <div key={msg.id} className={cn("flex items-end gap-2", isOwn ? "justify-end" : "justify-start")}>
                          {!isOwn && (
                            <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mb-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}

                          <div className={cn("max-w-[65%] flex flex-col", isOwn ? "items-end" : "items-start")}>
                            <div className={cn(
                              "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-secondary/70 text-foreground border border-border/40 rounded-bl-sm",
                            )}>
                              {msg.content}
                            </div>
                            <div className={cn("flex items-center gap-1 mt-0.5 px-1", isOwn ? "flex-row-reverse" : "flex-row")}>
                              <span className="text-[10px] text-muted-foreground">{msgTime(msg.createdAt)}</span>
                              {isOwn && msg.senderType === "ai" && (
                                <span className="text-[9px] text-primary/60 font-medium">AI</span>
                              )}
                            </div>
                          </div>

                          {isOwn && (
                            <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mb-1">
                              {msg.senderType === "ai"
                                ? <BrainCircuit className="h-3 w-3 text-primary" />
                                : <UserCheck className="h-3 w-3 text-primary" />
                              }
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input bar */}
              <div className="px-4 py-3 border-t border-border shrink-0 bg-card/80 space-y-2">
                {/* List message composer panel */}
                {showList && (
                  <div className="rounded-lg border border-primary/30 bg-secondary/40 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-primary flex items-center gap-1.5"><List className="h-3.5 w-3.5" />Quick Reply List</p>
                      <button onClick={() => setShowList(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      placeholder="Title (e.g. How can I help you?)"
                      className="h-7 text-xs"
                      value={listTitle}
                      onChange={e => setListTitle(e.target.value)}
                    />
                    <Input
                      placeholder="Body text (optional)"
                      className="h-7 text-xs"
                      value={listBody}
                      onChange={e => setListBody(e.target.value)}
                    />
                    <div className="space-y-1.5">
                      {listOptions.map((opt, i) => (
                        <div key={i} className="flex gap-1.5 items-center">
                          <Input
                            placeholder={`Option ${i + 1}`}
                            className="h-7 text-xs flex-1"
                            value={opt.title}
                            onChange={e => {
                              const next = [...listOptions];
                              next[i] = { ...next[i], title: e.target.value };
                              setListOptions(next);
                            }}
                          />
                          <Input
                            placeholder="Detail (optional)"
                            className="h-7 text-xs flex-1"
                            value={opt.description}
                            onChange={e => {
                              const next = [...listOptions];
                              next[i] = { ...next[i], description: e.target.value };
                              setListOptions(next);
                            }}
                          />
                          {listOptions.length > 1 && (
                            <button
                              className="text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => setListOptions(listOptions.filter((_, j) => j !== i))}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {listOptions.length < 5 && (
                        <button
                          className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-1"
                          onClick={() => setListOptions([...listOptions, { title: "", description: "" }])}
                        >
                          <Plus className="h-3 w-3" /> Add option
                        </button>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowList(false)}>Cancel</Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleSendList}
                        disabled={!listTitle.trim() || listOptions.every(o => !o.title.trim())}
                      >
                        Send List
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    title="Send interactive list"
                    onClick={() => setShowList(!showList)}
                    className={cn(
                      "h-9 w-9 rounded-md flex items-center justify-center shrink-0 border transition-colors",
                      showList
                        ? "border-primary text-primary bg-primary/10"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <Input
                    ref={inputRef}
                    placeholder="Type a message…"
                    className="flex-1 h-9 text-sm"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                  <Button
                    size="sm"
                    className="h-9 w-9 shrink-0 p-0"
                    onClick={handleSend}
                    disabled={!message.trim() || sendMessage.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
