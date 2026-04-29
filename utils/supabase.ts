import { createClient } from '@supabase/supabase-js';

// 修正後：末尾の /rest/v1/ を削除します
const supabaseUrl = 'https://esitpeeotffvdberhwqj.supabase.co'; 

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaXRwZWVvdGZmdmRiZXJod3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTczOTEsImV4cCI6MjA5Mjg5MzM5MX0.Veczz8oleDlHBbmQJPvFkzsv8EDnCvxCgqqazbL2J6g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);