import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { useLogin } from "@workspace/api-client-react";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Login() {
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password123");
  const [, setLocation] = useLocation();
  const setToken = useAuthStore((state) => state.setToken);
  const { toast } = useToast();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        toast({ title: "Welcome back!" });
        setLocation("/");
      },
      onError: (err) => {
        toast({ title: "Login failed", description: err.message, variant: "destructive" });
      }
    }
  });

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
        <p className="text-muted-foreground mb-8">Sign in to book tables, order, and earn loyalty points.</p>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              <span className="text-sm text-primary font-medium">Forgot password?</span>
            </Link>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-lg font-medium mt-4" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        
        <div className="mt-8 text-center">
          <span className="text-muted-foreground text-sm">Don't have an account? </span>
          <Link href="/register">
            <span className="text-primary font-medium text-sm">Register</span>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
