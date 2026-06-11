'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-provider'
import { initials } from '@/lib/utils'
import type { User } from '@/types/database'

export default function SettingsPage() {
  const supabase = createClient()
  const { appUser } = useAuth()

  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'spouse' as 'owner' | 'spouse',
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    const { data } = await supabase.from('users').select('*').order('created_at')
    setMembers((data as User[]) ?? [])
    setLoading(false)
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/create-user`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }
    )

    const json = await res.json()

    if (!res.ok || json.error) {
      setError(json.error ?? 'Gagal menambah anggota')
    } else {
      setSuccess(`${form.name} berhasil ditambahkan!`)
      setForm({ name: '', email: '', password: '', role: 'spouse' })
      setShowForm(false)
      fetchMembers()
    }

    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus ${name} dari keluarga?`)) return
    if (id === appUser?.id) {
      alert('Tidak bisa menghapus akun sendiri.')
      return
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/create-user`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }
    )

    if (res.ok) fetchMembers()
  }

  const roleLabel = (role: string) => role === 'owner' ? 'Owner' : role === 'spouse' ? 'Pasangan' : 'Anak'
  const roleBadge = (role: string) => role === 'owner'
    ? 'bg-indigo-50 text-indigo-700'
    : role === 'spouse'
    ? 'bg-pink-50 text-pink-700'
    : 'bg-amber-50 text-amber-700'

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Anggota keluarga</h1>
          <p className="text-sm text-gray-500">Kelola akses anggota keluarga</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); setSuccess(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah anggota
        </button>
      </div>

      {/* Notifikasi */}
      {success && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form tambah */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Anggota baru</h2>
          <form onSubmit={handleAddMember} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nama lengkap</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="cth: Siti Muhtadi"
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="spouse">Pasangan</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@contoh.com"
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 karakter"
                required
                minLength={6}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2 flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {saving ? 'Menyimpan...' : 'Tambah anggota'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Daftar anggota */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Memuat data...</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700 shrink-0">
                  {initials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge(member.role)}`}>
                      {roleLabel(member.role)}
                    </span>
                    {member.id === appUser?.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Anda</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Bergabung {new Date(member.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {member.id !== appUser?.id && (
                  <button
                    onClick={() => handleDelete(member.id, member.name)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                    title="Hapus anggota"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}