'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'

type GroceryItem = {
  id: string
  name: string
  quantity: number | null
  category: string | null
  completed: boolean
  store_id: string | null
  store_name: string | null
  created_at: string | null
}

type Store = {
  id: string
  name: string
}

type FilterType = 'all' | 'pending' | 'completed'

const categories = [
  'Fruit & Veg',
  'Dairy',
  'Meat',
  'Frozen',
  'Bakery',
  'Drinks',
  'Snacks',
  'Cleaning',
  'Other',
]

export default function GroceryPage() {
  const supabase = createClient()

  const [items, setItems] = useState<GroceryItem[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [message, setMessage] = useState('')

  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [category, setCategory] = useState('Other')
  const [storeId, setStoreId] = useState('')

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Unable to load your session.')
      setLoading(false)
      return
    }

    const [itemsRes, storesRes] = await Promise.all([
      supabase
        .from('grocery_items')
        .select('id, name, quantity, category, completed, store_id, store_name, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('stores').select('id, name').order('name', { ascending: true }),
    ])

    if (itemsRes.error) {
      console.error(itemsRes.error)
      setMessage('Failed to load grocery items.')
    } else {
      setItems((itemsRes.data ?? []) as GroceryItem[])
    }

    if (storesRes.error) {
      console.error(storesRes.error)
    } else {
      setStores((storesRes.data ?? []) as Store[])
    }

    setLoading(false)
  }

  function resetForm() {
    setName('')
    setQuantity('1')
    setCategory('Other')
    setStoreId('')
  }

  function getStoreName(selectedId: string) {
    return stores.find((store) => store.id === selectedId)?.name ?? null
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const trimmedName = name.trim()

    if (!trimmedName) {
      setMessage('Please enter an item name.')
      setSaving(false)
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Unable to identify the signed-in user.')
      setSaving(false)
      return
    }

    const selectedStoreName = storeId ? getStoreName(storeId) : null

    const payload = {
      user_id: user.id,
      name: trimmedName,
      quantity: Number(quantity) || 1,
      category,
      completed: false,
      store_id: storeId || null,
      store_name: selectedStoreName,
    }

    const { error } = await supabase.from('grocery_items').insert(payload)

    if (error) {
      console.error(error)
      setMessage('Failed to add item.')
      setSaving(false)
      return
    }

    resetForm()
    await loadData()
    setMessage('Item added.')
    setSaving(false)
  }

  async function handleToggleComplete(itemId: string, currentValue: boolean) {
    const { error } = await supabase
      .from('grocery_items')
      .update({ completed: !currentValue })
      .eq('id', itemId)

    if (error) {
      console.error(error)
      setMessage('Failed to update item.')
      return
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !currentValue } : item
      )
    )
  }

  async function handleDelete(itemId: string) {
    const confirmed = window.confirm('Delete this grocery item?')
    if (!confirmed) return

    const { error } = await supabase.from('grocery_items').delete().eq('id', itemId)

    if (error) {
      console.error(error)
      setMessage('Failed to delete item.')
      return
    }

    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const filteredItems = useMemo(() => {
    if (filter === 'pending') return items.filter((item) => !item.completed)
    if (filter === 'completed') return items.filter((item) => item.completed)
    return items
  }, [items, filter])

  const stats = useMemo(() => {
    const total = items.length
    const completed = items.filter((item) => item.completed).length
    const pending = total - completed
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, pending, progress }
  }, [items])

  return (
    <div className="min-h-screen bg-[#edf1f7] text-[#0d1b4c]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#315efb] sm:text-sm">
              Grocery
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Grocery List
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5d6d92] sm:text-base">
              Organise your shopping items, keep track of what is still pending,
              and manage your list with a clean mobile-friendly layout.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl border border-[#d8dfea] bg-white px-5 py-3 text-sm font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5 sm:text-base"
            >
              Dashboard
            </Link>
            <Link
              href="/stores"
              className="rounded-2xl border border-[#d8dfea] bg-white px-5 py-3 text-sm font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5 sm:text-base"
            >
              Stores
            </Link>
            <Link
              href="/auto-consumption"
              className="rounded-2xl border border-[#d8dfea] bg-white px-5 py-3 text-sm font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5 sm:text-base"
            >
              Auto Consumption
            </Link>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-[#d9dfeb] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6b7a99]">Total items</p>
            <p className="mt-2 text-3xl font-bold">{stats.total}</p>
          </div>

          <div className="rounded-[24px] border border-[#d9dfeb] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6b7a99]">Pending</p>
            <p className="mt-2 text-3xl font-bold">{stats.pending}</p>
          </div>

          <div className="rounded-[24px] border border-[#d9dfeb] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6b7a99]">Completed</p>
            <p className="mt-2 text-3xl font-bold">{stats.completed}</p>
          </div>

          <div className="rounded-[24px] border border-[#d9dfeb] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6b7a99]">Progress</p>
            <p className="mt-2 text-3xl font-bold">{stats.progress}%</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="rounded-[24px] border border-[#d9dfeb] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-2xl font-bold text-[#0b1742]">Add item</h2>

            <form onSubmit={handleAddItem} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#33415c]">
                  Item name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Milk"
                  className="h-13 w-full rounded-2xl border border-[#d8dfea] bg-[#f9fbff] px-4 py-3 text-base outline-none transition focus:border-[#315efb]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#33415c]">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-13 w-full rounded-2xl border border-[#d8dfea] bg-[#f9fbff] px-4 py-3 text-base outline-none transition focus:border-[#315efb]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#33415c]">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-13 w-full rounded-2xl border border-[#d8dfea] bg-[#f9fbff] px-4 py-3 text-base outline-none transition focus:border-[#315efb]"
                  >
                    {categories.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#33415c]">
                  Store
                </label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="h-13 w-full rounded-2xl border border-[#d8dfea] bg-[#f9fbff] px-4 py-3 text-base outline-none transition focus:border-[#315efb]"
                >
                  <option value="">No store selected</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-13 w-full items-center justify-center rounded-2xl bg-[#071b52] px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#0a246b] disabled:opacity-60"
              >
                {saving ? 'Adding...' : 'Add item'}
              </button>

              {message && (
                <p className="text-sm text-[#5d6d92]">
                  {message}
                </p>
              )}
            </form>
          </div>

          <div className="rounded-[24px] border border-[#d9dfeb] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold text-[#0b1742]">Your items</h2>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    filter === 'all'
                      ? 'bg-[#071b52] text-white'
                      : 'border border-[#d8dfea] bg-white text-[#0d1b4c]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    filter === 'pending'
                      ? 'bg-[#071b52] text-white'
                      : 'border border-[#d8dfea] bg-white text-[#0d1b4c]'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    filter === 'completed'
                      ? 'bg-[#071b52] text-white'
                      : 'border border-[#d8dfea] bg-white text-[#0d1b4c]'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-[22px] border border-[#d8dfea] bg-[#f6f8fc] p-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-[#0b1742]">Shopping progress</h3>
                <span className="text-lg font-bold text-[#0b1742]">{stats.progress}%</span>
              </div>

              <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-[#dde4f0]">
                <div
                  className="h-full rounded-full bg-[#071b52] transition-all"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-[#5d6d92]">Loading items...</p>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[#d8dfea] bg-[#fbfcff] p-8 text-center text-sm text-[#6b7a99]">
                No grocery items found for this filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-[22px] border p-4 shadow-sm transition sm:p-5 ${
                      item.completed
                        ? 'border-[#d9dfeb] bg-[#f8fbff]'
                        : 'border-[#d9dfeb] bg-white'
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-lg font-semibold ${
                              item.completed
                                ? 'text-[#7b88a8] line-through'
                                : 'text-[#0b1742]'
                            }`}
                          >
                            {item.name}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.completed
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {item.completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-[#5d6d92]">
                          <span className="rounded-full bg-[#eef3fb] px-3 py-1">
                            Qty: {item.quantity ?? 1}
                          </span>
                          <span className="rounded-full bg-[#eef3fb] px-3 py-1">
                            {item.category || 'Other'}
                          </span>
                          <span className="rounded-full bg-[#eef3fb] px-3 py-1">
                            {item.store_name || 'No store'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleComplete(item.id, item.completed)}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            item.completed
                              ? 'border border-[#d8dfea] bg-white text-[#0d1b4c]'
                              : 'bg-[#071b52] text-white hover:bg-[#0a246b]'
                          }`}
                        >
                          {item.completed ? 'Mark pending' : 'Mark done'}
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-2xl border border-[#f0c9c9] bg-white px-4 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff5f5]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}