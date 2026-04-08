import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { useCreateReservation, useGetAvailability } from "@workspace/api-client-react";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function NewReservation() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("");
  const [guests, setGuests] = useState<number>(2);
  const [notes, setNotes] = useState("");

  const token = useAuthStore((state) => state.token);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const formattedDate = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : "";
  const { data: availability } = useGetAvailability({ date: formattedDate, guests }, { query: { enabled: !!formattedDate } });
  
  const createReservationMutation = useCreateReservation();

  const handleBook = () => {
    if (!formattedDate || !time) {
      toast({ title: "Select date and time", variant: "destructive" });
      return;
    }

    createReservationMutation.mutate({
      data: { date: formattedDate, time, guests, notes: notes || undefined }
    }, {
      onSuccess: () => {
        toast({ title: "Table Booked!" });
        setLocation("/reservations");
      },
      onError: (err) => {
        toast({ title: "Failed to book", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center gap-3 mb-6 pt-2">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-serif font-bold">Book a Table</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-serif text-lg font-semibold">Number of Guests</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <Button 
                key={num} 
                variant={guests === num ? "default" : "outline"}
                className={`rounded-full shrink-0 w-12 h-12 text-lg ${guests !== num ? 'border-border' : ''}`}
                onClick={() => setGuests(num)}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="font-serif text-lg font-semibold mb-4">Select Date</h3>
          <div className="flex justify-center bg-background rounded-xl p-2 border border-border">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
              className="pointer-events-auto"
            />
          </div>
        </div>

        {availability && !availability.closedDay && availability.availableSlots.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-secondary" />
              <h3 className="font-serif text-lg font-semibold">Available Times</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {availability.availableSlots.map(slot => (
                <Button 
                  key={slot}
                  variant={time === slot ? "default" : "outline"}
                  className={`rounded-xl py-6 ${time === slot ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground' : 'border-border hover:bg-muted'}`}
                  onClick={() => setTime(slot)}
                >
                  {slot}
                </Button>
              ))}
            </div>
          </div>
        )}

        {availability?.closedDay && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-center font-medium">
            We are closed on this day. Please select another date.
          </div>
        )}

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <Label htmlFor="notes" className="font-serif text-lg font-semibold mb-2 block">Special Requests</Label>
          <Textarea 
            id="notes" 
            placeholder="Anniversary? Dietary requirements?" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-xl bg-muted/50 border-transparent resize-none min-h-[100px]"
          />
        </div>

        <Button 
          className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover-elevate mt-6"
          onClick={handleBook}
          disabled={createReservationMutation.isPending || !date || !time}
        >
          {createReservationMutation.isPending ? "Confirming..." : "Confirm Reservation"}
        </Button>
      </div>
    </PageTransition>
  );
}
