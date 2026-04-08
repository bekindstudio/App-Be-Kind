import { PageTransition } from "@/components/page-transition";
import { useAdminCheck } from "@/hooks/use-admin";
import { useGetAdminNotifications, useCreateNotification, useDeleteNotification } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, Plus, Trash2, Send, Bell, Users, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const NOTIFICATION_TYPES = [
  { value: "general", label: "Generale" },
  { value: "promo", label: "Promozione" },
  { value: "order", label: "Ordine" },
  { value: "event", label: "Evento" },
  { value: "loyalty", label: "Fedeltà" },
  { value: "info", label: "Info" },
];

export default function AdminNotifications() {
  useAdminCheck();
  const { data: notifications, isLoading } = useGetAdminNotifications();
  const createMutation = useCreateNotification();
  const deleteMutation = useDeleteNotification();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users } = useQuery<any[]>({
    queryKey: ["admin-users-list"],
    queryFn: () => customFetch<any[]>("/api/admin/users"),
  });

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("general");
  const [targetMode, setTargetMode] = useState<"all" | "user">("all");
  const [targetUserId, setTargetUserId] = useState<number | null>(null);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setType("general");
    setTargetMode("all");
    setTargetUserId(null);
    setShowForm(false);
  };

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Compila tutti i campi", variant: "destructive" });
      return;
    }
    if (targetMode === "user" && !targetUserId) {
      toast({ title: "Seleziona un utente", variant: "destructive" });
      return;
    }

    createMutation.mutate(
      { data: { title, body, type, targetUserId: targetMode === "user" ? targetUserId : null } },
      {
        onSuccess: () => {
          toast({ title: "Notifica inviata!" });
          queryClient.invalidateQueries({ queryKey: ["getAdminNotifications"] });
          resetForm();
        },
        onError: () => {
          toast({ title: "Errore nell'invio", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getAdminNotifications"] });
          toast({ title: "Notifica eliminata" });
        },
      }
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <PageTransition className="flex flex-col min-h-full bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="px-5 pt-10 pb-3 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center shadow-sm text-foreground active:scale-95 transition-transform border border-border/50">
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-lg font-serif font-bold text-foreground">Notifiche</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="px-5 pt-4">
          <div className="bg-card rounded-[20px] border border-border/30 p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Send size={16} />
              <span className="text-sm font-semibold">Nuova Notifica</span>
            </div>

            <input
              placeholder="Titolo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background rounded-xl py-2.5 px-3.5 text-sm outline-none border border-border/50 focus:border-primary/30 transition-all"
            />

            <textarea
              placeholder="Messaggio..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full bg-background rounded-xl py-2.5 px-3.5 text-sm outline-none border border-border/50 focus:border-primary/30 transition-all resize-none"
            />

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo</label>
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      type === t.value
                        ? "bg-primary text-white border-primary"
                        : "bg-background border-border/50 text-muted-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Destinatari</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setTargetMode("all"); setTargetUserId(null); }}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                    targetMode === "all"
                      ? "bg-primary text-white border-primary"
                      : "bg-background border-border/50 text-muted-foreground"
                  }`}
                >
                  <Users size={12} /> Tutti
                </button>
                <button
                  onClick={() => setTargetMode("user")}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                    targetMode === "user"
                      ? "bg-primary text-white border-primary"
                      : "bg-background border-border/50 text-muted-foreground"
                  }`}
                >
                  <User size={12} /> Utente specifico
                </button>
              </div>
            </div>

            {targetMode === "user" && (
              <select
                value={targetUserId ?? ""}
                onChange={(e) => setTargetUserId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-background rounded-xl py-2.5 px-3.5 text-sm outline-none border border-border/50 focus:border-primary/30 transition-all"
              >
                <option value="">Seleziona utente...</option>
                {users?.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
            )}

            <Button
              onClick={handleSend}
              disabled={createMutation.isPending}
              className="w-full rounded-xl"
            >
              <Send size={16} className="mr-2" />
              {createMutation.isPending ? "Invio..." : "Invia Notifica"}
            </Button>
          </div>
        </div>
      )}

      <div className="px-5 pt-4">
        <p className="text-xs text-muted-foreground mb-3">
          {notifications?.length ?? 0} notifiche inviate
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-card rounded-[20px] animate-pulse" />
            ))}
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">Nessuna notifica inviata</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => (
              <div key={n.id} className="bg-card rounded-[20px] border border-border/30 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {NOTIFICATION_TYPES.find((t) => t.value === n.type)?.label ?? n.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {n.targetUserName ? `→ ${n.targetUserName}` : "→ Tutti"}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {n.readCount} letture
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 ml-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
