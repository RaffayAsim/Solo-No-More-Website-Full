/**
 * Supabase library barrel export.
 *
 * Usage:
 *   Client Components / browser:  import { supabase } from "@/lib/supabase"
 *   Server Actions / Route handlers: import { supabaseAdmin } from "@/lib/supabase"
 *   Types: import type { Database, Profile } from "@/lib/supabase"
 */
export { supabase } from "./client";
export { supabaseAdmin } from "./admin";
export type { Database, Profile, SubscriptionTier, AccountStatus } from "./types";
