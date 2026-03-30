"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ShoppingCart,
  Sparkles,
  Store,
} from "lucide-react";

type GroceryItem = {
  id: string;
  name: string;
  category: string | null;
  completed: boolean | null;
  store_id: string | null;
  created_at?: string;
};

type StoreType = {
  id: string;
  name: string;
  created_at?: string;
};

type StoreSummary = {
  id: string;
  name: string;
  total: number;
  pending: number;
  completed: number;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [items, setItems] = useState<GroceryItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [{ data: storesData, error: storesError }, { data: itemsData, error: itemsError }] =
        await Promise.all([
          supabase.from("stores").select("*").order("created_at", { ascending: false }),
          supabase.from("grocery_items").select("*").order("created_at", { ascending: false }),
        ]);

      if (storesError) throw storesError;
      if (itemsError) throw itemsError;

      setStores((storesData as StoreType[]) || []);
      setItems((itemsData as GroceryItem[]) || []);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalItems = items.length;
    const pendingItems = items.filter((item) => !item.completed).length;
    const completedItems = items.filter((item) => item.completed).length;
    const totalStores = stores.length;

    return {
      totalItems,
      pendingItems,
      completedItems,
      totalStores,
    };
  }, [items, stores]);

  const recentItems = useMemo(() => items.slice(0, 5), [items]);

  const pendingItemsPreview = useMemo(
    () => items.filter((item) => !item.completed).slice(0, 6),
    [items]
  );

  const storeSummaries = useMemo<StoreSummary[]>(() => {
    const summaries: StoreSummary[] = stores.map((store) => {
      const storeItems = items.filter((item) => item.store_id === store.id);

      return {
        id: store.id,
        name: store.name,
        total: storeItems.length,
        pending: storeItems.filter((item) => !item.completed).length,
        completed: storeItems.filter((item) => item.completed).length,
      };
    });

    const noStoreItems = items.filter((item) => !item.store_id);

    if (noStoreItems.length > 0) {
      summaries.push({
        id: "no-store",
        name: "No store",
        total: noStoreItems.length,
        pending: noStoreItems.filter((item) => !item.completed).length,
        completed: noStoreItems.filter((item) => item.completed).length,
      });
    }

    return summaries.sort((a, b) => b.pending - a.pending || b.total - a.total);
  }, [stores, items]);

  const getStoreHref = (store: StoreSummary) => {
    if (store.id === "no-store") {
      return "/grocery?store=no-store";
    }

    return `/grocery?store=${store.id}`;
  };

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_30%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
              <Sparkles size={14} />
              AVO Dashboard
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Your grocery app, all in one place
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              Manage your grocery flow, review pending shopping items, and keep stores organised in
              one cleaner premium dashboard.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/grocery"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1020] transition hover:scale-[1.01]"
              >
                Open Grocery List
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/auto-consumption"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Open Auto Consumption
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Items"
            value={loading ? "..." : String(stats.totalItems)}
            icon={<ClipboardList size={18} />}
            href="/grocery"
          />
          <StatCard
            title="Pending"
            value={loading ? "..." : String(stats.pendingItems)}
            icon={<ShoppingCart size={18} />}
            href="/grocery?status=pending"
          />
          <StatCard
            title="Completed"
            value={loading ? "..." : String(stats.completedItems)}
            icon={<CheckCircle2 size={18} />}
            href="/grocery?status=completed"
          />
          <StatCard
            title="Stores"
            value={loading ? "..." : String(stats.totalStores)}
            icon={<Store size={18} />}
            href="/stores"
          />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Pending items</h2>
                <p className="text-sm text-white/60">Quick access to what still needs buying</p>
              </div>

              <Link
                href="/grocery?status=pending"
                className="text-sm font-medium text-white/80 transition hover:text-white"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-white/60">Loading items...</p>
            ) : pendingItemsPreview.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
                No pending items right now.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingItemsPreview.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{item.name}</p>
                      <p className="mt-1 text-xs text-white/50">{item.category || "Other"}</p>
                    </div>

                    <span className="ml-3 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recent grocery items</h2>
                <p className="text-sm text-white/60">Your latest added products</p>
              </div>

              <Link
                href="/grocery"
                className="text-sm font-medium text-white/80 transition hover:text-white"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-white/60">Loading items...</p>
            ) : recentItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
                No grocery items yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{item.name}</p>
                      <p className="mt-1 text-xs text-white/50">
                        {item.category || "Uncategorised"}
                      </p>
                    </div>

                    <span
                      className={`ml-3 rounded-full px-3 py-1 text-xs font-medium ${
                        item.completed
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {item.completed ? "Completed" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Store summary</h2>
                <p className="text-sm text-white/60">Tap a store to open Grocery already filtered</p>
              </div>

              <Link
                href="/stores"
                className="text-sm font-medium text-white/80 transition hover:text-white"
              >
                Manage stores
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-white/60">Loading store summary...</p>
            ) : storeSummaries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
                No store data available yet.
              </div>
            ) : (
              <div className="space-y-3">
                {storeSummaries.map((store) => (
                  <Link
                    key={store.id}
                    href={getStoreHref(store)}
                    className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{store.name}</p>
                        <p className="mt-1 text-xs text-white/50">
                          {store.total} total item{store.total === 1 ? "" : "s"}
                        </p>
                      </div>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">
                        {store.pending} pending
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-xl bg-white/10 px-3 py-2 text-white/70">
                        Total: <span className="font-semibold text-white">{store.total}</span>
                      </div>
                      <div className="rounded-xl bg-white/10 px-3 py-2 text-white/70">
                        Pending: <span className="font-semibold text-white">{store.pending}</span>
                      </div>
                      <div className="rounded-xl bg-white/10 px-3 py-2 text-white/70">
                        Done: <span className="font-semibold text-white">{store.completed}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Quick access</h2>
              <p className="text-sm text-white/60">Move faster around AVO</p>
            </div>

            <div className="space-y-3">
              <QuickLinkCard
                href="/auto-consumption"
                title="Auto Consumption"
                description="Generate items automatically from product usage"
                icon={<Sparkles size={18} />}
              />
              <QuickLinkCard
                href="/grocery"
                title="Grocery List"
                description="Add, edit and complete shopping items"
                icon={<ShoppingCart size={18} />}
              />
              <QuickLinkCard
                href="/stores"
                title="Stores"
                description="Organise your supermarkets and shop locations"
                icon={<Store size={18} />}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition hover:scale-[1.02] hover:bg-white/10"
    >
      <div className="flex items-center justify-between">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white/80 transition group-hover:bg-white group-hover:text-[#0b1020]">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-sm text-white/60">{title}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </Link>
  );
}

function QuickLinkCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:bg-white/[0.08]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white/80">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{title}</p>
          <p className="truncate text-xs text-white/50">{description}</p>
        </div>
      </div>

      <ChevronRight size={18} className="text-white/40" />
    </Link>
  );
}
