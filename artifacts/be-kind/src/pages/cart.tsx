import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, ShoppingBag, Minus, Plus, Trash2, ArrowRight, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const token = useAuthStore((state) => state.token);
  const { data: cart, isLoading } = useGetCart({ query: { enabled: !!token } });
  const updateMutation = useUpdateCartItem();
  const deleteMutation = useRemoveCartItem();
  const clearMutation = useClearCart();
  const { toast } = useToast();

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      deleteMutation.mutate({ id: itemId });
    } else {
      updateMutation.mutate({ id: itemId, data: { quantity: newQuantity } });
    }
  };

  const handleRemoveItem = (itemId: number) => {
    deleteMutation.mutate({ id: itemId });
  };

  const handleClearCart = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => toast({ title: "Carrello svuotato" }),
    });
  };

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="w-9 h-9 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Accedi per ordinare</h2>
        <p className="text-muted-foreground mb-6">Accedi per vedere il carrello e fare ordini.</p>
        <Link href="/login">
          <Button className="rounded-xl w-full max-w-sm h-12 text-lg">Accedi</Button>
        </Link>
      </PageTransition>
    );
  }

  const ivaAmount = cart ? (cart.total * 0.10 / 1.10) : 0;

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-serif font-bold">Il Tuo Ordine</h1>
          {cart && cart.items.length > 0 && (
            <>
              <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {cart.items.length} {cart.items.length === 1 ? "articolo" : "articoli"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                className="text-destructive/70 hover:text-destructive text-xs h-8 px-2 rounded-lg"
                disabled={clearMutation.isPending}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Svuota
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-24 bg-card rounded-[24px]" />
            <div className="h-24 bg-card rounded-[24px]" />
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-serif font-semibold mb-2">Il carrello è vuoto</h2>
            <p className="text-muted-foreground mb-6">Non hai ancora aggiunto nulla.</p>
            <Link href="/menu">
              <Button className="rounded-xl px-8">Sfoglia il Menù</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="space-y-3">
              {cart.items.map(item => (
                <div key={item.id} className="flex gap-3 items-center bg-card p-3 rounded-[20px] border border-border/30 shadow-sm">
                  <div className="w-16 h-16 rounded-[14px] bg-muted overflow-hidden shrink-0">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.dishName} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1">{item.dishName}</h3>
                    <div className="text-primary font-bold text-sm mt-0.5">€{item.dishPrice.toFixed(2)}</div>
                    {item.customizations && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.customizations}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                    >
                      <X className="w-3 h-3 text-destructive" />
                    </button>
                    <div className="flex items-center gap-0 bg-muted/60 rounded-full">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                        disabled={updateMutation.isPending}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                        disabled={updateMutation.isPending}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-[24px] p-5 border border-border/30 shadow-sm space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotale</span>
                <span>€{cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Consegna</span>
                <span>{cart.deliveryCost === 0 ? "Gratuita" : `€${cart.deliveryCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground/70 pt-1">
                <span>di cui IVA (10%)</span>
                <span>€{ivaAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-border/30 pt-3 flex justify-between font-bold text-lg">
                <span>Totale</span>
                <span className="text-primary">€{cart.total.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1">Prezzi IVA inclusa (10%) — D.P.R. 633/1972</p>
            </div>

            <Link href="/order/checkout">
              <Button className="w-full h-14 rounded-[20px] text-lg font-medium shadow-lg flex items-center justify-center gap-2">
                Procedi all'Ordine
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
