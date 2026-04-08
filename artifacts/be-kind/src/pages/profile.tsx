import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetProfile, useGetLoyaltyBalance } from "@workspace/api-client-react";
import { ChevronRight, LogOut, User as UserIcon, Calendar, Package, Shield, Star, CreditCard, Settings, HelpCircle } from "lucide-react";
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
        <UserIcon className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Accedi al tuo profilo</h2>
        <p className="text-muted-foreground mb-6">Accedi per vedere i tuoi punti fedeltà e i dettagli dell'account.</p>
        <Link href="/login">
          <Button className="rounded-xl w-full max-w-sm h-12 text-lg">Accedi</Button>
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
    { icon: UserIcon, label: "Il mio profilo", href: "/profile/edit" },
    { icon: Package, label: "I miei ordini", href: "/orders" },
    { icon: Calendar, label: "Le mie prenotazioni", href: "/reservations" },
    { icon: CreditCard, label: "Metodi di pagamento", href: "/profile/edit" },
    { icon: Settings, label: "Impostazioni", href: "/profile/edit" },
    { icon: HelpCircle, label: "Aiuto & Supporto", href: "/profile/edit" },
  ];

  return (
    <PageTransition className="flex flex-col min-h-full bg-background pb-24">
      <div className="px-6 pt-12 pb-6 bg-gradient-to-r from-background to-white border-b border-gray-50">
        {isLoading ? (
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          </div>
        ) : profile ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xl shrink-0">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">{profile.firstName} {profile.lastName}</p>
              {loyalty && (
                <p className="text-sm text-muted-foreground">
                  {LEVEL_LABELS[loyalty.level] || loyalty.level} {LEVEL_EMOJI[loyalty.level] || ''} ({loyalty.points} pt)
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="px-4 flex flex-col gap-4 pt-4">
        {loyalty && (
          <Link href="/loyalty">
            <div className="bg-gradient-to-br from-secondary to-secondary/80 rounded-3xl p-5 text-white shadow-soft active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Punti Fedeltà</p>
                  <p className="text-3xl font-bold">{loyalty.points}</p>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Star size={16} fill="currentColor" />
                  <span className="font-medium">Vedi premi</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="bg-white rounded-3xl overflow-hidden shadow-soft">
          {menuItems.map((item, idx) => (
            <Link key={idx} href={item.href}>
              <div className={`flex items-center justify-between px-5 py-4 text-sm text-gray-600 hover:bg-background hover:text-secondary transition-colors group active:bg-background/80 ${idx < menuItems.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>

        {adminCheck?.isAdmin && (
          <Link href="/admin">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-3xl p-4 shadow-soft flex items-center gap-3 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-serif font-semibold">Pannello Admin</span>
                <p className="text-xs text-muted-foreground">Gestisci menù, eventi e bottega</p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary" />
            </div>
          </Link>
        )}

        <div className="bg-white rounded-3xl overflow-hidden shadow-soft">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium active:bg-red-100"
          >
            <LogOut size={18} />
            Esci
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
