import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, ExternalLink, Ticket } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
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

  const formatFullDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border pt-6 pb-4 px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold">Esperienze</h1>
            <p className="text-sm text-muted-foreground">Workshop, eventi e momenti speciali</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex-1 flex flex-col gap-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-64 bg-card rounded-2xl"></div>
            <div className="h-64 bg-card rounded-2xl"></div>
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
              <div className="bg-card border border-border rounded-2xl overflow-hidden active-elevate shadow-sm">
                <div className="h-48 w-full relative bg-muted">
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <CalendarIcon className="w-10 h-10 text-primary" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-primary text-primary-foreground border-none shadow-sm font-semibold text-xs">
                      {event.category}
                    </Badge>
                    {event.isWixEvent && (
                      <Badge className="bg-secondary text-secondary-foreground border-none shadow-sm text-xs">
                        <Ticket className="w-3 h-3 mr-1" />
                        Biglietti
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-background text-foreground hover:bg-background border-none shadow-sm font-semibold">
                      {formatDate(event.date)}
                    </Badge>
                  </div>
                  {event.wixStatus === "UPCOMING" && event.wixTicketUrl && (
                    <div className="absolute bottom-3 right-3">
                      <Badge className="bg-green-600 text-white border-none shadow-sm text-xs">
                        Prenotabile
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif font-bold text-lg leading-tight flex-1 pr-2">{event.title}</h3>
                    <span className="font-semibold text-primary whitespace-nowrap">
                      {event.isFree ? "Gratis" : `€${event.price}`}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                      <span>{formatFullDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-secondary" />
                    <span className="truncate">{event.location}</span>
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
