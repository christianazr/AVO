"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Search,
  LogOut,
  Plus,
  Star,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  Store,
  Minus,
  Sparkles,
} from "lucide-react";

type Category =
  | "Food"
  | "Drinks"
  | "Cleaning"
  | "Frozen"
  | "Household"
  | "Other";

type StoreType =
  | "Tesco"
  | "Lidl"
  | "Costco"
  | "Aldi"
  | "Sainsbury's"
  | "Asda"
  | "Other";

type StatusFilter = "all" | "pending" | "done";

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

export default function DashboardPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newItem, setNewItem] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [store, setStore] = useState<StoreType>("Tesco");
  const [quantity, setQuantity] = useState(1);

  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    const loadUserAndItems = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("grocery_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setItems(data);
      }

      setLoading(false);
    };

    loadUserAndItems();
  }, [router]);

  const total = items.length;
  const pending = items.filter((item) => !item.completed).length;
  const done = items.filter((item) => item.completed).length;
  const favorites = items.filter((item) => item.favorite).length;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

  const uniqueStores = useMemo(() => {
    return [...new Set(items.map((item) => item.store))];
  }, [items]);

  const uniqueCategories = useMemo(() => {
    return [...new Set(items.map((item) => item.category))];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesStore = storeFilter === "all" || item.store === storeFilter;
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && !item.completed) ||
        (statusFilter === "done" && item.completed);

      return matchesSearch && matchesStore && matchesCategory && matchesStatus;
    });
  }, [items, search, storeFilter, categoryFilter, statusFilter]);

  const addItem = async () => {
    if (!newItem.trim() || !userId || saving) return;

    setSaving(true);

    const payload = {
      user_id: userId,
      name: newItem.trim(),
      category,
      store,
      quantity,
      completed: false,
      favorite: false,
    };

    const { data, error } = await supabase
      .from("grocery_items")
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      setItems((prev) => [data, ...prev]);
      setNewItem("");
      setCategory("Food");
      setStore("Tesco");
      setQuantity(1);
    }

    setSaving(false);
  };

  const updateItem = async (
    id: string,
    updates: Partial<Pick<GroceryItem, "completed" | "favorite" | "quantity">>
  ) => {
    const previousItems = items;
    const nextItems = items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );

    setItems(nextItems);

    const { error } = await supabase
      .from("grocery_items")
      .update(updates)
      .eq("id", id);

    if (error) {
      setItems(previousItems);
    }
  };

  const toggleComplete = async (id: string, currentValue: boolean) => {
    await updateItem(id, { completed: !currentValue });
  };

  const toggleFavorite = async (id: string, currentValue: boolean) => {
    await updateItem(id, { favorite: !currentValue });
  };

  const increaseQty = async (id: string, currentQty: number) => {
    await updateItem(id, { quantity: currentQty + 1 });
  };

  const decreaseQty = async (id: string, currentQty: number) => {
    await updateItem(id, { quantity: Math.max(1, currentQty - 1) });
  };

  const deleteItem = async (id: string) => {
    const previousItems = items;
    setItems((prev) => prev.filter((item) => item.id !== id));

    const { error } = await supabase.from("grocery_items").delete().eq("id", id);

    if (error) {
      setItems(previousItems);
    }
  };

  const clearCompleted = async () => {
    const completedIds = items.filter((item) => item.completed).map((item) => item.id);
    if (completedIds.length === 0) return;

    const previousItems = items;
    setItems((prev) => prev.filter((item) => !item.completed));

    const { error } = await supabase
      .from("grocery_items")
      .delete()
      .in("id", completedIds);

    if (error) {
      setItems(previousItems);
    }
  };

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
              AVO Grocery List
            </h1>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <button className="rounded-xl border border-[#d8dfeb] bg-white px-4 py-2.5 text-sm font-semibold text-[#0d1730] shadow-sm transition hover:bg-[#f8fbff] sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base">
              Grocery
            </button>
            <button className="rounded-xl border border-[#d8dfeb] bg-white px-4 py-2.5 text-sm font-semibold text-[#0d1730] shadow-sm transition hover:bg-[#f8fbff] sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base">
              Stores
            </button>
            <button className="rounded-xl border border-[#d8dfeb] bg-white px-4 py-2.5 text-sm font-semibold text-[#0d1730] shadow-sm transition hover:bg-[#f8fbff] sm:rounded-2xl sm:px-5 sm:py-3 sm:text-base">
              Favourites
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0c1730] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:rounded-2xl sm:px-6 sm:py-3 sm:text-base"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </header>

        <section className="mb-8 grid gap-6 xl:mb-10 xl:grid-cols-[1.6fr_1fr] xl:gap-8">
          <div className="rounded-[28px] border border-[#d8dfeb] bg-white p-5 shadow-sm sm:p-8 sm:rounded-[34px]">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#2f66f5] sm:mb-5 sm:text-sm">
              Your shopping dashboard
            </div>

            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[#0d1730] sm:text-4xl md:text-5xl xl:text-6xl">
              Shop with clarity and premium organisation.
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#667085] sm:mt-6 sm:text-lg md:text-xl md:leading-8">
              Keep track of your grocery list, organise products by store and
              category, and manage your essentials across all your devices.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
              <button className="w-full rounded-2xl bg-[#0c1730] px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto sm:px-7 sm:py-4 sm:text-lg">
                Open Grocery List
              </button>
              <button className="w-full rounded-2xl border border-[#d8dfeb] bg-white px-5 py-3.5 text-base font-semibold text-[#0d1730] transition hover:bg-[#f8fbff] sm:w-auto sm:px-7 sm:py-4 sm:text-lg">
                Manage Stores
              </button>
            </div>

            <div className="mt-8 rounded-[24px] border border-[#dde3ee] bg-[#f8fbff] p-5 sm:mt-8 sm:rounded-[28px] sm:p-6">
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
                <OverviewRow label={`${done} items completed`} />
                <OverviewRow label={`${total} total items`} />
                <OverviewRow label={`${pending} items pending`} />
                <OverviewRow label={`${favorites} favourites saved`} />
              </div>

              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-5 sm:mt-10">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/60 sm:text-sm">
                  <Sparkles className="h-4 w-4" />
                  Premium tip
                </div>
                <p className="text-sm leading-7 text-white/85 sm:text-base">
                  Keep your list grouped by store to make shopping faster and reduce
                  duplicate purchases.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-[#d8dfeb] bg-white p-5 shadow-sm sm:mb-8 sm:p-7 sm:rounded-[34px]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.5fr_0.9fr_0.9fr_0.6fr_auto]">
            <div>
              <label className="mb-3 block text-base font-medium text-[#25324a] sm:text-lg">
                Add item
              </label>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Enter product name"
                className="h-14 w-full rounded-2xl border border-[#d7deea] bg-[#fbfcfe] px-4 text-base text-[#0d1730] outline-none transition focus:border-[#93b4ff] sm:h-16 sm:px-5 sm:text-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addItem();
                }}
              />
            </div>

            <div>
              <label className="mb-3 block text-base font-medium text-[#25324a] sm:text-lg">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="h-14 w-full rounded-2xl border border-[#d7deea] bg-[#fbfcfe] px-4 text-base text-[#0d1730] outline-none transition focus:border-[#93b4ff] sm:h-16 sm:px-5 sm:text-lg"
              >
                <option>Food</option>
                <option>Drinks</option>
                <option>Cleaning</option>
                <option>Frozen</option>
                <option>Household</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-3 block text-base font-medium text-[#25324a] sm:text-lg">
                Store
              </label>
              <select
                value={store}
                onChange={(e) => setStore(e.target.value as StoreType)}
                className="h-14 w-full rounded-2xl border border-[#d7deea] bg-[#fbfcfe] px-4 text-base text-[#0d1730] outline-none transition focus:border-[#93b4ff] sm:h-16 sm:px-5 sm:text-lg"
              >
                <option>Tesco</option>
                <option>Lidl</option>
                <option>Costco</option>
                <option>Aldi</option>
                <option>Sainsbury&apos;s</option>
                <option>Asda</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-3 block text-base font-medium text-[#25324a] sm:text-lg">
                Qty
              </label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="h-14 w-full rounded-2xl border border-[#d7deea] bg-[#fbfcfe] px-4 text-base text-[#0d1730] outline-none transition focus:border-[#93b4ff] sm:h-16 sm:px-5 sm:text-lg"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end md:col-span-2 xl:col-span-1">
              <button
                onClick={addItem}
                disabled={saving}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0c1730] px-6 text-base font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60 sm:h-16 sm:text-lg xl:w-auto"
              >
                <Plus className="h-5 w-5" />
                {saving ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-[#d8dfeb] bg-white p-5 shadow-sm sm:mb-8 sm:p-7 sm:rounded-[34px]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.8fr_0.7fr_auto]">
            <div className="relative md:col-span-2 lg:col-span-1">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a94a6]" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-14 w-full rounded-2xl border border-[#d7deea] bg-[#fbfcfe] pl-14 pr-5 text-base text-[#0d1730] outline-none transition focus:border-[#93b4ff] sm:h-16 sm:text-lg"
              />
            </div>

            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="h-14 rounded-2xl border border-[#d7deea] bg-[#fbfcfe] px-4 text-base text-[#0d1730] outline-none transition focus:border-[#93b4ff] sm:h-16 sm:px-5 sm:text-lg"
            >
              <option value="all">All stores</option>
              {uniqueStores.map((storeName) => (
                <option key={storeName} value={storeName}>
                  {storeName}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-14 rounded-2xl border border-[#d7deea] bg-[#fbfcfe] px-4 text-base text-[#0d1730] outline-none transition focus:border-[#93b4ff] sm:h-16 sm:px-5 sm:text-lg"
            >
              <option value="all">All categories</option>
              {uniqueCategories.map((categoryName) => (
                <option key={categoryName} value={categoryName}>
                  {categoryName}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-14 rounded-2xl border border-[#d7deea] bg-[#fbfcfe] px-4 text-base text-[#0d1730] outline-none transition focus:border-[#93b4ff] sm:h-16 sm:px-5 sm:text-lg"
            >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="done">Done</option>
            </select>

            <button
              onClick={clearCompleted}
              className="h-14 w-full rounded-2xl px-4 text-base font-medium text-[#e26d47] transition hover:bg-[#fff5f1] sm:h-16 sm:text-lg lg:w-auto"
            >
              Clear completed
            </button>
          </div>
        </section>

        <section className="space-y-4 sm:space-y-5">
          {filteredItems.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#d8dfeb] bg-white p-10 text-center shadow-sm sm:rounded-[34px] sm:p-16">
              <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-[#8a94a6]" />
              <h3 className="text-xl font-semibold text-[#0d1730] sm:text-2xl">
                No items found
              </h3>
              <p className="mt-3 text-base text-[#667085] sm:text-lg">
                Try another search or add a new grocery item.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className={`rounded-[24px] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 sm:rounded-[30px] sm:p-6 ${
                  item.completed ? "border-[#e2e8f3] opacity-80" : "border-[#d8dfeb]"
                }`}
              >
                <div className="flex flex-col gap-4 lg:gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                    <button
                      onClick={() => toggleComplete(item.id, item.completed)}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
                        item.completed
                          ? "border-[#0d1730] bg-[#0d1730] text-white"
                          : "border-[#c8d1df] bg-white text-transparent"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f2f5fa] text-[#334155] sm:h-14 sm:w-14">
                      {item.category.toLowerCase() === "food" ? (
                        <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <Store className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3
                        className={`truncate text-xl font-semibold text-[#0d1730] sm:text-2xl ${
                          item.completed ? "line-through opacity-50" : ""
                        }`}
                      >
                        {item.name}
                      </h3>

                      <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-[#667085]">
                        <span className="rounded-full bg-[#f3f6fb] px-3 py-1.5">
                          {item.category}
                        </span>
                        <span className="rounded-full bg-[#f3f6fb] px-3 py-1.5">
                          {item.store}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center rounded-2xl border border-[#d8dfeb] bg-[#fbfcfe] p-1">
                      <button
                        onClick={() => decreaseQty(item.id, item.quantity)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#475467] transition hover:bg-white sm:h-12 sm:w-12"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      <span className="min-w-[2rem] text-center text-lg font-semibold text-[#0d1730] sm:min-w-[2.5rem] sm:text-xl">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQty(item.id, item.quantity)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#475467] transition hover:bg-white sm:h-12 sm:w-12"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>

                    <button
                      onClick={() => toggleFavorite(item.id, item.favorite)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d8dfeb] bg-white transition hover:bg-[#f8fbff] sm:h-12 sm:w-12"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          item.favorite
                            ? "fill-[#d6a93f] text-[#d6a93f]"
                            : "text-[#667085]"
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[#f0cfc5] bg-[#fff8f6] px-4 text-sm font-medium text-[#df6b47] transition hover:bg-[#fff1ed] sm:h-12 sm:px-5 sm:text-lg"
                    >
                      <Trash2 className="h-5 w-5" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
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