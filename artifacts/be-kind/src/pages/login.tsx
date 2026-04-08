import { PageTransition } from "@/components/page-transition";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { useLogin } from "@workspace/api-client-react";
import { ChevronLeft, Mail, Lock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react/custom-fetch";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const BASE = import.meta.env.BASE_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const setToken = useAuthStore((state) => state.setToken);
  const { toast } = useToast();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        toast({ title: "Bentornato!" });
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Accesso fallito", description: "Email o password non corretti", variant: "destructive" });
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
        toast({ title: "Bentornato!" });
        setLocation("/");
      } else {
        toast({ title: "Accesso fallito", variant: "destructive" });
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
        document.getElementById("google-signin-btn"),
        { theme: "outline", size: "large", width: "100%", text: "signin_with", locale: "it" }
      );
    };
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [handleGoogleCredential]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } });
  };

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
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Bentornato.</h1>
        <p className="text-muted-foreground mb-8">Accedi per prenotare tavoli, ordinare e guadagnare punti fedeltà.</p>

        {GOOGLE_CLIENT_ID ? (
          <>
            <div id="google-signin-btn" className="flex justify-center mb-6" />
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
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="La tua password"
                className="w-full bg-muted/50 border border-transparent focus:border-primary focus:bg-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-300 text-foreground font-medium"
                required
              />
            </div>
          </div>

          <div className="pt-2 text-right">
            <Link href="/forgot-password">
              <span className="text-sm text-primary font-medium cursor-pointer">Password dimenticata?</span>
            </Link>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <span className="text-muted-foreground text-sm">Non hai un account? </span>
          <Link href="/register">
            <span className="text-primary font-bold text-sm">Registrati</span>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
