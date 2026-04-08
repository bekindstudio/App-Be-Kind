import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useGetProduct, useAddToShopCart } from "@workspace/api-client-react";
import { ArrowLeft, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/use-auth-store";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const { data: product, isLoading } = useGetProduct(Number(id), { query: { enabled: !!id } });
  const addToCartMutation = useAddToShopCart();
  const { toast } = useToast();
  const token = useAuthStore((state) => state.token);
  const [, setLocation] = useLocation();

  const handleAddToCart = () => {
    if (!token) {
      setLocation("/login");
      return;
    }
    if (!product) return;
    
    addToCartMutation.mutate({ data: { productId: product.id, quantity } }, {
      onSuccess: () => {
        toast({ title: "Added to cart", description: `${quantity}x ${product.name}` });
      },
      onError: (err) => {
        toast({ title: "Failed to add", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading || !product) {
    return (
      <PageTransition className="min-h-screen bg-background flex flex-col">
        <div className="h-[50vh] bg-muted animate-pulse"></div>
        <div className="p-5 space-y-4">
          <div className="h-8 w-2/3 bg-muted animate-pulse rounded"></div>
          <div className="h-20 bg-muted animate-pulse rounded"></div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col pb-24">
      <div className="relative h-[50vh] w-full bg-zinc-100 rounded-b-[2.5rem] overflow-hidden shadow-sm">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => window.history.back()} 
          className="absolute top-6 left-4 z-10 rounded-full bg-background/80 backdrop-blur-md hover:bg-background"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <img 
          src={product.imageUrl || "/images/product-oil.png"} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="px-5 pt-6 flex-1">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-3xl font-serif font-bold leading-tight">{product.name}</h1>
          <span className="text-2xl font-semibold text-secondary">€{product.price.toFixed(2)}</span>
        </div>
        
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">{product.categoryName}</p>

        <p className="text-muted-foreground leading-relaxed mb-6">
          {product.description}
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-40 md:w-[430px] md:left-1/2 md:-translate-x-1/2">
        <Button 
          className="w-full h-14 rounded-xl text-lg shadow-lg hover-elevate bg-secondary text-secondary-foreground hover:bg-secondary/90"
          onClick={handleAddToCart}
          disabled={addToCartMutation.isPending}
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          Add to Bag
        </Button>
      </div>
    </PageTransition>
  );
}
