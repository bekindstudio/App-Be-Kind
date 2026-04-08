import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useGetReservations } from "@workspace/api-client-react";
import { ArrowLeft, Calendar, Clock, MapPin, Plus, Users } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Reservations() {
  const token = useAuthStore((state) => state.token);
  const { data: reservations, isLoading } = useGetReservations({ query: { enabled: !!token } });

  if (!token) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Sign in to book</h2>
        <p className="text-muted-foreground mb-6">Log in to view and manage your reservations.</p>
        <Link href="/login">
          <Button className="rounded-xl w-full max-w-sm h-12 text-lg">Sign In</Button>
        </Link>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-serif font-bold">Reservations</h1>
        </div>
        <Link href="/reservations/new">
          <Button size="icon" className="rounded-full w-10 h-10">
            <Plus className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-card rounded-2xl"></div>
          <div className="h-32 bg-card rounded-2xl"></div>
        </div>
      ) : !reservations || reservations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-serif font-semibold mb-2">No reservations yet</h2>
          <p className="text-muted-foreground mb-6">Book a table to experience Be Kind.</p>
          <Link href="/reservations/new">
            <Button className="rounded-xl px-8">Book a Table</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reservations.map(res => (
            <div key={res.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 text-lg font-bold font-serif">
                  <Calendar className="w-5 h-5 text-primary" />
                  {new Date(res.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <Badge variant={res.status === 'confirmed' ? 'default' : res.status === 'completed' ? 'secondary' : 'outline'}>
                  {res.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-secondary" />
                  <span className="font-medium text-foreground">{res.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-secondary" />
                  <span className="font-medium text-foreground">{res.guests} guests</span>
                </div>
              </div>

              {res.status === 'confirmed' && (
                <div className="flex gap-3 pt-4 border-t border-border mt-2">
                  <Button variant="outline" className="flex-1 rounded-xl">Modify</Button>
                  <Button variant="outline" className="flex-1 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">Cancel</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
