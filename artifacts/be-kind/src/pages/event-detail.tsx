import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { ArrowLeft, Calendar, Clock, MapPin, Users, ExternalLink, Ticket, Info, Euro } from "lucide-react";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface WixTicket {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  free: boolean;
  saleStatus: string;
}

interface EventDetail {
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
  wixTickets?: WixTicket[];
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery<EventDetail>({
    queryKey: ["event", id],
    queryFn: () => customFetch<EventDetail>(`/api/events/${id}`),
    enabled: !!id,
  });

  const registerMutation = useMutation({
    mutationFn: (body: any) =>
      customFetch(`/api/events/${id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast({ title: "Iscrizione confermata!", description: "Sei nella lista! +30 punti fedeltà" });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    },
  });

  const handleRegister = () => {
    if (!token) {
      toast({ title: "Accedi per iscriverti", variant: "destructive" });
      return;
    }
    registerMutation.mutate({ eventId: Number(id) });
  };

  const handleWixBooking = () => {
    if (event?.wixTicketUrl) {
      window.open(event.wixTicketUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading || !event) {
    return (
      <PageTransition className="min-h-screen bg-background flex flex-col">
        <div className="h-64 bg-muted animate-pulse rounded-b-[2.5rem]"></div>
      </PageTransition>
    );
  }

  const spotsLeft = event.maxParticipants - event.currentParticipants;
  const isWix = event.isWixEvent;
  const hasTickets = event.wixTickets && event.wixTickets.length > 0;
  const ticketsOnSale = event.wixTickets?.some(t => t.saleStatus === "SALE_STARTED");

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col pb-32">
      <div className="relative h-[45vh] w-full bg-zinc-900 rounded-b-[2.5rem] overflow-hidden shadow-sm">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => window.history.back()}
          className="absolute top-6 left-4 z-10 rounded-full bg-background/80 backdrop-blur-md hover:bg-background"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <img
          src={event.imageUrl || "/images/event-wine.png"}
          alt={event.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/30 to-transparent" />
        <div className="absolute bottom-6 left-5 pr-5">
          <div className="flex gap-2 mb-3 flex-wrap">
            <Badge className="bg-primary text-primary-foreground font-semibold">{event.category}</Badge>
            {isWix && (
              <Badge className="bg-secondary text-secondary-foreground font-semibold">
                <Ticket className="w-3 h-3 mr-1" />
                Evento Wix
              </Badge>
            )}
            {event.wixStatus === "UPCOMING" && (
              <Badge className="bg-green-600 text-white font-semibold">In arrivo</Badge>
            )}
          </div>
          <h1 className="text-3xl font-serif font-bold text-white leading-tight">{event.title}</h1>
        </div>
      </div>

      <div className="px-5 pt-6 flex-1 space-y-5">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Data</p>
              <p className="font-medium text-sm">{formatDate(event.date)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Orario</p>
              <p className="font-medium">{event.startTime} - {event.endTime}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 col-span-2">
            <MapPin className="w-5 h-5 text-chart-3 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Luogo</p>
              <p className="font-medium">{event.location}</p>
            </div>
          </div>
        </div>

        {hasTickets && (
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <h3 className="font-serif text-lg font-bold mb-3 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Biglietti Disponibili
            </h3>
            <div className="space-y-3">
              {event.wixTickets!.map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{ticket.name}</p>
                    {ticket.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ticket.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-bold text-primary">
                      {ticket.free ? "Gratis" : `€${parseFloat(ticket.price).toFixed(2)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.saleStatus === "SALE_STARTED" ? "In vendita" :
                       ticket.saleStatus === "SALE_ENDED" ? "Vendita terminata" :
                       ticket.saleStatus === "CLOSED_MANUALLY" ? "Chiuso" :
                       ticket.saleStatus === "SALE_SCHEDULED" ? "Prossimamente" : ticket.saleStatus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-serif text-xl font-bold mb-3">Informazioni</h3>
          <p className="text-muted-foreground leading-relaxed">
            {event.description}
          </p>
        </div>

        {isWix && (
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">Prenotazione e Pagamento</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Il biglietto è una prevendita per la partecipazione. Il saldo va effettuato in loco il giorno dell'evento.
                  Clicca "Prenota e Paga" per completare l'acquisto sul sito ufficiale.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-40 md:w-[430px] md:left-1/2 md:-translate-x-1/2">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            {isWix ? (
              <>
                <Euro className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Prevendita online</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {spotsLeft} {spotsLeft === 1 ? "posto disponibile" : "posti disponibili"}
                </span>
              </>
            )}
          </div>
          <div className="font-bold text-xl">
            {event.isFree ? "Gratis" : `€${event.price.toFixed(2)}`}
          </div>
        </div>

        {isWix && event.wixTicketUrl ? (
          <Button
            className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover-elevate gap-2"
            onClick={handleWixBooking}
            disabled={!ticketsOnSale && hasTickets}
          >
            <Ticket className="w-5 h-5" />
            {!ticketsOnSale && hasTickets ? "Vendita non disponibile" : "Prenota e Paga"}
            <ExternalLink className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover-elevate"
            onClick={handleRegister}
            disabled={registerMutation.isPending || event.isFull || event.isRegistered}
          >
            {event.isRegistered ? "Già Iscritto" : event.isFull ? "Evento Completo" : "Prenota il Posto"}
          </Button>
        )}
      </div>
    </PageTransition>
  );
}
