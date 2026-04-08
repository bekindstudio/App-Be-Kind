import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetFeaturedDishes, useGetMe } from "@workspace/api-client-react";
import { ArrowRight, Calendar, Clock, MapPin, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Link } from "wouter";
import { DishCard } from "@/components/dish-card";

export default function Home() {
  const token = useAuthStore((state) => state.token);
  const { data: user } = useGetMe({ query: { enabled: !!token } });
  
  const { data: featuredDishes } = useGetFeaturedDishes();

  return (
    <PageTransition className="pb-8">
      <div className="relative h-[300px] w-full rounded-b-[2.5rem] overflow-hidden bg-zinc-900">
        <img 
          src="/images/event-wine.png" 
          alt="Cortile Be Kind" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-4xl font-serif font-bold mb-2">Be Kind.</h1>
          <p className="text-zinc-200">
            {user ? `Bentornato, ${user.firstName}` : "Osteria & Lifestyle"}
          </p>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-10 grid grid-cols-2 gap-3">
        <Link href="/menu">
          <div className="bg-card rounded-2xl p-4 shadow-md border border-border flex flex-col items-center justify-center gap-2 aspect-square active-elevate">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm">Menù & Ordina</span>
          </div>
        </Link>
        <Link href="/reservations/new">
          <div className="bg-card rounded-2xl p-4 shadow-md border border-border flex flex-col items-center justify-center gap-2 aspect-square active-elevate">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm">Prenota Tavolo</span>
          </div>
        </Link>
        <Link href="/shop">
          <div className="bg-card rounded-2xl p-4 shadow-md border border-border flex flex-col items-center justify-center gap-2 aspect-square active-elevate">
            <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center text-accent-foreground">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm">Bottega</span>
          </div>
        </Link>
        <Link href="/events">
          <div className="bg-card rounded-2xl p-4 shadow-md border border-border flex flex-col items-center justify-center gap-2 aspect-square active-elevate">
            <div className="w-12 h-12 rounded-full bg-chart-3/10 flex items-center justify-center text-chart-3">
              <Clock className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm">Esperienze</span>
          </div>
        </Link>
      </div>

      <div className="mt-8 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-serif font-bold">Speciali del Giorno</h2>
          <Link href="/menu">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              Vedi tutti
            </Button>
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {featuredDishes?.map(dish => (
            <DishCard key={dish.id} dish={dish} />
          ))}
          {(!featuredDishes || featuredDishes.length === 0) && (
             <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-border border-dashed">
               Caricamento piatti speciali...
             </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 px-4 mb-4">
        <div className="bg-secondary text-secondary-foreground rounded-2xl p-6 relative overflow-hidden">
          <div className="relative z-10 w-2/3">
            <h3 className="font-serif text-xl font-bold mb-2">Unisciti alla Famiglia</h3>
            <p className="text-sm text-secondary-foreground/80 mb-4">
              Accumula punti, sblocca cene esclusive e ricevi un regalo per il tuo compleanno.
            </p>
            <Link href="/register">
              <Button variant="secondary" className="bg-background text-foreground hover:bg-background/90 rounded-full">
                Registrati Ora
              </Button>
            </Link>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-secondary-foreground/10 rounded-full blur-2xl" />
        </div>
      </div>
    </PageTransition>
  );
}
