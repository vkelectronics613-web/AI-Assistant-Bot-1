import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCustomers,
  useUpdateCustomer,
  getListCustomersQueryKey,
  getGetCustomerQueryKey,
} from "@workspace/api-client-react";
import { Users, Search, Star, Ban, BrainCircuit, AlertTriangle, Phone } from "lucide-react";

function EmotionBadge({ state }: { state: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    neutral: { label: "Neutral", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    happy: { label: "Happy", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
    frustrated: { label: "Frustrated", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    angry: { label: "Angry", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const info = map[state] ?? map.neutral;
  return <Badge variant="outline" className={`text-[10px] ${info.cls}`}>{info.label}</Badge>;
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateCustomer = useUpdateCustomer();

  const { data: customers, isLoading } = useListCustomers(
    search ? { search } : {},
    { query: { queryKey: getListCustomersQueryKey(search ? { search } : {}) } }
  );

  const selectedCustomer = customers?.find(c => c.id === selectedId) ?? null;

  function toggle(id: number, field: "isVip" | "isBlocked" | "aiEnabled", current: boolean) {
    updateCustomer.mutate(
      { id, data: { [field]: !current } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
          toast({ title: "Customer updated" });
        },
        onError: () => toast({ title: "Error", variant: "destructive" }),
      }
    );
  }

  function saveNotes() {
    if (!selectedId) return;
    updateCustomer.mutate(
      { id: selectedId, data: { notes } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          toast({ title: "Notes saved" });
          setSelectedId(null);
        },
        onError: () => toast({ title: "Error", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">Manage customer settings, VIP status, and AI preferences.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by phone or name..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-customers"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !customers?.length ? (
        <Card className="glass-panel">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No customers yet</p>
            <p className="text-sm mt-1">Customers will appear when they message your WhatsApp.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-panel">
          <div className="divide-y divide-border">
            {customers.map(customer => (
              <div key={customer.id} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors" data-testid={`row-customer-${customer.id}`}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold">
                      {customer.name?.charAt(0) ?? customer.phone.charAt(1)}
                    </div>
                    {customer.emotionState === "angry" && (
                      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-2 w-2 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{customer.name ?? "Unknown"}</p>
                      {customer.isVip && <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px] h-4 px-1"><Star className="h-2.5 w-2.5 mr-0.5" />VIP</Badge>}
                      {customer.isBlocked && <Badge variant="destructive" className="text-[10px] h-4 px-1"><Ban className="h-2.5 w-2.5 mr-0.5" />Blocked</Badge>}
                      <EmotionBadge state={customer.emotionState} />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BrainCircuit className="h-3.5 w-3.5" />
                    <span>AI</span>
                    <Switch
                      checked={customer.aiEnabled}
                      onCheckedChange={() => toggle(customer.id, "aiEnabled", customer.aiEnabled)}
                      data-testid={`switch-ai-${customer.id}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5" />
                    <span>VIP</span>
                    <Switch
                      checked={customer.isVip}
                      onCheckedChange={() => toggle(customer.id, "isVip", customer.isVip)}
                      data-testid={`switch-vip-${customer.id}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Ban className="h-3.5 w-3.5" />
                    <span>Block</span>
                    <Switch
                      checked={customer.isBlocked}
                      onCheckedChange={() => toggle(customer.id, "isBlocked", customer.isBlocked)}
                      data-testid={`switch-blocked-${customer.id}`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedId(customer.id); setNotes(customer.notes ?? ""); }}
                    data-testid={`button-notes-${customer.id}`}
                  >
                    Notes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Dialog open={!!selectedId} onOpenChange={(v) => { if (!v) setSelectedId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Notes — {selectedCustomer?.name ?? selectedCustomer?.phone}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Internal notes (not visible to customer)</Label>
              <Textarea
                className="mt-2"
                rows={5}
                placeholder="Add notes about this customer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="textarea-customer-notes"
              />
            </div>
            <Button className="w-full" onClick={saveNotes} disabled={updateCustomer.isPending} data-testid="button-save-notes">
              Save Notes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
