const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;

if (supabaseUrl && supabaseServiceRoleKey && supabaseUrl !== 'https://your-project-id.supabase.co') {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('[Supabase] Server admin client initialized successfully.');
} else {
  console.warn('[Supabase] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured in backend environment. Server running in disconnected mode.');
}

module.exports = {
  supabaseAdmin,
  isSupabaseConfigured: () => !!supabaseAdmin
};
