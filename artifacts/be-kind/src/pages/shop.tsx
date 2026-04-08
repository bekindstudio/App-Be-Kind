import { PageTransition } from "@/components/page-transition";
import { useGetProducts, useGetProductCategories } from "@workspace/api-client-react";
import { ChevronLeft, ShoppingBag, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: categories } = useGetProductCategories();
  const { data: products, isLoading } = useGetProducts({
    category: activeCategory !== "all" ? activeCategory : undefined,
    search: search || undefined
  });

  return (
    <PageTransition className="flex flex-col min-h-full bg-background">
      <div className="px-6 pt-12 pb-4 flex items-center justify-between bg-background sticky top-0 z-10">
        <button onClick={() => window.history.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft text-secondary active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-serif font-bold text-secondary">Be Kind Shop</h2>
        <Link href="/shop/cart">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft text-secondary active:scale-95 transition-transform">
            <ShoppingBag size={20} />
          </div>
        </Link>
      </div>

      <div className="px-6 pb-3">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Cerca nella dispensa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none shadow-soft border border-transparent focus:border-primary/20 transition-all placeholder:text-gray-300"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 pb-6 pt-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all border active:scale-95 ${
            activeCategory === "all"
              ? "bg-secondary text-white border-secondary shadow-lg"
              : "bg-white/50 text-secondary border-secondary/20 hover:border-secondary/50"
          }`}
        >
          Tutti
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.slug)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all border active:scale-95 ${
              activeCategory === cat.slug
                ? "bg-secondary text-white border-secondary shadow-lg"
                : "bg-white/50 text-secondary border-secondary/20 hover:border-secondary/50"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
        {activeCategory === "all" && (
          <div className="bg-[#676959] rounded-3xl p-6 text-white mb-8 relative overflow-hidden shadow-soft group cursor-pointer active:scale-[0.98] transition-all">
            <div className="relative z-10">
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block shadow-sm">New In</span>
              <h3 className="font-serif font-bold text-2xl mb-2">Merch Sostenibile</h3>
              <p className="text-white/80 text-sm mb-4 max-w-[70%]">Cotone organico e materiali riciclati per il pianeta.</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600"
              className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-20"
              alt="Sustainable"
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-secondary">
            {activeCategory === "all" ? "In Evidenza" : categories?.find(c => c.slug === activeCategory)?.name || ""}
          </h3>
          <span className="text-xs text-muted-foreground">{products?.length || 0} prodotti</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white aspect-[3/4] rounded-2xl animate-pulse shadow-soft" />
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nessun prodotto trovato.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products?.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`}>
                <div className="bg-white p-3 rounded-2xl shadow-card flex flex-col group transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer">
                  <div className="h-36 bg-gray-50 rounded-xl overflow-hidden mb-3 relative">
                    <img src={product.imageUrl || "/images/product-oil.png"} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    {product.isNewArrival && (
                      <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">New</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">
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
