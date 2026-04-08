import { PageTransition } from "@/components/page-transition";
import { useGetMenuCategories, useGetDishes } from "@workspace/api-client-react";
import { ChevronLeft, Filter, Search, UtensilsCrossed } from "lucide-react";
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
      <div className="px-6 pt-12 pb-4 flex items-center justify-between bg-background sticky top-0 z-10">
        <button onClick={() => window.history.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft text-secondary active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-serif font-bold text-foreground">Il Nostro Menù</h2>
        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft text-foreground active:scale-95 transition-transform">
          <Filter size={20} />
        </button>
      </div>

      <div className="px-6 pb-3">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Cerca piatti..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none shadow-soft border border-transparent focus:border-primary/20 transition-all placeholder:text-gray-300"
          />
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar px-6 pb-4 pt-1">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
            activeCategory === "all"
              ? "bg-secondary text-white shadow-md"
              : "bg-white text-foreground border border-gray-100"
          }`}
        >
          Tutti
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.slug)}
            className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
              activeCategory === cat.slug
                ? "bg-secondary text-white shadow-md"
                : "bg-white text-foreground border border-gray-100"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white h-48 rounded-2xl animate-pulse shadow-soft" />
            ))}
          </div>
        ) : dishes?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nessun piatto trovato.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {dishes?.map((dish) => (
              <Link key={dish.id} href={`/menu/${dish.id}`}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-soft cursor-pointer group active:scale-[0.97] transition-transform">
                  <div className="h-32 overflow-hidden relative bg-secondary/10">
                    {dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed size={28} className="text-secondary/30" /></div>}
                    <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <span className="text-xs font-bold text-primary">€{Number(dish.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-serif font-bold text-foreground text-sm leading-tight mb-1 line-clamp-2">{dish.name}</h3>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{dish.description}</p>
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
