import { Dish } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export function DishCard({ dish }: { dish: Dish }) {
  return (
    <Link href={`/menu/${dish.id}`}>
      <div className="flex bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow active-elevate">
        <div className="w-1/3 aspect-square shrink-0">
          <img 
            src={dish.imageUrl || "/images/dish-pizza.png"} 
            alt={dish.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4 flex flex-col justify-between flex-1">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-serif font-semibold text-lg leading-tight line-clamp-2">{dish.name}</h3>
              <span className="font-medium text-primary">€{dish.price.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{dish.description}</p>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1 flex-wrap">
              {dish.dietaryTags?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
