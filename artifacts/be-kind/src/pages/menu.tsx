import { PageTransition } from "@/components/page-transition";
import { useGetMenuCategories, useGetDishes } from "@workspace/api-client-react";
import { ChevronLeft, Search, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: categories } = useGetMenuCategories();
  const { data: dishes, isLoading } = useGetDishes({
    category: activeCategory !== "all" ? activeCategory : undefined,
    search: search || undefined
  });

  return (
    <PageTransition className="flex flex-col min-h-full bg-background">
      <div className="px-5 pt-10 pb-3 flex items-center justify-between bg-background/80 backdrop-blur-xl sticky top-0 z-10 border-b border-border/30">
        <button onClick={() => window.history.back()} className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center shadow-sm text-foreground active:scale-95 transition-transform border border-border/50">
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-lg font-serif font-bold text-foreground">Il Nostro Menù</h2>
        <div className="w-10" />
      </div>

      <div className="px-5 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            placeholder="Cerca piatti..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card rounded-2xl py-3 pl-10 pr-4 text-sm outline-none shadow-sm border border-border/50 focus:border-primary/30 transition-all placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-5 pb-4 pt-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-5 py-2 rounded-2xl whitespace-nowrap text-sm font-bold transition-all ${
            activeCategory === "all"
              ? "bg-secondary text-white shadow-md"
              : "bg-card text-foreground border border-border/50"
          }`}
        >
          Tutti
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.slug)}
            className={`px-5 py-2 rounded-2xl whitespace-nowrap text-sm font-bold transition-all ${
              activeCategory === cat.slug
                ? "bg-secondary text-white shadow-md"
                : "bg-card text-foreground border border-border/50"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card h-52 rounded-[20px] animate-pulse shadow-sm" />
            ))}
          </div>
        ) : dishes?.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed size={28} className="text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">Nessun piatto trovato.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {dishes?.map((dish) => (
              <Link key={dish.id} href={`/menu/${dish.id}`}>
                <div className="bg-card rounded-[20px] overflow-hidden shadow-sm cursor-pointer group active:scale-[0.97] transition-all border border-border/30 hover:shadow-md">
                  <div className="h-32 overflow-hidden relative bg-muted">
                    {dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed size={26} className="text-muted-foreground/30" /></div>}
                    <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-sm">
                      <span className="text-xs font-bold text-primary">€{Number(dish.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-serif font-bold text-foreground text-sm leading-tight mb-1 line-clamp-2">{dish.name}</h3>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{dish.description}</p>
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
