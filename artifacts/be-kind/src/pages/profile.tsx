import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetProfile, useGetLoyaltyBalance } from "@workspace/api-client-react";
import { ChevronRight, LogOut, User as UserIcon, Calendar, Package, Shield, Star, CreditCard, Settings, HelpCircle, Leaf, FileText } from "lucide-react";
import { useAdminCheck } from "@/hooks/use-admin";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLogout } from "@workspace/api-client-react";

const LEVEL_LABELS: Record<string, string> = {
  Seed: "Seme", Sprout: "Germoglio", Bloom: "Fiore", Tree: "Albero",
  Bronze: "Seme", Silver: "Germoglio", Gold: "Fiore", Platinum: "Albero",
};
const LEVEL_EMOJI: Record<string, string> = {
  Seed: "🌱", Sprout: "🌿", Bloom: "🌸", Tree: "🌳",
  Bronze: "🌱", Silver: "🌿", Gold: "🌸", Platinum: "🌳",
};

export default function Profile() {
  const token = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: profile, isLoading } = useGetProfile({ query: { enabled: !!token } });
  const { data: loyalty } = useGetLoyaltyBalance({ query: { enabled: !!token } });
  const { data: adminCheck } = useAdminCheck();
  const logoutMutation = useLogout();

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <UserIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Accedi al tuo profilo</h2>
        <p className="text-muted-foreground mb-6 max-w-xs">Accedi per vedere i tuoi punti fedeltà e i dettagli dell'account.</p>
        <Link href="/login">
          <Button className="rounded-2xl w-full max-w-sm h-12 text-lg font-bold">Accedi</Button>
        </Link>
      </PageTransition>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setToken(null);
        toast({ title: "Disconnessione effettuata" });
        setLocation("/");
      }
    });
  };

  const menuItems = [
    { icon: UserIcon, label: "Il mio profilo", href: "/profile/edit", desc: "Modifica i tuoi dati" },
    { icon: Package, label: "I miei ordini", href: "/orders", desc: "Storico e stato ordini" },
    { icon: Calendar, label: "Le mie prenotazioni", href: "/reservations", desc: "Prenota un tavolo" },
    { icon: CreditCard, label: "Metodi di pagamento", href: "/profile/edit", desc: "Carte e pagamenti" },
    { icon: Settings, label: "Impostazioni", href: "/profile/edit", desc: "Notifiche e preferenze" },
    { icon: HelpCircle, label: "Aiuto & Supporto", href: "/profile/edit", desc: "FAQ e contatti" },
    { icon: Shield, label: "Informativa Privacy", href: "/privacy", desc: "GDPR e trattamento dati" },
    { icon: FileText, label: "Termini e Condizioni", href: "/terms", desc: "Condizioni di vendita" },
  ];

  return (
    <PageTransition className="flex flex-col min-h-full bg-background pb-24">
      <div className="px-5 pt-10 pb-6">
        {isLoading ? (
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-18 h-18 rounded-[22px] bg-muted" />
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          </div>
        ) : profile ? (
          <div className="flex items-center gap-4">
            <div className="w-[68px] h-[68px] rounded-[20px] bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            <div>
              <p className="font-serif font-bold text-foreground text-xl">{profile.firstName} {profile.lastName}</p>
              {loyalty && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground font-medium">
                    {LEVEL_LABELS[loyalty.level] || loyalty.level} {LEVEL_EMOJI[loyalty.level] || ''}
                  </span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-sm text-primary font-bold">{loyalty.points} pt</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="px-4 flex flex-col gap-4">
        {loyalty && (
          <Link href="/loyalty">
            <div className="bg-gradient-to-br from-secondary via-secondary/90 to-secondary/70 rounded-[24px] p-5 text-white shadow-lg active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/8 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
                    <Leaf size={22} />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Punti Fedeltà</p>
                    <p className="text-2xl font-bold">{loyalty.points}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-white/70 text-sm bg-white/10 px-3 py-1.5 rounded-xl">
                  <Star size={14} fill="currentColor" />
                  <span className="font-medium text-xs">Premi</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="bg-card rounded-[24px] overflow-hidden shadow-sm border border-border/50">
          {menuItems.map((item, idx) => (
            <Link key={idx} href={item.href}>
              <div className={`flex items-center justify-between px-5 py-4 text-sm hover:bg-muted/30 transition-colors group active:bg-muted/50 ${idx < menuItems.length - 1 ? 'border-b border-border/50' : ''}`}>
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center">
                    <item.icon size={17} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{item.label}</span>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {adminCheck?.isAdmin && (
          <Link href="/admin">
            <div className="bg-gradient-to-r from-primary/8 to-secondary/8 border border-primary/15 rounded-[24px] p-4 shadow-sm flex items-center gap-3.5 active:scale-[0.98] transition-transform">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-serif font-bold text-sm">Pannello Admin</span>
                <p className="text-[10px] text-muted-foreground">Gestisci menù, eventi e bottega</p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary/50" />
            </div>
          </Link>
        )}

        <div className="bg-card rounded-[24px] overflow-hidden shadow-sm border border-border/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-5 py-4 text-sm text-destructive hover:bg-destructive/5 transition-colors font-medium active:bg-destructive/10"
          >
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut size={17} />
            </div>
            Esci
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
