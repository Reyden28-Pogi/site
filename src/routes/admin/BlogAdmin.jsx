import { useEffect, useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth.js'
import ImageUploader from '../../components/admin/ImageUploader.jsx'

const emptyForm = {
  id: null,
  title: '',
  slug: '',
  content: '',
  cover_image_url: null,
  is_published: false,
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function BlogAdmin() {
  const { appUser } = useAuth()
  const [posts, setPosts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  async function load() {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('business_id', appUser.business_id)
      .order('created_at', { ascending: false })
    if (error) {
      setErrorMessage(`Couldn't load posts: ${error.message}`)
      return
    }
    setPosts(data || [])
  }

  useEffect(() => {
    if (appUser?.business_id) load()
  }, [appUser])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setErrorMessage(null)
    const payload = {
      business_id: appUser.business_id,
      title: form.title,
      slug: form.slug || slugify(form.title),
      content: form.content,
      cover_image_url: form.cover_image_url,
      is_published: form.is_published,
    }

    const { error } = form.id
      ? await supabase.from('blog_posts').update(payload).eq('id', form.id)
      : await supabase.from('blog_posts').insert(payload)

    setSaving(false)

    if (error) {
      // Most likely cause: another post already uses this slug (unique
      // per business_id + slug) — surface that plainly rather than a raw
      // Postgres constraint message.
      const friendly = error.message.includes('duplicate key')
        ? 'That URL slug is already used by another post — please choose a different one.'
        : error.message
      setErrorMessage(`Couldn't save: ${friendly}`)
      return
    }

    setForm(emptyForm)
    load()
  }

  async function togglePublish(post) {
    const { error } = await supabase
      .from('blog_posts')
      .update({ is_published: !post.is_published })
      .eq('id', post.id)
    if (error) {
      setErrorMessage(`Couldn't update: ${error.message}`)
      return
    }
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this post?')) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) {
      setErrorMessage(`Couldn't delete: ${error.message}`)
      return
    }
    load()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">Blog</h1>

      {errorMessage && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</p>
      )}

      <form onSubmit={handleSave} className="mt-8 grid gap-4 rounded-2xl border border-ink/10 bg-white p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/70">Title</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/70">URL slug</span>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder={slugify(form.title) || 'auto-generated-from-title'}
            className="input"
          />
        </label>

        <ImageUploader
          imageUrl={form.cover_image_url}
          onUploaded={(url) => setForm({ ...form, cover_image_url: url })}
          label="Cover image"
        />

        <div>
          <span className="mb-1 block text-sm font-medium text-ink/70">Content</span>
          <ReactQuill
            theme="snow"
            value={form.content}
            onChange={(content) => setForm({ ...form, content })}
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
          />
          <span className="text-sm text-ink/70">Publish immediately</span>
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
          >
            {saving ? 'Saving…' : form.id ? 'Update post' : 'Add post'}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-medium text-ink/60"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="flex items-center justify-between rounded-xl border border-ink/10 bg-white p-4">
            <div>
              <p className="font-medium text-ink">{post.title}</p>
              <p className="text-xs text-ink/40">/{post.slug}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => togglePublish(post)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  post.is_published ? 'bg-brand/10 text-brand' : 'bg-ink/5 text-ink/50'
                }`}
              >
                {post.is_published ? 'Published' : 'Draft'}
              </button>
              <button onClick={() => setForm(post)} className="text-sm font-medium text-brand hover:underline">
                Edit
              </button>
              <button onClick={() => handleDelete(post.id)} className="text-sm font-medium text-red-600 hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
