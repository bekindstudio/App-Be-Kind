import { PageTransition } from "@/components/page-transition";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { ChevronLeft, Calendar as CalendarIcon, Clock, MapPin, ArrowRight, Ticket } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface EventItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  price: number;
  maxParticipants: number;
  currentParticipants: number;
  isFull: boolean;
  isFree: boolean;
  isRegistered: boolean;
  wixEventId: string | null;
  wixSlug: string | null;
  wixTicketUrl: string | null;
  wixStatus: string | null;
  isWixEvent: boolean;
}

export default function Events() {
  const { data: events, isLoading } = useQuery<EventItem[]>({
    queryKey: ["events"],
    queryFn: () => customFetch<EventItem[]>("/api/events?upcoming=true"),
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" });
    } catch {
      return dateStr;
    }
  };

  return (
    <PageTransition className="flex flex-col min-h-full bg-background">
      <div className="px-5 pt-10 pb-3 flex items-center justify-between bg-background/80 backdrop-blur-xl sticky top-0 z-10 border-b border-border/30">
        <button onClick={() => window.history.back()} className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center shadow-sm text-foreground active:scale-95 transition-transform border border-border/50">
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-lg font-serif font-bold text-foreground">Eventi Be Kind</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 pt-4 no-scrollbar">
        {isLoading ? (
          <div className="space-y-5 animate-pulse">
            <div className="h-72 bg-card rounded-[24px] shadow-sm" />
            <div className="h-72 bg-card rounded-[24px] shadow-sm" />
          </div>
        ) : !events || events.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <CalendarIcon className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-serif font-bold mb-2">Nessun evento in programma</h2>
            <p className="text-muted-foreground text-sm">Torna più tardi per le nuove esperienze.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {events.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="bg-card rounded-[24px] overflow-hidden shadow-sm border border-border/30 group cursor-pointer active:scale-[0.98] transition-all hover:shadow-md">
                  <div className="h-40 relative overflow-hidden">
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <CalendarIcon className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl shadow-sm">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">{event.category}</span>
                    </div>
                    {event.isWixEvent && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-sm">
                        <Ticket size={14} className="text-primary" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                      <h3 className="font-serif font-bold text-xl text-white leading-tight">{event.title}</h3>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-col gap-2.5 mb-4">
                      <div className="flex items-center gap-3 text-foreground/70 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <CalendarIcon size={15} className="text-primary" />
                        </div>
                        <span className="font-medium">{formatDate(event.date)}</span>
                        <span className="text-border">|</span>
                        <Clock size={14} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{event.startTime} - {event.endTime}</span>
                      </div>
                      <div className="flex items-center gap-3 text-foreground/70 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                          <MapPin size={15} className="text-secondary" />
                        </div>
                        <span className="font-medium truncate">{event.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Prezzo</span>
                        <div className="font-bold text-secondary text-lg">{event.isFree ? "Gratis" : `€${event.price.toFixed(2)}`}</div>
                      </div>
                      <div className="bg-primary/10 text-primary font-bold px-5 py-2.5 rounded-2xl text-sm flex items-center gap-2 group-hover:bg-primary group-hover:text-white transition-colors">
                        Dettagli <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
