import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAdminCheck } from "@/hooks/use-admin";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import {
  ArrowLeft, Lock, QrCode, User, Star, Gift, Leaf, CheckCircle2,
  Coffee, Calendar, Bike, Flower2, ShoppingBag, Users, Smartphone, X,
  Camera, Plus, Minus,
} from "lucide-react";
import { Link } from "wouter";
import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const STAMPS = [
  { id: "st1", title: "Recensione", icon: "Star" },
  { id: "st2", title: "Brunch Lover", icon: "Coffee" },
  { id: "st3", title: "Workshop", icon: "Calendar" },
  { id: "st4", title: "Delivery", icon: "Bike" },
  { id: "st5", title: "Yogi", icon: "Flower" },
  { id: "st6", title: "Shopping", icon: "ShoppingBag" },
  { id: "st7", title: "Community", icon: "Users" },
  { id: "st8", title: "Social Star", icon: "Smartphone" },
];

const LEVEL_EMOJI: Record<string, string> = {
  Bronze: "🌱", Silver: "🌿", Gold: "🌸", Platinum: "🌳",
};
const LEVEL_LABELS: Record<string, string> = {
  Bronze: "Seme", Silver: "Germoglio", Gold: "Fiore", Platinum: "Albero",
};

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

interface ScannedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  loyaltyPoints: number;
  loyaltyLevel: string;
  stamps: string[];
  recentHistory: { id: number; points: number; type: string; reason: string; createdAt: string }[];
}

type ScannerView = "scanner" | "user" | "manual";

