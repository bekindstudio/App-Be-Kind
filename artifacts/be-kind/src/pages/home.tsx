import { PageTransition } from "@/components/page-transition";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetFeaturedDishes, useGetMe } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, ShoppingBag, UtensilsCrossed, Bike, Bell } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";

const LOGO_COLOR_URI = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 80'%3E%3Cstyle%3E@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600');%3C/style%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='Fredoka, sans-serif' font-weight='600' font-size='50' fill='%23C6957C' letter-spacing='2'%3EBE KIND%3C/text%3E%3C/svg%3E";

export default function Home() {
  const token = useAuthStore((state) => state.token);
  const { data: user } = useGetMe({ query: { enabled: !!token } });
  const { data: featuredDishes } = useGetFeaturedDishes();
  const { data: events } = useQuery<any[]>({
    queryKey: ["events-home"],
    queryFn: () => customFetch<any[]>("/api/events?upcoming=true"),
  });
  const [animateLogo, setAnimateLogo] = useState(false);

  useEffect(() => {
    setAnimateLogo(true);
  }, []);

  return (
    <PageTransition className="flex flex-col min-h-full bg-background">
      <div className="px-6 pt-12 pb-6 flex justify-between items-center bg-background sticky top-0 z-20">
        <div className={`transition-all duration-1000 ease-out transform origin-left ${animateLogo ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}>
          <img src={LOGO_COLOR_URI} alt="Be Kind Logo" className="h-14 w-auto object-contain" />
        </div>
        <div className="flex gap-3">
          <button className="w-10 h-10 rounded-full bg-white text-primary shadow-soft flex items-center justify-center hover:bg-primary/5 transition-all active:scale-95">
            <Bell size={20} />
          </button>
          <Link href={token ? "/profile" : "/login"}>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-soft transition-transform active:scale-95 bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : '👤'}
            </div>
          </Link>
        </div>
      </div>

      <div className="flex-1 px-6 pb-24">
        <div className="mb-8 mt-2">
          <h1 className="font-serif text-3xl text-secondary leading-tight">
            {user ? `Ciao ${user.firstName},` : 'Buongiorno,'} <br />
            <span className="font-bold text-primary">Coltiva la gentilezza.</span>
          </h1>
        </div>

        <Link href="/menu">
          <div className="relative w-full h-64 rounded-[32px] overflow-hidden shadow-soft cursor-pointer mb-8 group">
            <img
              src="https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1000&auto=format&fit=crop"
              alt="Promo"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#676959]/90 to-transparent flex flex-col justify-end p-6">
              <span className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full w-fit mb-2 shadow-sm tracking-wide uppercase">Menu Primavera</span>
              <h4 className="text-white font-serif font-bold text-2xl mb-1">Nuovi Sapori</h4>
              <div className="flex items-center gap-2 text-white/90 text-sm font-medium group-hover:translate-x-1 transition-transform">
                <span>Scopri i piatti di stagione</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { icon: UtensilsCrossed, label: "Menu", href: "/menu" },
            { icon: Calendar, label: "Prenota", href: "/reservations/new" },
            { icon: ShoppingBag, label: "Shop", href: "/shop" },
            { icon: Bike, label: "Delivery", href: "/orders" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-soft flex items-center justify-center text-secondary group-active:scale-90 transition-all border-2 border-transparent group-hover:border-primary/20 group-hover:text-primary">
                  <item.icon size={24} strokeWidth={2} />
                </div>
                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {featuredDishes && featuredDishes.length > 0 && (
          <div className="mb-10">
            <div className="flex justify-between items-end mb-4">
              <h3 className="font-serif font-bold text-xl text-secondary">Speciali del Giorno</h3>
              <Link href="/menu">
                <span className="text-primary text-xs font-bold hover:underline">Vedi tutti</span>
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
              {featuredDishes.map((dish) => (
                <Link key={dish.id} href={`/menu/${dish.id}`}>
                  <div className="min-w-[200px] bg-white rounded-2xl overflow-hidden shadow-soft cursor-pointer group hover:shadow-card transition-shadow border border-gray-50">
                    <div className="h-28 overflow-hidden relative bg-secondary/10">
                      {dish.imageUrl && <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                      {!dish.imageUrl && <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed size={28} className="text-secondary/30" /></div>}
                      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <span className="text-xs font-bold text-primary">€{Number(dish.price).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-serif font-bold text-foreground text-sm leading-tight mb-1 line-clamp-1">{dish.name}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{dish.description}</p>
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
              <h3 className="font-serif font-bold text-xl text-secondary">Eventi & Workshop</h3>
              <Link href="/events">
                <span className="text-primary text-xs font-bold hover:underline">Vedi tutti</span>
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-6 px-6">
              {events.slice(0, 4).map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="min-w-[260px] bg-white rounded-3xl overflow-hidden shadow-card border border-gray-50 cursor-pointer group hover:shadow-lg transition-shadow">
                    <div className="h-36 overflow-hidden relative bg-secondary/10">
                      {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                      {!event.imageUrl && <div className="w-full h-full flex items-center justify-center"><Calendar size={32} className="text-secondary/30" /></div>}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg shadow-sm">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">{event.location ? 'Evento' : 'Workshop'}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h4 className="font-serif font-bold text-foreground text-lg mb-1 truncate">{event.title}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Calendar size={14} className="text-primary" />
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
          <div className="bg-secondary text-secondary-foreground rounded-3xl p-6 relative overflow-hidden shadow-soft">
            <div className="relative z-10 w-2/3">
              <h3 className="font-serif text-xl font-bold mb-2">Unisciti alla Famiglia</h3>
              <p className="text-sm text-secondary-foreground/80 mb-4">
                Accumula punti, sblocca cene esclusive e ricevi un regalo per il tuo compleanno.
              </p>
              <Link href="/register">
                <button className="bg-white text-foreground font-bold py-3 px-5 rounded-full shadow-sm hover:bg-background transition-colors text-sm active:scale-95">
                  Registrati Ora
                </button>
              </Link>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-secondary-foreground/10 rounded-full blur-2xl" />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
