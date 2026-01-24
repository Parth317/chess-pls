import { createClient } from '@supabase/supabase-js';

// Default to env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
    return !!supabaseUrl && !!supabaseAnonKey;
};

// safely create client (mock if missing to prevent crash)
export const supabase = isSupabaseConfigured()
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder'); // Dummy to prevent crash, requests will fail gracefully or be blocked by isConfigured checks

