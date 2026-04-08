import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetLoyaltyBalance, useGetLoyaltyHistory } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Star, Gift, History, Leaf, CheckCircle2, Lock, ArrowRight,
  Users, Calendar, Coffee, Bike, Flower2, ShoppingBag, Smartphone, X,
  TrendingUp, Utensils, MessageSquare, Instagram, Share2, QrCode, Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

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
  const { data: qrData } = useQuery<{ qrToken: string }>({
    queryKey: ["loyalty-qr"],
    queryFn: () => customFetch<{ qrToken: string }>("/api/loyalty/qr-data"),
    enabled: !!token,
  });
  const { data: userStamps } = useQuery<{ stampId: string }[]>({
    queryKey: ["loyalty-stamps"],
    queryFn: () => customFetch<{ stampId: string }[]>("/api/loyalty/stamps"),
    enabled: !!token,
  });

  const [activeTab, setActiveTab] = useState<"CARD" | "REWARDS" | "EARN">("CARD");
  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);
  const [showQr, setShowQr] = useState(false);

  const earnedStampIds = userStamps?.map(s => s.stampId) ?? [];
  const userPoints = loyalty?.points ?? 0;
  const progressPercent = loyalty?.progressPercent ?? 0;
  const pointsToNext = loyalty?.pointsToNextLevel ?? 0;

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Leaf className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Be Kind Fidelity</h2>
        <p className="text-muted-foreground mb-6 max-w-xs">Accedi per seguire i tuoi punti, collezionare timbri e riscattare premi.</p>
        <Link href="/login">
          <Button className="rounded-2xl w-full max-w-sm h-12 text-lg font-bold">Accedi</Button>
        </Link>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24 relative">

      {showQr && qrData?.qrToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-md" onClick={() => setShowQr(false)}>
          <div className="bg-white rounded-[28px] p-8 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 text-white flex items-center justify-center mb-4 shadow-lg">
                <QrCode size={28} />
              </div>
              <h3 className="font-serif font-bold text-xl mb-1">Il tuo QR Code</h3>
              <p className="text-muted-foreground text-sm mb-6">Mostralo alla cassa per guadagnare punti</p>
              <div className="bg-gradient-to-br from-accent/50 to-muted/30 p-5 rounded-2xl mb-4">
                <QRCodeSVG
                  value={qrData.qrToken}
                  size={200}
                  level="H"
                  bgColor="transparent"
                  fgColor="#6E7A58"
                  includeMargin={false}
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono tracking-wider bg-muted/50 px-3 py-1.5 rounded-lg">{qrData.qrToken}</p>
            </div>
          </div>
        </div>
      )}

      {selectedStamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-md" onClick={() => setSelectedStamp(null)}>
          <div className="bg-card rounded-[28px] p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedStamp(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className={`w-20 h-20 rounded-[22px] flex items-center justify-center mb-4 shadow-lg ${
                earnedStampIds.includes(selectedStamp.id)
                  ? "bg-gradient-to-br from-secondary to-secondary/80 text-white"
                  : "bg-muted text-muted-foreground border-2 border-dashed border-border"
              }`}>
                {getIcon(selectedStamp.icon, 36)}
              </div>

              <h3 className="font-serif font-bold text-2xl mb-1">{selectedStamp.title}</h3>
              <p className={`font-bold text-sm mb-4 uppercase tracking-wider ${
                earnedStampIds.includes(selectedStamp.id) ? "text-secondary" : "text-muted-foreground"
              }`}>
                {earnedStampIds.includes(selectedStamp.id) ? "✓ Timbro Ottenuto!" : "Da Sbloccare"}
              </p>

              <div className="bg-background p-4 rounded-2xl w-full text-left mb-5 border border-border">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {selectedStamp.actionRequired}
                </p>
              </div>

              {!earnedStampIds.includes(selectedStamp.id) && qrData?.qrToken && (
                <div className="w-full mb-5">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">Mostra questo QR all'admin per sbloccare</p>
                  <div className="bg-gradient-to-br from-accent/50 to-muted/30 p-4 rounded-2xl flex justify-center">
                    <QRCodeSVG
                      value={`${qrData.qrToken}:${selectedStamp.id}`}
                      size={160}
                      level="H"
                      bgColor="transparent"
                      fgColor="#6E7A58"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground font-mono tracking-wider mt-2">
                    {qrData.qrToken}:{selectedStamp.id}
                  </p>
                </div>
              )}

              {earnedStampIds.includes(selectedStamp.id) && (
                <div className="w-full mb-5 bg-secondary/10 p-4 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-secondary shrink-0" />
                  <p className="text-sm text-secondary font-medium text-left">Hai già sbloccato questo timbro!</p>
                </div>
              )}

              <Button className="w-full h-12 rounded-2xl font-bold" onClick={() => setSelectedStamp(null)}>
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-6 pb-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-serif font-bold">Be Kind Fidelity</h1>
          </div>
          <button
            onClick={() => setShowQr(true)}
            className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <QrCode size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 mb-4">
        <div className="flex bg-card p-1.5 rounded-2xl shadow-sm border border-border">
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
          <div className="space-y-5 animate-in fade-in duration-300">

            {isLoading ? (
              <div className="h-44 bg-card rounded-3xl animate-pulse" />
            ) : (
              <div className="bg-gradient-to-br from-secondary via-secondary/90 to-secondary/70 rounded-[28px] p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/8 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl" />

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Livello Attuale</p>
                    <h3 className="font-serif text-3xl font-bold flex items-center gap-2">
                      {LEVEL_LABELS[loyalty?.level ?? "Seed"] || "Seme"} {LEVEL_EMOJI[loyalty?.level ?? "Seed"] || "🌱"}
                    </h3>
                  </div>
                  <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl">
                    <span className="font-bold text-lg">{userPoints}</span>
                    <span className="text-white/70 text-xs ml-1">pt</span>
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between text-[10px] mb-2 text-white/60 font-medium uppercase tracking-wide">
                    <span>Progressi</span>
                    <span>{pointsToNext > 0 ? `${pointsToNext} punti al prossimo` : "Livello massimo!"}</span>
                  </div>
                  <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/80 rounded-full transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowQr(true)}
              className="w-full bg-card p-4 rounded-2xl shadow-sm border border-border flex items-center gap-4 active:scale-[0.98] transition-transform hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 text-white flex items-center justify-center shrink-0 shadow-md">
                <QrCode size={22} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-sm">Mostra il tuo QR Code</h4>
                <p className="text-xs text-muted-foreground">Scannerizzalo alla cassa per guadagnare punti</p>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </button>

            <div className="bg-card p-5 rounded-[28px] shadow-sm border border-border">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-serif font-bold text-lg">La tua Collezione</h3>
                <span className="text-xs bg-secondary/10 text-secondary px-3 py-1.5 rounded-xl font-bold">
                  {earnedStampIds.length}/{STAMPS.length}
                </span>
              </div>
              <p className="text-muted-foreground text-xs mb-5">Tocca un timbro per vedere il QR da mostrare</p>

              <div className="grid grid-cols-4 gap-3">
                {STAMPS.map((stamp) => {
                  const isEarned = earnedStampIds.includes(stamp.id);
                  return (
                    <button
                      key={stamp.id}
                      onClick={() => setSelectedStamp(stamp)}
                      className={`aspect-square rounded-[18px] flex flex-col items-center justify-center gap-1.5 transition-all active:scale-90 relative ${
                        isEarned
                          ? "bg-gradient-to-br from-secondary to-secondary/80 text-white shadow-lg"
                          : "bg-muted/40 border border-dashed border-border text-muted-foreground hover:bg-muted/70 hover:border-secondary/30"
                      }`}
                    >
                      {isEarned && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                          <CheckCircle2 size={14} className="text-secondary" />
                        </div>
                      )}
                      {!isEarned && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                          <QrCode size={10} className="text-primary" />
                        </div>
                      )}
                      {getIcon(stamp.icon, 18)}
                      <span className="text-[8px] font-bold leading-none px-1 text-center">{stamp.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-bold flex items-center gap-2 mb-3 text-sm">
                <History size={16} className="text-primary" /> Attività Recenti
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
                        <span className={`font-bold text-sm px-2.5 py-1 rounded-lg ${item.type === "earned" ? "text-secondary bg-secondary/10" : "text-primary bg-primary/10"}`}>
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
            <div className="bg-gradient-to-r from-secondary/10 to-accent p-4 rounded-2xl flex items-center gap-3 mb-2 border border-secondary/10">
              <div className="w-12 h-12 rounded-2xl bg-secondary/15 flex items-center justify-center">
                <Gift className="text-secondary" size={22} />
              </div>
              <div>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Saldo Disponibile</p>
                <p className="text-2xl font-bold text-secondary">{userPoints} <span className="text-sm font-medium">Punti</span></p>
              </div>
            </div>

            <div className="space-y-3">
              {REWARDS.map((reward) => {
                const canAfford = userPoints >= reward.cost;
                return (
                  <div key={reward.id} className={`bg-card p-4 rounded-2xl shadow-sm border border-border flex gap-4 transition-opacity ${!canAfford ? "opacity-50" : ""}`}>
                    <div className="w-20 h-20 rounded-2xl bg-muted flex-shrink-0 overflow-hidden">
                      <img src={reward.image} alt={reward.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-sm">{reward.title}</h4>
                          {canAfford ? <CheckCircle2 size={16} className="text-secondary shrink-0" /> : <Lock size={16} className="text-muted-foreground shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{reward.description}</p>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <span className="font-bold text-primary text-sm">{reward.cost} pt</span>
                        <button
                          disabled={!canAfford}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            canAfford
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
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
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles size={28} className="text-primary" />
              </div>
              <h3 className="font-serif font-bold text-xl">Guadagna Punti</h3>
              <p className="text-sm text-muted-foreground">Completa le azioni per salire di livello</p>
            </div>

            <div className="space-y-3">
              {EARN_ACTIONS.map((action) => (
                <div key={action.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border flex items-center justify-between active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      {getIcon(action.icon, 20)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{action.title}</h4>
                      <p className="text-[10px] text-muted-foreground max-w-[180px]">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg text-sm">+{action.points}</span>
                    {action.stamps > 0 && (
                      <span className="text-[10px] text-secondary font-bold flex items-center gap-1 mt-1">
                        +{action.stamps} <Leaf size={8} />
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-r from-secondary/5 to-accent p-4 rounded-2xl border border-secondary/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
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
