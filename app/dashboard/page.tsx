'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Apple,
  Beef,
  CircleHelp,
  Coffee,
  Droplets,
  Egg,
  GlassWater,
  Grape,
  Milk,
  Sandwich,
  Soup,
  Sparkles,
  SprayCan,
  Star,
  StarOff,
  Trash2,
  WashingMachine,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

type Item = {
  id: string
  name: string
  user_id?: string
  category?: string
  supermarket?: string
  quantity?: number
  completed?: boolean
  favorite?: boolean
  created_at?: string
}

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  message: string
  type: ToastType
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

const quantityOptions = Array.from({ length: 20 }, (_, i) => i + 1)

function formatStore(store?: string) {
  return storeOptions.find((s) => s.value === store)?.label || store || 'Store'
}

function formatCategory(category?: string) {
  return categoryOptions.find((c) => c.value === category)?.label || category || 'Category'
}

function getToastStyles(type: ToastType, isDark: boolean) {
  if (type === 'success') {
    return isDark
      ? 'border-emerald-800 bg-emerald-950 text-emerald-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (type === 'error') {
    return isDark
      ? 'border-red-800 bg-red-950 text-red-300'
      : 'border-red-200 bg-red-50 text-red-700'
  }

  return isDark
    ? 'border-slate-700 bg-slate-900 text-slate-200'
    : 'border-slate-200 bg-white text-slate-700'
}

function getProductIcon(name?: string, category?: string) {
  const text = name?.toLowerCase() || ''

  if (text.includes('milk')) return Milk
  if (text.includes('water')) return GlassWater
  if (text.includes('egg')) return Egg
  if (text.includes('apple')) return Apple
  if (text.includes('orange') || text.includes('grape') || text.includes('fruit')) return Grape
  if (text.includes('chicken') || text.includes('beef') || text.includes('meat')) return Beef
  if (text.includes('rice') || text.includes('pasta') || text.includes('noodle')) return Soup
  if (text.includes('cheese') || text.includes('ham') || text.includes('sandwich') || text.includes('bread')) return Sandwich
  if (text.includes('coffee') || text.includes('tea')) return Coffee
  if (text.includes('juice') || text.includes('cola') || text.includes('coke') || text.includes('soda')) return Droplets
  if (text.includes('soap') || text.includes('detergent') || text.includes('shampoo')) return Sparkles
  if (text.includes('bleach') || text.includes('spray')) return SprayCan
  if (text.includes('toilet paper') || text.includes('tissue') || text.includes('laundry')) return WashingMachine

  if (category === 'food') return Apple
  if (category === 'drinks') return Droplets
  if (category === 'cleaning') return Sparkles

  return CircleHelp
}

