"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Home, ShoppingCart, Sparkles, Store } from "lucide-react";
import MobileBottomNav from "@/components/mobile-bottom-nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b1020] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1020]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-lg">
              <span className="text-sm font-semibold tracking-wide">AVO</span>
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold">AVO</p>
              <p className="text-xs text-white/50">Premium grocery planner</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <DesktopNavLink href="/dashboard" label="Dashboard" icon={<Home size={16} />} />
            <DesktopNavLink href="/grocery" label="Grocery" icon={<ShoppingCart size={16} />} />
            <DesktopNavLink
              href="/auto-consumption"
              label="Auto Consumption"
              icon={<Sparkles size={16} />}
            />
            <DesktopNavLink href="/stores" label="Stores" icon={<Store size={16} />} />
          </nav>
        </div>
      </header>

      <div className="pb-28 md:pb-10">{children}</div>

      <MobileBottomNav />
    </div>
  );
}

function DesktopNavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();

  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition ${
        active
          ? "border-white bg-white text-[#0b1020]"
          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
