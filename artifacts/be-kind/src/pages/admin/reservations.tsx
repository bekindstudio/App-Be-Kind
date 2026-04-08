import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminReservations, useUpdateReservationStatus, useAdminCheck } from "@/hooks/use-admin";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Clock, Lock, MapPin, Phone, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const STATUS_LABELS: Record<string, string> = {
  pending: "In attesa", confirmed: "Confermata", cancelled: "Annullata", completed: "Completata",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700", completed: "bg-gray-100 text-gray-600",
};

export default function AdminReservations() {
  const token = useAuthStore((s) => s.token);
  const { data: admin } = useAdminCheck();
  const { data: reservations, isLoading } = useAdminReservations();
  const updateStatus = useUpdateReservationStatus();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("upcoming");

  if (!token || !admin?.isAdmin) {
    return <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center"><Lock className="w-16 h-16 text-muted-foreground mb-4" /><h2 className="text-2xl font-serif font-bold mb-2">Accesso Riservato</h2></PageTransition>;
  }

  const today = new Date().toISOString().split("T")[0];
  const filtered = reservations?.filter((r: any) => {
    if (filter === "upcoming") return r.date >= today && r.status !== "cancelled";
    if (filter === "today") return r.date === today && r.status !== "cancelled";
    if (filter === "past") return r.date < today;
    if (filter === "cancelled") return r.status === "cancelled";
    return true;
  })?.sort((a: any, b: any) => {
    if (a.date === b.date) return a.time.localeCompare(b.time);
    return a.date.localeCompare(b.date);
  }) ?? [];

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => toast({ title: `Prenotazione: ${STATUS_LABELS[status]}` }),
      onError: () => toast({ title: "Errore", variant: "destructive" }),
    });
  };

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center gap-3 mb-4 pt-2">
        <Link href="/admin"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="text-2xl font-serif font-bold">Prenotazioni</h1>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[["today", "Oggi"], ["upcoming", "Prossime"], ["past", "Passate"], ["cancelled", "Annullate"], ["all", "Tutte"]].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${filter === key ? "bg-chart-3 border-chart-3 text-white" : "bg-transparent border-border"}`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-card rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <MapPin className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-serif font-semibold mb-2">Nessuna prenotazione</h2>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r: any) => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm">{r.customerName || r.customerEmail}</h3>
                  <Badge className={`mt-1 text-[10px] ${STATUS_COLORS[r.status] || ""}`}>{STATUS_LABELS[r.status] || r.status}</Badge>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(r.date + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    {r.time}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {r.guests} ospiti</div>
                {r.customerPhone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {r.customerPhone}</div>}
              </div>
              {r.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{r.notes}"</p>}

              {r.status !== "cancelled" && r.status !== "completed" && (
                <div className="flex gap-2 mt-3">
                  {r.status === "pending" && (
                    <button onClick={() => handleStatusChange(r.id, "confirmed")} className="flex-1 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      Conferma
                    </button>
                  )}
                  <button onClick={() => handleStatusChange(r.id, "completed")} className="flex-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    Completata
                  </button>
                  <button onClick={() => handleStatusChange(r.id, "cancelled")} className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                    Annulla
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