export default function Dashboard() {
  const router = useRouter()

  const [items, setItems] = useState<Item[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('food')
  const [store, setStore] = useState('tesco')
  const [quantity, setQuantity] = useState(1)

  const [filterStore, setFilterStore] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterFavorite, setFilterFavorite] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('food')
  const [editStore, setEditStore] = useState('tesco')
  const [editQuantity, setEditQuantity] = useState(1)

  const [toast, setToast] = useState<Toast | null>(null)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('avo-theme')
    if (savedTheme === 'dark') {
      setIsDark(true)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('avo-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type })

    setTimeout(() => {
      setToast(null)
    }, 2500)
  }

  const fetchItems = async () => {
    setLoading(true)

    let query = supabase.from('items').select('*')

    if (filterStore !== 'all') {
      query = query.eq('supermarket', filterStore)
    }

    if (filterStatus === 'pending') {
      query = query.eq('completed', false)
    }

    if (filterStatus === 'completed') {
      query = query.eq('completed', true)
    }

    if (filterCategory !== 'all') {
      query = query.eq('category', filterCategory)
    }

    if (filterFavorite === 'favorites') {
      query = query.eq('favorite', true)
    }

    const { data, error } = await query

    setLoading(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    setItems(data || [])
  }

  const addItem = async () => {
    if (!name.trim()) {
      showToast('Please enter an item name', 'info')
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      showToast('You must be logged in', 'error')
      return
    }

    const { error } = await supabase.from('items').insert({
      name,
      category,
      supermarket: store,
      quantity,
      completed: false,
      favorite: false,
      user_id: user.id,
    })

    if (error) {
      showToast(error.message, 'error')
      return
    }

    setName('')
    setQuantity(1)
    showToast('Item added successfully', 'success')
    fetchItems()
  }

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('items').delete().eq('id', id)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    if (editingId === id) {
      cancelEdit()
    }

    showToast('Item deleted', 'success')
    fetchItems()
  }

  const clearCompleted = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      showToast('You must be logged in', 'error')
      return
    }

    const completedCount = items.filter((item) => item.completed).length

    if (completedCount === 0) {
      showToast('There are no completed items to clear', 'info')
      return
    }

    const confirmed = window.confirm(`Delete ${completedCount} completed item(s)?`)
    if (!confirmed) return

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('user_id', user.id)
      .eq('completed', true)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    if (editingId) {
      const editedItem = items.find((item) => item.id === editingId)
      if (editedItem?.completed) {
        cancelEdit()
      }
    }

    showToast('Completed items cleared', 'success')
    fetchItems()
  }

  const toggleCompleted = async (id: string, currentValue: boolean | undefined) => {
    const { error } = await supabase
      .from('items')
      .update({ completed: !currentValue })
      .eq('id', id)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    showToast(!currentValue ? 'Item marked as completed' : 'Item marked as pending', 'success')
    fetchItems()
  }

  const toggleFavorite = async (id: string, currentValue: boolean | undefined) => {
    const { error } = await supabase
      .from('items')
      .update({ favorite: !currentValue })
      .eq('id', id)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    showToast(!currentValue ? 'Added to favorites' : 'Removed from favorites', 'success')
    fetchItems()
  }

  const updateQuantity = async (id: string, currentQuantity: number | undefined, change: number) => {
    const nextQuantity = Math.max(1, (currentQuantity || 1) + change)

    const { error } = await supabase
      .from('items')
      .update({ quantity: nextQuantity })
      .eq('id', id)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    fetchItems()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const startEdit = (item: Item) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditCategory(item.category || 'food')
    setEditStore(item.supermarket || 'tesco')
    setEditQuantity(item.quantity || 1)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditCategory('food')
    setEditStore('tesco')
    setEditQuantity(1)
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) {
      showToast('Item name cannot be empty', 'info')
      return
    }

    const { error } = await supabase
      .from('items')
      .update({
        name: editName,
        category: editCategory,
        supermarket: editStore,
        quantity: editQuantity,
      })
      .eq('id', id)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    cancelEdit()
    showToast('Item updated successfully', 'success')
    fetchItems()
  }

  useEffect(() => {
    fetchItems()
  }, [filterStore, filterStatus, filterCategory, filterFavorite])

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    let result = [...items]

    if (term) {
      result = result.filter((item) => {
        const itemName = item.name?.toLowerCase() || ''
        const itemCategory = formatCategory(item.category).toLowerCase()
        const itemStore = formatStore(item.supermarket).toLowerCase()

        return (
          itemName.includes(term) ||
          itemCategory.includes(term) ||
          itemStore.includes(term)
        )
      })
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      }

      if (sortBy === 'oldest') {
        return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
      }

      if (sortBy === 'az') {
        return (a.name || '').localeCompare(b.name || '')
      }

      if (sortBy === 'za') {
        return (b.name || '').localeCompare(a.name || '')
      }

      if (sortBy === 'quantity-high') {
        return (b.quantity || 1) - (a.quantity || 1)
      }

      if (sortBy === 'quantity-low') {
        return (a.quantity || 1) - (b.quantity || 1)
      }

      return 0
    })

    return result
  }, [items, searchTerm, sortBy])

  const stats = useMemo(() => {
    const total = filteredItems.length
    const completed = filteredItems.filter((item) => item.completed).length
    const pending = total - completed
    return { total, completed, pending }
  }, [filteredItems])

  const completedVisibleCount = filteredItems.filter((item) => item.completed).length

  const pageBg = isDark
    ? 'bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100'
    : 'bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-900'

  const glassCard = isDark
    ? 'border border-slate-800/80 bg-slate-900/80 shadow-[0_20px_70px_rgba(0,0,0,0.35)]'
    : 'border border-white/70 bg-white/80 shadow-[0_20px_70px_rgba(15,23,42,0.08)]'

  const panelCard = isDark
    ? 'border border-slate-800 bg-slate-950 text-slate-100'
    : 'border border-slate-200 bg-white text-slate-900'

  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputClass = isDark
    ? 'border-slate-700 bg-slate-900 text-slate-100 focus:border-slate-500 focus:bg-slate-950'
    : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-slate-400 focus:bg-white'

  const chipClass = isDark
    ? 'bg-slate-800 text-slate-300'
    : 'bg-slate-100 text-slate-600'

  return (
    <main className={`min-h-screen px-4 py-8 ${pageBg}`}>
      <div className="mx-auto max-w-5xl">
        {toast && (
          <div className="fixed right-4 top-4 z-50">
            <div
              className={`rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${getToastStyles(
                toast.type,
                isDark
              )}`}
            >
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        )}

        <div className="mb-4 flex justify-end gap-3">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              isDark
                ? 'border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
                : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>

          <button
            onClick={handleLogout}
            className="rounded-full bg-black px-4 py-2 text-sm text-white transition hover:opacity-90"
          >
            Logout
          </button>
        </div>

        <div className={`mb-8 overflow-hidden rounded-[28px] backdrop-blur ${glassCard}`}>
          <div className={`border-b px-6 py-6 md:px-8 ${isDark ? 'border-slate-800' : 'border-slate-200/70'}`}>
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.24em] ${mutedText}`}>
                  Premium grocery planner
                </p>
                <h1 className="text-4xl font-semibold tracking-tight">AVO Grocery List</h1>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  Organise your shopping by category, supermarket, quantity and status.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className={`rounded-2xl px-4 py-3 text-center shadow-sm ${panelCard}`}>
                  <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Visible</p>
                  <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
                </div>
                <div className={`rounded-2xl px-4 py-3 text-center shadow-sm ${panelCard}`}>
                  <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Pending</p>
                  <p className="mt-1 text-2xl font-semibold">{stats.pending}</p>
                </div>
                <div className={`rounded-2xl px-4 py-3 text-center shadow-sm ${panelCard}`}>
                  <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Done</p>
                  <p className="mt-1 text-2xl font-semibold">{stats.completed}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.2fr_0.8fr] md:px-8">
            <section className={`rounded-[24px] p-5 shadow-sm ${panelCard}`}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Add new item</h2>
                <p className={`text-sm ${mutedText}`}>
                  Build your list by item, category, store and quantity.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  className={`w-full rounded-2xl border px-4 py-3 text-base outline-none transition ${inputClass}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Add item"
                />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <select
                    className={`rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
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
                    className={`rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                  >
                    {storeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    className={`rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  >
                    {quantityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
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

            <section className={`rounded-[24px] p-5 shadow-sm ${panelCard}`}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <p className={`text-sm ${mutedText}`}>
                  Narrow the view by search, store, status, category, favorites and sorting.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search item, category or store"
                />

                <select
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
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
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All items</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
                  value={filterFavorite}
                  onChange={(e) => setFilterFavorite(e.target.value)}
                >
                  <option value="all">All items</option>
                  <option value="favorites">Favorites only</option>
                </select>

                <select
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Sort: Newest first</option>
                  <option value="oldest">Sort: Oldest first</option>
                  <option value="az">Sort: A to Z</option>
                  <option value="za">Sort: Z to A</option>
                  <option value="quantity-high">Sort: Quantity high to low</option>
                  <option value="quantity-low">Sort: Quantity low to high</option>
                </select>

                <button
                  onClick={clearCompleted}
                  className="w-full rounded-2xl border border-red-200 px-4 py-3 font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={completedVisibleCount === 0}
                >
                  Clear completed
                </button>
              </div>
            </section>
          </div>
        </div>

        <section className={`rounded-[28px] p-6 backdrop-blur md:p-8 ${glassCard}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Your items</h2>
              <p className={`text-sm ${mutedText}`}>
                {loading ? 'Refreshing list...' : `${filteredItems.length} item(s) visible`}
              </p>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className={`rounded-[24px] border border-dashed px-6 py-12 text-center ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-slate-50'}`}>
              <p className="text-lg font-medium">No matching items</p>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Try changing your search or filters, or add a new product.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {filteredItems.map((item) => {
                const ProductIcon = getProductIcon(item.name, item.category)

                return (
                  <li
                    key={item.id}
                    className={`rounded-[24px] px-5 py-4 shadow-sm transition hover:shadow-md ${panelCard}`}
                  >
                    {editingId === item.id ? (
                      <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <input
                            className={`rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Item name"
                          />

                          <select
                            className={`rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                          >
                            {categoryOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <select
                            className={`rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
                            value={editStore}
                            onChange={(e) => setEditStore(e.target.value)}
                          >
                            {storeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <select
                            className={`rounded-2xl border px-4 py-3 outline-none transition ${inputClass}`}
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(Number(e.target.value))}
                          >
                            {quantityOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="rounded-2xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className={`rounded-2xl border px-4 py-2 font-medium transition ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-900' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            className="mt-1 h-5 w-5 rounded border-slate-300"
                            checked={!!item.completed}
                            onChange={() => toggleCompleted(item.id, item.completed)}
                          />

                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                                isDark ? 'bg-slate-800' : 'bg-slate-100'
                              }`}
                            >
                              <ProductIcon className="h-6 w-6" />
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p
                                  className={`text-lg font-medium ${
                                    item.completed
                                      ? isDark
                                        ? 'text-slate-500 line-through'
                                        : 'text-slate-400 line-through'
                                      : ''
                                  }`}
                                >
                                  {item.name}
                                </p>

                                <button
                                  onClick={() => toggleFavorite(item.id, item.favorite)}
                                  className={`rounded-full px-2 py-1 text-sm transition ${
                                    item.favorite
                                      ? 'bg-amber-100 text-amber-700'
                                      : isDark
                                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                                >
                                  {item.favorite ? (
                                    <Star className="h-4 w-4 fill-current" />
                                  ) : (
                                    <StarOff className="h-4 w-4" />
                                  )}
                                </button>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${chipClass}`}>
                                  {formatCategory(item.category)}
                                </span>
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${chipClass}`}>
                                  {formatStore(item.supermarket)}
                                </span>

                                <div
                                  className={`flex items-center overflow-hidden rounded-full border ${
                                    isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-100'
                                  }`}
                                >
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity, -1)}
                                    className={`px-3 py-1 text-sm font-medium transition ${
                                      isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-200'
                                    }`}
                                  >
                                    -
                                  </button>
                                  <span
                                    className={`min-w-[32px] px-2 py-1 text-center text-xs font-medium ${
                                      isDark ? 'text-slate-200' : 'text-slate-700'
                                    }`}
                                  >
                                    {item.quantity || 1}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity, 1)}
                                    className={`px-3 py-1 text-sm font-medium transition ${
                                      isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-200'
                                    }`}
                                  >
                                    +
                                  </button>
                                </div>

                                {item.favorite && (
                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                                    Favorite
                                  </span>
                                )}

                                {item.completed && (
                                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                    Completed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => startEdit(item)}
                            className={`rounded-2xl border px-4 py-2 font-medium transition ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-900' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteItem(item.id)}
                            className="rounded-2xl border border-red-200 px-4 py-2 font-medium text-red-500 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}