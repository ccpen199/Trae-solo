import { Link } from 'react-router-dom'

interface TopicBadgeProps {
  name: string
  slug: string
  size?: 'sm' | 'md'
}

export default function TopicBadge({ name, slug, size = 'sm' }: TopicBadgeProps) {
  return (
    <Link
      to={`/topic/${slug}`}
      className={`inline-flex items-center text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      }`}
    >
      #{name}
    </Link>
  )
}
