import "server-only";

/**
 * Server-only store for delegated team managers (sub-admins, artist managers,
 * partner managers). Persisted in the `platform_settings` table under the
 * `team_delegations` key so it works on serverless hosting.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ManagerType = "sub_admin" | "artist_manager" | "partner_manager";

export interface DelegatedManager {
  id: string;
  type: ManagerType;
  delegator_id: string; // The parent Admin, Artist, or Partner ID
  delegator_name: string;
  manager_user_id: string;
  manager_name: string;
  manager_email: string;
  manager_phone?: string;
  permissions: string[]; // Granular scope keys
  status: "active" | "suspended";
  created_at: string;
  updated_at: string;
}

const SETTINGS_KEY = "team_delegations";

export async function readDelegations(): Promise<DelegatedManager[]> {
  try {
    const { data, error } = await (supabaseAdmin.from("platform_settings") as any)
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    if (error) return [];
    return Array.isArray(data?.value) ? (data.value as DelegatedManager[]) : [];
  } catch {
    return [];
  }
}

export async function writeDelegations(
  records: DelegatedManager[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabaseAdmin.from("platform_settings") as any).upsert({
      key: SETTINGS_KEY,
      value: records,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      return {
        success: false,
        error:
          "Could not save team settings. Make sure the latest Supabase migration (phase18) has been run.",
      };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Could not save team settings." };
  }
}
