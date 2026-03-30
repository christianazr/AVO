"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ShoppingCart,
  Store,
  Package,
  Sparkles,
  ArrowRight,
  LogOut,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type GroceryItem = {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  category?: string | null;
  store_id?: string | null;
  status: string;
};

type StoreItem = {
  id: string;
  user_id: string;
  name: string;
};

type AutoConsumptionItem = {
  id: string;
  user_id: string;
  item_name: string;
  current_stock: number;
  target_stock: number;
  threshold_percent: number;
  auto_add_enabled: boolean;
};

export default function DashboardPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [autoItems, setAutoItems] = useState<AutoConsumptionItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (!session) {
          router.replace("/login");
          return;
        }

        const uid = session.user.id;
        setUserId(uid);
        setEmail(session.user.email || "");

        await Promise.all([
          loadGroceryItems(uid),
          loadStores(uid),
          loadAutoItems(uid),
        ]);

        if (active) setChecking(false);
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(err?.message || "Failed to load dashboard.");
          setChecking(false);
        }
      }
    }

    void loadPage();

    return () => {
      active = false;
    };
  }, [router]);

  async function loadGroceryItems(uid: string) {
    const { data, error } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("user_id", uid);

    if (error) throw error;
    setGroceryItems((data || []) as GroceryItem[]);
  }

  async function loadStores(uid: string) {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", uid);

    if (error) throw error;
    setStores((data || []) as StoreItem[]);
  }

  async function loadAutoItems(uid: string) {
    const { data, error } = await supabase
      .from("auto_consumption_items")
      .select("*")
      .eq("user_id", uid);

    if (error) throw error;
    setAutoItems((data || []) as AutoConsumptionItem[]);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const stats = useMemo(() => {
    const pending = groceryItems.filter((item) => item.status === "pending").length;
    const completed = groceryItems.filter((item) => item.status === "completed").length;
    const lowStock = autoItems.filter((item) => {
      if (!item.target_stock || item.target_stock <= 0) return false;
      const pct = Math.round((item.current_stock / item.target_stock) * 100);
      return pct <= item.threshold_percent;
    }).length;

    return {
      groceryTotal: groceryItems.length,
      groceryPending: pending,
      groceryCompleted: completed,
      storesTotal: stores.length,
      autoTracked: autoItems.length,
      autoLow: lowStock,
    };
  }, [groceryItems, stores, autoItems]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-[-120px] top-[120px] h-[320px] w-[320px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[25%] h-[280px] w-[280px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              AVO premium workspace
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Dashboard
            </h1>
            <p className="mt-3 text-sm text-white/60 sm:text-base">
              Signed in as {email}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 font-medium text-black transition hover:opacity-90"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-white/60">Grocery items</span>
              <ShoppingCart className="h-5 w-5 text-white/50" />
            </div>
            <div className="text-3xl font-semibold">{stats.groceryTotal}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-white/60">Pending items</span>
              <AlertTriangle className="h-5 w-5 text-amber-300/80" />
            </div>
            <div className="text-3xl font-semibold">{stats.groceryPending}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-white/60">Stores</span>
              <Store className="h-5 w-5 text-white/50" />
            </div>
            <div className="text-3xl font-semibold">{stats.storesTotal}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-white/60">Low stock tracked</span>
              <Package className="h-5 w-5 text-red-300/80" />
            </div>
            <div className="text-3xl font-semibold">{stats.autoLow}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Link
            href="/grocery"
            className="group rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:bg-white/[0.05]"
          >
            <div className="mb-4 flex items-center justify-between">
              <ShoppingCart className="h-6 w-6 text-white/75" />
              <ArrowRight className="h-5 w-5 text-white/40 transition group-hover:translate-x-1" />
            </div>
            <h2 className="text-2xl font-semibold">Grocery list</h2>
            <p className="mt-2 text-sm text-white/55">
              Manage pending and completed shopping items.
            </p>
            <div className="mt-5 rounded-2xl bg-black/30 px-4 py-3 text-sm text-white/70">
              {stats.groceryPending} pending · {stats.groceryCompleted} completed
            </div>
          </Link>

          <Link
            href="/auto-consumption"
            className="group rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:bg-white/[0.05]"
          >
            <div className="mb-4 flex items-center justify-between">
              <Package className="h-6 w-6 text-white/75" />
              <ArrowRight className="h-5 w-5 text-white/40 transition group-hover:translate-x-1" />
            </div>
            <h2 className="text-2xl font-semibold">Auto-consumption</h2>
            <p className="mt-2 text-sm text-white/55">
              Track stock at home and auto-push low items into grocery.
            </p>
            <div className="mt-5 rounded-2xl bg-black/30 px-4 py-3 text-sm text-white/70">
              {stats.autoTracked} tracked · {stats.autoLow} below threshold
            </div>
          </Link>

          <Link
            href="/stores"
            className="group rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:bg-white/[0.05]"
          >
            <div className="mb-4 flex items-center justify-between">
              <Store className="h-6 w-6 text-white/75" />
              <ArrowRight className="h-5 w-5 text-white/40 transition group-hover:translate-x-1" />
            </div>
            <h2 className="text-2xl font-semibold">Stores</h2>
            <p className="mt-2 text-sm text-white/55">
              Organise your supermarkets and preferred shopping locations.
            </p>
            <div className="mt-5 rounded-2xl bg-black/30 px-4 py-3 text-sm text-white/70">
              {stats.storesTotal} stores configured
            </div>
          </Link>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <h3 className="text-xl font-semibold">System status</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-black/30 px-4 py-4 text-sm text-white/70">
              Authentication is active
            </div>
            <div className="rounded-2xl bg-black/30 px-4 py-4 text-sm text-white/70">
              Supabase session detected
            </div>
            <div className="rounded-2xl bg-black/30 px-4 py-4 text-sm text-white/70">
              Dashboard ready for navigation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
