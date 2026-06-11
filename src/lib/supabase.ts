import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aosfxqvmsxenenwukzrh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_I-CVEwKbsUxzYsCTaJ-dbA_ainWt6jL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

