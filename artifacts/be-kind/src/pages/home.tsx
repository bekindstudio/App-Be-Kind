import { PageTransition } from "@/components/page-transition";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetFeaturedDishes, useGetMe, useGetCart } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, ShoppingBag, UtensilsCrossed, Bike, Bell, Sparkles, MapPin, Clock, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

export default function Home() {
  const token = useAuthStore((state) => state.token);
  const { data: user } = useGetMe({ query: { enabled: !!token } });
  const { data: featuredDishes } = useGetFeaturedDishes();
  const { data: cart } = useGetCart({ query: { enabled: !!token } });
  const cartCount = cart?.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
  const { data: events } = useQuery<any[]>({
    queryKey: ["events-home"],
    queryFn: () => customFetch<any[]>("/api/events?upcoming=true"),
  });
  const [animateLogo, setAnimateLogo] = useState(false);

  useEffect(() => {
    setAnimateLogo(true);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buongiorno";
    if (h < 18) return "Buon pomeriggio";
    return "Buonasera";
  };

  return (
    <PageTransition className="flex flex-col min-h-full bg-background">
      <div className="px-5 pt-10 pb-4 flex justify-between items-center bg-background/80 backdrop-blur-xl sticky top-0 z-20 border-b border-border/30">
        <div className={`transition-all duration-1000 ease-out transform origin-left ${animateLogo ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}>
          <img src={`${BASE}logo-terracotta.png`} alt="Be Kind Logo" className="h-9 w-auto object-contain" />
        </div>
        <div className="flex gap-2.5">
          <button className="w-10 h-10 rounded-2xl bg-card text-foreground shadow-sm flex items-center justify-center hover:bg-card/80 transition-all active:scale-95 border border-border/50">
            <Bell size={19} strokeWidth={1.8} />
          </button>
          <Link href="/cart">
            <div className="relative w-10 h-10 rounded-2xl bg-card text-foreground shadow-sm flex items-center justify-center hover:bg-card/80 transition-all active:scale-95 border border-border/50">
              <ShoppingCart size={19} strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
          </Link>
          <Link href={token ? "/profile" : "/login"}>
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-border/50 shadow-sm transition-transform active:scale-95 bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">
              {user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : '👤'}
            </div>
          </Link>
        </div>
      </div>

      <div className="flex-1 px-5 pb-24">
        <div className="mb-6 mt-5">
          <h1 className="font-serif text-[28px] leading-tight text-foreground">
            {user ? `${greeting()}, ${user.firstName}` : `${greeting()}`} <br />
            <span className="text-primary font-bold">Coltiva la gentilezza.</span>
          </h1>
        </div>

        <Link href="/menu">
          <div className="relative w-full h-56 rounded-[24px] overflow-hidden shadow-lg cursor-pointer mb-7 group">
            <img
              src="https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1000&auto=format&fit=crop"
              alt="Promo"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-5">
              <span className="bg-primary text-white text-[9px] font-bold px-3 py-1 rounded-full w-fit mb-2 shadow-sm tracking-widest uppercase">Menu Primavera</span>
              <h4 className="text-white font-serif font-bold text-2xl mb-0.5">Nuovi Sapori</h4>
              <div className="flex items-center gap-2 text-white/80 text-sm font-medium group-hover:translate-x-1 transition-transform">
                <span>Scopri i piatti di stagione</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { icon: UtensilsCrossed, label: "Menu", href: "/menu", color: "bg-primary/10 text-primary" },
            { icon: Calendar, label: "Prenota", href: "/reservations/new", color: "bg-secondary/10 text-secondary" },
            { icon: ShoppingBag, label: "Bottega", href: "/shop", color: "bg-accent text-accent-foreground" },
            { icon: Bike, label: "Delivery", href: "/orders", color: "bg-primary/10 text-primary" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col items-center gap-2 group">
                <div className={`w-[60px] h-[60px] rounded-[18px] ${item.color} shadow-sm flex items-center justify-center group-active:scale-90 transition-all border border-border/30`}>
                  <item.icon size={23} strokeWidth={1.8} />
                </div>
                <span className="text-[11px] font-semibold text-foreground/70 group-hover:text-foreground transition-colors">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {featuredDishes && featuredDishes.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <h3 className="font-serif font-bold text-lg text-foreground">Speciali del Giorno</h3>
              <Link href="/menu">
                <span className="text-primary text-xs font-bold hover:underline">Vedi tutti</span>
              </Link>
            </div>
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
              {featuredDishes.map((dish) => (
                <Link key={dish.id} href={`/menu/${dish.id}`}>
                  <div className="min-w-[180px] bg-card rounded-[20px] overflow-hidden shadow-sm cursor-pointer group hover:shadow-md transition-all border border-border/50 active:scale-[0.97]">
                    <div className="h-28 overflow-hidden relative bg-muted">
                      {dish.imageUrl && <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                      {!dish.imageUrl && <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed size={26} className="text-muted-foreground/30" /></div>}
                      <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-sm">
                        <span className="text-xs font-bold text-primary">€{Number(dish.price).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-serif font-bold text-foreground text-sm leading-tight mb-1 line-clamp-1">{dish.name}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{dish.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {events && events.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <h3 className="font-serif font-bold text-lg text-foreground">Eventi & Workshop</h3>
              <Link href="/events">
                <span className="text-primary text-xs font-bold hover:underline">Vedi tutti</span>
              </Link>
            </div>
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5">
              {events.slice(0, 4).map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="min-w-[240px] bg-card rounded-[22px] overflow-hidden shadow-sm border border-border/50 cursor-pointer group hover:shadow-md transition-all active:scale-[0.98]">
                    <div className="h-32 overflow-hidden relative bg-muted">
                      {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                      {!event.imageUrl && <div className="w-full h-full flex items-center justify-center"><Calendar size={30} className="text-muted-foreground/30" /></div>}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg shadow-sm">
                        <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">{event.category || 'Evento'}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-serif font-bold text-foreground text-base mb-1.5 truncate">{event.title}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Calendar size={13} className="text-primary" />
                        {event.date ? new Date(event.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Da definire'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!token && (
          <div className="bg-gradient-to-br from-secondary via-secondary/90 to-secondary/70 text-white rounded-[24px] p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/8 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="relative z-10 w-3/4">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                <Sparkles size={20} />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2">Unisciti alla Famiglia</h3>
              <p className="text-sm text-white/70 mb-5 leading-relaxed">
                Accumula punti, sblocca cene esclusive e ricevi un regalo per il tuo compleanno.
              </p>
              <Link href="/register">
                <button className="bg-white text-secondary font-bold py-3 px-6 rounded-2xl shadow-md hover:bg-white/90 transition-colors text-sm active:scale-95">
                  Registrati Ora
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
