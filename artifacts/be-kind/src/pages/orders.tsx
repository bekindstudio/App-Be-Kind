import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetOrders } from "@workspace/api-client-react";
import { ArrowLeft, Clock, Package, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Orders() {
  const token = useAuthStore((state) => state.token);
  const { data: orders, isLoading } = useGetOrders({ query: { enabled: !!token } });

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Package className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Sign in to view orders</h2>
        <p className="text-muted-foreground mb-6">Log in to track your food orders.</p>
        <Link href="/login">
          <Button className="rounded-xl w-full max-w-sm h-12 text-lg">Sign In</Button>
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
        <h1 className="text-2xl font-serif font-bold">Your Orders</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-card rounded-2xl"></div>
          <div className="h-32 bg-card rounded-2xl"></div>
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-serif font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">When you place an order, it will appear here.</p>
          <Link href="/menu">
            <Button className="rounded-xl px-8">Browse Menu</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map(order => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="bg-card border border-border rounded-2xl p-4 active-elevate shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs text-muted-foreground font-mono">#{order.orderNumber}</span>
                    <h3 className="font-semibold text-base capitalize mt-0.5">{order.type} Order</h3>
                  </div>
                  <Badge variant={order.status === 'delivered' || order.status === 'ready' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <div className="text-sm font-medium">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </div>
                  <div className="font-semibold text-primary">
                    €{order.total.toFixed(2)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
