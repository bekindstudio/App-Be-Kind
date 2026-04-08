import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAdminProducts, useAdminProductCategories, useSaveProduct } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ImageIcon, Save, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== "nuovo";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories } = useAdminProductCategories();
  const { data: products } = useAdminProducts();
  const saveMutation = useSaveProduct();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);

  useEffect(() => {
    if (isEdit && products) {
      const product = products.find((p: any) => p.id === Number(id));
      if (product) {
        setName(product.name);
        setDescription(product.description);
        setPrice(product.price.toString());
        setImageUrl(product.imageUrl || "");
        setCategoryId(product.categoryId);
        setIsAvailable(product.isAvailable);
        setIsFeatured(product.isFeatured);
        setIsNewArrival(product.isNewArrival);
      }
    }
  }, [isEdit, products, id]);

  const handleSave = () => {
    if (!name || !description || !price || !categoryId) {
      toast({ title: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      id: isEdit ? Number(id) : undefined,
      data: {
        name, description, price: parseFloat(price), imageUrl: imageUrl || null,
        categoryId, isAvailable, isFeatured, isNewArrival, images: [], variants: [],
      },
    }, {
      onSuccess: () => {
        toast({ title: isEdit ? "Prodotto aggiornato" : "Prodotto creato" });
        setLocation("/admin/prodotti");
      },
      onError: () => toast({ title: "Errore nel salvataggio", variant: "destructive" }),
    });
  };

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center gap-3 mb-6 pt-2">
        <Link href="/admin/prodotti">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-serif font-bold">{isEdit ? "Modifica Prodotto" : "Nuovo Prodotto"}</h1>
      </div>

      <div className="space-y-5">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-5 h-5 text-secondary" />
            <h3 className="font-serif font-semibold text-lg">Informazioni Prodotto</h3>
          </div>
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="es. Olio EVO Be Kind" className="h-12 bg-muted/50 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Descrizione *</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrizione del prodotto..." className="bg-muted/50 rounded-xl resize-none min-h-[100px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prezzo (€) *</Label>
              <Input type="number" step="0.50" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="29.90" className="h-12 bg-muted/50 rounded-xl" />
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
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="w-5 h-5 text-primary" />
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
            <Sparkles className="w-5 h-5 text-chart-3" />
            <h3 className="font-serif font-semibold text-lg">Visibilità</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Disponibile</p>
              <p className="text-xs text-muted-foreground">Visibile nella bottega</p>
            </div>
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">In Evidenza</p>
              <p className="text-xs text-muted-foreground">Mostra tra i bestseller</p>
            </div>
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Novità</p>
              <p className="text-xs text-muted-foreground">Mostra badge "Nuovo"</p>
            </div>
            <Switch checked={isNewArrival} onCheckedChange={setIsNewArrival} />
          </div>
        </div>

        <Button
          className="w-full h-14 rounded-xl text-lg font-medium shadow-lg hover-elevate mt-2"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Salvataggio..." : <><Save className="w-5 h-5 mr-2" /> {isEdit ? "Salva Modifiche" : "Crea Prodotto"}</>}
        </Button>
      </div>
    </PageTransition>
  );
}
