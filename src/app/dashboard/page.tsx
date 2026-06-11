'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { formatRupiahShort, formatRupiah, currentMonthYear, formatMonth, budgetColor } from '@/lib/utils'
import type { BudgetSummary, Notification } from '@/types/database'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

export default function DashboardPage() {
  const supabase = createClient()
  const { month, year } = currentMonthYear()

  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary[]>([])
  const [recentTxns, setRecentTxns] = useState<any[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
  const dateTo = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const fetchIncomeSummary = useCallback(async () => {
    const { data } = await supabase
      .from('income')
      .select('amount')
      .gte('date', dateFrom)
      .lt('date', dateTo)
    setTotalIncome(data?.reduce((s, r) => s + Number(r.amount), 0) ?? 0)
  }, [])

  const fetchExpenseSummary = useCallback(async () => {
    const { data } = await supabase
      .from('expense')
      .select('amount')
      .gte('date', dateFrom)
      .lt('date', dateTo)
    setTotalExpense(data?.reduce((s, r) => s + Number(r.amount), 0) ?? 0)
  }, [])

  const fetchBudgetSummary = useCallback(async () => {
    const { data } = await supabase
      .from('budget_summary')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .order('planned_amount', { ascending: false })
    setBudgetSummary((data as BudgetSummary[]) ?? [])
  }, [])

  const fetchRecentTxns = useCallback(async () => {
    const [inc, exp] = await Promise.all([
      supabase.from('income').select('*, user:users(name), category:categories(name,icon)').order('date', { ascending: false }).limit(5),
      supabase.from('expense').select('*, user:users(name), category:categories(name,icon)').order('date', { ascending: false }).limit(5),
    ])
    const combined = [
      ...(inc.data ?? []).map((r: any) => ({ ...r, kind: 'income' })),
      ...(exp.data ?? []).map((r: any) => ({ ...r, kind: 'expense' })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)
    setRecentTxns(combined)
  }, [])

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5)
    setNotifications((data as Notification[]) ?? [])
  }, [])

  useEffect(() => {
    Promise.all([
      fetchIncomeSummary(),
      fetchExpenseSummary(),
      fetchBudgetSummary(),
      fetchRecentTxns(),
      fetchNotifications(),
    ]).then(() => setLoading(false))

    // Semua .on() dulu, baru .subscribe() di akhir
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'income' }, () => {
        fetchIncomeSummary()
        fetchRecentTxns()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense' }, () => {
        fetchExpenseSummary()
        fetchBudgetSummary()
        fetchRecentTxns()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const balance = totalIncome - totalExpense
  const totalBudget = budgetSummary.reduce((s, r) => s + r.planned_amount, 0)
  const budgetUsedPct = totalBudget > 0 ? Math.round((totalExpense / totalBudget) * 100) : 0

  const chartData = budgetSummary.map((b) => ({
    name: b.category_name.split(' ')[0],
    Budget: Math.round(b.planned_amount / 1000),
    Aktual: Math.round(b.actual_amount / 1000),
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">Memuat data...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{formatMonth(month, year)}</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {notifications.length} notifikasi belum dibaca
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Pemasukan', value: formatRupiahShort(totalIncome), color: 'text-emerald-600' },
          { label: 'Pengeluaran', value: formatRupiahShort(totalExpense), color: 'text-red-500' },
          { label: 'Budget terpakai', value: `${budgetUsedPct}%`, color: budgetUsedPct >= 100 ? 'text-red-500' : budgetUsedPct >= 85 ? 'text-amber-600' : 'text-gray-900' },
          { label: 'Saldo bersih', value: (balance >= 0 ? '+' : '') + formatRupiahShort(balance), color: balance >= 0 ? 'text-emerald-600' : 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-900">Budget vs aktual</p>
            <p className="text-xs text-gray-400">dalam ribuan (rb)</p>
          </div>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              Belum ada budget plan bulan ini
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={2} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: number) => [`Rp ${val} rb`, '']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Budget" fill="#e0e7ff" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Aktual" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm font-medium text-gray-900 mb-3">Per kategori</p>
          {budgetSummary.length === 0 ? (
            <p className="text-xs text-gray-400">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {budgetSummary.slice(0, 6).map((b) => {
                const pct = Math.min(Math.round(b.usage_pct ?? 0), 100)
                const color = budgetColor(b.usage_pct ?? 0)
                const barBg = color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-400' : 'bg-emerald-500'
                return (
                  <div key={b.budget_plan_id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-700 truncate max-w-[120px]">{b.category_name}</span>
                      <span className={`text-xs font-medium ${color === 'red' ? 'text-red-500' : color === 'amber' ? 'text-amber-600' : 'text-gray-500'}`}>
                        {Math.round(b.usage_pct ?? 0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barBg}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-sm font-medium text-gray-900 mb-3">Transaksi terbaru</p>
        {recentTxns.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada transaksi</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTxns.map((txn: any) => (
              <div key={`${txn.kind}-${txn.id}`} className="flex items-center gap-3 py-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${txn.kind === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                  {txn.kind === 'income' ? '↑' : '↓'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{txn.title}</p>
                  <p className="text-xs text-gray-400">{txn.user?.name} · {txn.date}</p>
                </div>
                <p className={`text-sm font-medium shrink-0 ${txn.kind === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {txn.kind === 'income' ? '+' : '-'}{formatRupiahShort(Number(txn.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}