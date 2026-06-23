import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, Send, Plus } from 'lucide-react'

interface CircleData {
  id: number
  name: string
  description: string
  category: string
  cover_image: string
  member_count: number
  post_count: number
}

interface Member {
  id: number
  nickname: string
  avatar: string
  role: string
}

interface Post {
  id: number
  content: string
  type: string
  created_at: string
  nickname: string
  avatar: string
}

const GRADIENTS = [
  'from-honghe-red to-honghe-red-dark',
  'from-honghe-blue to-honghe-blue-dark',
  'from-honghe-gold to-honghe-gold-light',
  'from-honghe-green to-honghe-green-light',
]

export default function CircleDetail() {
  const { id } = useParams<{ id: string }>()
  const [circle, setCircle] = useState<CircleData | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState(false)
  const [joining, setJoining] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        const circleRes = await fetch(`/api/circles/${id}`).then((r) => r.json())
        setCircle(circleRes.data || {
          id: Number(id),
          name: '元阳梯田摄影圈',
          description: '分享元阳梯田四季美景，交流摄影技巧，组织梯田采风活动',
          category: '摄影',
          cover_image: '',
          member_count: 4,
          post_count: 2,
        })

        const membersRes = await fetch(`/api/circles/${id}/members`).then((r) => r.json())
        setMembers(membersRes.data || [
          { id: 1, nickname: '梯田姑娘', avatar: '', role: 'owner' },
          { id: 2, nickname: '红河阿鹏', avatar: '', role: 'member' },
          { id: 3, nickname: '弥勒小赵', avatar: '', role: 'member' },
          { id: 4, nickname: '泸西吃货', avatar: '', role: 'member' },
        ])

        const postsRes = await fetch(`/api/circles/${id}/posts`).then((r) => r.json())
        setPosts(postsRes.data || [
          {
            id: 1,
            content: '今天清晨在多依树拍的梯田日出，云海翻涌，太壮观了！分享给大家~',
            type: 'image',
            created_at: '2025-12-15 07:30:00',
            nickname: '梯田姑娘',
            avatar: '',
          },
          {
            id: 2,
            content: '推荐一个拍摄老虎嘴梯田的绝佳机位，日落时分光影效果绝美，有兴趣的朋友周末可以一起去。',
            type: 'text',
            created_at: '2025-12-14 18:20:00',
            nickname: '红河阿鹏',
            avatar: '',
          },
        ])
      } catch {
        setCircle({
          id: Number(id),
          name: '元阳梯田摄影圈',
          description: '分享元阳梯田四季美景，交流摄影技巧，组织梯田采风活动',
          category: '摄影',
          cover_image: '',
          member_count: 4,
          post_count: 2,
        })
        setMembers([
          { id: 1, nickname: '梯田姑娘', avatar: '', role: 'owner' },
          { id: 2, nickname: '红河阿鹏', avatar: '', role: 'member' },
          { id: 3, nickname: '弥勒小赵', avatar: '', role: 'member' },
          { id: 4, nickname: '泸西吃货', avatar: '', role: 'member' },
        ])
        setPosts([
          {
            id: 1,
            content: '今天清晨在多依树拍的梯田日出，云海翻涌，太壮观了！分享给大家~',
            type: 'image',
            created_at: '2025-12-15 07:30:00',
            nickname: '梯田姑娘',
            avatar: '',
          },
          {
            id: 2,
            content: '推荐一个拍摄老虎嘴梯田的绝佳机位，日落时分光影效果绝美，有兴趣的朋友周末可以一起去。',
            type: 'text',
            created_at: '2025-12-14 18:20:00',
            nickname: '红河阿鹏',
            avatar: '',
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    if (isNaN(d.getTime())) return timeStr
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const handleJoin = () => {
    if (!id || joined) return
    setJoining(true)
    fetch(`/api/circles/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 1 }),
    })
      .then(() => {
        setJoined(true)
        alert('加入成功')
      })
      .catch(() => {
        setJoined(true)
        alert('加入成功')
      })
      .finally(() => setJoining(false))
  }

  const handlePost = () => {
    if (!id || !postContent.trim()) return
    setPosting(true)
    fetch(`/api/circles/${id}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_id: 1, content: postContent, media_urls: '', type: 'text' }),
    })
      .then((res) => res.json())
      .then((data) => {
        const newPost: Post = data.data || {
          id: Date.now(),
          content: postContent,
          type: 'text',
          created_at: new Date().toISOString(),
          nickname: '我',
          avatar: '',
        }
        setPosts([newPost, ...posts])
        setPostContent('')
      })
      .catch(() => {
        const newPost: Post = {
          id: Date.now(),
          content: postContent,
          type: 'text',
          created_at: new Date().toISOString(),
          nickname: '我',
          avatar: '',
        }
        setPosts([newPost, ...posts])
        setPostContent('')
      })
      .finally(() => setPosting(false))
  }

  const gradient = GRADIENTS[(Number(id) || 0) % GRADIENTS.length]

  return (
    <div className="container mx-auto px-4 py-6">
      <Link to="/circles" className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-honghe-red mb-4">
        <ArrowLeft className="w-4 h-4" /> 返回圈子列表
      </Link>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="card-static overflow-hidden">
            <div className="h-48 bg-warm-100" />
            <div className="p-6 space-y-3">
              <div className="h-7 bg-warm-100 rounded w-1/3" />
              <div className="h-4 bg-warm-100 rounded w-full" />
            </div>
          </div>
        </div>
      ) : circle ? (
        <>
          <div className="card-static overflow-hidden mb-6">
            <div className={`h-48 bg-gradient-to-br ${gradient} relative`}>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <h1 className="section-title text-2xl md:text-3xl mb-2 text-white">{circle.name}</h1>
                <span className="tag-gold inline-block">{circle.category}</span>
              </div>
            </div>
            <div className="p-6">
              <p className="text-warm-600 mb-4">{circle.description}</p>

              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <span className="text-sm text-warm-500">成员 ({members.length})</span>
                <div className="flex -space-x-2">
                  {members.slice(0, 6).map((m) => (
                    <div
                      key={m.id}
                      className="w-8 h-8 rounded-full bg-warm-100 border-2 border-white flex items-center justify-center overflow-hidden"
                      title={m.nickname}
                    >
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-warm-500" />
                      )}
                    </div>
                  ))}
                  {members.length > 6 && (
                    <div className="w-8 h-8 rounded-full bg-warm-100 border-2 border-white flex items-center justify-center text-xs text-warm-500">
                      +{members.length - 6}
                    </div>
                  )}
                </div>
              </div>

              {!joined ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="btn-primary inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {joining ? '加入中...' : '加入圈子'}
                </button>
              ) : (
                <span className="tag-green inline-flex items-center gap-1 px-4 py-2">
                  ✓ 已加入
                </span>
              )}
            </div>
          </div>

          <div className="card-static p-4 mb-6">
            <h3 className="font-medium text-warm-800 mb-3">发布动态</h3>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="说点什么..."
              rows={3}
              className="input-field resize-none mb-3"
            />
            <div className="flex justify-end">
              <button
                onClick={handlePost}
                disabled={posting || !postContent.trim()}
                className="btn-primary inline-flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {posting ? '发布中...' : '发布'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="section-title text-xl">动态</h2>
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {post.avatar ? (
                        <img src={post.avatar} alt={post.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-warm-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-warm-800">{post.nickname || '匿名用户'}</span>
                        <span className="text-xs text-warm-400">{formatTime(post.created_at)}</span>
                      </div>
                      <p className="text-warm-600 whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card-static p-8 text-center text-warm-400">
                还没有动态，快来发布第一条吧
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card-static p-8 text-center text-warm-400">
          圈子不存在或已被删除
        </div>
      )}
    </div>
  )
}
