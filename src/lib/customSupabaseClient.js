import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nghovziwtjjzcocuccvb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5naG92eml3dGpqemNvY3VjY3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTczMDEsImV4cCI6MjA4Mjg3MzMwMX0.fyT8XKEiLH7gyNycAdjdV50BUgMR18Qm_leHllXIPu0';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
