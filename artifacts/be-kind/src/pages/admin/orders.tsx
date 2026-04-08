import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminOrders, useUpdateOrderStatus, useAdminCheck } from "@/hooks/use-admin";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronDown, ClipboardList, Lock } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const STATUS_LABELS: Record<string, string> = {
  received: "Ricevuto", preparing: "In preparazione", ready: "Pronto",
  delivering: "In consegna", delivered: "Consegnato", cancelled: "Annullato",
};
const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-100 text-blue-800", preparing: "bg-yellow-100 text-yellow-800",
  ready: "bg-green-100 text-green-800", delivering: "bg-purple-100 text-purple-800",
  delivered: "bg-gray-100 text-gray-600", cancelled: "bg-red-100 text-red-700",
};
const ORDER_STATUSES = ["received", "preparing", "ready", "delivering", "delivered", "cancelled"];

export default function AdminOrders() {
  const token = useAuthStore((s) => s.token);
  const { data: admin } = useAdminCheck();
  const { data: orders, isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("active");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!token || !admin?.isAdmin) {
    return <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center"><Lock className="w-16 h-16 text-muted-foreground mb-4" /><h2 className="text-2xl font-serif font-bold mb-2">Accesso Riservato</h2></PageTransition>;
  }

  const filtered = orders?.filter((o: any) => {
    if (filter === "active") return !["delivered", "cancelled"].includes(o.status);
    if (filter === "completed") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  }) ?? [];

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => toast({ title: `Stato aggiornato: ${STATUS_LABELS[status]}` }),
      onError: () => toast({ title: "Errore nell'aggiornamento", variant: "destructive" }),
    });
  };

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center gap-3 mb-4 pt-2">
        <Link href="/admin"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="text-2xl font-serif font-bold">Ordini Ristorante</h1>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[["active", "Attivi"], ["completed", "Completati"], ["cancelled", "Annullati"], ["all", "Tutti"]].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${filter === key ? "bg-primary border-primary text-primary-foreground" : "bg-transparent border-border"}`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-card rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-serif font-semibold mb-2">Nessun ordine</h2>
          <p className="text-muted-foreground">Non ci sono ordini in questa sezione.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order: any) => (
            <div key={order.id} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-mono font-semibold text-sm">#{order.orderNumber}</span>
                    <Badge className={`ml-2 text-[10px] ${STATUS_COLORS[order.status] || ""}`}>{STATUS_LABELS[order.status] || order.status}</Badge>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === order.id ? "rotate-180" : ""}`} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{order.customerName || order.customerEmail}</span>
                  <span className="font-medium text-primary">€{order.total?.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                  <span>{order.type === "delivery" ? "🛵 Consegna" : "🏃 Asporto"}</span>
                  <span>·</span>
                  <span>{new Date(order.createdAt).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              {expandedId === order.id && (
                <div className="border-t border-border p-4 bg-muted/30 space-y-3">
                  {order.items?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1">Articoli:</p>
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs py-0.5">
                          <span>{item.quantity}x {item.dishName}</span>
                          <span className="text-muted-foreground">€{item.subtotal?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {order.deliveryAddress && <p className="text-xs"><span className="font-semibold">Indirizzo:</span> {order.deliveryAddress}</p>}
                  {order.notes && <p className="text-xs"><span className="font-semibold">Note:</span> {order.notes}</p>}

                  <div>
                    <p className="text-xs font-semibold mb-2">Cambia stato:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ORDER_STATUSES.filter(s => s !== order.status).map(s => (
                        <button key={s} onClick={() => handleStatusChange(order.id, s)} disabled={updateStatus.isPending}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${STATUS_COLORS[s] || "bg-muted"}`}>
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
