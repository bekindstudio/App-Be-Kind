import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAdminCheck, useAdminStats } from "@/hooks/use-admin";
import { useAuthStore } from "@/hooks/use-auth-store";
import { ArrowLeft, Calendar, ChefHat, ClipboardList, FolderOpen, Lock, MapPin, Package, ShoppingBag, Sparkles, Users } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const token = useAuthStore((s) => s.token);
  const { data, isLoading } = useAdminCheck();
  const { data: stats } = useAdminStats();

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Accesso Riservato</h2>
        <p className="text-muted-foreground mb-6">Accedi per continuare.</p>
        <Link href="/login"><Button className="rounded-xl">Accedi</Button></Link>
      </PageTransition>
    );
  }

  if (isLoading) {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse h-40 w-40 bg-muted rounded-2xl" />
      </PageTransition>
    );
  }

  if (!data?.isAdmin) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Accesso Riservato</h2>
        <p className="text-muted-foreground mb-6">Questa sezione è riservata agli amministratori.</p>
        <Link href="/"><Button className="rounded-xl">Torna alla Home</Button></Link>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center gap-3 mb-4 pt-2">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold">Gestione Be Kind</h1>
          <p className="text-sm text-muted-foreground">Pannello di Amministrazione</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          <StatBadge label="Ordini attivi" value={stats.pendingOrders} color="text-primary bg-primary/10" />
          <StatBadge label="Ordini bottega" value={stats.pendingShopOrders} color="text-secondary bg-secondary/10" />
          <StatBadge label="Prenotaz. oggi" value={stats.todayReservations} color="text-chart-3 bg-chart-3/10" />
        </div>
      )}

      <div className="space-y-2 mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Contenuti</p>
        <div className="flex flex-col gap-3">
          <AdminCard href="/admin/piatti" icon={<ChefHat className="w-6 h-6" />} title="Piatti del Menù" subtitle={`${stats?.dishes ?? '...'} piatti`} color="bg-primary/10 text-primary" />
          <AdminCard href="/admin/eventi" icon={<Calendar className="w-6 h-6" />} title="Eventi & Esperienze" subtitle={`${stats?.events ?? '...'} eventi`} color="bg-secondary/10 text-secondary" />
          <AdminCard href="/admin/prodotti" icon={<ShoppingBag className="w-6 h-6" />} title="Prodotti Bottega" subtitle={`${stats?.products ?? '...'} prodotti`} color="bg-chart-3/10 text-chart-3" />
          <AdminCard href="/admin/categorie" icon={<FolderOpen className="w-6 h-6" />} title="Categorie" subtitle="Menù e bottega" color="bg-chart-4/10 text-chart-4" />
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Operazioni</p>
        <div className="flex flex-col gap-3">
          <AdminCard href="/admin/ordini" icon={<ClipboardList className="w-6 h-6" />} title="Ordini Ristorante" subtitle={`${stats?.orders ?? '...'} totali · ${stats?.pendingOrders ?? 0} attivi`} color="bg-primary/10 text-primary" badge={stats?.pendingOrders} />
          <AdminCard href="/admin/ordini-bottega" icon={<Package className="w-6 h-6" />} title="Ordini Bottega" subtitle={`${stats?.shopOrders ?? '...'} totali · ${stats?.pendingShopOrders ?? 0} attivi`} color="bg-secondary/10 text-secondary" badge={stats?.pendingShopOrders} />
          <AdminCard href="/admin/prenotazioni" icon={<MapPin className="w-6 h-6" />} title="Prenotazioni Tavoli" subtitle={`${stats?.reservations ?? '...'} totali · ${stats?.todayReservations ?? 0} oggi`} color="bg-chart-3/10 text-chart-3" badge={stats?.todayReservations} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Persone</p>
        <div className="flex flex-col gap-3">
          <AdminCard href="/admin/utenti" icon={<Users className="w-6 h-6" />} title="Utenti" subtitle={`${stats?.users ?? '...'} registrati`} color="bg-chart-5/10 text-chart-5" />
        </div>
      </div>
    </PageTransition>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl p-3 text-center ${color}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] font-medium leading-tight mt-0.5">{label}</div>
    </div>
  );
}

function AdminCard({ href, icon, title, subtitle, color, badge }: { href: string; icon: React.ReactNode; title: string; subtitle: string; color: string; badge?: number }) {
  return (
    <Link href={href}>
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm active-elevate flex items-center gap-3 relative">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-bold text-[15px]">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {!!badge && badge > 0 && (
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
            {badge}
          </div>
        )}
        <Sparkles className="w-4 h-4 text-muted-foreground/30 shrink-0" />
      </div>
    </Link>
  );
}
