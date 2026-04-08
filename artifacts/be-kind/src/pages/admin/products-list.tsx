import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminProducts, useDeleteProduct, useAdminCheck } from "@/hooks/use-admin";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit2, Lock, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "wouter";

export default function AdminProducts() {
  const token = useAuthStore((s) => s.token);
  const { data: admin } = useAdminCheck();
  const { data: products, isLoading } = useAdminProducts();
  const deleteMutation = useDeleteProduct();
  const { toast } = useToast();

  if (!token || !admin?.isAdmin) {
    return (
      <PageTransition className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Accesso Riservato</h2>
      </PageTransition>
    );
  }

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Eliminare "${name}"?`)) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: "Prodotto eliminato" }),
      onError: () => toast({ title: "Errore nell'eliminazione", variant: "destructive" }),
    });
  };

  return (
    <PageTransition className="min-h-full bg-background flex flex-col p-4 pb-24">
      <div className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-serif font-bold">Prodotti</h1>
        </div>
        <Link href="/admin/prodotti/nuovo">
          <Button size="sm" className="rounded-full gap-2">
            <Plus className="w-4 h-4" /> Nuovo
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-xl" />)}
        </div>
      ) : !products || products.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-serif font-semibold mb-2">Nessun prodotto</h2>
          <p className="text-muted-foreground mb-4">Aggiungi il primo prodotto alla bottega.</p>
          <Link href="/admin/prodotti/nuovo">
            <Button className="rounded-xl">Aggiungi Prodotto</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((product: any) => (
            <div key={product.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                  {product.isNewArrival && <Badge className="text-[10px] px-1.5 py-0 bg-primary text-primary-foreground border-none">Nuovo</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-secondary">€{product.price.toFixed(2)}</span>
                  <span>·</span>
                  <span>{product.categoryName}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Link href={`/admin/prodotti/${product.id}`}>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-secondary hover:bg-secondary/10">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost" size="icon"
                  className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(product.id, product.name)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
