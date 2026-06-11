'use client'

// src/app/pemasukan/page.tsx
// Halaman pencatatan pemasukan — struktur sama dengan pengeluaran

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-provider'
import { formatRupiah, formatDate } from '@/lib/utils'
import type { Income, Category } from '@/types/database'

export default function PemasukanPage() {
  const supabase = createClient()
  const { appUser } = useAuth()

  const [incomes, setIncomes] = useState<Income[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
  fetchData()
  const channel = supabase
    .channel('income-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'income' }, () => fetchData())
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [])

  async function fetchData() {
    const [incRes, catRes] = await Promise.all([
      supabase.from('income').select('*, user:users(name), category:categories(name)').order('date', { ascending: false }).limit(50),
      supabase.from('categories').select('*').eq('type', 'income').order('name'),
    ])
    setIncomes((incRes.data as Income[]) ?? [])
    setCategories((catRes.data as Category[]) ?? [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!appUser) return
    setSaving(true)
    await supabase.from('income').insert({
      user_id: appUser.id,
      title: form.title,
      amount: Number(form.amount),
      category_id: form.category_id || null,
      date: form.date,
      notes: form.notes || null,
    })
    setForm({ title: '', amount: '', category_id: '', date: new Date().toISOString().split('T')[0], notes: '' })
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus pemasukan ini?')) return
    await supabase.from('income').delete().eq('id', id)
  }

  const totalThisMonth = incomes
    .filter((e) => { const d = new Date(e.date); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
    .reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Pemasukan</h1>
          <p className="text-sm text-gray-500">Bulan ini: <span className="font-medium text-emerald-600">{formatRupiah(totalThisMonth)}</span></p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Catat pemasukan
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Pemasukan baru</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Keterangan</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="cth: Gaji Juni 2026" required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jumlah (Rp)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="5000000" required min={1} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tanggal</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kategori</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Pilih kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Catatan (opsional)</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2 flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-sm text-gray-400">Memuat data...</div>
        : incomes.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">Belum ada pemasukan tercatat</div>
        : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Keterangan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Kategori</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Dicatat oleh</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Jumlah</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {incomes.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 text-gray-900">{e.title}</td>
                  <td className="px-4 py-3">{e.category ? <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{e.category.name}</span> : <span className="text-gray-300 text-xs">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500">{e.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">+{formatRupiah(Number(e.amount))}</td>
                  <td className="px-4 py-3 text-right">
                    {e.user_id === appUser?.id && (
                      <button onClick={() => handleDelete(e.id)} className="text-gray-300 hover:text-red-400 transition-colors" title="Hapus">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
