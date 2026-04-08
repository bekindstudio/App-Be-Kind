import { PageTransition } from "@/components/page-transition";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react/custom-fetch";

const BASE = import.meta.env.BASE_URL;

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({ title: "Password troppo corta", description: "Almeno 6 caratteri.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Le password non corrispondono", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await customFetch<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      setSuccess(true);
      toast({ title: "Password aggiornata!" });
    } catch (err: any) {
      toast({ title: "Errore", description: err.message || "Link scaduto o non valido.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <PageTransition className="flex flex-col min-h-screen bg-background justify-center items-center px-6">
        <h1 className="text-2xl font-serif font-bold mb-4">Link non valido</h1>
        <p className="text-muted-foreground mb-6 text-center">Il link di reset non è valido. Richiedi un nuovo link.</p>
        <Link href="/forgot-password">
          <button className="bg-primary text-white font-bold py-3 px-8 rounded-2xl">Richiedi Nuovo Link</button>
        </Link>
      </PageTransition>
    );
  }

  if (success) {
    return (
      <PageTransition className="flex flex-col min-h-screen bg-background justify-center items-center px-6">
        <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-secondary" />
        </div>
        <h1 className="text-3xl font-serif font-bold mb-2">Password aggiornata!</h1>
        <p className="text-muted-foreground mb-8 text-center">Ora puoi accedere con la tua nuova password.</p>
        <Link href="/login">
          <button className="w-full bg-primary text-white font-bold py-4 px-12 rounded-2xl shadow-lg">Vai al Login</button>
        </Link>
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
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2 text-center">Nuova Password</h1>
        <p className="text-muted-foreground mb-8 text-center text-sm">
          Inserisci la tua nuova password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">Nuova Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Almeno 6 caratteri"
                className="w-full bg-muted/50 border border-transparent focus:border-primary focus:bg-white rounded-xl py-3 pl-10 pr-12 text-sm outline-none transition-all placeholder:text-gray-300 text-foreground font-medium"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">Conferma Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la password"
                className="w-full bg-muted/50 border border-transparent focus:border-primary focus:bg-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-300 text-foreground font-medium"
                required
                minLength={6}
              />
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive ml-1 mt-1">Le password non corrispondono</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || newPassword !== confirmPassword}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? "Aggiornamento..." : "Aggiorna Password"}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
