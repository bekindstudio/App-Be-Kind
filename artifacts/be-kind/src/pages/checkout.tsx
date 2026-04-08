import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { useGetCart, useCreateOrder } from "@workspace/api-client-react";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
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
        toast({ title: "Ordine confermato!" });
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

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center gap-3 mb-6 pt-2">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-serif font-bold">Completa Ordine</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4">Tipo di Ordine</h3>
          <RadioGroup defaultValue={type} onValueChange={(v: "delivery" | "takeaway") => setType(v)} className="flex gap-4">
            <div className={`flex-1 border rounded-xl p-4 flex items-center gap-2 cursor-pointer transition-colors ${type === 'delivery' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`} onClick={() => setType('delivery')}>
              <RadioGroupItem value="delivery" id="delivery" />
              <Label htmlFor="delivery" className="cursor-pointer font-medium flex items-center gap-2"><MapPin className="w-4 h-4"/> Consegna</Label>
            </div>
            <div className={`flex-1 border rounded-xl p-4 flex items-center gap-2 cursor-pointer transition-colors ${type === 'takeaway' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`} onClick={() => setType('takeaway')}>
              <RadioGroupItem value="takeaway" id="takeaway" />
              <Label htmlFor="takeaway" className="cursor-pointer font-medium flex items-center gap-2"><Clock className="w-4 h-4"/> Asporto</Label>
            </div>
          </RadioGroup>
        </div>

        {type === "delivery" ? (
          <div className="space-y-4 bg-card rounded-2xl p-5 border border-border shadow-sm">
            <h3 className="font-serif text-lg font-semibold">Dettagli Consegna</h3>
            <div className="space-y-2">
              <Label>Indirizzo</Label>
              <Input 
                placeholder="Via Roma 123, 47841 Cattolica (RN)" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-12 bg-muted/50 rounded-xl"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 bg-card rounded-2xl p-5 border border-border shadow-sm">
            <h3 className="font-serif text-lg font-semibold">Orario di Ritiro</h3>
            <div className="space-y-2">
              <Label>Orario</Label>
              <Input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-12 bg-muted/50 rounded-xl"
              />
            </div>
          </div>
        )}

        <div className="space-y-4 bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="font-serif text-lg font-semibold">Note per la Cucina</h3>
          <Input 
            placeholder="Allergie o richieste particolari?" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-12 bg-muted/50 rounded-xl"
          />
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4">Riepilogo Pagamento</h3>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotale</span>
              <span>€{cart.subtotal.toFixed(2)}</span>
            </div>
            {type === "delivery" && (
              <div className="flex justify-between text-muted-foreground">
                <span>Consegna</span>
                <span>€{cart.deliveryCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Totale</span>
              <span className="text-primary">€{(cart.subtotal + (type === "delivery" ? cart.deliveryCost : 0)).toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover-elevate"
            onClick={handlePlaceOrder}
            disabled={createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? "Elaborazione..." : "Conferma Ordine"}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
