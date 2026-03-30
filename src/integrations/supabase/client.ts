/**
 * Supabase-compatible client
 * 
 * - Lovable preview → real Supabase client (uses Supabase database)
 * - cPanel / local → Laravel API wrapper (uses MySQL database)
 */
import { IS_LOVABLE } from '@/lib/environment';
import { apiDb } from '@/lib/apiDb';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Real Supabase client for Lovable preview
const supabaseReal = (IS_LOVABLE && SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Export: real Supabase on Lovable, Laravel wrapper everywhere else
export const supabase: any = supabaseReal || apiDb;
