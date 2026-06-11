// src/lib/supabase.ts
// Supabase client — gunakan createClient() di komponen client-side
// dan createServerClient() di Server Components / Route Handlers

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
