import { PageTransition } from "@/components/page-transition";
import { useGetProducts, useGetProductCategories, useGetShopCart } from "@workspace/api-client-react";
import { useAuthStore } from "@/hooks/use-auth-store";
import { ChevronLeft, ShoppingBag, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const token = useAuthStore((state) => state.token);
  const { data: shopCart } = useGetShopCart({ query: { enabled: !!token } });
  const shopCartCount = shopCart?.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;

  const { data: categories } = useGetProductCategories();
  const { data: products, isLoading } = useGetProducts({
    category: activeCategory !== "all" ? activeCategory : undefined,
    search: search || undefined
  });

  return (
    <PageTransition className="flex flex-col min-h-full bg-background">
      <div className="px-5 pt-10 pb-3 flex items-center justify-between bg-background/80 backdrop-blur-xl sticky top-0 z-10 border-b border-border/30">
        <button onClick={() => window.history.back()} className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center shadow-sm text-foreground active:scale-95 transition-transform border border-border/50">
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-lg font-serif font-bold text-foreground">Be Kind Bottega</h2>
        <Link href="/shop/cart">
          <div className="relative w-10 h-10 bg-card rounded-2xl flex items-center justify-center shadow-sm text-foreground active:scale-95 transition-transform border border-border/50">
            <ShoppingBag size={19} strokeWidth={1.8} />
            {shopCartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                {shopCartCount > 99 ? '99+' : shopCartCount}
              </span>
            )}
          </div>
        </Link>
      </div>

      <div className="px-5 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            placeholder="Cerca nella bottega..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card rounded-2xl py-3 pl-10 pr-4 text-sm outline-none shadow-sm border border-border/50 focus:border-primary/30 transition-all placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-5 pb-4 pt-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap text-xs font-bold transition-all border active:scale-95 ${
            activeCategory === "all"
              ? "bg-secondary text-white border-secondary shadow-md"
              : "bg-card text-foreground border-border/50"
          }`}
        >
          Tutti
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.slug)}
            className={`px-4 py-2 rounded-2xl whitespace-nowrap text-xs font-bold transition-all border active:scale-95 ${
              activeCategory === cat.slug
                ? "bg-secondary text-white border-secondary shadow-md"
                : "bg-card text-foreground border-border/50"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 no-scrollbar">
        {activeCategory === "all" && (
          <div className="bg-gradient-to-br from-secondary via-secondary/90 to-secondary/70 rounded-[24px] p-6 text-white mb-6 relative overflow-hidden shadow-lg group cursor-pointer active:scale-[0.98] transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/8 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="relative z-10">
              <span className="bg-primary text-white text-[9px] font-bold px-3 py-1 rounded-full mb-3 inline-block shadow-sm tracking-widest uppercase">New In</span>
              <h3 className="font-serif font-bold text-2xl mb-2">Merch Sostenibile</h3>
              <p className="text-white/70 text-sm mb-2 max-w-[70%] leading-relaxed">Cotone organico e materiali riciclati per il pianeta.</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600"
              className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-15"
              alt="Sustainable"
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-base text-foreground">
            {activeCategory === "all" ? "In Evidenza" : categories?.find(c => c.slug === activeCategory)?.name || ""}
          </h3>
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg font-medium">{products?.length || 0} prodotti</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card aspect-[3/4] rounded-[20px] animate-pulse shadow-sm" />
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={28} className="text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">Nessun prodotto trovato.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {products?.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`}>
                <div className="bg-card p-3 rounded-[20px] shadow-sm flex flex-col group transition-all hover:shadow-md cursor-pointer active:scale-[0.97] border border-border/30">
                  <div className="h-36 bg-muted rounded-2xl overflow-hidden mb-3 relative">
                    <img src={product.imageUrl || "/images/product-oil.png"} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    {product.isNewArrival && (
                      <span className="absolute top-2 left-2 bg-primary text-white text-[9px] font-bold px-2.5 py-0.5 rounded-lg shadow-sm tracking-wide uppercase">New</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <span className="text-[9px] text-primary font-bold uppercase tracking-widest mb-1">
                      {categories?.find(c => c.slug === product.categorySlug)?.name || ''}
                    </span>
                    <h4 className="font-serif font-bold text-foreground text-sm mb-1 leading-tight line-clamp-2">{product.name}</h4>
                    <div className="mt-auto pt-2">
                      <span className="text-secondary font-bold">€{Number(product.price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
