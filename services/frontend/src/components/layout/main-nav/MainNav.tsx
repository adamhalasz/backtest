import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Bot, LineChart, BrainCircuit, Beaker } from 'lucide-react';

export function MainNav() {
  const [location] = useLocation();

  const items = [
    {
      title: "Bots",
      icon: Bot,
      href: "/bots",
      disabled: false
    },
    {
      title: "Strategies",
      icon: BrainCircuit,
      href: "/strategies",
      disabled: false
    },
    {
      title: "Backtest",
      icon: Beaker,
      href: "/",
      disabled: false
    },
    {
      title: "Explorer",
      icon: LineChart,
      href: "/explorer",
      disabled: false
    }
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent/50",
            location === item.href ? "bg-accent" : "transparent",
            item.disabled && "pointer-events-none opacity-50"
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
}