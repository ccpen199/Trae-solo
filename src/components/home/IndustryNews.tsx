import { Clock, Tag } from 'lucide-react'
import { useStore } from '@/store'

const categoryColors: Record<string, string> = {
  industry: 'bg-teal-50 text-teal-700',
  policy: 'bg-amber-50 text-amber-700',
  report: 'bg-navy-50 text-navy-700',
}

const categoryLabels: Record<string, string> = {
  industry: '行业资讯',
  policy: '政策解读',
  report: '报告',
}

export default function IndustryNews() {
  const news = useStore((s) => s.newsArticles)

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h2 className="font-serif text-lg font-semibold text-navy-700 mb-4">行业动态</h2>
      <div className="space-y-3">
        {news.slice(0, 4).map((n) => (
          <div key={n.id} className="border-b border-navy-50 pb-3 last:border-0 last:pb-0 card-hover cursor-pointer">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${categoryColors[n.category]}`}>
                {categoryLabels[n.category]}
              </span>
              <span className="flex items-center gap-1 text-xs text-navy-300">
                <Clock size={10} />{n.publishDate}
              </span>
            </div>
            <h3 className="text-sm font-medium text-navy-700 mb-1">{n.title}</h3>
            <p className="text-xs text-navy-400 line-clamp-2">{n.summary}</p>
            <div className="flex gap-1 mt-1.5">
              {n.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-0.5 text-[10px] text-navy-400">
                  <Tag size={8} />{t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
