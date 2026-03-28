'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async () => {
    if (!email || !password) {
      alert('Please complete email and password')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    if (data.user && !data.session) {
      alert('Account created. Please confirm your email before logging in.')
      router.push('/login')
      return
    }

    alert('Account created successfully')
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center">
        <div className="grid w-full gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-white/70 bg-white/80 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Start your setup
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">Create your AVO account</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
              Build a premium shopping workflow with categories, store filters and progress tracking, all in one elegant list manager.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-sm font-medium text-slate-800">Organise by supermarket</p>
                <p className="mt-1 text-sm text-slate-500">
                  Tesco, Lidl, Aldi, Costco, Morrisons, Sainsbury&apos;s and Iceland.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-sm font-medium text-slate-800">Track your shopping progress</p>
                <p className="mt-1 text-sm text-slate-500">
                  Mark items as completed and keep your list clean and easy to follow.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white/80 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">Register</h2>
              <p className="mt-2 text-sm text-slate-500">
                Create your account to start using AVO.
              </p>
            </div>

            <div className="space-y-4">
              <input
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-slate-400 focus:bg-white"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-slate-400 focus:bg-white"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-slate-900 underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}