export default function AdminScanner() {
  const token = useAuthStore((s) => s.token);
  const { data: adminData, isLoading: adminLoading } = useAdminCheck();
  const { toast } = useToast();

  const [view, setView] = useState<ScannerView>("scanner");
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [scanning, setScanning] = useState(false);
  const [pointsToAward, setPointsToAward] = useState(10);
  const [awardReason, setAwardReason] = useState("");
  const [awarding, setAwarding] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner-container";

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const lookupUser = useCallback(async (qrToken: string) => {
    try {
      const userData = await customFetch<ScannedUser>(`/api/admin/loyalty/scan/${encodeURIComponent(qrToken)}`);
      setScannedUser(userData);
      setView("user");
      await stopScanner();
    } catch {
      toast({ title: "QR non valido", description: "Nessun utente trovato con questo codice.", variant: "destructive" });
    }
  }, [toast, stopScanner]);

  const startScanner = useCallback(async () => {
    await stopScanner();
    setScanning(true);

    await new Promise(resolve => setTimeout(resolve, 300));

    const container = document.getElementById(scannerContainerId);
    if (!container) { setScanning(false); return; }

    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          lookupUser(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      toast({ title: "Errore fotocamera", description: "Impossibile accedere alla fotocamera. Prova con il codice manuale.", variant: "destructive" });
      setScanning(false);
    }
  }, [lookupUser, stopScanner, toast]);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const handleAwardPoints = async () => {
    if (!scannedUser || pointsToAward <= 0) return;
    setAwarding(true);
    try {
      const result = await customFetch<{ newPoints: number; newLevel: string }>("/api/admin/loyalty/award-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: scannedUser.id, points: pointsToAward, reason: awardReason || "Punti dal ristorante" }),
      });
      toast({ title: "Punti assegnati!", description: `${pointsToAward} punti a ${scannedUser.firstName}` });
      setScannedUser(prev => prev ? { ...prev, loyaltyPoints: result.newPoints, loyaltyLevel: result.newLevel } : null);
      setPointsToAward(10);
      setAwardReason("");
    } catch {
      toast({ title: "Errore", description: "Impossibile assegnare i punti", variant: "destructive" });
    } finally {
      setAwarding(false);
    }
  };

  const handleAwardStamp = async (stampId: string) => {
    if (!scannedUser) return;
    try {
      await customFetch("/api/admin/loyalty/award-stamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: scannedUser.id, stampId }),
      });
      toast({ title: "Timbro assegnato!" });
      setScannedUser(prev => prev ? { ...prev, stamps: [...prev.stamps, stampId] } : null);
    } catch (e: any) {
      toast({ title: "Errore", description: e?.error || "Timbro già assegnato", variant: "destructive" });
    }
  };

  const handleManualLookup = () => {
    if (!manualCode.trim()) return;
    lookupUser(manualCode.trim());
  };

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Accesso Riservato</h2>
        <Link href="/login"><Button className="rounded-xl">Accedi</Button></Link>
      </PageTransition>
    );
  }

  if (adminLoading) {
    return <PageTransition className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse h-40 w-40 bg-muted rounded-2xl" /></PageTransition>;
  }

  if (!adminData?.isAdmin) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Accesso Riservato</h2>
        <p className="text-muted-foreground mb-6">Solo gli amministratori possono accedere.</p>
        <Link href="/"><Button className="rounded-xl">Torna alla Home</Button></Link>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center gap-3 mb-6 pt-2">
        <Button variant="ghost" size="icon" onClick={() => { stopScanner(); window.history.back(); }} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold">Scanner Fedeltà</h1>
          <p className="text-sm text-muted-foreground">Scansiona il QR per assegnare punti e timbri</p>
        </div>
      </div>

      {view === "scanner" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {!scanning ? (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-24 h-24 rounded-full bg-[#4A6741] text-white flex items-center justify-center">
                <QrCode size={48} />
              </div>
              <div className="text-center">
                <h3 className="font-serif font-bold text-xl mb-2">Pronto per la scansione</h3>
                <p className="text-sm text-muted-foreground max-w-xs">Premi il pulsante per attivare la fotocamera e scansionare il QR code del cliente.</p>
              </div>
              <Button onClick={startScanner} className="rounded-2xl h-14 px-8 text-base gap-3">
                <Camera size={20} /> Apri Fotocamera
              </Button>
              <button onClick={() => setView("manual")} className="text-sm text-primary font-medium">
                Inserisci codice manualmente
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden bg-black aspect-square max-h-[400px]">
                <div id={scannerContainerId} className="w-full h-full" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={stopScanner} className="flex-1 rounded-xl">Chiudi fotocamera</Button>
                <Button variant="outline" onClick={() => { stopScanner(); setView("manual"); }} className="flex-1 rounded-xl">Codice manuale</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === "manual" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <h3 className="font-serif font-bold text-lg mb-4">Inserisci Codice QR</h3>
            <p className="text-sm text-muted-foreground mb-4">Inserisci il codice alfanumerico mostrato sotto il QR code del cliente.</p>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="BK-XXXXXXXXXXXX"
              className="w-full bg-[#F9F9F9] border border-transparent focus:border-primary focus:bg-white rounded-xl py-3 px-4 text-sm outline-none transition-all placeholder:text-gray-300 text-foreground font-mono font-medium tracking-wider text-center"
            />
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => { setView("scanner"); setManualCode(""); }} className="flex-1 rounded-xl">Indietro</Button>
              <Button onClick={handleManualLookup} disabled={!manualCode.trim()} className="flex-1 rounded-xl">Cerca</Button>
            </div>
          </div>
        </div>
      )}

      {view === "user" && scannedUser && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-[#4A6741] to-[#2C4A32] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {scannedUser.firstName.charAt(0)}{scannedUser.lastName.charAt(0)}
              </div>
              <div>
                <h3 className="font-serif font-bold text-xl">{scannedUser.firstName} {scannedUser.lastName}</h3>
                <p className="text-white/70 text-sm">{scannedUser.email}</p>
                {scannedUser.phone && <p className="text-white/60 text-xs">{scannedUser.phone}</p>}
              </div>
            </div>

            <div className="flex gap-3 relative z-10">
              <div className="flex-1 bg-white/15 backdrop-blur-md rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{scannedUser.loyaltyPoints}</p>
                <p className="text-[10px] text-white/70 uppercase tracking-wider">Punti</p>
              </div>
              <div className="flex-1 bg-white/15 backdrop-blur-md rounded-xl p-3 text-center">
                <p className="text-lg font-bold flex items-center justify-center gap-1">
                  {LEVEL_EMOJI[scannedUser.loyaltyLevel] || "🌱"} {LEVEL_LABELS[scannedUser.loyaltyLevel] || scannedUser.loyaltyLevel}
                </p>
                <p className="text-[10px] text-white/70 uppercase tracking-wider">Livello</p>
              </div>
              <div className="flex-1 bg-white/15 backdrop-blur-md rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{scannedUser.stamps.length}</p>
                <p className="text-[10px] text-white/70 uppercase tracking-wider">Timbri</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
            <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <Gift size={20} className="text-primary" /> Assegna Punti
            </h3>
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setPointsToAward(Math.max(1, pointsToAward - 10))}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
              >
                <Minus size={18} />
              </button>
              <input
                type="number"
                value={pointsToAward}
                onChange={(e) => setPointsToAward(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-center text-3xl font-bold bg-transparent border-none outline-none text-foreground"
                min={1}
              />
              <button
                onClick={() => setPointsToAward(pointsToAward + 10)}
                className="w-10 h-10 rounded-full bg-[#4A6741] text-white flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
              {[10, 25, 50, 100, 200].map(v => (
                <button
                  key={v}
                  onClick={() => setPointsToAward(v)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                    pointsToAward === v ? "bg-primary text-white" : "bg-muted text-foreground"
                  }`}
                >
                  {v} pt
                </button>
              ))}
            </div>

            <input
              type="text"
              value={awardReason}
              onChange={(e) => setAwardReason(e.target.value)}
              placeholder="Motivo (es. pranzo, brunch...)"
              className="w-full bg-[#F9F9F9] border border-transparent focus:border-primary focus:bg-white rounded-xl py-3 px-4 text-sm outline-none transition-all placeholder:text-gray-300 text-foreground font-medium mb-4"
            />

            <Button
              onClick={handleAwardPoints}
              disabled={awarding || pointsToAward <= 0}
              className="w-full h-12 rounded-xl text-base"
            >
              {awarding ? "Assegnazione..." : `Assegna ${pointsToAward} Punti`}
            </Button>
          </div>

          <div className="bg-card p-5 rounded-3xl border border-border shadow-sm">
            <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <Leaf size={20} className="text-[#4A6741]" /> Assegna Timbri
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {STAMPS.map((stamp) => {
                const isEarned = scannedUser.stamps.includes(stamp.id);
                return (
                  <button
                    key={stamp.id}
                    onClick={() => !isEarned && handleAwardStamp(stamp.id)}
                    disabled={isEarned}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                      isEarned
                        ? "bg-[#4A6741] text-white shadow-md"
                        : "bg-muted/50 border border-dashed border-border text-muted-foreground hover:bg-[#4A6741]/10 hover:border-[#4A6741]/30"
                    }`}
                  >
                    {isEarned && <CheckCircle2 size={14} className="absolute" />}
                    {getIcon(stamp.icon, 18)}
                    <span className="text-[9px] font-bold leading-none">{stamp.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {scannedUser.recentHistory.length > 0 && (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-bold text-sm">Ultime Attività</h3>
              </div>
              <div className="divide-y divide-border">
                {scannedUser.recentHistory.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4">
                    <div>
                      <p className="font-bold text-sm">{item.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`font-bold ${item.type === "earned" ? "text-[#4A6741]" : "text-primary"}`}>
                      {item.type === "earned" ? "+" : "-"}{item.points} pt
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => { setScannedUser(null); setView("scanner"); }}
            className="w-full rounded-xl h-12"
          >
            <QrCode size={16} className="mr-2" /> Scansiona un altro QR
          </Button>
        </div>
      )}
    </PageTransition>
  );
}
