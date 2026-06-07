import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, TrendingUp, MapPin, Loader2, Hash, FolderPlus, MessageCircle, Award, CheckCircle, Info } from 'lucide-react'
import api from '../utils/api'
import ContentCard, { ContentItem } from '../components/ContentCard'
import TopicBadge from '../components/TopicBadge'

const popularCities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '武汉', '西安', '南京']

interface TopicData {
  id: string | number
  name: string
  slug: string
  post_count?: number
  is_official?: number
  description?: string
}

export default function ExplorePage() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [topics, setTopics] = useState<TopicData[]>([])
  const [hotContents, setHotContents] = useState<ContentItem[]>([])
  const [searchResults, setSearchResults] = useState<ContentItem[]>([])
  const [cityContents, setCityContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'topics' | 'hot' | 'cities' | 'search'>(
    q ? 'search' : 'topics'
  )
  const [selectedCity, setSelectedCity] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const [topicsRes, hotRes] = await Promise.all([
          api.get('/api/topics', { params: { limit: 20 } }),
          api.get('/api/contents', { params: { sort: 'hot', limit: 6 } }),
        ])
        if (topicsRes.data.code === 0) {
          setTopics(Array.isArray(topicsRes.data.data) ? topicsRes.data.data : [])
        }
        if (hotRes.data.code === 0) {
          setHotContents(hotRes.data.data.list || hotRes.data.data || [])
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    if (q) {
      setActiveSection('search')
      api.get('/api/contents', { params: { q, limit: 20 } }).then(res => {
        if (res.data.code === 0) {
          setSearchResults(res.data.data.list || res.data.data || [])
        }
      }).catch(() => {})
    }
  }, [q])

  useEffect(() => {
    if (selectedCity) {
      api.get('/api/contents', { params: { city: selectedCity, limit: 12 } }).then(res => {
        if (res.data.code === 0) {
          setCityContents(res.data.data.list || res.data.data || [])
        }
      }).catch(() => {})
    }
  }, [selectedCity])

  const getTopicAggregation = () => {
    const topicCounts: Record<string, { topic: TopicData; count: number }> = {}
    cityContents.forEach((content: ContentItem) => {
      if (content.topic_ids) {
        try {
          const topicArray = JSON.parse(content.topic_ids)
          topicArray.forEach((t: any) => {
            const id = String(t.id || t)
            if (!topicCounts[id]) {
              topicCounts[id] = {
                topic: { id: t.id || t, name: t.name || t, slug: t.slug || t },
                count: 0
              }
            }
            topicCounts[id].count++
          })
        } catch {}
      }
    })
    return Object.values(topicCounts).sort((a, b) => b.count - a.count)
  }

  const getUniqueTopicsCount = () => {
    const topicIds = new Set<string>()
    cityContents.forEach((content: ContentItem) => {
      if (content.topic_ids) {
        try {
          const topicArray = JSON.parse(content.topic_ids)
          topicArray.forEach((t: any) => {
            topicIds.add(String(t.id || t))
          })
        } catch {}
      }
    })
    return topicIds.size
  }

  const topicAggregation = getTopicAggregation()
  const uniqueTopicsCount = getUniqueTopicsCount()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">发现</h1>
        <div className="flex items-center gap-2">
          {[
            { key: 'topics', label: '话题' },
            { key: 'hot', label: '热门' },
            { key: 'cities', label: '城市' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === tab.key
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {q && (
            <button
              onClick={() => setActiveSection('search')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'search'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              搜索结果
            </button>
          )}
        </div>
      </div>

      {activeSection === 'topics' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">全部话题</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {topics.map(topic => (
              <Link
                key={topic.id}
                to={`/topic/${topic.slug}`}
                className="card p-4 hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="text-primary-600 font-medium">#{topic.name}</div>
                  {topic.is_official === 1 && (
                    <span className="badge bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" />官方
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">{topic.post_count || 0} 篇内容</span>
                  <span className={`badge text-[10px] px-1.5 py-0 ${
                    (topic.post_count || 0) > 0
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {(topic.post_count || 0) > 0 ? '活跃' : '策划中'}
                  </span>
                </div>
                {topic.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{topic.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'hot' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">热门内容</h2>
            <span className="text-xs text-gray-400 ml-auto">按点赞、浏览量排序</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotContents.map((content, index) => (
              <div key={content.id} className="relative">
                <div className="absolute top-2 left-2 z-10 w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <ContentCard content={content} showHotScore />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'cities' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">城市探索</h2>
          </div>
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {popularCities.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedCity === city
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              placeholder="输入其他城市名称..."
              className="input-field max-w-xs"
            />
          </div>
          {selectedCity && (
            <>
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 mb-4 border border-orange-100">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedCity} <span className="text-sm font-normal text-gray-500">· {cityContents.length} 篇内容 · {uniqueTopicsCount} 个话题</span>
                    </h3>
                  </div>
                  <Link to={`/collections?city=${encodeURIComponent(selectedCity)}`} className="btn-secondary text-xs py-1.5 flex items-center gap-1">
                    <FolderPlus className="w-3.5 h-3.5" />归档到合集
                  </Link>
                </div>
                {topicAggregation.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-orange-100">
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Hash className="w-3 h-3" />话题分布
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {topicAggregation.slice(0, 8).map(({ topic, count }) => (
                        <Link
                          key={topic.id}
                          to={`/topic/${topic.slug}?city=${encodeURIComponent(selectedCity)}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-primary-600 hover:bg-primary-50 transition-colors border border-orange-200"
                        >
                          #{topic.name}
                          <span className="text-gray-400">{count}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {cityContents.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">该城市暂无内容</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cityContents.map(content => (
                    <div key={content.id} className="relative">
                      <ContentCard content={content} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {!selectedCity && (
            <div className="text-center py-8 text-gray-400 text-sm">选择或输入城市名称开始探索</div>
          )}
        </div>
      )}

      {activeSection === 'search' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">搜索结果: {q}</h2>
          </div>
          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">未找到相关内容</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map(content => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
