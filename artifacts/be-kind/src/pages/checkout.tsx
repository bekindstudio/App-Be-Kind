import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { useGetCart } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import {
  ArrowLeft, MapPin, Clock, Bike, Store, CreditCard, StickyNote,
  CheckCircle2, Truck, Banknote, Shield, FileText, Receipt
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const IVA_RATE = 0.10;

export default function Checkout() {
  const [type, setType] = useState<"delivery" | "takeaway">("delivery");
  const [address, setAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [wantsFattura, setWantsFattura] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = useAuthStore((state) => state.token);
  const { data: cart, refetch: refetchCart } = useGetCart({ query: { enabled: !!token } });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") {
      toast({ title: "Pagamento annullato", description: "Puoi riprovare o scegliere un altro metodo.", variant: "destructive" });
    }
  }, []);

  const handlePlaceOrder = async () => {
    if (type === "delivery" && !address) {
      toast({ title: "Indirizzo obbligatorio", variant: "destructive" });
      return;
    }
    if (type === "delivery" && !deliveryCity) {
      toast({ title: "Zona di consegna obbligatoria", description: "Consegniamo solo a Cattolica e Gabicce Mare.", variant: "destructive" });
      return;
    }
    if (type === "takeaway" && !time) {
      toast({ title: "Orario di ritiro obbligatorio", variant: "destructive" });
      return;
    }
    if (!gdprConsent) {
      toast({ title: "Consenso privacy obbligatorio", description: "Devi accettare l'informativa sulla privacy per procedere.", variant: "destructive" });
      return;
    }
    if (!termsConsent) {
      toast({ title: "Termini obbligatori", description: "Devi accettare i termini e condizioni per procedere.", variant: "destructive" });
      return;
    }
    if (wantsFattura && !codiceFiscale.trim()) {
      toast({ title: "Codice Fiscale obbligatorio", description: "Inserisci il Codice Fiscale per ricevere la fattura.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (paymentMethod === "card") {
        const result = await customFetch<{ sessionId: string; url: string }>("/api/payments/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            deliveryAddress: type === "delivery" ? `${address}, ${deliveryCity}` : undefined,
            pickupTime: type === "takeaway" ? time : undefined,
            notes: notes || undefined,
            codiceFiscale: wantsFattura ? codiceFiscale : undefined,
            gdprConsent: true,
          }),
        });

        if (result.url) {
          window.location.href = result.url;
        }
      } else {
        const result = await customFetch<any>("/api/payments/confirm-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            deliveryAddress: type === "delivery" ? `${address}, ${deliveryCity}` : undefined,
            pickupTime: type === "takeaway" ? time : undefined,
            notes: notes || undefined,
            codiceFiscale: wantsFattura ? codiceFiscale : undefined,
            paymentMethod: "cash",
            gdprConsent: true,
          }),
        });

        toast({ title: "Ordine confermato!" });
        setLocation(`/orders/${result.id}`);
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
        <h2 className="text-2xl font-serif font-bold mb-2">Il carrello è vuoto</h2>
        <Link href="/menu">
          <Button className="rounded-xl w-full max-w-sm h-12">Sfoglia il Menù</Button>
        </Link>
      </PageTransition>
    );
  }

  const subtotal = cart.subtotal;
  const deliveryCost = type === "delivery" ? cart.deliveryCost : 0;
  const total = subtotal + deliveryCost;
  const ivaAmount = total * IVA_RATE / (1 + IVA_RATE);
  const imponibile = total - ivaAmount;

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
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${type === "delivery" ? "bg-primary/15" : "bg-muted"}`}>
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
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${type === "takeaway" ? "bg-primary/15" : "bg-muted"}`}>
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
              placeholder="Via Roma 123"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-12 bg-muted/30 rounded-xl border-border/50"
            />
            <select
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
              className="w-full h-12 bg-muted/30 rounded-xl border border-border/50 px-3 text-sm mt-3 outline-none focus:border-primary/30 transition-all"
            >
              <option value="">Seleziona zona di consegna...</option>
              <option value="Cattolica">Cattolica (RN)</option>
              <option value="Gabicce Mare">Gabicce Mare (PU)</option>
            </select>
            {deliveryCity && (
              <div className="mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <p className="text-[11px] text-green-700">Zona di consegna valida — Consegna stimata: ~30-40 minuti</p>
              </div>
            )}
            {!deliveryCity && address && (
              <p className="text-[11px] text-amber-600 mt-2">Seleziona la zona di consegna (solo Cattolica e Gabicce Mare)</p>
            )}
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
            placeholder="Allergie, intolleranze o richieste particolari"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-12 bg-muted/30 rounded-xl border-border/50"
          />
        </div>

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Metodo di Pagamento
          </h3>
          <RadioGroup defaultValue={paymentMethod} onValueChange={(v: "card" | "cash") => setPaymentMethod(v)} className="space-y-3">
            <div
              className={`border-2 rounded-[16px] p-4 flex items-center gap-3 cursor-pointer transition-all ${
                paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/50"
              }`}
              onClick={() => setPaymentMethod("card")}
            >
              <RadioGroupItem value="card" id="card" />
              <CreditCard className={`w-5 h-5 ${paymentMethod === "card" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <Label htmlFor="card" className="cursor-pointer font-semibold text-sm">Carta di Credito/Debito</Label>
                <p className="text-[10px] text-muted-foreground">Pagamento sicuro tramite Stripe (PCI-DSS Level 1)</p>
              </div>
            </div>
            <div
              className={`border-2 rounded-[16px] p-4 flex items-center gap-3 cursor-pointer transition-all ${
                paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/50"
              }`}
              onClick={() => setPaymentMethod("cash")}
            >
              <RadioGroupItem value="cash" id="cash" />
              <Banknote className={`w-5 h-5 ${paymentMethod === "cash" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex-1">
                <Label htmlFor="cash" className="cursor-pointer font-semibold text-sm">Contanti</Label>
                <p className="text-[10px] text-muted-foreground">{type === "delivery" ? "Pagamento alla consegna" : "Pagamento al ritiro"}</p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Documentazione Fiscale
          </h3>
          <div className="flex items-start gap-3">
            <Checkbox
              id="fattura"
              checked={wantsFattura}
              onCheckedChange={(checked) => setWantsFattura(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="fattura" className="text-sm cursor-pointer leading-relaxed">
              Desidero ricevere fattura elettronica
            </Label>
          </div>
          {wantsFattura && (
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Codice Fiscale / P.IVA</Label>
                <Input
                  placeholder="RSSMRA85M01H501Z o 01234567890"
                  value={codiceFiscale}
                  onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
                  className="h-11 bg-muted/30 rounded-xl border-border/50 mt-1 font-mono"
                  maxLength={16}
                />
              </div>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-3">
            Per ogni ordine viene emessa documentazione fiscale ai sensi della normativa vigente (D.P.R. 633/1972).
          </p>
        </div>

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Consensi e Privacy
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="gdpr"
                checked={gdprConsent}
                onCheckedChange={(checked) => setGdprConsent(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="gdpr" className="text-sm cursor-pointer leading-relaxed">
                Ho letto e accetto l'{" "}
                <Link href="/privacy" className="text-primary underline font-medium">Informativa sulla Privacy</Link>
                {" "}ai sensi del Reg. UE 2016/679 (GDPR) <span className="text-destructive">*</span>
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsConsent}
                onCheckedChange={(checked) => setTermsConsent(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                Accetto i{" "}
                <Link href="/terms" className="text-primary underline font-medium">Termini e Condizioni di Vendita</Link>
                {" "}<span className="text-destructive">*</span>
              </Label>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Riepilogo Ordine
          </h3>
          <div className="space-y-2 text-sm">
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
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            {type === "delivery" && (
              <div className="flex justify-between text-muted-foreground">
                <span>Consegna</span>
                <span>{deliveryCost === 0 ? "Gratuita" : `€${deliveryCost.toFixed(2)}`}</span>
              </div>
            )}
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
              <span className="text-primary">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Button
          className="w-full h-14 rounded-[20px] text-lg font-medium shadow-lg"
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
          I pagamenti con carta sono gestiti in sicurezza da Stripe (PCI-DSS Level 1). 
          I dati della tua carta non vengono mai memorizzati sui nostri server.
        </p>
      </div>
    </PageTransition>
  );
}
