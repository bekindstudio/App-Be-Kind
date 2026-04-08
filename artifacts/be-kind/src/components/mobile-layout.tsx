import React from "react";
import { Link, useLocation } from "wouter";
import { Home, UtensilsCrossed, Star, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background flex justify-center">
      <div className="w-full max-w-[430px] bg-background shadow-2xl flex flex-col relative overflow-hidden">
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
    <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-6 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-50 flex justify-between items-end">
      {navItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 w-16 transition-all duration-300",
              isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
            )}
            data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
          >
            <div className="relative">
              <item.icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive && item.label === "Be Kind" ? "currentColor" : "none"}
              />
            </div>
            <span className={cn(
              "text-[10px] font-bold transition-all",
              isActive ? "text-primary" : "text-transparent"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
