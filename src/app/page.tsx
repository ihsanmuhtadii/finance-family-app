// src/app/page.tsx
// Root redirect — middleware sudah handle, ini sebagai fallback

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
