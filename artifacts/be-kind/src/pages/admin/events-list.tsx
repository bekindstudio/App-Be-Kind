import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminEvents, useDeleteEvent, useAdminCheck } from "@/hooks/use-admin";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Edit2, Lock, Plus, Trash2, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";

export default function AdminEvents() {
  const token = useAuthStore((s) => s.token);
  const { data: admin } = useAdminCheck();
  const { data: events, isLoading } = useAdminEvents();
  const deleteMutation = useDeleteEvent();
  const { toast } = useToast();

  if (!token || !admin?.isAdmin) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Accesso Riservato</h2>
      </PageTransition>
    );
  }

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Eliminare "${title}"?`)) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: "Evento eliminato" }),
      onError: () => toast({ title: "Errore nell'eliminazione", variant: "destructive" }),
    });
  };

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-serif font-bold">Eventi</h1>
        </div>
        <Link href="/admin/eventi/nuovo">
          <Button size="sm" className="rounded-full gap-2">
            <Plus className="w-4 h-4" /> Nuovo
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-card rounded-xl" />)}
        </div>
      ) : !events || events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-serif font-semibold mb-2">Nessun evento</h2>
          <p className="text-muted-foreground mb-4">Crea il primo evento.</p>
          <Link href="/admin/eventi/nuovo">
            <Button className="rounded-xl">Crea Evento</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event: any) => (
            <div key={event.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-semibold truncate">{event.title}</h3>
                  <Badge variant="secondary" className="text-[10px] mt-1">{event.category}</Badge>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <Link href={`/admin/eventi/${event.id}`}>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-secondary hover:bg-secondary/10">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost" size="icon"
                    className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(event.id, event.title)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{new Date(event.date).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-secondary" />
                  <span>{event.startTime} - {event.endTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{event.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="font-medium text-primary">{event.isFree ? "Gratis" : `€${event.price}`}</span>
                <span className="text-muted-foreground">· Max {event.maxParticipants} partecipanti</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
