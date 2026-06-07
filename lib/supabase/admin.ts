import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "Warning: Missing Supabase service role environment variables. If this is a build server, remember to set them in your dashboard."
  );
}

/**
 * Server-side only Supabase admin client (uses service role key).
 * NEVER import this in Client Components — it bypasses RLS.
 * Use only in Server Actions, Route Handlers, or server-side utilities.
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
