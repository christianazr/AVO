'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AutoConsumptionItem,
  getStockPercentage,
  getSuggestedPurchaseQuantity,
  shouldAutoAdd,
} from '@/lib/auto-consumption'

type Store = {
  id: string
  name: string
}

type GroceryInsertPayload = {
  name: string
  store_id: string | null
  store_name: string | null
  quantity: number
  auto_generated: boolean
  auto_source_id: string
  auto_source_type: string
  completed?: boolean
}

const defaultForm = {
  item_name: '',
  store_id: '',
  current_stock: '0',
  target_stock: '1',
  threshold_percent: '25',
  auto_add_enabled: true,
}

export default function AutoConsumptionPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [items, setItems] = useState<AutoConsumptionItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [message, setMessage] = useState<string>('')

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
      setMessage('Unable to load user session.')
      setLoading(false)
      return
    }

    const [storesRes, itemsRes] = await Promise.all([
      supabase.from('stores').select('id, name').order('name', { ascending: true }),
      supabase
        .from('auto_consumption_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    if (storesRes.error) {
      console.error(storesRes.error)
      setMessage('Failed to load stores.')
    } else {
      setStores(storesRes.data || [])
    }

    if (itemsRes.error) {
      console.error(itemsRes.error)
      setMessage('Failed to load auto-consumption items.')
    } else {
      setItems((itemsRes.data || []) as AutoConsumptionItem[])
    }

    setLoading(false)
  }

  function resetForm() {
    setForm(defaultForm)
    setEditingId(null)
  }

  function getStoreName(storeId: string) {
    return stores.find((s) => s.id === storeId)?.name || null
  }

  async function maybeAddToGroceryList(item: AutoConsumptionItem) {
    if (!shouldAutoAdd(item)) return

    const quantityToBuy = getSuggestedPurchaseQuantity(item.current_stock, item.target_stock)
    if (quantityToBuy <= 0) return

    const { data: existing, error: existingError } = await supabase
      .from('grocery_items')
      .select('id')
      .eq('auto_generated', true)
      .eq('auto_source_id', item.id)
      .eq('auto_source_type', 'auto_consumption')
      .limit(1)

    if (existingError) {
      console.error(existingError)
      return
    }

    if (existing && existing.length > 0) {
      return
    }

    const payload: GroceryInsertPayload = {
      name: item.item_name,
      store_id: item.store_id,
      store_name: item.store_name,
      quantity: quantityToBuy,
      auto_generated: true,
      auto_source_id: item.id,
      auto_source_type: 'auto_consumption',
      completed: false,
    }

    const { error: insertError } = await supabase.from('grocery_items').insert(payload)

    if (insertError) {
      console.error(insertError)
      return
    }

    await supabase
      .from('auto_consumption_items')
      .update({ last_auto_added_at: new Date().toISOString() })
      .eq('id', item.id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Unable to identify the signed-in user.')
      setSaving(false)
      return
    }

    const selectedStoreName = form.store_id ? getStoreName(form.store_id) : null

    const payload = {
      user_id: user.id,
      item_name: form.item_name.trim(),
      store_id: form.store_id || null,
      store_name: selectedStoreName,
      current_stock: Number(form.current_stock),
      target_stock: Number(form.target_stock),
      threshold_percent: Number(form.threshold_percent),
      auto_add_enabled: form.auto_add_enabled,
    }

    if (!payload.item_name) {
      setMessage('Please enter an item name.')
      setSaving(false)
      return
    }

    if (payload.target_stock <= 0) {
      setMessage('Target stock must be greater than 0.')
      setSaving(false)
      return
    }

    if (payload.current_stock < 0) {
      setMessage('Current stock cannot be negative.')
      setSaving(false)
      return
    }

    let savedItem: AutoConsumptionItem | null = null

    if (editingId) {
      const { data, error } = await supabase
        .from('auto_consumption_items')
        .update(payload)
        .eq('id', editingId)
        .select()
        .single()

      if (error) {
        console.error(error)
        setMessage('Failed to update item.')
        setSaving(false)
        return
      }

      savedItem = data as AutoConsumptionItem
      setMessage('Item updated.')
    } else {
      const { data, error } = await supabase
        .from('auto_consumption_items')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error(error)
        setMessage('Failed to create item.')
        setSaving(false)
        return
      }

      savedItem = data as AutoConsumptionItem
      setMessage('Item created.')
    }

    if (savedItem) {
      await maybeAddToGroceryList(savedItem)
    }

    await loadData()
    resetForm()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Delete this auto-consumption item?')
    if (!confirmed) return

    const { error } = await supabase.from('auto_consumption_items').delete().eq('id', id)

    if (error) {
      console.error(error)
      setMessage('Failed to delete item.')
      return
    }

    setItems((prev) => prev.filter((item) => item.id !== id))
    setMessage('Item deleted.')
  }

  function handleEdit(item: AutoConsumptionItem) {
    setEditingId(item.id)
    setForm({
      item_name: item.item_name,
      store_id: item.store_id || '',
      current_stock: String(item.current_stock),
      target_stock: String(item.target_stock),
      threshold_percent: String(item.threshold_percent),
      auto_add_enabled: item.auto_add_enabled,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const stats = useMemo(() => {
    const total = items.length
    const low = items.filter((item) => shouldAutoAdd(item)).length
    return { total, low }
  }, [items])

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Auto Consumption</h1>
          <p className="max-w-3xl text-sm text-neutral-400">
            Track current stock, set a target stock, and automatically push items into your grocery
            list when stock reaches the threshold.
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-neutral-400">Tracked items</p>
            <p className="mt-2 text-3xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-neutral-400">Below threshold</p>
            <p className="mt-2 text-3xl font-semibold">{stats.low}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-lg font-medium">
              {editingId ? 'Edit item' : 'Add item'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-neutral-300">Item name</label>
                <input
                  type="text"
                  value={form.item_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, item_name: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 outline-none ring-0 placeholder:text-neutral-500"
                  placeholder="Milk"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-300">Store</label>
                <select
                  value={form.store_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, store_id: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 outline-none"
                >
                  <option value="">No store selected</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm text-neutral-300">Current stock</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.current_stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, current_stock: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-300">Target stock</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.target_stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, target_stock: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-300">Threshold %</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={form.threshold_percent}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, threshold_percent: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 outline-none"
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Example: 25 means the item will be auto-added when current stock is 25% or less of
                  target stock.
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-900 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.auto_add_enabled}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, auto_add_enabled: e.target.checked }))
                  }
                />
                <span className="text-sm text-neutral-300">Enable automatic add to grocery list</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update item' : 'Add item'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {message && <p className="text-sm text-neutral-400">{message}</p>}
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Tracked items</h2>
            </div>

            {loading ? (
              <p className="text-sm text-neutral-400">Loading...</p>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">
                No auto-consumption items yet.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const percentage = getStockPercentage(item.current_stock, item.target_stock)
                  const belowThreshold = shouldAutoAdd(item)
                  const suggestedQty = getSuggestedPurchaseQuantity(
                    item.current_stock,
                    item.target_stock
                  )

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-neutral-950/50 p-4"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <h3 className="truncate text-base font-medium">{item.item_name}</h3>
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                belowThreshold
                                  ? 'bg-red-500/15 text-red-300'
                                  : percentage <= 50
                                  ? 'bg-yellow-500/15 text-yellow-300'
                                  : 'bg-green-500/15 text-green-300'
                              }`}
                            >
                              {belowThreshold ? 'Low' : percentage <= 50 ? 'Medium' : 'OK'}
                            </span>
                          </div>

                          <div className="grid gap-2 text-sm text-neutral-400 sm:grid-cols-2 xl:grid-cols-4">
                            <p>
                              <span className="text-neutral-500">Store:</span>{' '}
                              {item.store_name || '—'}
                            </p>
                            <p>
                              <span className="text-neutral-500">Current:</span>{' '}
                              {item.current_stock}
                            </p>
                            <p>
                              <span className="text-neutral-500">Target:</span>{' '}
                              {item.target_stock}
                            </p>
                            <p>
                              <span className="text-neutral-500">Stock %:</span>{' '}
                              {percentage.toFixed(0)}%
                            </p>
                          </div>

                          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full ${
                                belowThreshold
                                  ? 'bg-red-400'
                                  : percentage <= 50
                                  ? 'bg-yellow-400'
                                  : 'bg-green-400'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>

                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500">
                            <span>Threshold: {item.threshold_percent}%</span>
                            <span>Suggested purchase: {suggestedQty}</span>
                            <span>
                              Auto add: {item.auto_add_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <span>
                              Last auto-added:{' '}
                              {item.last_auto_added_at
                                ? new Date(item.last_auto_added_at).toLocaleString()
                                : 'Never'}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/5"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-xl border border-red-500/20 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}