"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, FileText, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import type { BlogPost } from "@/lib/server/blog";
import { saveBlogPostAction, deleteBlogPostAction, type BlogPostInput } from "@/app/actions/blog";
import { compressImageFile } from "@/lib/image-compress";
import { renderBlogBody } from "@/lib/blog-format";

const EMPTY: BlogPostInput = { title: "", slug: "", excerpt: "", body: "", coverImage: null, city: null, tags: [], author: "Solo-No-More Team", published: false };

const slugify = (v: string) =>
  v.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" }) : "—";

export default function BlogAdminClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [editing, setEditing] = useState<{ original?: string; data: BlogPostInput } | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const d = editing?.data;
  const set = (patch: Partial<BlogPostInput>) => setEditing((e) => (e ? { ...e, data: { ...e.data, ...patch } } : e));

  const startNew = () => {
    setEditing({ data: { ...EMPTY } });
    setSlugTouched(false);
    setPreview(false);
    setMessage(null);
  };
  const startEdit = (p: BlogPost) => {
    setEditing({
      original: p.slug,
      data: { title: p.title, slug: p.slug, excerpt: p.excerpt, body: p.body, coverImage: p.coverImage, city: p.city, tags: p.tags, author: p.author, published: p.published },
    });
    setSlugTouched(true);
    setPreview(false);
    setMessage(null);
  };

  const onCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      set({ coverImage: await compressImageFile(file, { maxDimension: 1600, maxBytes: 500 * 1024 }) });
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message || "Could not use that image." });
    }
  };

  const save = async (published: boolean) => {
    if (!editing) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await saveBlogPostAction({ ...editing.data, published }, editing.original);
      if (!res.success) {
        setMessage({ ok: false, text: res.error });
        return;
      }
      setMessage({ ok: true, text: published ? `Published — live at /blog/${res.slug}` : "Saved as draft (not visible on the website)." });
      setEditing(null);
      router.refresh();
      // optimistic list refresh
      setPosts((prev) => {
        const others = prev.filter((p) => p.slug !== editing.original && p.slug !== res.slug);
        const now = new Date().toISOString();
        const prevPost = prev.find((p) => p.slug === editing.original);
        return [
          {
            ...(editing.data as any),
            slug: res.slug,
            coverImage: editing.data.coverImage && !editing.data.coverImage.startsWith("data:") ? editing.data.coverImage : prevPost?.coverImage || null,
            published,
            publishedAt: published ? prevPost?.publishedAt || now : prevPost?.publishedAt || null,
            updatedAt: now,
            tags: editing.data.tags || [],
            author: editing.data.author || "Solo-No-More Team",
            city: editing.data.city || null,
          } as BlogPost,
          ...others,
        ];
      });
    } catch {
      setMessage({ ok: false, text: "Could not reach the server. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (slug: string) => {
    setBusy(true);
    const res = await deleteBlogPostAction(slug);
    setBusy(false);
    setConfirmDelete(null);
    if (res.success) {
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
      setMessage({ ok: true, text: "Post deleted." });
    } else setMessage({ ok: false, text: res.error || "Could not delete." });
  };

  const words = useMemo(() => (d?.body || "").split(/\s+/).filter(Boolean).length, [d?.body]);
  const input = "w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6F26]";
  const label = "block text-xs font-bold text-neutral-300 mb-1.5";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF6F26]/10 text-[#FF6F26] border border-[#FF6F26]/20 mb-2">
            <FileText className="w-3.5 h-3.5" /> BLOG &amp; SEO
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Blog posts</h1>
          <p className="text-sm text-neutral-400 max-w-xl mt-1">
            Articles appear at solonomore.online/blog, are added to the sitemap automatically and help people find you on Google.
          </p>
        </div>
        {!editing && (
          <button type="button" onClick={startNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white">
            <Plus className="w-4 h-4" /> New post
          </button>
        )}
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl text-sm border ${message.ok ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300" : "bg-red-500/10 border-red-500/25 text-red-300"}`}>{message.text}</div>
      )}

      {editing && d ? (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{editing.original ? "Edit post" : "New post"}</h2>
            <button type="button" onClick={() => setEditing(null)} aria-label="Close editor" className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={label} htmlFor="b-title">Title *</label>
              <input id="b-title" className={input} value={d.title} maxLength={140} onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} placeholder="e.g. 10 First-Hangout Ideas in Lahore" />
            </div>
            <div>
              <label className={label} htmlFor="b-slug">Web address</label>
              <div className="flex items-center gap-1 text-sm text-neutral-500">
                <span className="shrink-0">/blog/</span>
                <input id="b-slug" className={input} value={d.slug || ""} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }} />
              </div>
            </div>
            <div>
              <label className={label} htmlFor="b-city">City (optional)</label>
              <select id="b-city" className={input + " bg-[#0E0B12]"} value={d.city || ""} onChange={(e) => set({ city: e.target.value || null })}>
                <option value="">All cities</option>
                <option>Karachi</option>
                <option>Lahore</option>
                <option>Islamabad</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={label} htmlFor="b-excerpt">Summary * <span className="text-neutral-500 font-normal">— shown in Google results ({(d.excerpt || "").length}/300, aim for 120–160)</span></label>
              <textarea id="b-excerpt" className={input} rows={2} maxLength={300} value={d.excerpt} onChange={(e) => set({ excerpt: e.target.value })} />
            </div>
            <div>
              <label className={label} htmlFor="b-tags">Tags (comma separated)</label>
              <input id="b-tags" className={input} value={(d.tags || []).join(", ")} onChange={(e) => set({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} placeholder="padel, weekend, guide" />
            </div>
            <div>
              <label className={label} htmlFor="b-author">Author</label>
              <input id="b-author" className={input} value={d.author || ""} onChange={(e) => set({ author: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <span className={label}>Cover image (optional, 16:9 works best)</span>
              <div className="flex items-center gap-3">
                {d.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.coverImage} alt="Cover preview" className="w-40 aspect-video object-cover rounded-lg border border-white/10" />
                )}
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-white/10 text-white cursor-pointer">
                  <ImagePlus className="w-4 h-4" /> {d.coverImage ? "Change image" : "Upload image"}
                  <input type="file" accept="image/*" className="hidden" onChange={onCover} />
                </label>
                {d.coverImage && (
                  <button type="button" onClick={() => set({ coverImage: null })} className="text-xs text-neutral-400 hover:text-white underline">Remove</button>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={label + " mb-0"} htmlFor="b-body">Article * <span className="text-neutral-500 font-normal">({words} words — 600+ is best for Google)</span></label>
              <button type="button" onClick={() => setPreview((v) => !v)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF8A3D]">
                <Eye className="w-3.5 h-3.5" /> {preview ? "Back to editing" : "Preview"}
              </button>
            </div>
            {preview ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-5 text-[15.5px] leading-relaxed text-white/85 min-h-[300px]">{renderBlogBody(d.body)}</div>
            ) : (
              <textarea id="b-body" className={input + " font-mono text-[13.5px] leading-relaxed"} rows={20} value={d.body} onChange={(e) => set({ body: e.target.value })} />
            )}
            <p className="text-[11.5px] text-neutral-500 mt-2 leading-relaxed">
              Formatting: leave an empty line between paragraphs · <code>## Heading</code> · <code>### Smaller heading</code> · <code>- list item</code> · <code>1. numbered item</code> · <code>**bold**</code> · <code>[link text](/karachi)</code> · <code>&gt; quote</code>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" disabled={busy} onClick={() => save(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#FF6F26] to-[#FF5A1F] text-white disabled:opacity-50">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} {d.published ? "Update & keep live" : "Publish"}
            </button>
            <button type="button" disabled={busy} onClick={() => save(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/[0.06] hover:bg-white/10 text-white disabled:opacity-50">
              {d.published ? "Unpublish (save as draft)" : "Save draft"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-neutral-400 hover:text-white">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
          {posts.length === 0 ? (
            <div className="text-center py-16 text-neutral-400 text-sm">No posts yet. Click “New post” to write your first article.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead>
                  <tr className="border-b border-white/[0.08] text-neutral-400 text-[11px] uppercase tracking-wider">
                    <th className="p-4">Post</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Updated</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {posts.map((p) => (
                    <tr key={p.slug}>
                      <td className="p-4">
                        <div className="font-bold text-white">{p.title}</div>
                        <div className="text-xs text-neutral-500">/blog/{p.slug}{p.city ? ` · ${p.city}` : ""}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${p.published ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-amber-500/15 border-amber-500/30 text-amber-300"}`}>
                          {p.published ? "Live" : "Draft"}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-neutral-400 whitespace-nowrap">{fmt(p.updatedAt)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {p.published && (
                            <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-white">View</a>
                          )}
                          <button type="button" onClick={() => startEdit(p)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-white">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          {confirmDelete === p.slug ? (
                            <>
                              <button type="button" disabled={busy} onClick={() => remove(p.slug)} className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white">Confirm delete</button>
                              <button type="button" onClick={() => setConfirmDelete(null)} className="px-2.5 py-1.5 rounded-lg text-xs text-neutral-400">Cancel</button>
                            </>
                          ) : (
                            <button type="button" onClick={() => setConfirmDelete(p.slug)} aria-label={`Delete ${p.title}`} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-red-500/20 text-red-300">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
