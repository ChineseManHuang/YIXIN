// env keys renamed: SUPABASE_* -> SB_*, VITE_SUPABASE_* -> VITE_SB_*
import { createClient } from '@supabase/supabase-js'

if (!import.meta.env.VITE_SB_URL || !import.meta.env.VITE_SB_ANON_KEY) {
  throw new Error('Missing VITE_SB_URL or VITE_SB_ANON_KEY. Check frontend env injection.')
}

if (import.meta.env.DEV) {
  console.log('[env] import.meta.env snapshot', {
    MODE: import.meta.env.MODE,
    VITE_SB_URL: import.meta.env.VITE_SB_URL,
    VITE_SB_ANON_KEY_PRESENT: Boolean(import.meta.env.VITE_SB_ANON_KEY),
  })
}

export const supabase = createClient(
  import.meta.env.VITE_SB_URL!,
  import.meta.env.VITE_SB_ANON_KEY!
)
