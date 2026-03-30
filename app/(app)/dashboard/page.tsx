"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ShoppingCart,
  Store,
  Package,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type GroceryItem = {
  id: string;
  user_id: string;
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
  current_stock: number;
  target_stock: number;
  threshold_percent: number;
};

export default function DashboardPage() {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [autoItems, setAutoItems] = useState<AutoConsumptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const uid = session.user.id;

      const [groceryRes, storesRes, autoRes] = await Promise.all([
        supabase.from("grocery_items").select("*").eq("user_id", uid),
        supabase.from("stores").select("*").eq("user_id", uid),
        supabase.from("auto_consumption_items").select("*").eq("user_id", uid),
      ]);

      setGroceryItems((groceryRes.data || []) as GroceryItem[]);
      setStores((storesRes.data || []) as StoreItem[]);
      setAutoItems((autoRes.data || []) as AutoConsumptionItem[]);
      setLoading(false);
    }

    void loadData();
  }, []);

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60 sm:text-base">
          Your premium overview of grocery planning, stores and home stock tracking.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-white/60">Grocery items</span>
            <ShoppingCart className="h-5 w-5 text-white/50" />
          </div>
          <div className="text-3xl font-semibold">{loading ? "—" : stats.groceryTotal}</div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-white/60">Pending items</span>
            <AlertTriangle className="h-5 w-5 text-amber-300/80" />
          </div>
          <div className="text-3xl font-semibold">{loading ? "—" : stats.groceryPending}</div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-white/60">Stores</span>
            <Store className="h-5 w-5 text-white/50" />
          </div>
          <div className="text-3xl font-semibold">{loading ? "—" : stats.storesTotal}</div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-white/60">Low stock tracked</span>
            <Package className="h-5 w-5 text-red-300/80" />
          </div>
          <div className="text-3xl font-semibold">{loading ? "—" : stats.autoLow}</div>
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
            {loading ? "Loading..." : `${stats.groceryPending} pending · ${stats.groceryCompleted} completed`}
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
            {loading ? "Loading..." : `${stats.autoTracked} tracked · ${stats.autoLow} below threshold`}
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
            {loading ? "Loading..." : `${stats.storesTotal} stores configured`}
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
            Shared premium layout is active
          </div>
          <div className="rounded-2xl bg-black/30 px-4 py-4 text-sm text-white/70">
            Dashboard ready for navigation
          </div>
        </div>
      </div>
    </div>
  );
}
