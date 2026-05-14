import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOrders,
  useUpdateOrder,
  getListOrdersQueryKey,
  type ListOrdersStatus,
} from "@workspace/api-client-react";
import { ShoppingCart, Phone, Package, CheckCircle, Truck, Clock, XCircle, AlertCircle } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

const statusConfig: Record<OrderStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: <Clock className="h-3 w-3" /> },
  confirmed: { label: "Confirmed", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: <CheckCircle className="h-3 w-3" /> },
  processing: { label: "Processing", cls: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: <AlertCircle className="h-3 w-3" /> },
  shipped: { label: "Shipped", cls: "bg-primary/10 text-primary border-primary/20", icon: <Truck className="h-3 w-3" /> },
  delivered: { label: "Delivered", cls: "bg-green-500/10 text-green-400 border-green-500/20", icon: <CheckCircle className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: <XCircle className="h-3 w-3" /> },
};

const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function Orders() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateOrder = useUpdateOrder();
  const { format: formatPrice } = useCurrency();

  const statusParam = filterStatus !== "all" ? { status: filterStatus as ListOrdersStatus } : undefined;
  const { data: orders, isLoading } = useListOrders(
    statusParam,
    { query: { queryKey: getListOrdersQueryKey(statusParam) } }
  );

  function changeStatus(id: number, status: OrderStatus) {
    updateOrder.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Order status updated" });
        },
        onError: () => toast({ title: "Error", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Track and update customer order statuses.</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40" data-testid="select-filter-status">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {ALL_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {ALL_STATUSES.map(s => {
          const count = orders?.filter(o => o.status === s).length ?? 0;
          const cfg = statusConfig[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              className={`rounded-lg border p-3 text-left transition-all ${filterStatus === s ? `${cfg.cls} border-opacity-50` : "border-border bg-card/50 hover:bg-secondary/30"}`}
              data-testid={`status-pill-${s}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {cfg.icon}
                <span className="text-[11px] font-medium">{cfg.label}</span>
              </div>
              <span className="text-xl font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : !orders?.length ? (
        <Card className="glass-panel">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-panel">
          <div className="divide-y divide-border">
            {orders.map(order => {
              const cfg = statusConfig[order.status as OrderStatus] ?? statusConfig.pending;
              return (
                <div key={order.id} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors" data-testid={`row-order-${order.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">Order #{order.id}</p>
                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 flex items-center gap-0.5 ${cfg.cls}`}>
                          {cfg.icon}{cfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{order.customerPhone ?? "Unknown"}</p>
                        {order.productName && <p className="text-xs text-muted-foreground">{order.productName} × {order.quantity}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-lg font-bold text-primary">{formatPrice(order.totalPrice)}</span>
                    <Select
                      value={order.status}
                      onValueChange={(v) => changeStatus(order.id, v as OrderStatus)}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs" data-testid={`select-status-${order.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map(s => (
                          <SelectItem key={s} value={s} className="text-xs">{statusConfig[s].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground hidden lg:block">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
