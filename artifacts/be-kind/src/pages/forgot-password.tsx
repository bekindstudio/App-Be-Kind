import { PageTransition } from "@/components/page-transition";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Mail, KeyRound, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react/custom-fetch";

const BASE = import.meta.env.BASE_URL;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const result = await customFetch<{ message: string; resetToken?: string }>("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (result.resetToken) {
        setResetToken(result.resetToken);
      }
      setSent(true);
      toast({ title: "Richiesta inviata", description: result.message });
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent && resetToken) {
    return (
      <PageTransition className="flex flex-col min-h-screen bg-background">
        <div className="px-6 pt-12 pb-4 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft text-secondary active:scale-95 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <img src={`${BASE}logo-terracotta.png`} alt="Be Kind" className="h-10 w-auto object-contain" />
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 pb-12">
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2 text-center">Link generato</h1>
          <p className="text-muted-foreground mb-8 text-center text-sm">
            Clicca il pulsante qui sotto per reimpostare la tua password.
          </p>

          <Link href={`/reset-password?token=${resetToken}`}>
            <button className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95">
              Reimposta Password
            </button>
          </Link>

          <div className="mt-6 text-center">
            <Link href="/login">
              <span className="text-sm text-primary font-medium">Torna al Login</span>
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (sent) {
    return (
      <PageTransition className="flex flex-col min-h-screen bg-background">
        <div className="px-6 pt-12 pb-4 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft text-secondary active:scale-95 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <img src={`${BASE}logo-terracotta.png`} alt="Be Kind" className="h-10 w-auto object-contain" />
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 pb-12 text-center">
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2">Controlla la tua email</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            Se l'indirizzo è registrato, riceverai le istruzioni per reimpostare la password.
          </p>
          <Link href="/login">
            <button className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95">
              Torna al Login
            </button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col min-h-screen bg-background">
      <div className="px-6 pt-12 pb-4 flex items-center justify-between">
        <button onClick={() => window.history.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft text-secondary active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <img src={`${BASE}logo-terracotta.png`} alt="Be Kind" className="h-10 w-auto object-contain" />
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2 text-center">Password dimenticata?</h1>
        <p className="text-muted-foreground mb-8 text-center text-sm">
          Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="la-tua@email.it"
                className="w-full bg-muted/50 border border-transparent focus:border-primary focus:bg-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-300 text-foreground font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? "Invio in corso..." : "Invia Istruzioni"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/login">
            <span className="text-primary font-bold text-sm">Torna al Login</span>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
