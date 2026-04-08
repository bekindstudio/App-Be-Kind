import { PageTransition } from "@/components/page-transition";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { ChevronLeft, Calendar, Clock, MapPin, Users, Share2, Info, Ticket, ExternalLink } from "lucide-react";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
  const [ticketQuantity, setTicketQuantity] = useState(1);

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
        <div className="h-[350px] bg-muted animate-pulse" />
      </PageTransition>
    );
  }

  const spotsLeft = event.maxParticipants - event.currentParticipants;
  const isWix = event.isWixEvent;
  const hasTickets = event.wixTickets && event.wixTickets.length > 0;
  const ticketsOnSale = event.wixTickets?.some(t => t.saleStatus === "SALE_STARTED");
  const progressPercentage = event.maxParticipants > 0 ? (event.currentParticipants / event.maxParticipants) * 100 : 0;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" });
    } catch {
      return dateStr;
    }
  };

  return (
    <PageTransition className="flex flex-col min-h-full bg-background relative">
      <div className="absolute top-0 left-0 right-0 z-30 px-6 pt-12 flex justify-between items-center pointer-events-none">
        <button onClick={() => window.history.back()} className="pointer-events-auto w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-soft text-secondary hover:bg-white transition-colors active:scale-95">
          <ChevronLeft size={24} />
        </button>
        <button className="pointer-events-auto w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-soft text-secondary hover:bg-white transition-colors active:scale-95">
          <Share2 size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="h-[350px] w-full relative group">
          <img
            src={event.imageUrl || "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1000&auto=format&fit=crop"}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/10 pointer-events-none" />
          <div className="absolute bottom-12 left-6">
            <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm mb-2 inline-block backdrop-blur-sm">{event.category}</span>
          </div>
        </div>

        <div className="px-6 -mt-6 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <h1 className="font-serif font-bold text-3xl text-foreground leading-tight max-w-[70%]">{event.title}</h1>
            <div className="text-right bg-white/50 px-3 py-2 rounded-xl backdrop-blur-sm shadow-soft">
              <span className="block font-bold text-2xl text-secondary">{event.isFree ? "Gratis" : `€${event.price.toFixed(2)}`}</span>
              {!event.isFree && <span className="text-xs text-gray-500">a persona</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-secondary/10 flex items-center gap-3">
              <div className="bg-[#FFFBF5] p-2.5 rounded-xl text-primary">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Data</p>
                <p className="text-sm font-bold text-foreground">{formatDate(event.date)}</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-secondary/10 flex items-center gap-3">
              <div className="bg-[#FFFBF5] p-2.5 rounded-xl text-primary">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Orario</p>
                <p className="text-sm font-bold text-foreground">{event.startTime} - {event.endTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-sm border border-secondary/10 flex items-center gap-3 mb-6">
            <div className="bg-[#FFFBF5] p-2.5 rounded-xl text-primary">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Luogo</p>
              <p className="text-sm font-bold text-foreground">{event.location}</p>
            </div>
          </div>

          {!isWix && event.maxParticipants > 0 && (
            <div className="mb-8 bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 text-secondary font-bold text-sm">
                  <Users size={16} />
                  <span>Disponibilità</span>
                </div>
                <span className="text-xs font-bold text-primary">{spotsLeft} posti rimasti</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {hasTickets && (
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
              <h3 className="font-serif text-lg font-bold mb-3 flex items-center gap-2 text-secondary">
                <Ticket size={20} className="text-primary" />
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

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Info size={18} className="text-secondary" />
              <h3 className="font-bold text-foreground text-lg">Dettagli Evento</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium">
              {event.description}
            </p>
          </div>

          {isWix && (
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-amber-800">Prenotazione e Pagamento</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Il biglietto è una prevendita per la partecipazione. Il saldo va effettuato in loco il giorno dell'evento.
                    Clicca "Prenota e Paga" per completare l'acquisto sul sito ufficiale.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 pb-8 z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.08)]">
        {isWix && event.wixTicketUrl ? (
          <button
            onClick={handleWixBooking}
            disabled={!ticketsOnSale && hasTickets}
            className="w-full bg-secondary text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Ticket size={20} />
            {!ticketsOnSale && hasTickets ? "Vendita non disponibile" : "Prenota e Paga"}
            <ExternalLink size={16} />
          </button>
        ) : (
          <button
            onClick={handleRegister}
            disabled={registerMutation.isPending || event.isFull || event.isRegistered}
            className="w-full bg-secondary text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {event.isRegistered ? "Già Iscritto" : event.isFull ? "Evento Completo" : "Prenota il Posto"}
          </button>
        )}
      </div>
    </PageTransition>
  );
}
