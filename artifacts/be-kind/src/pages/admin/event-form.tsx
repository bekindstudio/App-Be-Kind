import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAdminEvents, useSaveEvent } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Clock, ImageIcon, MapPin, Save, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";

const EVENT_CATEGORIES = ["Workshop", "Degustazione", "Musica", "Yoga", "Sociale", "Festività", "Altro"];

export default function EventForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== "nuovo";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: events } = useAdminEvents();
  const saveMutation = useSaveEvent();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocationVal] = useState("Ristorante Be Kind, Via Carducci 118, Cattolica (RN)");
  const [category, setCategory] = useState("Workshop");
  const [price, setPrice] = useState("0");
  const [maxParticipants, setMaxParticipants] = useState("20");
  const [isFree, setIsFree] = useState(true);

  useEffect(() => {
    if (isEdit && events) {
      const event = events.find((e: any) => e.id === Number(id));
      if (event) {
        setTitle(event.title);
        setDescription(event.description);
        setImageUrl(event.imageUrl || "");
        setDate(event.date);
        setStartTime(event.startTime);
        setEndTime(event.endTime);
        setLocationVal(event.location);
        setCategory(event.category);
        setPrice(event.price.toString());
        setMaxParticipants(event.maxParticipants.toString());
        setIsFree(event.isFree);
      }
    }
  }, [isEdit, events, id]);

  const handleSave = () => {
    if (!title || !description || !date || !startTime || !endTime || !location || !maxParticipants) {
      toast({ title: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      id: isEdit ? Number(id) : undefined,
      data: {
        title, description, imageUrl: imageUrl || null, date, startTime, endTime,
        location, category, price: isFree ? 0 : parseFloat(price),
        maxParticipants: parseInt(maxParticipants), isFree,
      },
    }, {
      onSuccess: () => {
        toast({ title: isEdit ? "Evento aggiornato" : "Evento creato" });
        setLocation("/admin/eventi");
      },
      onError: () => toast({ title: "Errore nel salvataggio", variant: "destructive" }),
    });
  };

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center gap-3 mb-6 pt-2">
        <Link href="/admin/eventi">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-serif font-bold">{isEdit ? "Modifica Evento" : "Nuovo Evento"}</h1>
      </div>

      <div className="space-y-5">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-secondary" />
            <h3 className="font-serif font-semibold text-lg">Informazioni Evento</h3>
          </div>
          <div className="space-y-2">
            <Label>Titolo *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="es. Workshop Pasta Fresca" className="h-12 bg-muted/50 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Descrizione *</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrizione dell'evento..." className="bg-muted/50 rounded-xl resize-none min-h-[100px]" />
          </div>
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${category === cat ? "bg-secondary border-secondary text-secondary-foreground" : "bg-transparent border-border text-foreground hover:bg-muted"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-serif font-semibold text-lg">Data & Orario</h3>
          </div>
          <div className="space-y-2">
            <Label>Data *</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-12 bg-muted/50 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Inizio *</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-12 bg-muted/50 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Fine *</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-12 bg-muted/50 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-5 h-5 text-chart-3" />
            <h3 className="font-serif font-semibold text-lg">Luogo & Partecipanti</h3>
          </div>
          <div className="space-y-2">
            <Label>Luogo *</Label>
            <Input value={location} onChange={e => setLocationVal(e.target.value)} className="h-12 bg-muted/50 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Max Partecipanti *</Label>
            <Input type="number" min="1" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} className="h-12 bg-muted/50 rounded-xl" />
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-serif font-semibold text-lg">Prezzo</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Evento Gratuito</p>
              <p className="text-xs text-muted-foreground">L'evento è ad accesso libero</p>
            </div>
            <Switch checked={isFree} onCheckedChange={setIsFree} />
          </div>
          {!isFree && (
            <div className="space-y-2">
              <Label>Prezzo (€)</Label>
              <Input type="number" step="0.50" min="0" value={price} onChange={e => setPrice(e.target.value)} className="h-12 bg-muted/50 rounded-xl" />
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="w-5 h-5 text-secondary" />
            <h3 className="font-serif font-semibold text-lg">Immagine</h3>
          </div>
          <div className="space-y-2">
            <Label>URL Immagine</Label>
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="h-12 bg-muted/50 rounded-xl" />
          </div>
          {imageUrl && (
            <div className="w-full h-40 rounded-xl overflow-hidden bg-muted">
              <img src={imageUrl} alt="Anteprima" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
        </div>

        <Button
          className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover-elevate mt-2"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Salvataggio..." : <><Save className="w-5 h-5 mr-2" /> {isEdit ? "Salva Modifiche" : "Crea Evento"}</>}
        </Button>
      </div>
    </PageTransition>
  );
}
