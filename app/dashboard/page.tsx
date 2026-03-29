'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

import {
  Apple,
  Beef,
  Milk,
  ShoppingCart,
  Coffee,
  Fish,
  Candy,
  Sandwich,
  Egg,
  Star,
} from 'lucide-react'

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

export default function Dashboard() {
  const router = useRouter()

  const [items, setItems] = useState<Item[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('food')
  const [store, setStore] = useState('tesco')
  const [quantity, setQuantity] = useState(1)

  const [search, setSearch] = useState('')
  const [filterStore, setFilterStore] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // 🔐 SESSION PROTECTION
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.push('/login')
        return
      }

      fetchItems()
    }

    checkSession()
  }, [router])

  // FETCH ITEMS
  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setItems(data || [])
  }

  // ADD ITEM
  const addItem = async () => {
    if (!name.trim()) return

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      alert('You must be logged in')
      return
    }

    await supabase.from('items').insert({
      name,
      category,
      supermarket: store,
      quantity,
      user_id: user.id,
    })

    setName('')
    setQuantity(1)
    fetchItems()
  }

  // DELETE
  const deleteItem = async (id: string) => {
    await supabase.from('items').delete().eq('id', id)
    fetchItems()
  }

  // TOGGLE COMPLETE
  const toggleComplete = async (item: Item) => {
    await supabase
      .from('items')
      .update({ completed: !item.completed })
      .eq('id', item.id)

    fetchItems()
  }

  // TOGGLE FAVORITE
  const toggleFavorite = async (item: Item) => {
    await supabase
      .from('items')
      .update({ favorite: !item.favorite })
      .eq('id', item.id)

    fetchItems()
  }

  // QUANTITY + -
  const updateQuantity = async (item: Item, value: number) => {
    if (value < 1) return

    await supabase
      .from('items')
      .update({ quantity: value })
      .eq('id', item.id)

    fetchItems()
  }

  // CLEAR COMPLETED
  const clearCompleted = async () => {
    await supabase.from('items').delete().eq('completed', true)
    fetchItems()
  }

  // LOGOUT
  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ICONS
  const getIcon = (item: Item) => {
    const name = item.name.toLowerCase()

    if (name.includes('milk')) return <Milk size={20} />
    if (name.includes('apple')) return <Apple size={20} />
    if (name.includes('beef')) return <Beef size={20} />
    if (name.includes('fish')) return <Fish size={20} />
    if (name.includes('coffee')) return <Coffee size={20} />
    if (name.includes('egg')) return <Egg size={20} />
    if (name.includes('bread')) return <Sandwich size={20} />
    if (name.includes('candy')) return <Candy size={20} />

    return <ShoppingCart size={20} />
  }

  // FILTER + SEARCH
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase()))
        return false

      if (filterStore !== 'all' && item.supermarket !== filterStore)
        return false

      if (filterCategory !== 'all' && item.category !== filterCategory)
        return false

      if (filterStatus === 'done' && !item.completed) return false
      if (filterStatus === 'pending' && item.completed) return false

      return true
    })
  }, [items, search, filterStore, filterCategory, filterStatus])

  const total = items.length
  const done = items.filter((i) => i.completed).length
  const pending = total - done

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-semibold">AVO Grocery List</h1>

          <button
            onClick={logout}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-red-50 text-red-600"
          >
            Logout
          </button>
        </div>

        {/* STATS */}
        <div className="flex gap-4 mb-6">
          <div>Total: {total}</div>
          <div>Pending: {pending}</div>
          <div>Done: {done}</div>
        </div>

        {/* ADD ITEM */}
        <div className="mb-6 space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Add item"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded-lg px-2 py-2"
            >
              <option value="food">Food</option>
              <option value="drinks">Drinks</option>
              <option value="cleaning">Cleaning</option>
            </select>

            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="border rounded-lg px-2 py-2"
            >
              <option value="tesco">Tesco</option>
              <option value="lidl">Lidl</option>
              <option value="costco">Costco</option>
              <option value="morrisons">Morrisons</option>
              <option value="sainsburys">Sainsbury's</option>
              <option value="iceland">Iceland</option>
            </select>

            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="border rounded-lg px-2 py-2"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <button
              onClick={addItem}
              className="bg-black text-white px-4 py-2 rounded-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <input
          className="mb-4 w-full border rounded-lg px-3 py-2"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* FILTERS */}
        <div className="flex gap-3 mb-6">
          <select onChange={(e)=>setFilterStore(e.target.value)}>
            <option value="all">All stores</option>
            <option value="tesco">Tesco</option>
            <option value="lidl">Lidl</option>
            <option value="costco">Costco</option>
          </select>

          <select onChange={(e)=>setFilterCategory(e.target.value)}>
            <option value="all">All categories</option>
            <option value="food">Food</option>
            <option value="drinks">Drinks</option>
          </select>

          <select onChange={(e)=>setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="done">Done</option>
          </select>

          <button onClick={clearCompleted} className="text-red-500">
            Clear completed
          </button>
        </div>

        {/* LIST */}
        <ul className="space-y-3">
          {filteredItems.map((item) => (
            <li key={item.id} className="border rounded-lg p-3 flex justify-between items-center">

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!item.completed}
                  onChange={() => toggleComplete(item)}
                />

                {getIcon(item)}

                <div>
                  <p className={item.completed ? 'line-through text-gray-400' : ''}>
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.category} • {item.supermarket}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* QUANTITY */}
                <button onClick={()=>updateQuantity(item,(item.quantity||1)-1)}>-</button>
                <span>{item.quantity || 1}</span>
                <button onClick={()=>updateQuantity(item,(item.quantity||1)+1)}>+</button>

                {/* FAVORITE */}
                <button onClick={()=>toggleFavorite(item)}>
                  <Star size={18} className={item.favorite ? 'text-yellow-400' : ''} />
                </button>

                <button onClick={() => deleteItem(item.id)} className="text-red-500">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}