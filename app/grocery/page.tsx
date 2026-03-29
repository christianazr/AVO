"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  Star,
  CheckCircle2,
  ShoppingBag,
  Store,
  LogOut,
} from "lucide-react";

type Category =
  | "Food"
  | "Drinks"
  | "Cleaning"
  | "Frozen"
  | "Household"
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

type UserStore = {
  id: string;
  user_id: string;
  name: string;
  is_favorite: boolean;
  created_at: string;
};

export default function GroceryPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [stores, setStores] = useState<UserStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newItem, setNewItem] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [store, setStore] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

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

      const loadedStores = storesData ?? [];
      setItems(itemsData ?? []);
      setStores(loadedStores);

      if (loadedStores.length > 0) {
        setStore(loadedStores[0].name);
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  const total = items.length;
  const pending = items.filter((item) => !item.completed).length;
  const done = items.filter((item) => item.completed).length;

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

  const availableStores = useMemo(() => stores.map((s) => s.name), [stores]);
  const uniqueCategories = useMemo(
    () => [...new Set(items.map((item) => item.category))],
    [items]
  );

  const addItem = async () => {
    if (!newItem.trim() || !userId || !store || saving) return;

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
            <p className="text-sm text-[#5c677d]">Loading grocery page...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3fb] text-[#0d1730]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-[#d8dfeb] bg-white px-4 py-2.5 text-sm font-semibold text-[#0d1730] shadow-sm transition hover:bg-[#f8fbff]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2f66f5] sm:text-sm">
                Grocery section
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Grocery List
              </h1>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/stores"
              className="rounded-xl border border-[#d8dfeb] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#0d1730] shadow-sm transition hover:bg-[#f8fbff] sm:text-base"
            >
              Manage Stores
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0c1730] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:text-base"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Total items" value={total} />
          <SummaryCard label="Pending" value={pending} />
          <SummaryCard label="Completed" value={done} />
        </section>

        <section className="mb-6 rounded-[28px] border border-[#d8dfeb] bg-white p-5 shadow-sm sm:p-7">
          {availableStores.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8dfeb] bg-[#f8fbff] p-5 text-sm text-[#667085]">
              You have no saved stores yet. Go to <Link href="/stores" className="font-semibold text-[#2f66f5]">Manage Stores</Link> first to add one.
            </div>
          ) : (
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
                  onChange={(e) => setStore(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-[#d7deea] bg-[#fbfcfe] px-4 text-base text-[#0d1730] outline-none transition focus:border-[#93b4ff] sm:h-16 sm:px-5 sm:text-lg"
                >
                  {availableStores.map((storeName) => (
                    <option key={storeName} value={storeName}>
                      {storeName}
                    </option>
                  ))}
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
          )}
        </section>

        <section className="mb-6 rounded-[28px] border border-[#d8dfeb] bg-white p-5 shadow-sm sm:p-7">
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
              {availableStores.map((storeName) => (
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
            <div className="rounded-[28px] border border-dashed border-[#d8dfeb] bg-white p-10 text-center shadow-sm sm:p-16">
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-[#d8dfeb] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#667085]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#0d1730]">{value}</p>
    </div>
  );
}