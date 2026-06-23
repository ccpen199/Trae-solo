import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, HelpCircle, Stethoscope, Flame, Eye, Clock, User, ChevronDown, Plus, Network, ChevronRight } from 'lucide-react'
import { useQAStore } from '@/stores/qaStore'
import { useAuthStore } from '@/stores/authStore'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { cn } from '@/lib/utils'

const hotTopics = ['#狗狗健康', '#猫咪护理', '#新手养猫', '#宠物训练', '#饮食营养', '#疾病预防', '#美容护理', '#行为问题']

const knowledgeCategories = {
  dog: { name: '狗狗', icon: '🐕', color: 'bg-orange-100 text-orange-600', subcategories: ['health', 'training', 'feeding', 'grooming'] },
  cat: { name: '猫咪', icon: '🐱', color: 'bg-emerald-100 text-emerald-600', subcategories: ['health', 'nutrition', 'behavior', 'litter'] },
  small: { name: '小宠', icon: '🐹', color: 'bg-blue-100 text-blue-600', subcategories: ['rabbit', 'hamster', 'bird'] },
}

const subcategoryNames: Record<string, string> = {
  health: '健康', training: '训练', feeding: '喂养', grooming: '美容',
  nutrition: '营养', behavior: '行为', litter: '猫砂',
  rabbit: '兔子', hamster: '仓鼠', bird: '鸟类',
}

const sortTabs = [
  { key: 'hot', label: '最热' },
  { key: 'latest', label: '最新' },
  { key: 'unanswered', label: '未回答' },
  { key: 'certified', label: '兽医认证' },
]

const nodeColors = ['bg-orange-400', 'bg-emerald-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400']

export default function QACommunity() {
  const { questions, knowledgeGraph, loading, fetchQuestions, fetchKnowledgeGraph } = useQAStore()
  const { user } = useAuthStore()
  const [activeSort, setActiveSort] = useState('hot')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('dog')
  const [showGraph, setShowGraph] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  useEffect(() => {
    const filters: any = { sort: activeSort }
    if (selectedTopic) filters.topic = selectedTopic.replace('#', '')
    fetchQuestions(filters)
  }, [activeSort, selectedTopic])

  const handleViewGraph = async () => {
    setShowGraph(true)
    await fetchKnowledgeGraph()
  }

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl p-5 animate-pulse">
      <div className="h-5 bg-stone-200 rounded w-3/4 mb-3" />
      <div className="h-4 bg-stone-200 rounded w-full mb-2" />
      <div className="h-4 bg-stone-200 rounded w-2/3 mb-4" />
      <div className="flex gap-3">
        <div className="h-3 bg-stone-200 rounded w-16" />
        <div className="h-3 bg-stone-200 rounded w-16" />
        <div className="h-3 bg-stone-200 rounded w-16" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="heading-font text-2xl font-bold text-text-primary flex items-center gap-2">
                    <MessageCircle className="w-7 h-7 text-primary" />
                    问答社区
                  </h1>
                  <p className="text-text-secondary mt-1">执业兽医在线解答，养宠疑问一站解决</p>
                </div>
                <Link
                  to="/qa/ask"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition-all shadow-sm shadow-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  我要提问
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {hotTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(selectedTopic === topic ? null : topic)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full transition-all',
                      selectedTopic === topic
                        ? 'bg-primary text-white'
                        : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                    )}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm">
              {sortTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSort(tab.key)}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                    activeSort === tab.key
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-stone-100'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading && questions.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : questions.length === 0 ? (
              <EmptyState
                icon={<HelpCircle className="w-8 h-8 text-stone-400" />}
                title="暂无问题"
                description="快来提出第一个问题吧，兽医会在线为你解答"
                action={{ label: '我要提问', onClick: () => window.location.href = '/qa/ask' }}
              />
            ) : (
              <div className="space-y-4">
                {questions.map((q: any, index: number) => (
                  <Link
                    key={q.id}
                    to={`/qa/${q.id}`}
                    className={cn(
                      'block bg-white rounded-2xl p-5 shadow-sm card-hover opacity-0 animate-slideUp',
                      `stagger-${Math.min((index % 6) + 1, 6)}`
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">
                            {q.category || '其他'}
                          </span>
                          {q.hasCertifiedAnswer && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">
                              <Stethoscope className="w-3 h-3" />
                              兽医认证
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-text-primary line-clamp-1">{q.title}</h3>
                      </div>
                      <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                        <Flame className="w-4 h-4" />
                        <span className="text-sm font-semibold">{q.heatScore || 0}</span>
                      </div>
                    </div>

                    <p className="text-text-secondary text-sm line-clamp-2 mb-4">{q.content}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {q.author?.name || '匿名用户'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {q.createdAt || '今天'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {q.viewCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {q.answerCount || 0} 回答
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {questions.length > 0 && (
              <div className="mt-6 text-center">
                <button className="px-6 py-2.5 bg-white text-text-primary font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition">
                  加载更多
                </button>
              </div>
            )}
          </div>

          <div className="lg:w-72 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
                <Network className="w-5 h-5 text-primary" />
                知识图谱
              </h3>

              <div className="space-y-2">
                {Object.entries(knowledgeCategories).map(([key, cat]) => (
                  <div key={key}>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition',
                        expandedCategory === key ? cat.color : 'hover:bg-stone-50'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span className="font-medium">{cat.name}</span>
                      </span>
                      <ChevronDown className={cn('w-4 h-4 transition-transform', expandedCategory === key && 'rotate-180')} />
                    </button>
                    {expandedCategory === key && (
                      <div className="ml-4 mt-1 space-y-1">
                        {cat.subcategories.map((sub) => (
                          <button
                            key={sub}
                            className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-stone-50 rounded-lg transition flex items-center justify-between group"
                          >
                            <span>{subcategoryNames[sub]}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleViewGraph}
                className="w-full mt-4 px-4 py-2.5 bg-primary/10 text-primary font-medium rounded-xl hover:bg-primary/20 transition"
              >
                查看完整图谱
              </button>

              {showGraph && (
                <div className="mt-4 p-4 bg-stone-50 rounded-xl">
                  <div className="relative h-40">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'absolute w-4 h-4 rounded-full animate-pulse',
                          nodeColors[i % nodeColors.length]
                        )}
                        style={{
                          left: `${15 + (i * 10) % 70}%`,
                          top: `${20 + (i * 15) % 60}%`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                    <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                      <line x1="25%" y1="30%" x2="55%" y2="45%" stroke="#FED7AA" strokeWidth="2" />
                      <line x1="55%" y1="45%" x2="75%" y2="25%" stroke="#FED7AA" strokeWidth="2" />
                      <line x1="55%" y1="45%" x2="65%" y2="70%" stroke="#D1FAE5" strokeWidth="2" />
                      <line x1="25%" y1="30%" x2="35%" y2="65%" stroke="#D1FAE5" strokeWidth="2" />
                      <line x1="65%" y1="70%" x2="85%" y2="55%" stroke="#BFDBFE" strokeWidth="2" />
                      <line x1="35%" y1="65%" x2="65%" y2="70%" stroke="#BFDBFE" strokeWidth="2" />
                    </svg>
                  </div>
                  <p className="text-xs text-text-secondary text-center mt-2">
                    知识图谱节点关系展示
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Stethoscope className="w-5 h-5" />
                执业兽医在线
              </h3>
              <p className="text-emerald-100 text-sm mb-3">
                12位认证兽医24小时在线，平均响应时间15分钟
              </p>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-xs"
                  >
                    👨‍⚕️
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
