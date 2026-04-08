import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useGetOrder } from "@workspace/api-client-react";
import { ArrowLeft, CheckCircle2, Clock, MapPin, Package, Timer } from "lucide-react";
import { Link, useParams } from "wouter";

const STATUS_LABELS: Record<string, string> = {
  received: "Ricevuto",
  preparing: "In preparazione",
  ready: "Pronto",
  delivering: "In consegna",
  delivered: "Consegnato",
};

const TYPE_LABELS: Record<string, string> = {
  delivery: "Consegna",
  takeaway: "Asporto",
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useGetOrder(Number(id), { query: { enabled: !!id } });

  if (isLoading || !order) {
    return (
      <PageTransition className="min-h-screen bg-background flex flex-col p-4">
        <div className="h-12 w-32 bg-muted animate-pulse mb-6 rounded-xl"></div>
        <div className="h-64 bg-card animate-pulse rounded-2xl mb-4"></div>
      </PageTransition>
    );
  }

  const statuses = ["received", "preparing", "ready", "delivering", "delivered"];
  const currentStatusIndex = statuses.indexOf(order.status);
  
  return (
    <PageTransition className="min-h-screen bg-background flex flex-col pb-24">
      <div className="bg-primary/5 pt-6 pb-8 px-4 rounded-b-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full bg-background/50 hover:bg-background">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-serif font-bold">Ordine #{order.orderNumber}</h1>
        </div>
        
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-lg font-bold">Stato</h3>
            <span className="text-sm font-medium text-primary capitalize">{STATUS_LABELS[order.status] || order.status}</span>
          </div>
          
          <div className="relative pt-2">
            <div className="absolute top-4 left-4 right-4 h-1 bg-muted rounded-full"></div>
            <div 
              className="absolute top-4 left-4 h-1 bg-primary rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(Math.max(0, currentStatusIndex) / (statuses.length - 1)) * 100}%` }}
            ></div>
            
            <div className="relative flex justify-between z-10">
              {statuses.map((s, i) => (
                <div key={s} className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-2 transition-colors ${i <= currentStatusIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {i <= currentStatusIndex ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-background"></div>}
                  </div>
                  {i === currentStatusIndex && <span className="text-[10px] font-bold uppercase tracking-wider text-primary absolute -bottom-4">{STATUS_LABELS[s] || s}</span>}
                </div>
              ))}
            </div>
          </div>
          
          {order.estimatedDeliveryTime && order.status !== 'delivered' && (
            <div className="mt-8 flex items-center gap-3 bg-secondary/10 text-secondary p-4 rounded-xl">
              <Timer className="w-5 h-5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Arrivo Stimato</p>
                <p className="font-bold text-lg">{order.estimatedDeliveryTime} min</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="font-serif text-lg font-bold mb-4">Articoli Ordinati</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div className="flex gap-3">
                  <span className="font-semibold">{item.quantity}x</span>
                  <div>
                    <p className="font-medium">{item.dishName}</p>
                    {item.customizations && <p className="text-muted-foreground text-xs">{item.customizations}</p>}
                  </div>
                </div>
                <span className="font-medium">€{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotale</span>
              <span>€{order.subtotal.toFixed(2)}</span>
            </div>
            {order.type === 'delivery' && (
              <div className="flex justify-between text-muted-foreground">
                <span>Costo Consegna</span>
                <span>€{order.deliveryCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2">
              <span>Totale</span>
              <span className="text-primary">€{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="font-serif text-lg font-bold mb-4">Dettagli</h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3 text-muted-foreground">
              <Package className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">{TYPE_LABELS[order.type] || order.type}</p>
                {order.type === 'delivery' && order.deliveryAddress && <p>{order.deliveryAddress}</p>}
                {order.type === 'takeaway' && order.pickupTime && <p>Ritiro alle {order.pickupTime}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
