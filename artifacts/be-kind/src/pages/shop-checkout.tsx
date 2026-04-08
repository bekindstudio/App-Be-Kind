import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { useGetShopCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, CreditCard, Banknote, Shield, FileText, Receipt,
  CheckCircle2, Truck
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { customFetch } from "@workspace/api-client-react/custom-fetch";

const IVA_RATE = 0.10;

export default function ShopCheckout() {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [cap, setCap] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [wantsFattura, setWantsFattura] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = useAuthStore((state) => state.token);
  const { data: cart } = useGetShopCart({ query: { enabled: !!token } });
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      const sessionId = params.get("session_id");
      const savedAddress = localStorage.getItem("bekind_shop_shipping_address");
      if (savedAddress) {
        customFetch<any>("/api/payments/confirm-shop-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, shippingAddress: savedAddress }),
        }).then((result) => {
          localStorage.removeItem("bekind_shop_shipping_address");
          queryClient.invalidateQueries({ queryKey: ["getShopCart"] });
          toast({ title: "Ordine confermato!", description: `Ordine #${result.orderNumber} creato con successo.` });
          setLocation("/orders");
        }).catch(() => {
          toast({ title: "Ordine già confermato", description: "Controlla la sezione I miei ordini." });
          setLocation("/orders");
        });
      }
    } else if (params.get("payment") === "cancelled") {
      toast({ title: "Pagamento annullato", description: "Puoi riprovare o scegliere un altro metodo.", variant: "destructive" });
    }
  }, []);

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast({ title: "Indirizzo obbligatorio", variant: "destructive" });
      return;
    }
    if (!city.trim()) {
      toast({ title: "Città obbligatoria", variant: "destructive" });
      return;
    }
    if (!gdprConsent) {
      toast({ title: "Consenso privacy obbligatorio", variant: "destructive" });
      return;
    }
    if (!termsConsent) {
      toast({ title: "Termini obbligatori", variant: "destructive" });
      return;
    }
    if (wantsFattura && !codiceFiscale.trim()) {
      toast({ title: "Codice Fiscale obbligatorio", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const fullAddress = `${address}, ${cap} ${city}`;

    try {
      if (paymentMethod === "card") {
        localStorage.setItem("bekind_shop_shipping_address", fullAddress);
        const result = await customFetch<{ url: string }>("/api/payments/create-shop-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shippingAddress: fullAddress,
          }),
        });
        if (result.url) {
          window.location.href = result.url;
        }
      } else {
        const result = await customFetch<any>("/api/shop/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shippingAddress: fullAddress }),
        });
        queryClient.invalidateQueries({ queryKey: ["getShopCart"] });
        toast({ title: "Ordine confermato!", description: `Ordine #${result.orderNumber} creato con successo.` });
        setLocation("/orders");
      }
    } catch (err: any) {
      toast({ title: "Errore", description: err.message || "Si è verificato un errore.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <h2 className="text-2xl font-serif font-bold mb-2">La borsa è vuota</h2>
        <Link href="/shop">
          <Button className="rounded-xl w-full max-w-sm h-12 bg-secondary text-secondary-foreground">Esplora la Bottega</Button>
        </Link>
      </PageTransition>
    );
  }

  const subtotal = cart.subtotal;
  const shippingCost = cart.shippingCost;
  const total = subtotal + shippingCost;
  const ivaAmount = total * IVA_RATE / (1 + IVA_RATE);
  const imponibile = total - ivaAmount;

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-serif font-bold">Checkout Bottega</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-secondary" />
            Indirizzo di Spedizione
          </h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Via e numero civico</Label>
              <Input
                placeholder="Via Roma 123"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-12 bg-muted/30 rounded-xl border-border/50 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Città</Label>
                <Input
                  placeholder="Cattolica"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-12 bg-muted/30 rounded-xl border-border/50 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">CAP</Label>
                <Input
                  placeholder="47841"
                  value={cap}
                  onChange={(e) => setCap(e.target.value)}
                  className="h-12 bg-muted/30 rounded-xl border-border/50 mt-1"
                  maxLength={5}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Telefono (opzionale)</Label>
              <Input
                placeholder="+39 333 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 bg-muted/30 rounded-xl border-border/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Note di spedizione</Label>
              <Input
                placeholder="Citofono, piano, orario preferito..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-12 bg-muted/30 rounded-xl border-border/50 mt-1"
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-secondary" />
            Metodo di Pagamento
          </h3>
          <RadioGroup defaultValue={paymentMethod} onValueChange={(v: "card" | "cash") => setPaymentMethod(v)} className="space-y-3">
            <div
              className={`border-2 rounded-[16px] p-4 flex items-center gap-3 cursor-pointer transition-all ${
                paymentMethod === "card" ? "border-secondary bg-secondary/5" : "border-border/50 hover:bg-muted/50"
              }`}
              onClick={() => setPaymentMethod("card")}
            >
              <RadioGroupItem value="card" id="shop-card" />
              <CreditCard className={`w-5 h-5 ${paymentMethod === "card" ? "text-secondary" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <Label htmlFor="shop-card" className="cursor-pointer font-semibold text-sm">Carta di Credito/Debito</Label>
                <p className="text-[10px] text-muted-foreground">Pagamento sicuro tramite Stripe</p>
              </div>
            </div>
            <div
              className={`border-2 rounded-[16px] p-4 flex items-center gap-3 cursor-pointer transition-all ${
                paymentMethod === "cash" ? "border-secondary bg-secondary/5" : "border-border/50 hover:bg-muted/50"
              }`}
              onClick={() => setPaymentMethod("cash")}
            >
              <RadioGroupItem value="cash" id="shop-cash" />
              <Banknote className={`w-5 h-5 ${paymentMethod === "cash" ? "text-secondary" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <Label htmlFor="shop-cash" className="cursor-pointer font-semibold text-sm">Contrassegno</Label>
                <p className="text-[10px] text-muted-foreground">Pagamento alla consegna del pacco</p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-secondary" />
            Documentazione Fiscale
          </h3>
          <div className="flex items-start gap-3">
            <Checkbox
              id="shop-fattura"
              checked={wantsFattura}
              onCheckedChange={(checked) => setWantsFattura(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="shop-fattura" className="text-sm cursor-pointer leading-relaxed">
              Desidero ricevere fattura elettronica
            </Label>
          </div>
          {wantsFattura && (
            <div className="mt-4">
              <Label className="text-xs text-muted-foreground">Codice Fiscale / P.IVA</Label>
              <Input
                placeholder="RSSMRA85M01H501Z"
                value={codiceFiscale}
                onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
                className="h-11 bg-muted/30 rounded-xl border-border/50 mt-1 font-mono"
                maxLength={16}
              />
            </div>
          )}
        </div>

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-secondary" />
            Consensi e Privacy
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="shop-gdpr"
                checked={gdprConsent}
                onCheckedChange={(checked) => setGdprConsent(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="shop-gdpr" className="text-sm cursor-pointer leading-relaxed">
                Ho letto e accetto l'{" "}
                <Link href="/privacy" className="text-secondary underline font-medium">Informativa sulla Privacy</Link>
                {" "}(GDPR) <span className="text-destructive">*</span>
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="shop-terms"
                checked={termsConsent}
                onCheckedChange={(checked) => setTermsConsent(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="shop-terms" className="text-sm cursor-pointer leading-relaxed">
                Accetto i{" "}
                <Link href="/terms" className="text-secondary underline font-medium">Termini e Condizioni</Link>
                {" "}<span className="text-destructive">*</span>
              </Label>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-secondary" />
            Riepilogo Ordine
          </h3>
          <div className="space-y-2 text-sm">
            {cart.items.map(item => (
              <div key={item.id} className="flex justify-between text-muted-foreground">
                <span>{item.quantity}x {item.productName}</span>
                <span>€{(item.productPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border/30 mt-4 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotale</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Spedizione</span>
              <span>{shippingCost === 0 ? "Gratuita" : `€${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="border-t border-border/20 pt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Imponibile</span>
                <span>€{imponibile.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>IVA (10%)</span>
                <span>€{ivaAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/30">
              <span>Totale (IVA incl.)</span>
              <span className="text-secondary">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Button
          className="w-full h-14 rounded-[20px] text-lg font-medium shadow-lg bg-secondary text-secondary-foreground hover:bg-secondary/90"
          onClick={handlePlaceOrder}
          disabled={isSubmitting || !gdprConsent || !termsConsent}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Elaborazione...
            </span>
          ) : paymentMethod === "card" ? (
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Paga con Carta — €{total.toFixed(2)}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Conferma Ordine — €{total.toFixed(2)}
            </span>
          )}
        </Button>

        <p className="text-[10px] text-center text-muted-foreground pb-4 leading-relaxed">
          Spedizione gratuita per ordini superiori a €50.
        </p>
      </div>
    </PageTransition>
  );
}
