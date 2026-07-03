import { createClient } from '@supabase/supabase-js';

import type { Database } from '../../types/database';

/**
 * Service-role Supabase client — server-side only (Trigger.dev workers).
 * The service-role key bypasses RLS and must never reach the app bundle:
 * this module is only reachable from src/trigger/, which is deployed by the
 * Trigger.dev CLI and excluded from the Expo entry graph.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminClient = ReturnType<typeof createAdminClient>;
