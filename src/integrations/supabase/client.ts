/**
 * Database client — Dual-mode: Supabase SDK for Lovable preview, Laravel API for production.
 */
import { IS_LOVABLE } from '@/lib/environment';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { apiDb as laravelApiDb } from '@/lib/apiDb';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://udxrzqpivtzunnfenmyd.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeHJ6cXBpdnR6dW5uZmVubXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjM3OTAsImV4cCI6MjA4ODUzOTc5MH0.cqupkjIjdIcF-g_WDBtmKpSXqMoL09TVPtWsV5XY0ps";

// In Lovable preview: use real Supabase SDK
// In production (cPanel/local): use Laravel API wrapper
const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

const db: any = IS_LOVABLE ? supabaseClient : laravelApiDb;
const supabase: any = IS_LOVABLE ? supabaseClient : laravelApiDb;
const apiDb: any = IS_LOVABLE ? supabaseClient : laravelApiDb;

// Export the real Supabase client separately for edge function calls in Lovable mode
export const supabaseDirect = supabaseClient;

export { apiDb, db, supabase };
export default apiDb;
