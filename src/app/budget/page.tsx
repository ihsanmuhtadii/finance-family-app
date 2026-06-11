'use client'

// src/app/budget/page.tsx
// Halaman perencanaan budget — isi rencana awal bulan, lihat vs aktual

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-provider'
import { formatRupiah, formatRupiahShort, currentMonthYear, formatMonth, budgetColor } from '@/lib/utils'
import type { BudgetSummary, BudgetPlan, Category } from '@/types/database'

export default function BudgetPage() {
  const supabase = createClient()
  const { appUser } = useAuth()
  const [{ month, year }, setPeriod] = useState(currentMonthYear())

  const [summary, setSummary] = useState<BudgetSummary[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category_id: '', planned_amount: '', notes: '' })

  useEffect(() => { fetchData() }, [month, year])

  async function fetchData() {
    setLoading(true)
    const [sumRes, catRes] = await Promise.all([
      supabase.from('budget_summary').select('*').eq('month', month).eq('year', year).order('planned_amount', { ascending: false }),
      supabase.from('categories').select('*').eq('type', 'expense').order('name'),
    ])
    setSummary((sumRes.data as BudgetSummary[]) ?? [])
    setCategories((catRes.data as Category[]) ?? [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!appUser) return
    setSaving(true)

    await supabase.from('budget_plans').upsert({
      user_id: appUser.id,
      category_id: form.category_id,
      month,
      year,
      planned_amount: Number(form.planned_amount),
      notes: form.notes || null,
    }, { onConflict: 'category_id,month,year' })

    setForm({ category_id: '', planned_amount: '', notes: '' })
    setShowForm(false)
    setSaving(false)
    fetchData()
  }

  function prevMonth() {
    setPeriod(({ month, year }) => month === 1
      ? { month: 12, year: year - 1 }
      : { month: month - 1, year })
  }

  function nextMonth() {
    setPeriod(({ month, year }) => month === 12
      ? { month: 1, year: year + 1 }
      : { month: month + 1, year })
  }

  const totalPlan = summary.reduce((s, r) => s + r.planned_amount, 0)
  const totalActual = summary.reduce((s, r) => s + r.actual_amount, 0)
  const overBudgetCount = summary.filter((r) => (r.usage_pct ?? 0) >= 100).length

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Budget planning</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-sm text-gray-600 font-medium w-32 text-center">{formatMonth(month, year)}</span>
            <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah budget
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Total rencana</p>
          <p className="text-xl font-semibold text-gray-900">{formatRupiahShort(totalPlan)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Total aktual</p>
          <p className={`text-xl font-semibold ${totalActual > totalPlan ? 'text-red-500' : 'text-gray-900'}`}>
            {formatRupiahShort(totalActual)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Kategori over budget</p>
          <p className={`text-xl font-semibold ${overBudgetCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {overBudgetCount} kategori
          </p>
        </div>
      </div>

      {/* Form tambah */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Atur budget kategori</h2>
          <form onSubmit={handleSave} className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kategori</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rencana budget (Rp)</label>
              <input
                type="number"
                value={form.planned_amount}
                onChange={(e) => setForm({ ...form, planned_amount: e.target.value })}
                placeholder="3000000"
                required
                min={0}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Catatan (opsional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-3 flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget list */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Memuat data...</div>
        ) : summary.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400 mb-2">Belum ada budget plan untuk {formatMonth(month, year)}</p>
            <p className="text-xs text-gray-300">Klik "Tambah budget" untuk mulai merencanakan pengeluaran bulan ini</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {summary.map((b) => {
              const color = budgetColor(b.usage_pct ?? 0)
              const pct = Math.min(Math.round(b.usage_pct ?? 0), 100)
              const barColor = color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-400' : 'bg-emerald-500'
              const pctColor = color === 'red' ? 'text-red-500' : color === 'amber' ? 'text-amber-600' : 'text-emerald-600'
              const badgeBg = color === 'red' ? 'bg-red-50 text-red-600' : color === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'

              return (
                <div key={b.budget_plan_id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{b.category_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeBg}`}>
                        {Math.round(b.usage_pct ?? 0)}%
                      </span>
                      {(b.usage_pct ?? 0) >= 100 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                          Over budget!
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${color === 'red' ? 'text-red-500' : 'text-gray-900'}`}>
                        {formatRupiah(b.actual_amount)}
                      </span>
                      <span className="text-xs text-gray-400"> / {formatRupiah(b.planned_amount)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                    <span>Sisa: {formatRupiah(Math.max(b.difference, 0))}</span>
                    {b.difference < 0 && (
                      <span className="text-red-400">Lebih {formatRupiah(Math.abs(b.difference))}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
