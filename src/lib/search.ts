import type { InfoPost, NewsArticle, Merchant } from '@/types'
import {
  newsArticles,
  jobPosts,
  housingPosts,
  foodPosts,
  datingPosts,
  merchants,
} from '@/data'

export type SearchResult = {
  id: string
  title: string
  snippet: string
  type: string
  typeLabel: string
  link: string
  createdAt?: string
  township?: string
}

export const categoryOptions = [
  { key: 'news', label: '资讯' },
  { key: 'job', label: '招聘' },
  { key: 'housing', label: '房产' },
  { key: 'food', label: '美食' },
  { key: 'dating', label: '交友' },
  { key: 'merchant', label: '商家' },
]

export const timeRanges = [
  { key: 'all', label: '全部', ms: Infinity },
  { key: 'day', label: '近一天', ms: 86400000 },
  { key: 'week', label: '近一周', ms: 604800000 },
  { key: 'month', label: '近一月', ms: 2592000000 },
]

export const typeBadgeColors: Record<string, string> = {
  资讯: 'bg-jade-50 text-jade-600',
  招聘: 'bg-blue-50 text-blue-600',
  房产: 'bg-amber-50 text-amber-600',
  美食: 'bg-orange-50 text-orange-600',
  交友: 'bg-pink-50 text-pink-600',
  商家: 'bg-purple-50 text-purple-600',
}

export function buildResults(keyword: string): SearchResult[] {
  const kw = keyword.toLowerCase()
  const results: SearchResult[] = []
  const matchText = (text: string) => text.toLowerCase().includes(kw)

  newsArticles.forEach((a) => {
    if (matchText(a.title) || matchText(a.summary) || matchText(a.content)) {
      results.push({
        id: a.id, title: a.title, snippet: a.summary,
        type: 'news', typeLabel: '资讯', link: `/news/${a.id}`,
        createdAt: a.publishedAt, township: a.township,
      })
    }
  })

  const postTypeMap: [InfoPost[], string, string][] = [
    [jobPosts, 'job', '招聘'],
    [housingPosts, 'housing', '房产'],
    [foodPosts, 'food', '美食'],
    [datingPosts, 'dating', '交友'],
  ]

  postTypeMap.forEach(([posts, type, typeLabel]) => {
    posts.forEach((p) => {
      if (matchText(p.title) || matchText(p.content) || p.tags.some(matchText)) {
        results.push({
          id: p.id, title: p.title, snippet: p.content.slice(0, 80),
          type, typeLabel, link: `/category/${type}`,
          createdAt: p.createdAt, township: p.location.township,
        })
      }
    })
  })

  merchants.forEach((m) => {
    if (matchText(m.name) || matchText(m.description) || m.category.some(matchText)) {
      results.push({
        id: m.id, title: m.name, snippet: m.description.slice(0, 80),
        type: 'merchant', typeLabel: '商家', link: `/merchant/${m.id}`,
        township: m.township,
      })
    }
  })

  return results
}
