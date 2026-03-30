"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  ShoppingCart,
  Store,
  Package,
  LogOut,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

type AppLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/grocery", label: "Grocery list", icon: ShoppingCart },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/auto-consumption", label: "Auto-consumption", icon: Package },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (!session) {
          router.replace("/login");
          return;
        }

        setEmail(session.user.email || "");
        setChecking(false);
      } catch (error) {
        console.error(error);
        if (active) router.replace("/login");
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-[-120px] top-[120px] h-[320px] w-[320px] rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[25%] h-[280px] w-[280px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="hidden w-72 border-r border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              Premium grocery planning
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">AVO</h1>
            <p className="mt-2 text-sm text-white/50 break-all">{email}</p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-white text-black"
                      : "border border-transparent text-white/75 hover:border-white/10 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-sm text-white/50">AVO workspace</p>
                  <h2 className="text-lg font-semibold">
                    {navItems.find((item) => item.href === pathname)?.label || "AVO"}
                  </h2>
                </div>
              </div>

              <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 md:block">
                {email}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] border-r border-white/10 bg-black p-6">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    <Sparkles className="h-3.5 w-3.5" />
                    Premium
                  </div>
                  <h2 className="text-2xl font-semibold">AVO</h2>
                </div>

                <button
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6 text-sm text-white/50 break-all">{email}</div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        active
                          ? "bg-white text-black"
                          : "border border-transparent text-white/75 hover:border-white/10 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleSignOut}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
