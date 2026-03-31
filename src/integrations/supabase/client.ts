/**
 * Database client — Uses Laravel API wrapper exclusively.
 * No external Supabase dependency in production.
 */
import { apiDb, db } from '@/lib/apiDb';

// "supabase" kept as legacy alias so existing code compiles without mass-rename
const supabase = apiDb;

export { apiDb, db, supabase };
export default apiDb;
