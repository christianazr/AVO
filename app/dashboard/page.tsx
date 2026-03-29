"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LogOut,
  Sparkles,
  ShoppingBag,
  Store,
  Star,
} from "lucide-react";

type GroceryItem = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  store: string;
  quantity: number;
  completed: boolean;
  favorite: boolean;
  created_at: string;
};

type UserStore = {
  id: string;
  user_id: string;
  name: string;
  is_favorite: boolean;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [stores, setStores] = useState<UserStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const [{ data: itemsData }, { data: storesData }] = await Promise.all([
        supabase
          .from("grocery_items")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("stores")
          .select("*")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
      ]);

      setItems(itemsData ?? []);
      setStores(storesData ?? []);
      setLoading(false);
    };

    loadDashboard();
  }, [router]);

  const total = items.length;
  const pending = items.filter((item) => !item.completed).length;
  const done = items.filter((item) => item.completed).length;
  const favorites = items.filter((item) => item.favorite).length;
  const favoriteStores = stores.filter((store) => store.is_favorite).length;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

  const recentItems = useMemo(() => items.slice(0, 5), [items]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#eef3fb]">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">
          <div className="rounded-[28px] border border-[#d9dfeb] bg-white px-8 py-6 shadow-sm">
            <p className="text-sm text-[#5c677d]">Loading your dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3fb] text-[#0d1730]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">
        <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#2f66f5] sm:mb-4 sm:text-sm">
              Smart Grocery Planner
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              AVO Dashboard
            </h1>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              href="/grocery"
              className="rounded-xl border border-[#d8dfeb] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#0d1730] shadow-sm transition hover:bg-[#f8fbff] sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base"
            >
              Grocery
            </Link>
            <Link
              href="/stores"
              className="rounded-xl border border-[#d8dfeb] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#0d1730] shadow-sm transition hover:bg-[#f8fbff] sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base"
            >
              Stores
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0c1730] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:rounded-2xl sm:px-6 sm:py-3 sm:text-base"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </header>

        <section className="mb-8 grid gap-6 xl:grid-cols-[1.6fr_1fr] xl:gap-8">
          <div className="rounded-[28px] border border-[#d8dfeb] bg-white p-5 shadow-sm sm:p-8 sm:rounded-[34px]">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#2f66f5] sm:mb-5 sm:text-sm">
              Your shopping dashboard
            </div>

            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[#0d1730] sm:text-4xl md:text-5xl xl:text-6xl">
              Shop with clarity and premium organisation.
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#667085] sm:mt-6 sm:text-lg md:text-xl md:leading-8">
              Use your dashboard as a control centre, then manage your full list
              in Grocery and your supermarkets in Stores.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href="/grocery"
                className="w-full rounded-2xl bg-[#0c1730] px-5 py-3.5 text-center text-base font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto sm:px-7 sm:py-4 sm:text-lg"
              >
                Open Grocery List
              </Link>
              <Link
                href="/stores"
                className="w-full rounded-2xl border border-[#d8dfeb] bg-white px-5 py-3.5 text-center text-base font-semibold text-[#0d1730] transition hover:bg-[#f8fbff] sm:w-auto sm:px-7 sm:py-4 sm:text-lg"
              >
                Manage Stores
              </Link>
            </div>

            <div className="mt-8 rounded-[24px] border border-[#dde3ee] bg-[#f8fbff] p-5 sm:rounded-[28px] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-[#0d1730] sm:text-2xl">
                  Shopping Progress
                </h3>
                <span className="text-xl font-semibold text-[#0d1730] sm:text-2xl">
                  {completionRate}%
                </span>
              </div>

              <div className="h-4 w-full overflow-hidden rounded-full bg-[#dde4f0]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2f66f5] to-[#69a2ff]"
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              <p className="mt-4 text-base text-[#667085] sm:text-xl">
                {done} of {total} items completed
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d8dfeb] bg-white p-5 shadow-sm sm:p-6 sm:rounded-[34px]">
            <div className="min-h-full rounded-[24px] bg-gradient-to-br from-[#081225] via-[#0d1a34] to-[#1d2d47] p-5 text-white sm:rounded-[28px] sm:p-7">
              <h3 className="mb-6 text-2xl font-semibold tracking-tight sm:mb-8 sm:text-3xl lg:text-4xl">
                Live Overview
              </h3>

              <div className="space-y-4">
                <OverviewRow label={`${total} total items`} />
                <OverviewRow label={`${pending} items pending`} />
                <OverviewRow label={`${done} items completed`} />
                <OverviewRow label={`${stores.length} saved stores`} />
                <OverviewRow label={`${favoriteStores} favourite stores`} />
                <OverviewRow label={`${favorites} favourite items`} />
              </div>

              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-5 sm:mt-10">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/60 sm:text-sm">
                  <Sparkles className="h-4 w-4" />
                  Premium tip
                </div>
                <p className="text-sm leading-7 text-white/85 sm:text-base">
                  Add your regular supermarkets in Stores so your grocery flow feels
                  faster and more organised.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[28px] border border-[#d8dfeb] bg-white p-5 shadow-sm sm:p-6 sm:rounded-[30px]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2f66f5]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0d1730] sm:text-xl">
                  Recent grocery items
                </h3>
                <p className="text-sm text-[#667085]">
                  Latest items from your shopping list
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {recentItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d8dfeb] bg-[#f8fbff] p-4 text-sm text-[#667085]">
                  No grocery items yet.
                </div>
              ) : (
                recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-[#e2e8f3] bg-[#fbfcfe] p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0d1730] sm:text-base">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#667085] sm:text-sm">
                        {item.category} • {item.store}
                      </p>
                    </div>
                    <span className="ml-4 rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-medium text-[#2f66f5]">
                      x{item.quantity}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d8dfeb] bg-white p-5 shadow-sm sm:p-6 sm:rounded-[30px]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2f66f5]">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0d1730] sm:text-xl">
                  Store summary
                </h3>
                <p className="text-sm text-[#667085]">
                  Your saved supermarkets
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {stores.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d8dfeb] bg-[#f8fbff] p-4 text-sm text-[#667085]">
                  No stores saved yet.
                </div>
              ) : (
                stores.slice(0, 5).map((store) => (
                  <div
                    key={store.id}
                    className="flex items-center justify-between rounded-2xl border border-[#e2e8f3] bg-[#fbfcfe] p-4"
                  >
                    <p className="truncate text-sm font-semibold text-[#0d1730] sm:text-base">
                      {store.name}
                    </p>
                    {store.is_favorite ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff7df] px-3 py-1 text-xs font-medium text-[#b88700]">
                        <Star className="h-3.5 w-3.5 fill-[#d6a93f] text-[#d6a93f]" />
                        Favourite
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#f2f5fa] px-3 py-1 text-xs font-medium text-[#667085]">
                        Standard
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function OverviewRow({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 text-base font-medium text-white/95 sm:px-5 sm:py-4 sm:text-lg lg:text-2xl">
      {label}
    </div>
  );
}