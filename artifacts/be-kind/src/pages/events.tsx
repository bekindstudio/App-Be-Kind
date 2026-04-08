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
      <div className="px-6 pt-12 pb-4 flex items-center justify-between bg-background sticky top-0 z-10">
        <button onClick={() => window.history.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft text-secondary hover:bg-white/50 transition-colors active:scale-95">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-serif font-bold text-foreground">Eventi Be Kind</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-72 bg-white rounded-3xl shadow-soft"></div>
            <div className="h-72 bg-white rounded-3xl shadow-soft"></div>
          </div>
        ) : !events || events.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <CalendarIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-serif font-semibold mb-2">Nessun evento in programma</h2>
            <p className="text-muted-foreground">Torna più tardi per le nuove esperienze.</p>
          </div>
        ) : (
          events.map(event => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="bg-white rounded-3xl overflow-hidden shadow-soft mb-6 group cursor-pointer active:scale-[0.98] transition-all">
                <div className="h-44 relative overflow-hidden">
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
                      <CalendarIcon className="w-10 h-10 text-secondary" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg shadow-sm">
                    <span className="text-xs font-bold text-secondary uppercase">{event.category}</span>
                  </div>
                  {event.isWixEvent && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm">
                      <Ticket size={14} className="text-primary" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10">
                    <h3 className="font-serif font-bold text-xl text-white leading-tight">{event.title}</h3>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-col gap-3 mb-5">
                    <div className="flex items-center gap-3 text-gray-600 text-sm">
                      <CalendarIcon size={18} className="text-primary" />
                      <span className="font-medium">{formatDate(event.date)}</span>
                      <span className="text-gray-300">|</span>
                      <Clock size={16} className="text-muted-foreground" />
                      <span className="text-xs">{event.startTime} - {event.endTime}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 text-sm">
                      <MapPin size={18} className="text-primary" />
                      <span className="font-medium truncate">{event.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Prezzo</span>
                      <div className="font-bold text-secondary text-lg">{event.isFree ? "Gratis" : `€${event.price.toFixed(2)}`}</div>
                    </div>
                    <div className="bg-background text-secondary font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 group-hover:bg-secondary group-hover:text-white transition-colors">
                      Dettagli <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </PageTransition>
  );
}
