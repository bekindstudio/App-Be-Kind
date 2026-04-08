import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetLoyaltyBalance, useGetLoyaltyHistory } from "@workspace/api-client-react";
import {
  ArrowLeft, Star, Gift, History, Leaf, CheckCircle2, Lock, ArrowRight,
  Users, Calendar, Coffee, Bike, Flower2, ShoppingBag, Smartphone, X,
  TrendingUp, Utensils, MessageSquare, Instagram, Share2,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const LEVEL_EMOJI: Record<string, string> = {
  Seed: "🌱", Sprout: "🌿", Bloom: "🌸", Tree: "🌳",
  Bronze: "🌱", Silver: "🌿", Gold: "🌸", Platinum: "🌳",
};

const LEVEL_LABELS: Record<string, string> = {
  Seed: "Seme", Sprout: "Germoglio", Bloom: "Fiore", Tree: "Albero",
  Bronze: "Seme", Silver: "Germoglio", Gold: "Fiore", Platinum: "Albero",
};

interface Stamp {
  id: string;
  title: string;
  icon: string;
  description: string;
  actionRequired: string;
}

const STAMPS: Stamp[] = [
  { id: "st1", title: "Recensione", icon: "Star", description: "La tua opinione conta!", actionRequired: "Lascia una recensione a 5 stelle sulla nostra pagina." },
  { id: "st2", title: "Brunch Lover", icon: "Coffee", description: "Colazione da campioni.", actionRequired: "Vieni a trovarci per il brunch della domenica e scansiona il QR code al tavolo." },
  { id: "st3", title: "Workshop", icon: "Calendar", description: "Impara con noi.", actionRequired: "Partecipa a uno dei nostri workshop o esperienze Be Kind." },
  { id: "st4", title: "Delivery", icon: "Bike", description: "Comodamente a casa.", actionRequired: "Effettua almeno 3 ordini con consegna a domicilio." },
  { id: "st5", title: "Yogi", icon: "Flower", description: "Namasté.", actionRequired: "Partecipa a una lezione di Yoga & Brunch." },
  { id: "st6", title: "Shopping", icon: "ShoppingBag", description: "Stile sostenibile.", actionRequired: "Acquista un prodotto dalla nostra Bottega online." },
  { id: "st7", title: "Community", icon: "Users", description: "Più siamo, meglio è.", actionRequired: "Invita 3 amici a iscriversi all'app Be Kind." },
  { id: "st8", title: "Social Star", icon: "Smartphone", description: "Dillo a tutti!", actionRequired: "Condividi una foto dei nostri piatti nelle tue storie Instagram." },
];

interface Reward {
  id: string;
  title: string;
  cost: number;
  image: string;
  description: string;
}

const REWARDS: Reward[] = [
  { id: "r1", title: "Caffè o Tè Bio", cost: 150, image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=500", description: "Una bevanda calda a tua scelta per iniziare la giornata con gentilezza." },
  { id: "r2", title: "Dessert del Giorno", cost: 300, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=500", description: "Dolcezza meritata. Scegli una fetta di torta dal nostro bancone." },
  { id: "r3", title: "Be Kind Tote Bag", cost: 600, image: "https://images.unsplash.com/photo-1554564883-9b2d8479e34e?auto=format&fit=crop&q=80&w=500", description: "Porta i tuoi acquisti in modo sostenibile con la nostra shopper iconica." },
  { id: "r4", title: "Lezione Yoga Gratuita", cost: 1000, image: "https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&q=80&w=500", description: "Un'ora di benessere per il corpo e la mente nel nostro giardino." },
];

interface EarnAction {
  id: string;
  title: string;
  points: number;
  stamps: number;
  icon: string;
  description: string;
}

const EARN_ACTIONS: EarnAction[] = [
  { id: "a1", title: "Invita un amico", points: 100, stamps: 0, icon: "Users", description: "Porta un amico nella community Be Kind." },
  { id: "a2", title: "Lascia una recensione", points: 50, stamps: 0, icon: "Star", description: "Raccontaci la tua esperienza." },
  { id: "a3", title: "Partecipa a un evento", points: 150, stamps: 1, icon: "Calendar", description: "Unisciti ai nostri workshop o eventi sociali." },
  { id: "a4", title: "Condividi su Instagram", points: 30, stamps: 0, icon: "Smartphone", description: "Taggaci nelle tue storie @bekindcattolica." },
];

function getIcon(iconName: string, size: number = 20, className: string = "") {
  const props = { size, className };
  switch (iconName) {
    case "Star": return <Star {...props} />;
    case "Coffee": return <Coffee {...props} />;
    case "Calendar": return <Calendar {...props} />;
    case "Bike": return <Bike {...props} />;
    case "Flower": return <Flower2 {...props} />;
    case "ShoppingBag": return <ShoppingBag {...props} />;
    case "Users": return <Users {...props} />;
    case "Smartphone": return <Smartphone {...props} />;
    default: return <Leaf {...props} />;
  }
}

export default function Loyalty() {
  const token = useAuthStore((state) => state.token);
  const { data: loyalty, isLoading } = useGetLoyaltyBalance({ query: { enabled: !!token } });
  const { data: history, isLoading: isHistoryLoading } = useGetLoyaltyHistory({ query: { enabled: !!token } });
  const [activeTab, setActiveTab] = useState<"CARD" | "REWARDS" | "EARN">("CARD");
  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);

  const earnedStamps = ["st1", "st4", "st6"];
  const userPoints = loyalty?.points ?? 0;
  const progressPercent = loyalty?.progressPercent ?? 0;
  const pointsToNext = loyalty?.pointsToNextLevel ?? 0;

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Leaf className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Be Kind Fidelity</h2>
        <p className="text-muted-foreground mb-6">Accedi per seguire i tuoi punti, collezionare timbri e riscattare premi.</p>
        <Link href="/login">
          <Button className="rounded-xl w-full max-w-sm h-12 text-lg">Accedi</Button>
        </Link>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24 relative">

      {selectedStamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedStamp(null)}>
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedStamp(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/80"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                earnedStamps.includes(selectedStamp.id)
                  ? "bg-[#4A6741] text-white shadow-lg"
                  : "bg-muted text-muted-foreground border-2 border-dashed border-border"
              }`}>
                {getIcon(selectedStamp.icon, 40)}
              </div>

              <h3 className="font-serif font-bold text-2xl mb-1">{selectedStamp.title}</h3>
              <p className={`font-bold text-sm mb-4 uppercase tracking-wider ${
                earnedStamps.includes(selectedStamp.id) ? "text-[#4A6741]" : "text-muted-foreground"
              }`}>
                {earnedStamps.includes(selectedStamp.id) ? "Timbro Ottenuto!" : "Da Sbloccare"}
              </p>

              <div className="bg-[#FFFBF5] dark:bg-muted p-4 rounded-xl w-full text-left mb-6 border border-secondary/20">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {selectedStamp.actionRequired}
                </p>
              </div>

              <Button className="w-full h-12 rounded-xl" onClick={() => setSelectedStamp(null)}>
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border pt-6 pb-4 px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-serif font-bold">Be Kind Fidelity</h1>
        </div>
      </div>

      <div className="px-4 pt-4 mb-4">
        <div className="flex bg-card p-1 rounded-2xl shadow-sm border border-border">
          {(["CARD", "REWARDS", "EARN"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "CARD" ? "La tua Carta" : tab === "REWARDS" ? "Premi" : "Guadagna"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">

        {activeTab === "CARD" && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {isLoading ? (
              <div className="h-44 bg-card rounded-3xl animate-pulse" />
            ) : (
              <div className="bg-gradient-to-br from-[#4A6741] to-[#2C4A32] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Livello Attuale</p>
                    <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
                      {LEVEL_LABELS[loyalty?.level ?? "Seed"] || "Seme"} {LEVEL_EMOJI[loyalty?.level ?? "Seed"] || "🌱"}
                    </h3>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                    <span className="font-bold text-sm">{userPoints} Punti</span>
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between text-xs mb-2 opacity-80">
                    <span>Progressi livello</span>
                    <span>{pointsToNext > 0 ? `${pointsToNext} punti al prossimo` : "Livello massimo!"}</span>
                  </div>
                  <div className="h-2.5 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C6957C] rounded-full transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-serif font-bold text-lg">La tua Collezione</h3>
                <span className="text-xs bg-[#E9F5E9] dark:bg-[#2C4A32]/30 text-[#4A6741] px-2.5 py-1 rounded-lg font-bold">
                  {earnedStamps.length}/{STAMPS.length}
                </span>
              </div>
              <p className="text-muted-foreground text-xs mb-5">Colleziona tutti i timbri per diventare un "Albero"!</p>

              <div className="grid grid-cols-4 gap-3">
                {STAMPS.map((stamp) => {
                  const isEarned = earnedStamps.includes(stamp.id);
                  return (
                    <button
                      key={stamp.id}
                      onClick={() => setSelectedStamp(stamp)}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                        isEarned
                          ? "bg-[#4A6741] text-white shadow-md"
                          : "bg-muted/50 border border-dashed border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {getIcon(stamp.icon, 18)}
                      <span className="text-[9px] font-bold leading-none">{stamp.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-bold flex items-center gap-2 mb-3">
                <History size={16} /> Attività Recenti
              </h3>
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                {isHistoryLoading ? (
                  <div className="p-4 space-y-4 animate-pulse">
                    <div className="h-10 bg-muted rounded" />
                    <div className="h-10 bg-muted rounded" />
                  </div>
                ) : !history || history.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Nessuna attività ancora. Ordina, partecipa agli eventi e guadagna punti!
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {history.slice(0, 5).map(item => (
                      <div key={item.id} className="flex justify-between items-center p-4">
                        <div>
                          <p className="font-bold text-sm">{item.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <span className={`font-bold ${item.type === "earned" ? "text-[#4A6741]" : "text-primary"}`}>
                          {item.type === "earned" ? "+" : "-"}{item.points} pt
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "REWARDS" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-[#E9F5E9] dark:bg-[#2C4A32]/20 p-4 rounded-2xl flex items-center gap-3 mb-2">
              <Gift className="text-[#4A6741]" size={24} />
              <div>
                <p className="text-xs text-[#6B8E23] font-bold uppercase tracking-wider">Saldo Disponibile</p>
                <p className="text-xl font-bold text-[#4A6741]">{userPoints} Punti</p>
              </div>
            </div>

            <div className="space-y-4">
              {REWARDS.map((reward) => {
                const canAfford = userPoints >= reward.cost;
                return (
                  <div key={reward.id} className={`bg-card p-4 rounded-2xl shadow-sm border border-border flex gap-4 ${!canAfford ? "opacity-60" : ""}`}>
                    <div className="w-20 h-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                      <img src={reward.image} alt={reward.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-sm">{reward.title}</h4>
                          {canAfford ? <CheckCircle2 size={16} className="text-[#4A6741] shrink-0" /> : <Lock size={16} className="text-muted-foreground shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{reward.description}</p>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <span className="font-bold text-primary text-sm">{reward.cost} pt</span>
                        <button
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            canAfford
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-muted text-muted-foreground cursor-not-allowed"
                          }`}
                        >
                          Riscatta
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "EARN" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-2">
              <h3 className="font-serif font-bold text-xl">Guadagna Punti</h3>
              <p className="text-sm text-muted-foreground">Completa le azioni per salire di livello</p>
            </div>

            <div className="space-y-3">
              {EARN_ACTIONS.map((action) => (
                <div key={action.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border flex items-center justify-between active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#FFFBF5] dark:bg-muted border border-secondary/20 flex items-center justify-center text-primary">
                      {getIcon(action.icon, 20)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{action.title}</h4>
                      <p className="text-[10px] text-muted-foreground max-w-[180px]">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-primary">+{action.points} pt</span>
                    {action.stamps > 0 && (
                      <span className="text-[10px] text-[#4A6741] font-bold flex items-center gap-1">
                        +{action.stamps} <Leaf size={8} />
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-r from-background to-[#F0F7F0] dark:to-[#2C4A32]/10 p-4 rounded-2xl shadow-sm border border-[#4A6741]/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-primary shadow-sm">
                    <Leaf size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Ad ogni acquisto</h4>
                    <p className="text-[10px] text-muted-foreground">Guadagna 1 punto per ogni €1 speso</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-secondary" />
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
