/**
 * Database client — Uses Laravel API wrapper exclusively.
 * No Supabase dependency in production.
 */
import { apiDb, db } from '@/lib/apiDb';

export { apiDb, db };

// Legacy default export
export default apiDb;
