import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetProfile, useUpdateProfile } from "@workspace/api-client-react";
import { ArrowLeft, Save, Lock, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react/custom-fetch";

export default function EditProfile() {
  const token = useAuthStore((state) => state.token);
  const { data: profile, isLoading } = useGetProfile({ query: { enabled: !!token } });
  const updateProfileMutation = useUpdateProfile();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhone(profile.phone || "");
      setCodiceFiscale((profile as any).codiceFiscale || "");
    }
  }, [profile]);

  const handleSave = () => {
    updateProfileMutation.mutate({
      data: { firstName, lastName, phone, codiceFiscale } as any
    }, {
      onSuccess: () => {
        toast({ title: "Profilo aggiornato" });
        window.history.back();
      },
      onError: (err) => {
        toast({ title: "Aggiornamento fallito", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password troppo corta", description: "Almeno 6 caratteri.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Le password non corrispondono", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    try {
      await customFetch<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast({ title: "Password aggiornata con successo" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      toast({ title: "Errore", description: err.message || "Impossibile cambiare la password", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
        <div className="h-8 w-1/3 bg-muted animate-pulse rounded mb-8"></div>
        <div className="space-y-4">
          <div className="h-12 bg-muted animate-pulse rounded-xl"></div>
          <div className="h-12 bg-muted animate-pulse rounded-xl"></div>
          <div className="h-12 bg-muted animate-pulse rounded-xl"></div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center gap-3 mb-6 pt-2">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-serif font-bold">Modifica Profilo</h1>
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nome</Label>
          <Input 
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-12 bg-muted/50 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Cognome</Label>
          <Input 
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-12 bg-muted/50 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefono</Label>
          <Input 
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12 bg-muted/50 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="codiceFiscale">Codice Fiscale / P.IVA</Label>
          <Input 
            id="codiceFiscale"
            value={codiceFiscale}
            onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
            placeholder="RSSMRA85M01H501Z"
            className="h-12 bg-muted/50 rounded-xl font-mono"
            maxLength={16}
          />
          <p className="text-[10px] text-muted-foreground ml-1">Verrà usato automaticamente nelle ricevute dei tuoi ordini</p>
        </div>
        <div className="space-y-2 opacity-50">
          <Label>Email (non modificabile)</Label>
          <Input 
            value={profile.email}
            disabled
            className="h-12 bg-muted/50 rounded-xl"
          />
        </div>
      </div>

      <Button 
        className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover-elevate mt-6"
        onClick={handleSave}
        disabled={updateProfileMutation.isPending}
      >
        {updateProfileMutation.isPending ? "Salvataggio..." : <><Save className="w-5 h-5 mr-2" /> Salva Modifiche</>}
      </Button>

      <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-serif font-bold">Cambia Password</h2>
        </div>

        <div className="space-y-2">
          <Label>Password attuale</Label>
          <div className="relative">
            <Input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Inserisci password attuale"
              className="h-12 bg-muted/50 rounded-xl pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Nuova password</Label>
          <Input
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Almeno 6 caratteri"
            className="h-12 bg-muted/50 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label>Conferma nuova password</Label>
          <Input
            type={showPasswords ? "text" : "password"}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Ripeti la nuova password"
            className="h-12 bg-muted/50 rounded-xl"
          />
          {confirmNewPassword && newPassword !== confirmNewPassword && (
            <p className="text-xs text-destructive ml-1">Le password non corrispondono</p>
          )}
        </div>

        <Button
          className="w-full h-12 rounded-xl font-medium"
          variant="outline"
          onClick={handleChangePassword}
          disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmNewPassword}
        >
          {changingPassword ? "Aggiornamento..." : "Aggiorna Password"}
        </Button>
      </div>
    </PageTransition>
  );
}
