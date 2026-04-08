import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetOrders } from "@workspace/api-client-react";
import { ArrowLeft, Clock, Package, ShoppingBag, MapPin, Bike, Navigation, CheckCircle2, ChefHat } from "lucide-react";
import { Link } from "wouter";

const STATUS_LABELS: Record<string, string> = {
  received: "Ricevuto",
  preparing: "In preparazione",
  ready: "Pronto",
  delivering: "In consegna",
  delivered: "Consegnato",
  cancelled: "Annullato",
};

const TYPE_LABELS: Record<string, string> = {
  delivery: "Consegna",
  takeaway: "Asporto",
};

const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-500/10 text-blue-600",
  preparing: "bg-amber-500/10 text-amber-600",
  ready: "bg-secondary/10 text-secondary",
  delivering: "bg-primary/10 text-primary",
  delivered: "bg-secondary/15 text-secondary",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function Orders() {
  const token = useAuthStore((state) => state.token);
  const { data: orders, isLoading } = useGetOrders({ query: { enabled: !!token } });

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Package className="w-9 h-9 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Accedi per vedere gli ordini</h2>
        <p className="text-muted-foreground mb-6">Accedi per seguire i tuoi ordini.</p>
        <Link href="/login">
          <Button className="rounded-xl w-full max-w-sm h-12 text-lg">Accedi</Button>
        </Link>
      </PageTransition>
    );
  }

  const activeOrders = orders?.filter(o => o.status !== "delivered" && o.status !== "cancelled") ?? [];
  const pastOrders = orders?.filter(o => o.status === "delivered" || o.status === "cancelled") ?? [];

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-serif font-bold">I Tuoi Ordini</h1>
          {orders && orders.length > 0 && (
            <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {orders.length}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-36 bg-card rounded-[24px]" />
            <div className="h-36 bg-card rounded-[24px]" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-serif font-semibold mb-2">Nessun ordine</h2>
            <p className="text-muted-foreground mb-6">Quando farai un ordine, apparirà qui.</p>
            <Link href="/menu">
              <Button className="rounded-xl px-8">Sfoglia il Menù</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {activeOrders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Ordini attivi</h2>
                </div>
                <div className="space-y-3">
                  {activeOrders.map(order => (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                      <div className="bg-card border border-primary/20 rounded-[24px] p-4 shadow-sm active:scale-[0.98] transition-transform">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {order.status === "delivering" ? <Navigation className="w-5 h-5 text-primary" /> :
                               order.status === "preparing" ? <ChefHat className="w-5 h-5 text-primary" /> :
                               <Package className="w-5 h-5 text-primary" />}
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground font-mono">#{order.orderNumber}</span>
                              <h3 className="font-semibold text-sm">{TYPE_LABELS[order.type]}</h3>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </div>

                        {order.type === "delivery" && order.status === "delivering" && (
                          <div className="mb-3">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-secondary to-primary rounded-full animate-pulse" style={{ width: "65%" }} />
                            </div>
                            <div className="flex justify-between mt-1.5 text-[10px] font-medium text-muted-foreground">
                              <span>Ristorante</span>
                              <span className="flex items-center gap-1"><Bike className="w-3 h-3" /> In arrivo</span>
                              <span>Casa tua</span>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t border-border/30">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(order.createdAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{order.items.length} {order.items.length === 1 ? "articolo" : "articoli"}</span>
                          </div>
                          <span className="font-bold text-primary">€{order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {pastOrders.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Ordini passati</h2>
                <div className="space-y-3">
                  {pastOrders.map(order => (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                      <div className="bg-card border border-border/30 rounded-[24px] p-4 shadow-sm active:scale-[0.98] transition-transform">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              {order.status === "delivered" ? <CheckCircle2 className="w-5 h-5 text-secondary" /> :
                               <Package className="w-5 h-5 text-muted-foreground" />}
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground font-mono">#{order.orderNumber}</span>
                              <h3 className="font-semibold text-sm">{TYPE_LABELS[order.type]}</h3>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-border/30">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(order.createdAt).toLocaleDateString("it-IT")}</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{order.items.length} {order.items.length === 1 ? "articolo" : "articoli"}</span>
                          </div>
                          <span className="font-bold">€{order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
