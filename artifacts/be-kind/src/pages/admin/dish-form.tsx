import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAdminDishes, useAdminMenuCategories, useSaveDish } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChefHat, ImageIcon, Save, Sparkles, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { cn } from "@/lib/utils";

export default function DishForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== "nuovo";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories } = useAdminMenuCategories();
  const { data: dishes } = useAdminDishes();
  const saveMutation = useSaveDish();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [ingredients, setIngredients] = useState("");
  const [allergens, setAllergens] = useState("");
  const [dietaryTags, setDietaryTags] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    if (isEdit && dishes) {
      const dish = dishes.find((d: any) => d.id === Number(id));
      if (dish) {
        setName(dish.name);
        setDescription(dish.description);
        setPrice(dish.price.toString());
        setImageUrl(dish.imageUrl || "");
        setCategoryId(dish.categoryId);
        setIngredients((dish.ingredients || []).join(", "));
        setAllergens((dish.allergens || []).join(", "));
        setDietaryTags((dish.dietaryTags || []).join(", "));
        setIsAvailable(dish.isAvailable);
        setIsFeatured(dish.isFeatured);
      }
    }
  }, [isEdit, dishes, id]);

  const handleSave = () => {
    if (!name || !description || !price || !categoryId) {
      toast({ title: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      id: isEdit ? Number(id) : undefined,
      data: {
        name, description, price: parseFloat(price), imageUrl: imageUrl || null,
        categoryId, isAvailable, isFeatured,
        ingredients: ingredients ? ingredients.split(",").map(s => s.trim()).filter(Boolean) : [],
        allergens: allergens ? allergens.split(",").map(s => s.trim()).filter(Boolean) : [],
        dietaryTags: dietaryTags ? dietaryTags.split(",").map(s => s.trim()).filter(Boolean) : [],
      },
    }, {
      onSuccess: () => {
        toast({ title: isEdit ? "Piatto aggiornato" : "Piatto creato" });
        setLocation("/admin/piatti");
      },
      onError: () => toast({ title: "Errore nel salvataggio", variant: "destructive" }),
    });
  };

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center gap-3 mb-6 pt-2">
        <Link href="/admin/piatti">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-serif font-bold">{isEdit ? "Modifica Piatto" : "Nuovo Piatto"}</h1>
      </div>

      <div className="space-y-5">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ChefHat className="w-5 h-5 text-primary" />
            <h3 className="font-serif font-semibold text-lg">Informazioni Base</h3>
          </div>
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="es. Bruschetta Be Kind" className="h-12 bg-muted/50 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Descrizione *</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrizione del piatto..." className="bg-muted/50 rounded-xl resize-none min-h-[100px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prezzo (€) *</Label>
              <Input type="number" step="0.50" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="12.50" className="h-12 bg-muted/50 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(Number(e.target.value))}
                className="w-full h-12 bg-muted/50 rounded-xl border-transparent px-3 text-sm"
              >
                <option value={0}>Seleziona...</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
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

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-5 h-5 text-chart-3" />
            <h3 className="font-serif font-semibold text-lg">Dettagli</h3>
          </div>
          <div className="space-y-2">
            <Label>Ingredienti</Label>
            <Input value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="Pomodoro, Basilico, Mozzarella..." className="h-12 bg-muted/50 rounded-xl" />
            <p className="text-xs text-muted-foreground">Separati da virgola</p>
          </div>
          <div className="space-y-2">
            <Label>Allergeni</Label>
            <Input value={allergens} onChange={e => setAllergens(e.target.value)} placeholder="glutine, lattosio..." className="h-12 bg-muted/50 rounded-xl" />
            <p className="text-xs text-muted-foreground">Separati da virgola</p>
          </div>
          <div className="space-y-2">
            <Label>Tag Dietetici</Label>
            <Input value={dietaryTags} onChange={e => setDietaryTags(e.target.value)} placeholder="Vegan, Vegetariano, Senza Glutine..." className="h-12 bg-muted/50 rounded-xl" />
            <p className="text-xs text-muted-foreground">Separati da virgola</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-serif font-semibold text-lg">Visibilità</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Disponibile</p>
              <p className="text-xs text-muted-foreground">Visibile nel menù ai clienti</p>
            </div>
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">In Evidenza</p>
              <p className="text-xs text-muted-foreground">Mostra nella sezione "Speciali del Giorno"</p>
            </div>
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
          </div>
        </div>

        <Button
          className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover-elevate mt-2"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Salvataggio..." : <><Save className="w-5 h-5 mr-2" /> {isEdit ? "Salva Modifiche" : "Crea Piatto"}</>}
        </Button>
      </div>
    </PageTransition>
  );
}
