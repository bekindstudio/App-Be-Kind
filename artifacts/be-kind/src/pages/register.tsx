import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@workspace/api-client-react";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

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
        toast({ title: "Welcome to Be Kind!" });
        setLocation("/");
      },
      onError: (err) => {
        toast({ title: "Registration failed", description: err.message, variant: "destructive" });
      }
    }
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast({ title: "Please accept terms", variant: "destructive" });
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
        <h1 className="text-4xl font-serif font-bold mb-2">Join us.</h1>
        <p className="text-muted-foreground mb-8">Create an account to become a regular.</p>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rounded-xl bg-muted/50 border-transparent focus-visible:border-primary"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
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
              className="rounded-xl bg-muted/50 border-transparent focus-visible:border-primary"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl bg-muted/50 border-transparent focus-visible:border-primary"
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
                Accept terms and conditions
              </label>
              <p className="text-xs text-muted-foreground">
                You agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-lg font-medium mt-8" 
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Creating account..." : "Create Account"}
          </Button>
        </form>
        
        <div className="mt-8 text-center">
          <span className="text-muted-foreground text-sm">Already have an account? </span>
          <Link href="/login">
            <span className="text-primary font-medium text-sm">Sign in</span>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
