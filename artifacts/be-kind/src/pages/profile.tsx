import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetProfile, useGetLoyaltyBalance } from "@workspace/api-client-react";
import { ArrowLeft, ChevronRight, LogOut, Settings, MapPin, CreditCard, Bell, User as UserIcon, Calendar, Package } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLogout } from "@workspace/api-client-react";

export default function Profile() {
  const token = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: profile, isLoading } = useGetProfile({ query: { enabled: !!token } });
  const { data: loyalty } = useGetLoyaltyBalance({ query: { enabled: !!token } });
  const logoutMutation = useLogout();

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <UserIcon className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Sign in to your profile</h2>
        <p className="text-muted-foreground mb-6">Log in to view your loyalty points and account details.</p>
        <Link href="/login">
          <Button className="rounded-xl w-full max-w-sm h-12 text-lg">Sign In</Button>
        </Link>
      </PageTransition>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setToken(null);
        toast({ title: "Logged out successfully" });
        setLocation("/");
      }
    });
  };

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24">
      <div className="bg-primary/5 pt-12 pb-6 px-4 rounded-b-[2.5rem] mb-6">
        {isLoading ? (
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-muted"></div>
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted rounded"></div>
              <div className="h-4 w-24 bg-muted rounded"></div>
            </div>
          </div>
        ) : profile ? (
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-serif font-bold shrink-0">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold">{profile.firstName} {profile.lastName}</h1>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="px-4 flex flex-col gap-6">
        {loyalty && (
          <Link href="/loyalty">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm active-elevate flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Loyalty Points</div>
                <div className="text-3xl font-bold text-primary">{loyalty.points}</div>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-semibold mb-1">
                  {loyalty.level} Member
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                  View rewards <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <Link href="/profile/edit">
            <div className="flex items-center justify-between p-4 border-b border-border active-elevate">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground">
                  <UserIcon className="w-5 h-5" />
                </div>
                <span className="font-medium">Personal Information</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/reservations">
            <div className="flex items-center justify-between p-4 border-b border-border active-elevate">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="font-medium">My Reservations</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/orders">
            <div className="flex items-center justify-between p-4 active-elevate">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground">
                  <Package className="w-5 h-5" />
                </div>
                <span className="font-medium">Order History</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </div>

        <Button 
          variant="outline" 
          className="w-full h-14 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </PageTransition>
  );
}
