/**
 * Minimal line-icon representations for social platforms — deliberately
 * simple geometric shapes rather than exact official brand marks (no
 * trademark reproduction concerns, and minimal line icons read as more
 * premium than solid brand-color logos anyway, consistent with the rest
 * of this template's aesthetic).
 */

function IconWrapper({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      {children}
    </svg>
  )
}

function FacebookIcon() {
  return (
    <IconWrapper>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M14 8.5h-1.5c-.8 0-1.5.7-1.5 1.5v2h3M11 21v-8.5h-2" strokeLinecap="round" strokeLinejoin="round" />
    </IconWrapper>
  )
}

function InstagramIcon() {
  return (
    <IconWrapper>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.8" fill="currentColor" stroke="none" />
    </IconWrapper>
  )
}

function TiktokIcon() {
  return (
    <IconWrapper>
      <path
        d="M14 4v10.5a3 3 0 1 1-3-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 4c0 2.5 2 4.5 4 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconWrapper>
  )
}

function TwitterIcon() {
  return (
    <IconWrapper>
      <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
    </IconWrapper>
  )
}

function YoutubeIcon() {
  return (
    <IconWrapper>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M10.5 9.5l5 2.5-5 2.5v-5z" fill="currentColor" stroke="none" />
    </IconWrapper>
  )
}

const PLATFORM_ICONS = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TiktokIcon,
  twitter: TwitterIcon,
  youtube: YoutubeIcon,
}

const PLATFORM_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  twitter: 'Twitter / X',
  youtube: 'YouTube',
}

/**
 * Renders one link per platform present in `links` (an object like
 * { facebook: "https://...", instagram: "https://..." } — see
 * businesses.social_links). Platforms with no URL set are simply absent
 * from the object and don't render anything, no empty/broken icons.
 */
export default function SocialIcons({ links, className = '' }) {
  const entries = Object.entries(links || {}).filter(([platform, url]) => PLATFORM_ICONS[platform] && url)

  if (entries.length === 0) return null

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {entries.map(([platform, url]) => {
        const Icon = PLATFORM_ICONS[platform]
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={PLATFORM_LABELS[platform]}
            className="text-paper/70 transition-colors hover:text-brand-light"
          >
            <Icon />
          </a>
        )
      })}
    </div>
  )
}
