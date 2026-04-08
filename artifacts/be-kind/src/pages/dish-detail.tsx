import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useGetDish, useAddToCart } from "@workspace/api-client-react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/use-auth-store";

export default function DishDetail() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const { data: dish, isLoading } = useGetDish(Number(id), { query: { enabled: !!id } });
  const addToCartMutation = useAddToCart();
  const { toast } = useToast();
  const token = useAuthStore((state) => state.token);
  const [, setLocation] = useLocation();

  const handleAddToCart = () => {
    if (!token) {
      setLocation("/login");
      return;
    }
    if (!dish) return;
    
    addToCartMutation.mutate({ data: { dishId: dish.id, quantity } }, {
      onSuccess: () => {
        toast({ title: "Aggiunto al carrello", description: `${quantity}x ${dish.name}` });
        window.history.back();
      },
      onError: (err) => {
        toast({ title: "Errore nell'aggiunta", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading || !dish) {
    return (
      <PageTransition className="min-h-screen bg-background flex flex-col">
        <div className="h-64 bg-muted animate-pulse rounded-b-[2rem]"></div>
        <div className="p-4 space-y-4">
          <div className="h-8 w-2/3 bg-muted animate-pulse rounded"></div>
          <div className="h-4 w-1/3 bg-muted animate-pulse rounded"></div>
          <div className="h-20 bg-muted animate-pulse rounded-xl"></div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col pb-24">
      <div className="relative h-[40vh] w-full bg-zinc-100 rounded-b-[2.5rem] overflow-hidden shadow-sm">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => window.history.back()} 
          className="absolute top-6 left-4 z-10 rounded-full bg-background/80 backdrop-blur-md hover:bg-background"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <img 
          src={dish.imageUrl || "/images/dish-pizza.png"} 
          alt={dish.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="px-5 pt-6 flex-1">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-3xl font-serif font-bold leading-tight">{dish.name}</h1>
          <span className="text-2xl font-semibold text-primary">€{dish.price.toFixed(2)}</span>
        </div>
        
        {dish.averageRating && (
          <div className="flex items-center gap-1 text-sm font-medium mb-4 text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span>{dish.averageRating} ({dish.reviewCount} {dish.reviewCount === 1 ? 'recensione' : 'recensioni'})</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {dish.dietaryTags?.map(tag => (
            <Badge key={tag} variant="secondary" className="bg-secondary/10 text-secondary border-none">
              {tag}
            </Badge>
          ))}
        </div>

        <p className="text-muted-foreground leading-relaxed mb-6">
          {dish.description}
        </p>

        {dish.ingredients && dish.ingredients.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2 font-serif text-lg">Ingredienti</h3>
            <p className="text-sm text-muted-foreground">{dish.ingredients.join(", ")}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-40 md:w-[430px] md:left-1/2 md:-translate-x-1/2">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-between bg-muted/50 rounded-full p-1 border border-border">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full w-10 h-10 hover:bg-background shadow-sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-10 text-center font-semibold text-lg">{quantity}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full w-10 h-10 hover:bg-background shadow-sm"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            className="flex-1 h-14 rounded-full text-lg shadow-lg hover-elevate"
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Aggiungi all'Ordine
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
