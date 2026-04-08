import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAdminCheck } from "@/hooks/use-admin";
import { useAuthStore } from "@/hooks/use-auth-store";
import { ArrowLeft, Calendar, ChefHat, Lock, ShoppingBag, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const token = useAuthStore((s) => s.token);
  const { data, isLoading } = useAdminCheck();

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Accesso Riservato</h2>
        <p className="text-muted-foreground mb-6">Accedi per continuare.</p>
        <Link href="/login">
          <Button className="rounded-xl">Accedi</Button>
        </Link>
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
        <Link href="/">
          <Button className="rounded-xl">Torna alla Home</Button>
        </Link>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center gap-3 mb-8 pt-2">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold">Gestione Be Kind</h1>
          <p className="text-sm text-muted-foreground">Pannello di Amministrazione</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Link href="/admin/piatti">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm active-elevate flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ChefHat className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif font-bold text-lg">Piatti del Menù</h3>
              <p className="text-sm text-muted-foreground">Aggiungi, modifica o rimuovi piatti</p>
            </div>
            <Sparkles className="w-5 h-5 text-primary/40" />
          </div>
        </Link>

        <Link href="/admin/eventi">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm active-elevate flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <Calendar className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif font-bold text-lg">Eventi & Esperienze</h3>
              <p className="text-sm text-muted-foreground">Crea e gestisci eventi e workshop</p>
            </div>
            <Sparkles className="w-5 h-5 text-secondary/40" />
          </div>
        </Link>

        <Link href="/admin/prodotti">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm active-elevate flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-chart-3/10 flex items-center justify-center text-chart-3 shrink-0">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif font-bold text-lg">Prodotti Bottega</h3>
              <p className="text-sm text-muted-foreground">Gestisci il catalogo della bottega</p>
            </div>
            <Sparkles className="w-5 h-5 text-chart-3/40" />
          </div>
        </Link>
      </div>
    </PageTransition>
  );
}
