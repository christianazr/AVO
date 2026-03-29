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
  Clock3,
  LayoutGrid,
  Store,
  Sparkles,
  Minus,
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
    updates: Partial<
      Pick<GroceryItem, "completed" | "favorite" | "quantity" | "name" | "store" | "category">
    >
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
      <main className="min-h-screen bg-[#f6f3ee] text-[#111111]">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="rounded-3xl border border-black/10 bg-white/80 px-8 py-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
            <p className="text-sm text-black/60">Loading your grocery dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f3ee] text-[#111111]">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-black/60 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Premium Grocery Dashboard
            </div>

            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              AVO Grocery List
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-black/60 md:text-base">
              Organise your shopping with a cleaner, more premium experience.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 text-sm font-medium text-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total items" value={total} icon={<LayoutGrid className="h-5 w-5" />} />
          <StatCard title="Pending" value={pending} icon={<Clock3 className="h-5 w-5" />} />
          <StatCard title="Completed" value={done} icon={<CheckCircle2 className="h-5 w-5" />} />
          <StatCard title="Favourites" value={favorites} icon={<Star className="h-5 w-5" />} />
        </section>

        <section className="mb-8 rounded-3xl border border-black/10 bg-white/80 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.04)] backdrop-blur md:p-6">
          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.5fr_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-black/70">
                Add item
              </label>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Enter product name"
                className="h-13 w-full rounded-2xl border border-black/10 bg-[#faf8f4] px-4 text-sm outline-none transition focus:border-black/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addItem();
                }}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black/70">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="h-13 w-full rounded-2xl border border-black/10 bg-[#faf8f4] px-4 text-sm outline-none transition focus:border-black/30"
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
              <label className="mb-2 block text-sm font-medium text-black/70">
                Store
              </label>
              <select
                value={store}
                onChange={(e) => setStore(e.target.value as StoreType)}
                className="h-13 w-full rounded-2xl border border-black/10 bg-[#faf8f4] px-4 text-sm outline-none transition focus:border-black/30"
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
              <label className="mb-2 block text-sm font-medium text-black/70">
                Qty
              </label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="h-13 w-full rounded-2xl border border-black/10 bg-[#faf8f4] px-4 text-sm outline-none transition focus:border-black/30"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={addItem}
                disabled={saving}
                className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {saving ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-black/10 bg-white/80 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.04)] backdrop-blur md:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_repeat(3,0.7fr)_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-13 w-full rounded-2xl border border-black/10 bg-[#faf8f4] pl-11 pr-4 text-sm outline-none transition focus:border-black/30"
              />
            </div>

            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="h-13 rounded-2xl border border-black/10 bg-[#faf8f4] px-4 text-sm outline-none transition focus:border-black/30"
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
              className="h-13 rounded-2xl border border-black/10 bg-[#faf8f4] px-4 text-sm outline-none transition focus:border-black/30"
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
              className="h-13 rounded-2xl border border-black/10 bg-[#faf8f4] px-4 text-sm outline-none transition focus:border-black/30"
            >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="done">Done</option>
            </select>

            <button
              onClick={clearCompleted}
              className="h-13 rounded-2xl border border-transparent px-4 text-sm font-medium text-[#c25d3f] transition hover:bg-[#fff5f1]"
            >
              Clear completed
            </button>
          </div>
        </section>

        <section className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white/70 px-6 py-16 text-center shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
              <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-black/30" />
              <h3 className="text-lg font-medium">No items found</h3>
              <p className="mt-2 text-sm text-black/50">
                Try another search or add a new product to your list.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className={`group rounded-3xl border p-4 shadow-[0_10px_40px_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_50px_rgba(0,0,0,0.06)] md:p-5 ${
                  item.completed
                    ? "border-black/5 bg-white/60 opacity-75"
                    : "border-black/10 bg-white/85"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <button
                      onClick={() => toggleComplete(item.id, item.completed)}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                        item.completed
                          ? "border-black bg-black text-white"
                          : "border-black/20 bg-white text-transparent"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f3efe8] text-black/70">
                      {item.category.toLowerCase() === "food" ? (
                        <ShoppingBag className="h-5 w-5" />
                      ) : (
                        <Store className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3
                        className={`truncate text-lg font-medium ${
                          item.completed ? "line-through text-black/40" : ""
                        }`}
                      >
                        {item.name}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-black/50">
                        <span className="rounded-full bg-[#f6f3ee] px-2.5 py-1">
                          {item.category}
                        </span>
                        <span className="rounded-full bg-[#f6f3ee] px-2.5 py-1">
                          {item.store}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <div className="flex items-center rounded-2xl border border-black/10 bg-[#faf8f4] p-1">
                      <button
                        onClick={() => decreaseQty(item.id, item.quantity)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-black/70 transition hover:bg-white"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQty(item.id, item.quantity)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-black/70 transition hover:bg-white"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => toggleFavorite(item.id, item.favorite)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white transition hover:bg-[#faf8f4]"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          item.favorite ? "fill-[#d4a437] text-[#d4a437]" : "text-black/60"
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#e7c7be] bg-[#fff8f6] px-4 text-sm font-medium text-[#c25d3f] transition hover:bg-[#fff2ee]"
                    >
                      <Trash2 className="h-4 w-4" />
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

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.04)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-black/55">{title}</div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f3efe8] text-black/70">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}