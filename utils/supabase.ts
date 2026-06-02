import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ↓ この 「export」 という言葉がとても重要です！
export const supabase = createClient(supabaseUrl, supabaseAnonKey);