import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminUsers, useToggleUserAdmin, useAdminCheck } from "@/hooks/use-admin";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Crown, Lock, Mail, Search, Shield, User, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "wouter";

const LEVEL_LABELS: Record<string, string> = {
  Seed: "Seme", Sprout: "Germoglio", Bloom: "Fiore", Tree: "Albero",
  Bronze: "Seme", Silver: "Germoglio", Gold: "Fiore", Platinum: "Albero",
};
const LEVEL_ICONS: Record<string, string> = {
  Bronze: "🌱", Silver: "🌿", Gold: "🌸", Platinum: "🌳",
  Seed: "🌱", Sprout: "🌿", Bloom: "🌸", Tree: "🌳",
};

export default function AdminUsersList() {
  const token = useAuthStore((s) => s.token);
  const { data: admin } = useAdminCheck();
  const { data: users, isLoading } = useAdminUsers();
  const toggleAdmin = useToggleUserAdmin();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  if (!token || !admin?.isAdmin) {
    return <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center"><Lock className="w-16 h-16 text-muted-foreground mb-4" /><h2 className="text-2xl font-serif font-bold mb-2">Accesso Riservato</h2></PageTransition>;
  }

  const filtered = users?.filter((u: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }) ?? [];

  const handleToggleAdmin = (id: number, currentAdmin: boolean, name: string) => {
    const action = currentAdmin ? "rimuovere i privilegi admin da" : "rendere admin";
    if (!confirm(`Vuoi ${action} ${name || "questo utente"}?`)) return;
    toggleAdmin.mutate({ id, isAdmin: !currentAdmin }, {
      onSuccess: () => toast({ title: currentAdmin ? "Privilegi admin rimossi" : "Utente promosso ad admin" }),
      onError: () => toast({ title: "Errore", variant: "destructive" }),
    });
  };

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center gap-3 mb-4 pt-2">
        <Link href="/admin"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="text-2xl font-serif font-bold">Utenti</h1>
        <Badge variant="secondary" className="ml-auto">{users?.length ?? 0}</Badge>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome o email..." className="h-11 pl-10 rounded-xl bg-muted/50" />
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-serif font-semibold mb-2">Nessun utente trovato</h2>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((user: any) => (
            <div key={user.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  {user.isAdmin ? <Shield className="w-5 h-5 text-primary" /> : <User className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{user.name || "Senza nome"}</h3>
                    {user.isAdmin && <Badge className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-none">Admin</Badge>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs">
                    <span>{LEVEL_ICONS[user.loyaltyLevel] || "🌱"}</span>
                    <span className="text-muted-foreground ml-1">{user.loyaltyPoints} pt</span>
                  </div>
                  <button
                    onClick={() => handleToggleAdmin(user.id, user.isAdmin, user.name)}
                    disabled={toggleAdmin.isPending}
                    className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${user.isAdmin ? "bg-red-50 text-red-600 border-red-200" : "bg-primary/5 text-primary border-primary/20"}`}
                  >
                    {user.isAdmin ? "Rimuovi admin" : "Rendi admin"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
