"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Sparkles, Store } from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    href: "/grocery",
    label: "Grocery",
    icon: ShoppingCart,
  },
  {
    href: "/auto-consumption",
    label: "Auto",
    icon: Sparkles,
  },
  {
    href: "/stores",
    label: "Stores",
    icon: Store,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0b1020]/90 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-2xl md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-2 rounded-[24px] border border-white/10 bg-white/5 p-2 shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-3 text-xs font-medium transition ${
                active
                  ? "bg-white text-[#0b1020]"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span className="mt-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
