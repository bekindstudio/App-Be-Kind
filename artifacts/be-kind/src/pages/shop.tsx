import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { useGetProducts, useGetProductCategories } from "@workspace/api-client-react";
import { ArrowLeft, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: categories } = useGetProductCategories();
  const { data: products, isLoading } = useGetProducts({
    category: activeCategory !== "all" ? activeCategory : undefined,
    search: search || undefined
  });

  return (
    <PageTransition className="min-h-full bg-background flex flex-col pb-24">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border pt-6 pb-2 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-serif font-bold">Bottega</h1>
          <Link href="/shop/cart">
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <ShoppingBag className="w-5 h-5" />
            </Button>
          </Link>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search our pantry..." 
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
                  ? "bg-secondary border-secondary text-secondary-foreground" 
                  : "bg-transparent border-border text-foreground hover:bg-muted"
              )}
            >
              All
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                  activeCategory === cat.slug 
                    ? "bg-secondary border-secondary text-secondary-foreground" 
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
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card aspect-[3/4] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No products found.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products?.map(product => (
              <Link key={product.id} href={`/shop/${product.id}`}>
                <div className="flex flex-col group cursor-pointer active-elevate">
                  <div className="bg-card rounded-2xl overflow-hidden aspect-square border border-border mb-3 relative">
                    <img 
                      src={product.imageUrl || "/images/product-oil.png"} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {product.isNewArrival && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm tracking-wider">
                        New
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
                  <span className="font-medium text-secondary">€{product.price.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
