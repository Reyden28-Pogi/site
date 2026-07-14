import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import { useBusiness } from '../../lib/businessContext'

export default function Blog() {
  const { business } = useBusiness()
  const [posts, setPosts] = useState([])

  useEffect(() => {
    if (!business) return
    supabase
      .from('blog_posts')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPosts(data || []))
  }, [business])

  return (
    <section className="mx-auto max-w-4xl px-6 py-24">
      <h1 className="brush-underline font-display text-3xl font-medium text-ink">Blog</h1>

      {posts.length === 0 ? (
        <p className="mt-8 text-sm text-ink/50">No posts published yet.</p>
      ) : (
        <div className="mt-12 space-y-10">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="flex flex-col gap-4 border-b border-ink/10 pb-10 sm:flex-row"
            >
              {post.cover_image_url && (
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="h-40 w-full rounded-xl object-cover sm:w-56"
                />
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-ink/40">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
                <h2 className="mt-1 font-display text-xl font-medium text-ink">
                  <Link to={`/blog/${post.slug}`} className="hover:text-brand">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-ink/60">
                  {post.content?.replace(/<[^>]+>/g, '').slice(0, 160)}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  )
}
