import { PageTransition } from "@/components/page-transition";
import { DishCard } from "@/components/dish-card";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useGetMenuCategories, useGetDishes } from "@workspace/api-client-react";
import { Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: categories } = useGetMenuCategories();
  const { data: dishes, isLoading } = useGetDishes({
    category: activeCategory !== "all" ? activeCategory : undefined,
    search: search || undefined
  });

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-6">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border pt-6 pb-2 px-4">
        <h1 className="text-3xl font-serif font-bold mb-4">Il Nostro Menù</h1>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cerca piatti..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-transparent rounded-xl h-10"
          />
        </div>

        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex w-max space-x-2 px-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                activeCategory === "all" 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "bg-transparent border-border text-foreground hover:bg-muted"
              )}
            >
              Tutti
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                  activeCategory === cat.slug 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "bg-transparent border-border text-foreground hover:bg-muted"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      <div className="px-4 py-4 flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card h-32 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : dishes?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nessun piatto trovato.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dishes?.map(dish => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
