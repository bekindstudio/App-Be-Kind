import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useGetEvent, useRegisterForEvent } from "@workspace/api-client-react";
import { ArrowLeft, Calendar, Clock, MapPin, Users } from "lucide-react";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/use-auth-store";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useGetEvent(Number(id), { query: { enabled: !!id } });
  const registerMutation = useRegisterForEvent();
  const { toast } = useToast();
  const token = useAuthStore((state) => state.token);

  const handleRegister = () => {
    if (!token) {
      toast({ title: "Please sign in to register", variant: "destructive" });
      return;
    }
    registerMutation.mutate({ data: { eventId: Number(id) } }, {
      onSuccess: () => {
        toast({ title: "Registered Successfully", description: "You are on the list!" });
      },
      onError: (err) => {
        toast({ title: "Registration failed", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading || !event) {
    return (
      <PageTransition className="min-h-screen bg-background flex flex-col">
        <div className="h-64 bg-muted animate-pulse rounded-b-[2.5rem]"></div>
      </PageTransition>
    );
  }

  const spotsLeft = event.maxParticipants - event.currentParticipants;

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col pb-24">
      <div className="relative h-[40vh] w-full bg-zinc-900 rounded-b-[2.5rem] overflow-hidden shadow-sm">
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
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 to-transparent"></div>
        <div className="absolute bottom-6 left-5 pr-5">
          <Badge className="bg-primary text-primary-foreground mb-3 font-semibold">{event.category}</Badge>
          <h1 className="text-3xl font-serif font-bold text-white leading-tight">{event.title}</h1>
        </div>
      </div>

      <div className="px-5 pt-6 flex-1 space-y-6">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Date</p>
              <p className="font-medium">{new Date(event.date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Time</p>
              <p className="font-medium">{event.startTime}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 col-span-2">
            <MapPin className="w-5 h-5 text-chart-3 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Location</p>
              <p className="font-medium">{event.location}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-serif text-xl font-bold mb-3">About this event</h3>
          <p className="text-muted-foreground leading-relaxed">
            {event.description}
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-40 md:w-[430px] md:left-1/2 md:-translate-x-1/2">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{spotsLeft} spots left</span>
          </div>
          <div className="font-bold text-xl">
            {event.isFree ? "Free" : `€${event.price.toFixed(2)}`}
          </div>
        </div>
        <Button 
          className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover-elevate"
          onClick={handleRegister}
          disabled={registerMutation.isPending || event.isFull || event.isRegistered}
        >
          {event.isRegistered ? "Already Registered" : event.isFull ? "Event Full" : "Reserve Spot"}
        </Button>
      </div>
    </PageTransition>
  );
}
