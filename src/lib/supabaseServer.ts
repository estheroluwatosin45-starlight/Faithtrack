import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback to the new database if the env is empty or points to the old paused project
if (!supabaseUrl || supabaseUrl.includes('auheuggklowxtclgknjb') || supabaseUrl.includes('placeholder')) {
  supabaseUrl = 'https://fnrrycpziiksrobcncrb.supabase.co';
}
if (!supabaseAnonKey || supabaseAnonKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1aGV1Z2drbG93eHRjbGdrbmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NTYwMTksImV4cCI6MjA5NjQzMjAxOX0.jYy2_0NW25rCuJf5fy5E0U3QR4DyHzxYEGmQHjxyzUk') || supabaseAnonKey.includes('placeholder')) {
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucnJ5Y3B6aWlrc3JvYmNuY3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDgwNDQsImV4cCI6MjA5ODMyNDA0NH0.n-t6BuTUMMQX_SyFT3goZN98LBUfuKnsX837U_-KHf0';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
