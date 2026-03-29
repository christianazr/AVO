import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type GroceryItem = {
  id: string
  completed: boolean
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [groceryRes, storesRes, autoRes] = await Promise.all([
    supabase.from('grocery_items').select('id, completed', { count: 'exact' }),
    supabase.from('stores').select('id', { count: 'exact' }),
    supabase.from('auto_consumption_items').select('id', { count: 'exact' }),
  ])

  const groceryItems = (groceryRes.data ?? []) as GroceryItem[]
  const totalItems = groceryRes.count ?? 0
  const completedItems = groceryItems.filter((item: GroceryItem) => item.completed).length
  const pendingItems = totalItems - completedItems
  const totalStores = storesRes.count ?? 0
  const totalAutoConsumptionItems = autoRes.count ?? 0

  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  async function handleSignOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#edf1f7] text-[#0d1b4c]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <header className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#315efb]">
              Smart Grocery Planner
            </p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight sm:text-6xl">
              AVO Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/grocery-list"
              className="rounded-3xl border border-[#d8dfea] bg-white px-7 py-4 text-lg font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5"
            >
              Grocery
            </Link>

            <Link
              href="/stores"
              className="rounded-3xl border border-[#d8dfea] bg-white px-7 py-4 text-lg font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5"
            >
              Stores
            </Link>

            <Link
              href="/auto-consumption"
              className="rounded-3xl border border-[#d8dfea] bg-white px-7 py-4 text-lg font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5"
            >
              Auto Consumption
            </Link>

            <form action={handleSignOut}>
              <button
                type="submit"
                className="rounded-3xl bg-[#071b52] px-7 py-4 text-lg font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0a246b]"
              >
                Log out
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-8 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="rounded-[2.25rem] border border-[#d9dfeb] bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#315efb]">
              Your shopping dashboard
            </p>

            <h2 className="mt-6 max-w-4xl text-4xl font-bold leading-tight text-[#0b1742] sm:text-5xl lg:text-6xl">
              Shop with clarity and premium organisation.
            </h2>

            <p className="mt-8 max-w-3xl text-xl leading-10 text-[#5d6d92]">
              Use your dashboard as a control centre, then manage your full list in Grocery,
              your supermarkets in Stores, and your smart stock tracking in Auto Consumption.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/grocery-list"
                className="rounded-3xl bg-[#071b52] px-8 py-5 text-xl font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0a246b]"
              >
                Open Grocery List
              </Link>

              <Link
                href="/stores"
                className="rounded-3xl border border-[#d8dfea] bg-white px-8 py-5 text-xl font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5"
              >
                Manage Stores
              </Link>

              <Link
                href="/auto-consumption"
                className="rounded-3xl border border-[#d8dfea] bg-white px-8 py-5 text-xl font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5"
              >
                Auto Consumption
              </Link>
            </div>

            <div className="mt-12 rounded-[2rem] border border-[#d8dfea] bg-[#f6f8fc] p-7">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-2xl font-bold text-[#0b1742]">Shopping Progress</h3>
                <span className="text-2xl font-bold text-[#0b1742]">{progress}%</span>
              </div>

              <div className="mt-6 h-5 w-full overflow-hidden rounded-full bg-[#dde4f0]">
                <div
                  className="h-full rounded-full bg-[#071b52] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-6 text-xl text-[#5d6d92]">
                {completedItems} of {totalItems} items completed
              </p>
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-[#d9dfeb] bg-white p-8 shadow-sm">
            <div className="rounded-[2rem] bg-gradient-to-br from-[#03123d] to-[#0b1f57] p-8 text-white">
              <h2 className="text-5xl font-bold tracking-tight">Live Overview</h2>

              <div className="mt-8 space-y-5">
                <div className="rounded-[1.4rem] bg-white/14 px-6 py-6 text-2xl font-medium">
                  {totalItems} total items
                </div>

                <div className="rounded-[1.4rem] bg-white/14 px-6 py-6 text-2xl font-medium">
                  {pendingItems} items pending
                </div>

                <div className="rounded-[1.4rem] bg-white/14 px-6 py-6 text-2xl font-medium">
                  {completedItems} items completed
                </div>

                <div className="rounded-[1.4rem] bg-white/14 px-6 py-6 text-2xl font-medium">
                  {totalStores} saved stores
                </div>

                <div className="rounded-[1.4rem] bg-white/14 px-6 py-6 text-2xl font-medium">
                  {totalAutoConsumptionItems} auto consumption items
                </div>

                <div className="rounded-[1.4rem] bg-white/14 px-6 py-6 text-2xl font-medium">
                  {progress}% shopping progress
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}