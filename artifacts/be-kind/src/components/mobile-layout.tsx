import React from "react";
import { Link, useLocation } from "wouter";
import { Home, UtensilsCrossed, ShoppingBag, Calendar, User, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background flex justify-center">
      <div className="w-full max-w-[430px] bg-background shadow-xl flex flex-col relative overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-20 scroll-smooth">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: UtensilsCrossed, label: "Menù", href: "/menu" },
    { icon: ShoppingCart, label: "Ordini", href: "/orders" },
    { icon: ShoppingBag, label: "Bottega", href: "/shop" },
    { icon: User, label: "Profilo", href: "/profile" },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50">
      {navItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-16 h-full space-y-1 text-xs transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
