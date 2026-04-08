import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, Shield } from "lucide-react";
import { Link } from "wouter";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("bekind_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleAccept = () => {
    localStorage.setItem("bekind_cookie_consent", "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-2 right-2 z-50 animate-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto">
      <div className="bg-card border border-border/50 rounded-[20px] p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Cookie e Privacy</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Utilizziamo solo cookie tecnici necessari al funzionamento dell'app (autenticazione e sessione). Nessun cookie di profilazione.{" "}
              <Link href="/privacy" className="text-primary underline">Informativa Privacy</Link>
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAccept} className="rounded-xl text-xs h-8 px-4">
                <Shield className="w-3.5 h-3.5 mr-1" />
                Ho capito
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
