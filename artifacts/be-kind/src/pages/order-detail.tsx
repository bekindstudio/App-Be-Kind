import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useGetOrder } from "@workspace/api-client-react";
import type { DeliveryTracking, Order } from "@workspace/api-client-react";
import {
  ArrowLeft, CheckCircle2, Clock, MapPin, Package, Timer,
  Phone, Bike, Car, Navigation, ChefHat, CircleDot, Store,
  Home as HomeIcon, Utensils
} from "lucide-react";
import { useParams } from "wouter";
import { useEffect, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  received: "Ricevuto",
  preparing: "In preparazione",
  ready: "Pronto",
  delivering: "In consegna",
  delivered: "Consegnato",
  cancelled: "Annullato",
};

const RIDER_STATUS_LABELS: Record<string, string> = {
  assigned: "Rider assegnato",
  picking_up: "Ritiro in corso",
  on_the_way: "In viaggio",
  nearby: "Quasi arrivato",
  arrived: "Arrivato!",
};

const STATUS_ICONS: Record<string, typeof Package> = {
  received: Package,
  preparing: ChefHat,
  ready: Utensils,
  delivering: Navigation,
  delivered: CheckCircle2,
};

function VehicleIcon({ vehicle }: { vehicle: string }) {
  if (vehicle === "auto") return <Car className="w-5 h-5" />;
  return <Bike className="w-5 h-5" />;
}

