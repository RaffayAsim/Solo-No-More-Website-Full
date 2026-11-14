import { verifyAdminStatus } from "@/app/actions/admin";
import { getAdminBlogPostsAction } from "@/app/actions/blog";
import BlogAdminClient from "./BlogAdminClient";

export const revalidate = 0;

export default async function AdminBlogPage() {
  // Each admin page checks access itself — the layout guard is not re-run on every navigation.
  await verifyAdminStatus();
  const posts = await getAdminBlogPostsAction();
  return <BlogAdminClient initialPosts={posts} />;
}
