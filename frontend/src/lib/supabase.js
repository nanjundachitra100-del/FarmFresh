import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co') {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  } catch (error) {
    console.warn('[Supabase Client] Failed to initialize Supabase client:', error);
  }
}

export const supabase = supabaseClient;
export const isSupabaseAvailable = () => Boolean(supabaseClient);
