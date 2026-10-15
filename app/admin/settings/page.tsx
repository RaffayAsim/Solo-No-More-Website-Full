import { verifyAdminStatus } from "@/app/actions/admin";
import AdminSettingsClient from "./AdminSettingsClient";
import {
  getTeamDelegationsAction,
  getAllPlatformUsersForAdminAction,
} from "@/app/actions/team-permissions";

export const revalidate = 0;

export const metadata = {
  title: "Access & Settings — Solo-No-More Admin",
  description: "Configure Sub-Admin delegated security scopes and team members.",
};

export default async function AdminSettingsPage() {
  const admin = await verifyAdminStatus();
  const [subAdmins, platformUsers] = await Promise.all([
    getTeamDelegationsAction({ type: "sub_admin" }),
    getAllPlatformUsersForAdminAction(),
  ]);

  return (
    <AdminSettingsClient
      initialSubAdmins={subAdmins}
      platformUsers={platformUsers}
      currentAdminEmail={admin.email || "admin@solonomore.com"}
    />
  );
}
