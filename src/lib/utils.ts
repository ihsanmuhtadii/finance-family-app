// src/lib/utils.ts

// Format angka ke Rupiah: 1500000 → "Rp 1.500.000"
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format singkat: 1500000 → "Rp 1,5 jt" / 500000 → "Rp 500 rb"
export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} jt`
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`
  }
  return `Rp ${amount}`
}

// Format tanggal: "2026-06-09" → "9 Jun 2026"
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Format bulan: 6, 2026 → "Juni 2026"
export function formatMonth(month: number, year: number): string {
  return new Date(year, month - 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

// Nama bulan pendek: 6 → "Jun"
export function monthShort(month: number): string {
  return new Date(2026, month - 1).toLocaleDateString('id-ID', { month: 'short' })
}

// Bulan dan tahun sekarang
export function currentMonthYear(): { month: number; year: number } {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

// Hitung persentase dengan aman (hindari division by zero)
export function safePct(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// Warna berdasarkan persentase usage budget
export function budgetColor(pct: number): 'green' | 'amber' | 'red' {
  if (pct >= 100) return 'red'
  if (pct >= 85) return 'amber'
  return 'green'
}

// Singkat nama: "Ihsan Muhtadi" → "IH"
export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

// cn() — gabung className kondisional (mirip clsx tapi tanpa dependency)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
