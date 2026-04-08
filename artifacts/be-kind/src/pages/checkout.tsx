import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { useGetCart, useCreateOrder } from "@workspace/api-client-react";
import { ArrowLeft, MapPin, Clock, Bike, Store, CreditCard, StickyNote, CheckCircle2, Truck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Checkout() {
  const [type, setType] = useState<"delivery" | "takeaway">("delivery");
  const [address, setAddress] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const token = useAuthStore((state) => state.token);
  const { data: cart } = useGetCart({ query: { enabled: !!token } });
  const createOrderMutation = useCreateOrder();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handlePlaceOrder = () => {
    if (type === "delivery" && !address) {
      toast({ title: "Indirizzo obbligatorio", variant: "destructive" });
      return;
    }
    if (type === "takeaway" && !time) {
      toast({ title: "Orario di ritiro obbligatorio", variant: "destructive" });
      return;
    }

    createOrderMutation.mutate({
      data: {
        type,
        deliveryAddress: type === "delivery" ? address : undefined,
        pickupTime: type === "takeaway" ? time : undefined,
        notes: notes || undefined
      }
    }, {
      onSuccess: (order) => {
        toast({ title: "Ordine confermato! 🎉" });
        setLocation(`/orders/${order.id}`);
      },
      onError: (err) => {
        toast({ title: "Ordine fallito", description: err.message, variant: "destructive" });
      }
    });
  };

  if (!cart || cart.items.length === 0) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <h2 className="text-2xl font-serif font-bold mb-2">Il carrello è vuoto</h2>
        <Link href="/menu">
          <Button className="rounded-xl w-full max-w-sm h-12">Sfoglia il Menù</Button>
        </Link>
      </PageTransition>
    );
  }

  const total = cart.subtotal + (type === "delivery" ? cart.deliveryCost : 0);

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-serif font-bold">Completa Ordine</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Tipo di Ordine
          </h3>
          <RadioGroup defaultValue={type} onValueChange={(v: "delivery" | "takeaway") => setType(v)} className="flex gap-3">
            <div
              className={`flex-1 border-2 rounded-[20px] p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                type === "delivery" ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 hover:bg-muted/50"
              }`}
              onClick={() => setType("delivery")}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                type === "delivery" ? "bg-primary/15" : "bg-muted"
              }`}>
                <Bike className={`w-6 h-6 ${type === "delivery" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
              <Label htmlFor="delivery" className="cursor-pointer font-semibold text-sm">Consegna</Label>
              <p className="text-[10px] text-muted-foreground text-center">A domicilio con rider</p>
            </div>
            <div
              className={`flex-1 border-2 rounded-[20px] p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                type === "takeaway" ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 hover:bg-muted/50"
              }`}
              onClick={() => setType("takeaway")}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                type === "takeaway" ? "bg-primary/15" : "bg-muted"
              }`}>
                <Store className={`w-6 h-6 ${type === "takeaway" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <RadioGroupItem value="takeaway" id="takeaway" className="sr-only" />
              <Label htmlFor="takeaway" className="cursor-pointer font-semibold text-sm">Asporto</Label>
              <p className="text-[10px] text-muted-foreground text-center">Ritiro al ristorante</p>
            </div>
          </RadioGroup>
        </div>

        {type === "delivery" ? (
          <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
            <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Indirizzo di Consegna
            </h3>
            <Input
              placeholder="Via Roma 123, 47841 Cattolica (RN)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-12 bg-muted/30 rounded-xl border-border/50"
            />
            <p className="text-[11px] text-muted-foreground mt-2">Consegna stimata: ~40 minuti</p>
          </div>
        ) : (
          <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
            <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Orario di Ritiro
            </h3>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-12 bg-muted/30 rounded-xl border-border/50"
            />
            <p className="text-[11px] text-muted-foreground mt-2">Preparazione stimata: ~25 minuti</p>
          </div>
        )}

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" />
            Note per la Cucina
          </h3>
          <Input
            placeholder="Allergie o richieste particolari?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-12 bg-muted/30 rounded-xl border-border/50"
          />
        </div>

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Riepilogo
          </h3>
          <div className="space-y-3 text-sm">
            {cart.items.map(item => (
              <div key={item.id} className="flex justify-between text-muted-foreground">
                <span>{item.quantity}x {item.dishName}</span>
                <span>€{(item.dishPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border/30 mt-4 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotale</span>
              <span>€{cart.subtotal.toFixed(2)}</span>
            </div>
            {type === "delivery" && (
              <div className="flex justify-between text-muted-foreground">
                <span>Consegna</span>
                <span>{cart.deliveryCost === 0 ? "Gratuita" : `€${cart.deliveryCost.toFixed(2)}`}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/30">
              <span>Totale</span>
              <span className="text-primary">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Button
          className="w-full h-14 rounded-[20px] text-lg font-medium shadow-lg"
          onClick={handlePlaceOrder}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Elaborazione...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Conferma Ordine — €{total.toFixed(2)}
            </span>
          )}
        </Button>
      </div>
    </PageTransition>
  );
}