function DeliveryMap({ tracking }: { tracking: DeliveryTracking }) {
  const { progress, riderStatus } = tracking;

  return (
    <div className="relative bg-gradient-to-br from-secondary/5 via-background to-primary/5 rounded-[24px] p-5 border border-border/30 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "20px 20px"
        }}
      />

      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center">
            <Store className="w-4 h-4 text-secondary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Ristorante</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Casa tua</span>
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <HomeIcon className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>

      <div className="relative h-3 mb-3">
        <div className="absolute inset-0 bg-muted/60 rounded-full" />
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.max(3, progress)}%` }}
        />
        {riderStatus !== "arrived" && progress > 0 && progress < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
            style={{ left: `${progress}%`, transform: `translateX(-50%) translateY(-50%)` }}
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-primary shadow-lg flex items-center justify-center animate-pulse border-2 border-white">
                <Navigation className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/10">
          <CircleDot className="w-3 h-3 text-secondary" />
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
            {RIDER_STATUS_LABELS[riderStatus]}
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
      </div>
    </div>
  );
}

function RiderCard({ tracking }: { tracking: DeliveryTracking }) {
  const { rider } = tracking;

  return (
    <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
      <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
        <Navigation className="w-5 h-5 text-primary" />
        Il Tuo Rider
      </h3>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-xl font-bold shadow-md">
          {rider.name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-base">{rider.name}</p>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-0.5">
            <VehicleIcon vehicle={rider.vehicle} />
            <span className="capitalize">{rider.vehicle === "bici" ? "Bicicletta" : rider.vehicle === "auto" ? "Automobile" : "Scooter"}</span>
          </div>
        </div>
        <a
          href={`tel:${rider.phone}`}
          className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center hover:bg-secondary/20 transition-colors"
        >
          <Phone className="w-5 h-5 text-secondary" />
        </a>
      </div>
    </div>
  );
}

function ETACountdown({ etaMinutes, status }: { etaMinutes: number; status: string }) {
  const [displayTime, setDisplayTime] = useState(etaMinutes);

  useEffect(() => {
    setDisplayTime(etaMinutes);
  }, [etaMinutes]);

  if (status === "delivered") {
    return (
      <div className="bg-gradient-to-r from-secondary to-secondary/80 rounded-[24px] p-6 text-white text-center">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-2 animate-bounce" />
        <p className="text-xl font-bold font-serif">Ordine Consegnato!</p>
        <p className="text-sm opacity-80 mt-1">Buon appetito!</p>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="bg-destructive/10 rounded-[24px] p-6 text-center">
        <p className="text-xl font-bold font-serif text-destructive">Ordine Annullato</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 rounded-[24px] p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Arrivo stimato</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-bold font-serif">{displayTime}</span>
            <span className="text-lg opacity-80">min</span>
          </div>
        </div>
        <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
          <Timer className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useGetOrder(Number(id), {
    query: {
      enabled: !!id,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return 5000;
        if (data.status === "delivered" || data.status === "cancelled") return false;
        return 5000;
      },
    },
  });

  if (isLoading) {
    return (
      <PageTransition className="min-h-screen bg-background flex flex-col p-4">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="h-7 w-40 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="h-32 bg-card animate-pulse rounded-[24px] mb-4" />
        <div className="h-48 bg-card animate-pulse rounded-[24px] mb-4" />
        <div className="h-40 bg-card animate-pulse rounded-[24px]" />
      </PageTransition>
    );
  }

  if (isError || !order) {
    return (
      <PageTransition className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Package className="w-9 h-9 text-destructive" />
        </div>
        <h2 className="text-xl font-serif font-bold mb-2">Ordine non trovato</h2>
        <p className="text-muted-foreground mb-6">Non è stato possibile caricare i dettagli dell'ordine.</p>
        <Button variant="outline" className="rounded-xl" onClick={() => window.history.back()}>
          Torna indietro
        </Button>
      </PageTransition>
    );
  }

  const statuses = order.type === "delivery"
    ? ["received", "preparing", "ready", "delivering", "delivered"]
    : ["received", "preparing", "ready", "delivered"];
  const currentStatusIndex = statuses.indexOf(order.status);
  const isDelivery = order.type === "delivery";
  const isActive = order.status !== "delivered" && order.status !== "cancelled";
  const tracking = order.tracking ?? null;

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-serif font-bold">Ordine #{order.orderNumber}</h1>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("it-IT")} alle{" "}
              {new Date(order.createdAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            order.status === "delivered" ? "bg-secondary/15 text-secondary" :
            order.status === "delivering" ? "bg-primary/15 text-primary animate-pulse" :
            order.status === "cancelled" ? "bg-destructive/15 text-destructive" :
            "bg-muted text-muted-foreground"
          }`}>
            {STATUS_LABELS[order.status]}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {isActive && order.estimatedDeliveryTime && (
          <ETACountdown etaMinutes={tracking?.etaMinutes ?? order.estimatedDeliveryTime} status={order.status} />
        )}
        {!isActive && <ETACountdown etaMinutes={0} status={order.status} />}

        {isDelivery && tracking && isActive && (
          <DeliveryMap tracking={tracking} />
        )}

        {isDelivery && tracking && isActive && (
          <RiderCard tracking={tracking} />
        )}

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-bold mb-5 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Stato dell'Ordine
          </h3>

          <div className="relative">
            <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-muted" />

            {statuses.map((s, i) => {
              const isCompleted = i <= currentStatusIndex;
              const isCurrent = i === currentStatusIndex;
              const Icon = STATUS_ICONS[s] || Package;

              return (
                <div key={s} className="relative flex items-start gap-4 mb-6 last:mb-0">
                  <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                    isCurrent ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110" :
                    isCompleted ? "bg-primary/15 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? <Icon className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current opacity-40" />}
                  </div>
                  <div className={`pt-1.5 ${isCurrent ? "opacity-100" : isCompleted ? "opacity-70" : "opacity-40"}`}>
                    <p className={`font-medium text-sm ${isCurrent ? "text-primary font-bold" : ""}`}>
                      {STATUS_LABELS[s]}
                    </p>
                    {isCurrent && isActive && (
                      <p className="text-xs text-muted-foreground mt-0.5 animate-pulse">In corso...</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {order.deliveryAddress && (
          <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
            <h3 className="font-serif text-lg font-bold mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {isDelivery ? "Indirizzo di Consegna" : "Punto di Ritiro"}
            </h3>
            <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
          </div>
        )}

        {order.type === "takeaway" && order.pickupTime && (
          <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
            <h3 className="font-serif text-lg font-bold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Orario di Ritiro
            </h3>
            <p className="text-sm text-muted-foreground">Ritiro alle <span className="font-semibold text-foreground">{order.pickupTime}</span></p>
          </div>
        )}

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Articoli Ordinati
          </h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex gap-3 items-start">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{item.quantity}x</span>
                  <div>
                    <p className="font-medium text-sm">{item.dishName}</p>
                    {item.customizations && <p className="text-muted-foreground text-xs mt-0.5">{item.customizations}</p>}
                  </div>
                </div>
                <span className="font-medium text-sm">€{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border/50 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotale</span>
              <span>€{order.subtotal.toFixed(2)}</span>
            </div>
            {isDelivery && (
              <div className="flex justify-between text-muted-foreground">
                <span>Consegna</span>
                <span>{order.deliveryCost === 0 ? "Gratuita" : `€${order.deliveryCost.toFixed(2)}`}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border/30">
              <span>Totale</span>
              <span className="text-primary">€{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
            <h3 className="font-serif text-lg font-bold mb-3">Note</h3>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        )}

        {order.pointsEarned > 0 && (
          <div className="bg-gradient-to-r from-accent to-accent/60 rounded-[24px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center">
              <span className="text-lg">🌱</span>
            </div>
            <div>
              <p className="font-semibold text-sm">+{order.pointsEarned} punti fedeltà</p>
              <p className="text-xs text-muted-foreground">Guadagnati con questo ordine</p>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
