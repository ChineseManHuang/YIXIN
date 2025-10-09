// Supabase browser client bootstrap
import { createClient } from '@supabase/supabase-js'

const ensureEnv = (value: string | undefined, key: string): string => {
  if (!value || value.trim() === '') {
    throw new Error('Missing ' + key + '. Check frontend env injection.')
  }
  return value.trim()
}

const supabaseUrl = ensureEnv(import.meta.env.VITE_SB_URL, 'VITE_SB_URL')
const supabaseAnonKey = ensureEnv(import.meta.env.VITE_SB_ANON_KEY, 'VITE_SB_ANON_KEY')

if (import.meta.env.DEV) {
  console.log('[env] import.meta.env snapshot', {
    MODE: import.meta.env.MODE,
    has_VITE_SB_URL: Boolean(import.meta.env.VITE_SB_URL),
    VITE_SB_URL_FIRST40: supabaseUrl.slice(0, 40),
    VITE_SB_ANON_KEY_LENGTH: supabaseAnonKey.length,
  })
}

export const supabase = createClient(
  import.meta.env.VITE_SB_URL!,
  import.meta.env.VITE_SB_ANON_KEY!,
)
