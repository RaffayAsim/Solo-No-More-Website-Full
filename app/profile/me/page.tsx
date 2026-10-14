import { redirect } from "next/navigation";
import { getSessionUserSecurely } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export default async function ProfileMePage() {
  const result = await getSessionUserSecurely();

  if ("error" in result) {
    redirect("/login");
  }

  // Redirect current user directly to their dashboard profile tab
  redirect("/dashboard/profile");
}
