import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminMenuCategories, useAdminProductCategories, useSaveMenuCategory, useDeleteMenuCategory, useSaveProductCategory, useDeleteProductCategory, useAdminCheck } from "@/hooks/use-admin";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit2, FolderOpen, Lock, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function AdminCategories() {
  const token = useAuthStore((s) => s.token);
  const { data: admin } = useAdminCheck();
  const { data: menuCats, isLoading: menuLoading } = useAdminMenuCategories();
  const { data: productCats, isLoading: productLoading } = useAdminProductCategories();
  const saveMenuCat = useSaveMenuCategory();
  const deleteMenuCat = useDeleteMenuCategory();
  const saveProductCat = useSaveProductCategory();
  const deleteProductCat = useDeleteProductCategory();
  const { toast } = useToast();

  const [tab, setTab] = useState<"menu" | "bottega">("menu");
  const [editing, setEditing] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("");
  const [showNew, setShowNew] = useState(false);

  if (!token || !admin?.isAdmin) {
    return <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center"><Lock className="w-16 h-16 text-muted-foreground mb-4" /><h2 className="text-2xl font-serif font-bold mb-2">Accesso Riservato</h2></PageTransition>;
  }

  const resetForm = () => { setNewName(""); setNewSlug(""); setNewIcon(""); setNewSortOrder(""); setShowNew(false); setEditing(null); };

  const startEdit = (cat: any) => {
    setEditing(cat);
    setNewName(cat.name);
    setNewSlug(cat.slug);
    setNewIcon(cat.icon || "");
    setNewSortOrder(cat.sortOrder?.toString() || "");
    setShowNew(true);
  };

  const startNew = () => {
    resetForm();
    setShowNew(true);
  };

  const handleSave = () => {
    if (!newName || !newSlug) {
      toast({ title: "Nome e slug obbligatori", variant: "destructive" }); return;
    }
    const data: any = { name: newName, slug: newSlug, icon: newIcon || (tab === "menu" ? "🍽️" : "📦") };
    if (tab === "menu") data.sortOrder = parseInt(newSortOrder) || 99;

    const saveFn = tab === "menu" ? saveMenuCat : saveProductCat;
    saveFn.mutate({ id: editing?.id, data }, {
      onSuccess: () => { toast({ title: editing ? "Categoria aggiornata" : "Categoria creata" }); resetForm(); },
      onError: () => toast({ title: "Errore", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Eliminare la categoria "${name}"?`)) return;
    const deleteFn = tab === "menu" ? deleteMenuCat : deleteProductCat;
    deleteFn.mutate(id, {
      onSuccess: () => toast({ title: "Categoria eliminata" }),
      onError: (err: any) => toast({ title: err?.message || "Impossibile eliminare questa categoria", variant: "destructive" }),
    });
  };

  const cats = tab === "menu" ? menuCats : productCats;
  const loading = tab === "menu" ? menuLoading : productLoading;

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center justify-between mb-4 pt-2">
        <div className="flex items-center gap-3">
          <Link href="/admin"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <h1 className="text-2xl font-serif font-bold">Categorie</h1>
        </div>
        <Button size="sm" className="rounded-full gap-2" onClick={startNew}>
          <Plus className="w-4 h-4" /> Nuova
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        {[["menu", "Menù"], ["bottega", "Bottega"]].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key as any); resetForm(); }}
            className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${tab === key ? "bg-primary border-primary text-primary-foreground" : "bg-transparent border-border"}`}>
            {label}
          </button>
        ))}
      </div>

      {showNew && (
        <div className="bg-card border border-primary/20 rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-semibold">{editing ? "Modifica Categoria" : "Nuova Categoria"}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm} className="h-8 w-8 rounded-full"><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input value={newName} onChange={e => { setNewName(e.target.value); if (!editing) setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} placeholder="Nome" className="h-10 bg-muted/50 rounded-xl" />
            <Input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="slug" className="h-10 bg-muted/50 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="Icona (emoji)" className="h-10 bg-muted/50 rounded-xl" />
            {tab === "menu" && (
              <Input type="number" value={newSortOrder} onChange={e => setNewSortOrder(e.target.value)} placeholder="Ordine" className="h-10 bg-muted/50 rounded-xl" />
            )}
          </div>
          <Button className="w-full rounded-xl gap-2" onClick={handleSave} disabled={saveMenuCat.isPending || saveProductCat.isPending}>
            <Save className="w-4 h-4" /> {editing ? "Aggiorna" : "Crea"}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-card rounded-xl" />)}</div>
      ) : !cats || cats.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-serif font-semibold mb-2">Nessuna categoria</h2>
          <Button className="rounded-xl mt-2" onClick={startNew}>Crea la prima</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {cats.map((cat: any) => (
            <div key={cat.id} className="bg-card border border-border rounded-xl p-3 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                {cat.icon || "📁"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{cat.name}</h3>
                <p className="text-[10px] text-muted-foreground font-mono">{cat.slug}{tab === "menu" && cat.sortOrder != null ? ` · ordine: ${cat.sortOrder}` : ""}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-primary/10" onClick={() => startEdit(cat)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cat.id, cat.name)} disabled={deleteMenuCat.isPending || deleteProductCat.isPending}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
