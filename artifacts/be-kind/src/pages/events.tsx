import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useGetEvents } from "@workspace/api-client-react";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Events() {
  const { data: events, isLoading } = useGetEvents();

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border pt-6 pb-4 px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-serif font-bold">Esperienze</h1>
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
                <div className="h-40 w-full relative bg-muted">
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <CalendarIcon className="w-10 h-10 text-primary" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge className="bg-background text-foreground hover:bg-background border-none shadow-sm font-semibold">
                      {new Date(event.date).toLocaleDateString("it-IT", { month: 'short', day: 'numeric' })}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif font-bold text-xl">{event.title}</h3>
                    <span className="font-semibold text-primary">
                      {event.isFree ? 'Gratis' : `€${event.price}`}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {event.description}
                  </p>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-secondary" />
                      <span>{event.location}</span>
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
