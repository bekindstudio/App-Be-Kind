import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetShopCart } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function ShopCart() {
  const token = useAuthStore((state) => state.token);
  const { data: cart, isLoading } = useGetShopCart({ query: { enabled: !!token } });

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Accedi per acquistare</h2>
        <Link href="/login">
          <Button className="rounded-xl w-full max-w-sm h-12 text-lg">Accedi</Button>
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
        <h1 className="text-2xl font-serif font-bold">La Tua Borsa</h1>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-card rounded-xl"></div>
          <div className="h-20 bg-card rounded-xl"></div>
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-serif font-semibold mb-2">La borsa è vuota</h2>
          <Link href="/shop">
            <Button className="rounded-xl px-8 mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90">Esplora la Bottega</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            {cart.items.map(item => (
              <div key={item.id} className="flex gap-4 items-center bg-card p-3 rounded-xl border border-border">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm line-clamp-1">{item.productName}</h3>
                  <div className="text-secondary font-medium text-sm">€{item.productPrice.toFixed(2)}</div>
                </div>
                <div className="font-semibold px-2">x{item.quantity}</div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotale</span>
              <span>€{cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Spedizione</span>
              <span>€{cart.shippingCost.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
              <span>Totale</span>
              <span className="text-secondary">€{cart.total.toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover-elevate bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Procedi al Pagamento
          </Button>
        </div>
      )}
    </PageTransition>
  );
}
