import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'

interface CircleItem {
  id: number
  name: string
  description: string
  category: string
  cover_image: string
  memberCount?: number
}

const CATEGORIES = ['全部', '摄影', '手工', '美食', '运动']

const GRADIENTS = [
  'from-honghe-red to-honghe-red-dark',
  'from-honghe-blue to-honghe-blue-dark',
  'from-honghe-gold to-honghe-gold-light',
  'from-honghe-green to-honghe-green-light',
]

const getGradient = (id: number) => GRADIENTS[id % GRADIENTS.length]

export default function Circles() {
  const navigate = useNavigate()
  const [circles, setCircles] = useState<CircleItem[]>([])
  const [activeCategory, setActiveCategory] = useState('全部')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/circles')
      .then((res) => res.json())
      .then((data) => {
        const items = data.data?.items || data.data || []
        setCircles(items)
      })
      .catch(() => {
        setCircles([
          { id: 1, name: '元阳梯田摄影圈', description: '分享元阳梯田四季美景，交流摄影技巧，组织梯田采风活动', category: '摄影', cover_image: '', memberCount: 128 },
          { id: 2, name: '建水紫陶爱好者', description: '紫陶鉴赏、制作交流，建水古城文化探索', category: '手工', cover_image: '', memberCount: 86 },
          { id: 3, name: '红河美食探店', description: '发现红河州各地美食，过桥米线、泸西小吃、弥勒卤鸡米线一网打尽', category: '美食', cover_image: '', memberCount: 256 },
          { id: 4, name: '弥勒户外运动', description: '徒步、骑行、露营，探索弥勒及周边自然风光', category: '运动', cover_image: '', memberCount: 92 },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredCircles = activeCategory === '全部'
    ? circles
    : circles.filter((c) => c.category === activeCategory)

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">生活圈</h1>
        <button
          onClick={() => navigate('/circles/create')}
          className="btn-primary text-sm !px-4 !py-2"
        >
          创建圈子
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-honghe-red text-white'
                : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card-static overflow-hidden animate-pulse">
              <div className="h-36 bg-warm-100" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-warm-100 rounded w-3/4" />
                <div className="h-4 bg-warm-100 rounded w-full" />
                <div className="h-4 bg-warm-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCircles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCircles.map((circle) => (
            <Link
              key={circle.id}
              to={`/circles/${circle.id}`}
              className="card overflow-hidden group"
            >
              <div className={`h-36 bg-gradient-to-br ${getGradient(circle.id)} flex items-center justify-center text-white/90 text-3xl font-serif font-bold relative overflow-hidden`}>
                <span className="relative z-10">{circle.name.slice(0, 2)}</span>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-warm-800 mb-2 line-clamp-1">{circle.name}</h3>
                <p className="text-sm text-warm-500 line-clamp-2 mb-3 h-10">{circle.description}</p>
                <div className="flex items-center gap-1 text-xs text-warm-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{circle.memberCount || Math.floor(Math.random() * 200 + 20)} 成员</span>
                  <span className="ml-auto tag-blue">{circle.category}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card-static p-12 text-center text-warm-400">
          暂无该分类的圈子
        </div>
      )}

      <button
        onClick={() => navigate('/circles/create')}
        className="fixed bottom-8 right-8 btn-primary rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
