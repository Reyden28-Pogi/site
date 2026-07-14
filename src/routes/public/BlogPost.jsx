import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import DOMPurify from 'dompurify'
import { supabase } from '../../lib/supabaseClient'
import { useBusiness } from '../../lib/businessContext'

export default function BlogPost() {
  const { business } = useBusiness()
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!business) return
    supabase
      .from('blog_posts')
      .select('*')
      .eq('business_id', business.id)
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setPost(data)
      })
  }, [business, slug])

  if (notFound) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="font-display text-2xl text-ink">Post not found</p>
        <Link to="/blog" className="mt-4 inline-block text-sm text-brand hover:underline">
          ← Back to blog
        </Link>
      </section>
    )
  }

  if (!post) return null

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-3xl px-6 py-24"
    >
      <Link to="/blog" className="text-sm text-brand hover:underline">
        ← Back to blog
      </Link>
      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt={post.title}
          className="mt-6 h-72 w-full rounded-2xl object-cover"
        />
      )}
      <p className="mt-8 text-xs uppercase tracking-wide text-ink/40">
        {new Date(post.created_at).toLocaleDateString()}
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium text-ink">{post.title}</h1>
      <div
        className="prose prose-neutral mt-8 max-w-none text-ink/80"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }}
      />
    </motion.article>
  )
}
