import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetLoyaltyBalance, useGetLoyaltyHistory } from "@workspace/api-client-react";
import { ArrowLeft, Gift, Star, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

const LEVEL_COLORS: Record<string, string> = {
  Seed: "bg-[#8B7355] text-white",
  Sprout: "bg-[#6B8E23] text-white",
  Bloom: "bg-[#DB7093] text-white",
  Tree: "bg-gradient-to-r from-[#228B22] to-[#2E8B57] text-white",
  Bronze: "bg-[#CD7F32] text-white",
  Silver: "bg-[#C0C0C0] text-black",
  Gold: "bg-[#FFD700] text-black",
  Platinum: "bg-gradient-to-r from-[#e5e4e2] to-[#b0b0b0] text-black",
};

const LEVEL_EMOJI: Record<string, string> = {
  Seed: "🌱",
  Sprout: "🌿",
  Bloom: "🌸",
  Tree: "🌳",
};

const LEVEL_LABELS: Record<string, string> = {
  Seed: "Seme",
  Sprout: "Germoglio",
  Bloom: "Fiore",
  Tree: "Albero",
  Bronze: "Bronzo",
  Silver: "Argento",
  Gold: "Oro",
  Platinum: "Platino",
};

export default function Loyalty() {
  const token = useAuthStore((state) => state.token);
  const { data: loyalty, isLoading } = useGetLoyaltyBalance({ query: { enabled: !!token } });
  const { data: history, isLoading: isHistoryLoading } = useGetLoyaltyHistory({ query: { enabled: !!token } });

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Star className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Accedi per vedere la fedeltà</h2>
        <p className="text-muted-foreground mb-6">Accedi per seguire i tuoi punti e premi.</p>
        <Link href="/login">
          <Button className="rounded-xl w-full max-w-sm h-12 text-lg">Accedi</Button>
        </Link>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24">
      <div className="bg-primary/5 pt-6 pb-8 px-4 rounded-b-[2.5rem]">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full bg-background/50 hover:bg-background">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-serif font-bold">Famiglia Be Kind</h1>
        </div>

        {isLoading ? (
          <div className="h-40 bg-card rounded-2xl animate-pulse"></div>
        ) : loyalty ? (
          <div className="bg-card rounded-3xl p-6 shadow-md border border-border text-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">I Tuoi Punti</p>
              <h2 className="text-5xl font-bold font-serif text-primary mb-4">{loyalty.points}</h2>
              <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold shadow-sm mb-6 ${LEVEL_COLORS[loyalty.level] || "bg-primary text-primary-foreground"}`}>
                {LEVEL_EMOJI[loyalty.level] || ""} Membro {LEVEL_LABELS[loyalty.level] || loyalty.level}
              </div>
              
              {loyalty.nextLevel && (
                <div className="text-left mt-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-muted-foreground">{loyalty.pointsToNextLevel} punti per {LEVEL_LABELS[loyalty.nextLevel] || loyalty.nextLevel}</span>
                    <span className="font-bold">{loyalty.progressPercent}%</span>
                  </div>
                  <Progress value={loyalty.progressPercent} className="h-2" />
                </div>
              )}
            </div>
            <div className="absolute -right-10 -top-10 opacity-5">
              <Star className="w-40 h-40" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="px-4 py-6 space-y-6">
        <div>
          <h3 className="font-serif text-xl font-bold mb-4">Come guadagnare</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold">Ordina dal Menù</h4>
                <p className="text-sm text-muted-foreground">1 punto per ogni €1 speso</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold">Acquista in Bottega</h4>
                <p className="text-sm text-muted-foreground">2 punti per ogni €1 speso</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-serif text-xl font-bold mb-4">Attività Recente</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {isHistoryLoading ? (
              <div className="p-4 space-y-4 animate-pulse">
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            ) : !history || history.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nessuna attività ancora.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {history.map(item => (
                  <div key={item.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.reason}</p>
                      <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("it-IT")}</p>
                    </div>
                    <div className={`font-bold ${item.type === 'earned' ? 'text-green-600' : 'text-primary'}`}>
                      {item.type === 'earned' ? '+' : '-'}{item.points}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
