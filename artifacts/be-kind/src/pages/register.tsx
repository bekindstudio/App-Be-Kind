import { PageTransition } from "@/components/page-transition";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@workspace/api-client-react";
import { ChevronLeft, Mail, Lock, Phone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react/custom-fetch";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [, setLocation] = useLocation();
  const setToken = useAuthStore((state) => state.setToken);
  const { toast } = useToast();

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        toast({ title: "Benvenuto in Be Kind!" });
        setLocation("/");
      },
      onError: (err) => {
        toast({ title: "Registrazione fallita", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleGoogleCredential = useCallback(async (response: any) => {
    try {
      const data = await customFetch<{ token: string; user: any }>("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      if (data.token) {
        setToken(data.token);
        toast({ title: "Benvenuto in Be Kind!" });
        setLocation("/");
      } else {
        toast({ title: "Registrazione fallita", variant: "destructive" });
      }
    } catch {
      toast({ title: "Errore con Google", variant: "destructive" });
    }
  }, [setToken, toast, setLocation]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (window as any).google?.accounts?.id?.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      (window as any).google?.accounts?.id?.renderButton(
        document.getElementById("google-signup-btn"),
        { theme: "outline", size: "large", width: "100%", text: "signup_with", locale: "it" }
      );
    };
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [handleGoogleCredential]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast({ title: "Accetta i termini e condizioni", variant: "destructive" });
      return;
    }
    registerMutation.mutate({ data: { firstName, lastName, email, password, phone, acceptedTerms } });
  };

  return (
    <PageTransition className="flex flex-col min-h-screen bg-background">
      <div className="px-6 pt-12 pb-4">
        <button onClick={() => window.history.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft text-secondary active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-6 pb-12">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Unisciti a noi.</h1>
        <p className="text-muted-foreground mb-8">Crea un account per diventare un cliente abituale.</p>

        {GOOGLE_CLIENT_ID ? (
          <>
            <div id="google-signup-btn" className="flex justify-center mb-6" />
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">oppure</span>
              </div>
            </div>
          </>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="bg-white p-5 rounded-3xl shadow-soft space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Nome</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Mario"
                  className="w-full bg-[#F9F9F9] border border-transparent focus:border-primary focus:bg-white rounded-xl py-3 px-4 text-sm outline-none transition-all placeholder:text-gray-300 text-foreground font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Cognome</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Rossi"
                  className="w-full bg-[#F9F9F9] border border-transparent focus:border-primary focus:bg-white rounded-xl py-3 px-4 text-sm outline-none transition-all placeholder:text-gray-300 text-foreground font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario.rossi@email.com"
                  className="w-full bg-[#F9F9F9] border border-transparent focus:border-primary focus:bg-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-300 text-foreground font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1">Telefono</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 333 1234567"
                  className="w-full bg-[#F9F9F9] border border-transparent focus:border-primary focus:bg-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-300 text-foreground font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Crea una password sicura"
                  className="w-full bg-[#F9F9F9] border border-transparent focus:border-primary focus:bg-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-300 text-foreground font-medium"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-4 px-1">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(c) => setAcceptedTerms(!!c)}
              className="mt-1"
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="terms" className="text-sm font-medium leading-none">
                Accetto i termini e le condizioni
              </label>
              <p className="text-xs text-muted-foreground">
                Accetti i nostri Termini di Servizio e l'Informativa sulla Privacy.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {registerMutation.isPending ? "Creazione account..." : "Crea Account"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <span className="text-muted-foreground text-sm">Hai già un account? </span>
          <Link href="/login">
            <span className="text-primary font-bold text-sm">Accedi</span>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
