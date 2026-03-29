import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 xl:mb-10 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#315efb] sm:text-sm">
              Smart Grocery Planner
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              AVO Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link
              href="/grocery"
              className="rounded-2xl border border-[#d8dfea] bg-white px-5 py-3 text-base font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5 sm:rounded-3xl sm:px-7 sm:py-4 sm:text-lg"
            >
              Grocery
            </Link>

            <Link
              href="/stores"
              className="rounded-2xl border border-[#d8dfea] bg-white px-5 py-3 text-base font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5 sm:rounded-3xl sm:px-7 sm:py-4 sm:text-lg"
            >
              Stores
            </Link>

            <Link
              href="/auto-consumption"
              className="rounded-2xl border border-[#d8dfea] bg-white px-5 py-3 text-base font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5 sm:rounded-3xl sm:px-7 sm:py-4 sm:text-lg"
            >
              Auto Consumption
            </Link>

            <form action={handleSignOut}>
              <button
                type="submit"
                className="rounded-2xl bg-[#071b52] px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0a246b] sm:rounded-3xl sm:px-7 sm:py-4 sm:text-lg"
              >
                Log out
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr] xl:gap-8">
          <div className="rounded-[24px] border border-[#d9dfeb] bg-white p-5 shadow-sm sm:rounded-[30px] sm:p-7 lg:rounded-[2.25rem] lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#315efb] sm:text-sm">
              Your shopping dashboard
            </p>

            <h2 className="mt-4 max-w-4xl text-3xl font-bold leading-tight text-[#0b1742] sm:mt-6 sm:text-4xl lg:text-5xl xl:text-6xl">
              Shop with clarity and premium organisation.
            </h2>

            <p className="mt-5 max-w-3xl text-base leading-7 text-[#5d6d92] sm:mt-7 sm:text-lg sm:leading-8 lg:text-xl lg:leading-10">
              Use your dashboard as a control centre, then manage your full list in Grocery,
              your supermarkets in Stores, and your smart stock tracking in Auto Consumption.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href="/grocery"
                className="rounded-2xl bg-[#071b52] px-6 py-4 text-center text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0a246b] sm:rounded-3xl sm:px-8 sm:py-5 sm:text-lg lg:text-xl"
              >
                Open Grocery List
              </Link>

              <Link
                href="/stores"
                className="rounded-2xl border border-[#d8dfea] bg-white px-6 py-4 text-center text-base font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5 sm:rounded-3xl sm:px-8 sm:py-5 sm:text-lg lg:text-xl"
              >
                Manage Stores
              </Link>

              <Link
                href="/auto-consumption"
                className="rounded-2xl border border-[#d8dfea] bg-white px-6 py-4 text-center text-base font-semibold text-[#0d1b4c] shadow-sm transition hover:-translate-y-0.5 sm:rounded-3xl sm:px-8 sm:py-5 sm:text-lg lg:text-xl"
              >
                Auto Consumption
              </Link>
            </div>

            <div className="mt-8 rounded-[22px] border border-[#d8dfea] bg-[#f6f8fc] p-5 sm:mt-10 sm:rounded-[28px] sm:p-6 lg:mt-12 lg:rounded-[2rem] lg:p-7">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-[#0b1742] sm:text-2xl">
                  Shopping Progress
                </h3>
                <span className="text-xl font-bold text-[#0b1742] sm:text-2xl">
                  {progress}%
                </span>
              </div>

              <div className="mt-5 h-4 w-full overflow-hidden rounded-full bg-[#dde4f0] sm:mt-6 sm:h-5">
                <div
                  className="h-full rounded-full bg-[#071b52] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-5 text-base text-[#5d6d92] sm:mt-6 sm:text-lg lg:text-xl">
                {completedItems} of {totalItems} items completed
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#d9dfeb] bg-white p-5 shadow-sm sm:rounded-[30px] sm:p-7 lg:rounded-[2.25rem] lg:p-8">
            <div className="rounded-[22px] bg-gradient-to-br from-[#03123d] to-[#0b1f57] p-5 text-white sm:rounded-[28px] sm:p-7 lg:rounded-[2rem] lg:p-8">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Live Overview
              </h2>

              <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
                <div className="rounded-[20px] bg-white/14 px-5 py-5 text-lg font-medium sm:px-6 sm:py-6 sm:text-xl lg:text-2xl">
                  {totalItems} total items
                </div>

                <div className="rounded-[20px] bg-white/14 px-5 py-5 text-lg font-medium sm:px-6 sm:py-6 sm:text-xl lg:text-2xl">
                  {pendingItems} items pending
                </div>

                <div className="rounded-[20px] bg-white/14 px-5 py-5 text-lg font-medium sm:px-6 sm:py-6 sm:text-xl lg:text-2xl">
                  {completedItems} items completed
                </div>

                <div className="rounded-[20px] bg-white/14 px-5 py-5 text-lg font-medium sm:px-6 sm:py-6 sm:text-xl lg:text-2xl">
                  {totalStores} saved stores
                </div>

                <div className="rounded-[20px] bg-white/14 px-5 py-5 text-lg font-medium sm:px-6 sm:py-6 sm:text-xl lg:text-2xl">
                  {totalAutoConsumptionItems} auto consumption items
                </div>

                <div className="rounded-[20px] bg-white/14 px-5 py-5 text-lg font-medium sm:px-6 sm:py-6 sm:text-xl lg:text-2xl">
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