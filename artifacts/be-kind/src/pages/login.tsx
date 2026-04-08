import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { useLogin } from "@workspace/api-client-react";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react/custom-fetch";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
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
    setGoogleLoading(true);
    try {
      const res = await customFetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        toast({ title: "Bentornato!" });
        setLocation("/");
      } else {
        toast({ title: "Accesso fallito", variant: "destructive" });
      }
    } catch {
      toast({ title: "Errore con Google", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
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
    <PageTransition className="min-h-screen bg-background flex flex-col p-6">
      <div className="mb-8">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-4xl font-serif font-bold mb-2">Bentornato.</h1>
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
        ) : (
          <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground text-center">
              🔑 Per attivare l'accesso con Google, configura il <strong>Google Client ID</strong> nelle impostazioni.
            </p>
          </div>
        )}
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="la-tua@email.it"
              className="rounded-xl h-12 bg-muted/50 border-transparent focus-visible:border-primary"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl h-12 bg-muted/50 border-transparent focus-visible:border-primary"
              required 
            />
          </div>
          
          <div className="pt-4 text-right">
            <Link href="/forgot-password">
              <span className="text-sm text-primary font-medium">Password dimenticata?</span>
            </Link>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-lg font-medium mt-4" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
          </Button>
        </form>
        
        <div className="mt-8 text-center">
          <span className="text-muted-foreground text-sm">Non hai un account? </span>
          <Link href="/register">
            <span className="text-primary font-medium text-sm">Registrati</span>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
