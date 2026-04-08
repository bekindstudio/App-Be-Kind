import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@workspace/api-client-react";
import { ArrowLeft } from "lucide-react";
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
    <PageTransition className="min-h-screen bg-background flex flex-col p-6">
      <div className="mb-6">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col pb-12">
        <h1 className="text-4xl font-serif font-bold mb-2">Unisciti a noi.</h1>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input 
                id="firstName" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rounded-xl bg-muted/50 border-transparent focus-visible:border-primary"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Cognome</Label>
              <Input 
                id="lastName" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="rounded-xl bg-muted/50 border-transparent focus-visible:border-primary"
                required 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="la-tua@email.it"
              className="rounded-xl bg-muted/50 border-transparent focus-visible:border-primary"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input 
              id="phone" 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+39 ..."
              className="rounded-xl bg-muted/50 border-transparent focus-visible:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl bg-muted/50 border-transparent focus-visible:border-primary"
              required 
            />
          </div>
          
          <div className="flex items-start space-x-3 pt-4">
            <Checkbox 
              id="terms" 
              checked={acceptedTerms} 
              onCheckedChange={(c) => setAcceptedTerms(!!c)} 
              className="mt-1"
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Accetto i termini e le condizioni
              </label>
              <p className="text-xs text-muted-foreground">
                Accetti i nostri Termini di Servizio e la Privacy Policy.
              </p>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-lg font-medium mt-8" 
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Creazione account..." : "Crea Account"}
          </Button>
        </form>
        
        <div className="mt-8 text-center">
          <span className="text-muted-foreground text-sm">Hai già un account? </span>
          <Link href="/login">
            <span className="text-primary font-medium text-sm">Accedi</span>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
