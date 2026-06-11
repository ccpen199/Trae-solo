import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Plus, X, Image as ImageIcon } from 'lucide-react'

interface Post {
  id: string
  author: string
  avatar: string
  content: string
  image: boolean
  topic: string
  likes: number
  comments: number
  liked: boolean
  time: string
}

const mockPosts: Post[] = [
  { id: 'p1', author: '电动老王', avatar: '王', content: '今天跑了趟北京到上海的长途，沿途充电站非常方便！济南服务区的国网桩功率稳定在60kW，强烈推荐。特来电的APP体验也很好，排队时间短。', image: true, topic: '长途出行', likes: 42, comments: 8, liked: false, time: '2小时前' },
  { id: 'p2', author: '蔚来小陈', avatar: '陈', content: 'V2G第一次尝试，月收益竟然有300+！谷时充电峰时放电，完全是白赚的。大家有没有更多V2G的省电技巧？', image: false, topic: 'V2G体验', likes: 67, comments: 23, liked: true, time: '3小时前' },
  { id: 'p3', author: '比亚迪达人', avatar: '达', content: '汉EV冬季续航实测：满电出发，室外-5度，暖风22度，跑了280km还剩15%的电，基本符合官方标注。电池预热功能很实用。', image: true, topic: '车型讨论', likes: 89, comments: 31, liked: false, time: '5小时前' },
  { id: 'p4', author: '充电侠', avatar: '侠', content: '发现一个超好用的充电技巧：先用APP预约桩位，到站直接插枪，省去排队时间。特别是早晚高峰，预约和不预约差别太大了！', image: false, topic: '充电经验', likes: 35, comments: 12, liked: false, time: '6小时前' },
  { id: 'p5', author: '小鹏飞侠', avatar: '飞', content: 'P7的NGP配上充电路线规划简直是绝配！上周末自驾去千岛湖，AI自动规划了两个充电点，全程无焦虑。', image: true, topic: '长途出行', likes: 56, comments: 15, liked: false, time: '8小时前' },
  { id: 'p6', author: '特斯拉粉', avatar: '粉', content: 'Model 3的超级充电站速度真的快，15分钟补能200km。不过价格确实比国网贵一些，大家一般选哪个？', image: false, topic: '充电经验', likes: 78, comments: 45, liked: true, time: '10小时前' },
]

const topics = ['全部', '充电经验', '长途出行', '车型讨论', 'V2G体验']

const topicColors: Record<string, string> = {
  '充电经验': 'bg-electric-green/10 text-electric-green',
  '长途出行': 'bg-ice-blue/10 text-ice-blue',
  '车型讨论': 'bg-amber-orange/10 text-amber-orange',
  'V2G体验': 'bg-purple-500/10 text-purple-400',
}

export default function Community() {
  const [posts, setPosts] = useState<Post[]>(mockPosts)
  const [activeTopic, setActiveTopic] = useState('全部')
  const [showNewPost, setShowNewPost] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newTopic, setNewTopic] = useState('充电经验')

  useEffect(() => {
    fetch('/api/community/posts')
      .then(r => r.json())
      .then(payload => {
        const list = Array.isArray(payload) ? payload : payload?.data?.list
        if (Array.isArray(list)) {
          setPosts(list.map((item: any) => ({
            id: item.id,
            author: item.author || item.nickname || '匿名用户',
            avatar: item.avatar || String(item.nickname || '用').slice(0, 1),
            content: item.content,
            image: Boolean(item.image),
            topic: item.topic || '充电经验',
            likes: item.likes ?? item.likes_count ?? 0,
            comments: item.comments_count ?? 0,
            liked: Boolean(item.liked),
            time: item.time || item.created_at || '刚刚',
          })))
        }
      })
      .catch(() => {})
  }, [])

  const filtered = activeTopic === '全部' ? posts : posts.filter(p => p.topic === activeTopic)

  const toggleLike = (id: string) => {
    setPosts(posts.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ))
  }

  const handlePost = () => {
    if (!newContent.trim()) return
    const newPost: Post = {
      id: `p${Date.now()}`,
      author: '我',
      avatar: '我',
      content: newContent,
      image: false,
      topic: newTopic,
      likes: 0,
      comments: 0,
      liked: false,
      time: '刚刚',
    }
    setPosts([newPost, ...posts])
    setNewContent('')
    setShowNewPost(false)
  }

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setActiveTopic(t)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${activeTopic === t ? 'bg-electric-green/10 text-electric-green' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setShowNewPost(true)} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> 发帖
        </button>
      </div>

      <div className="columns-2 gap-4 space-y-4">
        {filtered.map(post => (
          <div key={post.id} className="glass-card p-4 break-inside-avoid mb-4 hover:border-electric-green/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-green/30 to-ice-blue/30 flex items-center justify-center text-xs font-medium text-electric-green shrink-0">
                {post.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-200">{post.author}</div>
                <div className="text-[10px] text-gray-500">{post.time}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ml-auto shrink-0 ${topicColors[post.topic] || 'bg-gray-500/10 text-gray-400'}`}>
                {post.topic}
              </span>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-3">{post.content}</p>

            {post.image && (
              <div className="w-full h-36 rounded-lg bg-gradient-to-br from-deep-blue-lighter to-deep-blue mb-3 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-600" />
              </div>
            )}

            <div className="flex items-center gap-5 text-xs text-gray-500">
              <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1 transition-colors ${post.liked ? 'text-red-400' : 'hover:text-red-400'}`}>
                <Heart className={`w-3.5 h-3.5 ${post.liked ? 'fill-red-400' : ''}`} />
                {post.likes}
              </button>
              <button className="flex items-center gap-1 hover:text-ice-blue transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
                {post.comments}
              </button>
              <button className="flex items-center gap-1 hover:text-gray-300 transition-colors ml-auto">
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-[520px] p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-100">发布动态</h3>
              <button onClick={() => setShowNewPost(false)} className="p-1 rounded hover:bg-white/5"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              rows={5}
              className="input-field w-full resize-none mb-4"
              placeholder="分享你的充电体验、出行故事..."
            />
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-gray-400">话题:</span>
              {topics.filter(t => t !== '全部').map(t => (
                <button
                  key={t}
                  onClick={() => setNewTopic(t)}
                  className={`text-xs px-2 py-0.5 rounded-full ${newTopic === t ? topicColors[t] : 'text-gray-500 border border-white/10'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors">
                <ImageIcon className="w-4 h-4" /> 添加图片
              </button>
              <div className="flex gap-3">
                <button onClick={() => setShowNewPost(false)} className="btn-secondary text-sm">取消</button>
                <button onClick={handlePost} className="btn-primary text-sm">发布</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
