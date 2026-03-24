import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
}

/**
 * Server-side Supabase client using the service role key.
 * Bypasses RLS — use only in API routes and server components.
 */
export const db = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
