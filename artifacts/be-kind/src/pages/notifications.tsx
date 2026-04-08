import { PageTransition } from "@/components/page-transition";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetNotifications, useGetUnreadCount, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Bell, BellOff, CheckCheck, Megaphone, Gift, Calendar, ShoppingBag, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  general: { icon: Bell, color: "bg-primary/10 text-primary", label: "Generale" },
  promo: { icon: Gift, color: "bg-amber-100 text-amber-700", label: "Promozione" },
  order: { icon: ShoppingBag, color: "bg-blue-100 text-blue-700", label: "Ordine" },
  event: { icon: Calendar, color: "bg-emerald-100 text-emerald-700", label: "Evento" },
  loyalty: { icon: Megaphone, color: "bg-purple-100 text-purple-700", label: "Fedeltà" },
  info: { icon: Info, color: "bg-secondary/10 text-secondary", label: "Info" },
};

export default function Notifications() {
  const token = useAuthStore((state) => state.token);
  const { data: notifications, isLoading } = useGetNotifications({ query: { enabled: !!token } });
  const { data: unreadData } = useGetUnreadCount({ query: { enabled: !!token } });
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate(
      { id },
      { onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getNotifications"] });
        queryClient.invalidateQueries({ queryKey: ["getUnreadCount"] });
      }}
    );
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(
      undefined,
      { onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getNotifications"] });
        queryClient.invalidateQueries({ queryKey: ["getUnreadCount"] });
      }}
    );
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Adesso";
    if (diffMin < 60) return `${diffMin} min fa`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h fa`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}g fa`;
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  };

  if (!token) {
    return (
      <PageTransition className="flex flex-col min-h-full bg-background items-center justify-center px-5">
        <BellOff className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <p className="text-lg font-serif font-bold mb-2">Notifiche</p>
        <p className="text-sm text-muted-foreground text-center mb-4">Accedi per vedere le tue notifiche</p>
        <Link href="/login">
          <Button className="rounded-xl">Accedi</Button>
        </Link>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col min-h-full bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="px-5 pt-10 pb-3 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center shadow-sm text-foreground active:scale-95 transition-transform border border-border/50">
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-lg font-serif font-bold text-foreground">Notifiche</h2>
          {(unreadData?.count ?? 0) > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center shadow-sm text-primary active:scale-95 transition-transform border border-border/50"
            >
              <CheckCheck size={18} />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      <div className="px-5 pt-4">
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
            <p className="text-sm text-muted-foreground">Nessuna notifica</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
              const Icon = config.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  className={cn(
                    "w-full text-left rounded-[20px] p-4 transition-all border",
                    n.isRead
                      ? "bg-card border-border/20 opacity-70"
                      : "bg-card border-primary/20 shadow-sm"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", config.color)}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-semibold truncate", !n.isRead && "text-foreground")}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", config.color)}>
                          {config.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatTime(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
