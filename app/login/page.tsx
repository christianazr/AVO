'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Item = {
  id: string
  name: string
  user_id?: string
  category?: string
  supermarket?: string
  completed?: boolean
  created_at?: string
}

const storeOptions = [
  { value: 'tesco', label: 'Tesco' },
  { value: 'lidl', label: 'Lidl' },
  { value: 'aldi', label: 'Aldi' },
  { value: 'costco', label: 'Costco' },
  { value: 'morrisons', label: 'Morrisons' },
  { value: 'sainsburys', label: "Sainsbury's" },
  { value: 'iceland', label: 'Iceland' },
]

const categoryOptions = [
  { value: 'food', label: 'Food' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'cleaning', label: 'Cleaning' },
]

function formatStore(store?: string) {
  return storeOptions.find((s) => s.value === store)?.label || store || 'Store'
}

function formatCategory(category?: string) {
  return (
    categoryOptions.find((c) => c.value === category)?.label || category || 'Category'
  )
}

export default function Dashboard() {
  const [items, setItems] = useState<Item[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('food')
  const [store, setStore] = useState('tesco')
  const [filterStore, setFilterStore] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)

  const fetchItems = async () => {
    setLoading(true)

    let query = supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })

    if (filterStore !== 'all') {
      query = query.eq('supermarket', filterStore)
    }

    if (filterStatus === 'pending') {
      query = query.eq('completed', false)
    }

    if (filterStatus === 'completed') {
      query = query.eq('completed', true)
    }

    const { data, error } = await query

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setItems(data || [])
  }

  const addItem = async () => {
    if (!name.trim()) return

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      alert('You must be logged in')
      return
    }

    const { error } = await supabase.from('items').insert({
      name,
      category,
      supermarket: store,
      completed: false,
      user_id: user.id,
    })

    if (error) {
      alert(error.message)
      return
    }

    setName('')
    fetchItems()
  }

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('items').delete().eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    fetchItems()
  }

  const toggleCompleted = async (id: string, currentValue: boolean | undefined) => {
    const { error } = await supabase
      .from('items')
      .update({ completed: !currentValue })
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    fetchItems()
  }

  useEffect(() => {
    fetchItems()
  }, [filterStore, filterStatus])

  const stats = useMemo(() => {
    const total = items.length
    const completed = items.filter((item) => item.completed).length
    const pending = total - completed
    return { total, completed, pending }
  }, [items])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-200/70 px-6 py-6 md:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Premium grocery planner
                </p>
                <h1 className="text-4xl font-semibold tracking-tight">AVO Grocery List</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Organise your shopping by category, supermarket and status.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                  <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
                  <p className="mt-1 text-2xl font-semibold">{stats.pending}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Done</p>
                  <p className="mt-1 text-2xl font-semibold">{stats.completed}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.2fr_0.8fr] md:px-8">
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Add new item</h2>
                <p className="text-sm text-slate-500">
                  Build your list by item, category and store.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-slate-400 focus:bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Add item"
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <select
                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                  >
                    {storeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    className="rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
                    onClick={addItem}
                  >
                    Add item
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <p className="text-sm text-slate-500">
                  Narrow the view by store and completion status.
                </p>
              </div>

              <div className="space-y-3">
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
                  value={filterStore}
                  onChange={(e) => setFilterStore(e.target.value)}
                >
                  <option value="all">All stores</option>
                  {storeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All items</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </section>
          </div>
        </div>

        <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Your items</h2>
              <p className="text-sm text-slate-500">
                {loading ? 'Refreshing list...' : `${items.length} item(s) visible`}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-lg font-medium text-slate-700">No items yet</p>
              <p className="mt-2 text-sm text-slate-500">
                Add your first product to start building your premium shopping list.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-slate-300"
                      checked={!!item.completed}
                      onChange={() => toggleCompleted(item.id, item.completed)}
                    />

                    <div>
                      <p
                        className={`text-lg font-medium ${
                          item.completed ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}
                      >
                        {item.name}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {formatCategory(item.category)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {formatStore(item.supermarket)}
                        </span>
                        {item.completed && (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteItem(item.id)}
                    className="rounded-2xl border border-red-200 px-4 py-2 font-medium text-red-500 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}