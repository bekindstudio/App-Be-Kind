import React from "react";
import { Link, useLocation } from "wouter";
import { Home, UtensilsCrossed, Star, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background flex justify-center">
      <div className="w-full max-w-[430px] bg-background shadow-2xl flex flex-col relative">
        <main className="flex-1 overflow-y-auto pb-20 no-scrollbar scroll-smooth">
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
    { icon: Star, label: "Be Kind", href: "/loyalty" },
    { icon: ShoppingBag, label: "Bottega", href: "/shop" },
    { icon: User, label: "Profilo", href: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 backdrop-blur-xl border-t border-border/30 px-3 pt-1.5 pb-5 shadow-[0_-2px_24px_rgba(0,0,0,0.06)] z-50 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 min-w-[52px] py-1 transition-all duration-200",
              isActive ? "text-primary" : "text-foreground/40"
            )}
            data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
          >
            <div className={cn(
              "relative flex items-center justify-center w-10 h-8 rounded-[14px] transition-all duration-200",
              isActive ? "bg-primary/10" : ""
            )}>
              <item.icon
                size={21}
                strokeWidth={isActive ? 2.5 : 1.8}
                fill={isActive && item.label === "Be Kind" ? "currentColor" : "none"}
              />
            </div>
            <span className={cn(
              "text-[10px] font-semibold transition-colors",
              isActive ? "text-primary" : "text-foreground/40"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
