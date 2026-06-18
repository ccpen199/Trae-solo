import { useState, useCallback } from 'react'
import { NavBar, Card, Space, Button, TextArea, Tag, Tabs, Toast } from 'antd-mobile'
import { LikeOutline, MessageOutline, SendOutline, StarOutline, HeartOutline } from 'antd-mobile-icons'
import './index.css'

const POST_TYPES = [
  { label: '全部', value: 'all' },
  { label: '充电体验', value: '充电体验' },
  { label: '站点评测', value: '站点评测' },
  { label: '路线分享', value: '路线分享' },
  { label: 'V2G心得', value: 'V2G心得' },
  { label: '提问求助', value: '提问求助' },
]

const TYPE_COLOR: Record<string, string> = {
  '充电体验': 'primary',
  '站点评测': 'success',
  '路线分享': 'warning',
  'V2G心得': 'danger',
  '提问求助': 'default',
}

interface Comment {
  id: number
  author: string
  avatar: string
  content: string
  time: string
}

interface Post {
  id: number
  type: string
  author: string
  avatar: string
  time: string
  title: string
  content: string
  images: string[]
  likes: number
  commentCount: number
  collects: number
  liked: boolean
  collected: boolean
  comments: Comment[]
  showComments: boolean
  expanded: boolean
}

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    type: '充电体验',
    author: '特斯拉车主小王',
    avatar: '特',
    time: '2小时前',
    title: '朝阳公园充电站体验',
    content: '今天发现了一个超棒的充电站，电价便宜还免停车费，位置在朝阳公园附近，快充功率稳定在60kW，半小时就能充到80%，推荐给大家！',
    images: ['#4fc3f7', '#81c784'],
    likes: 42,
    commentCount: 15,
    collects: 8,
    liked: false,
    collected: false,
    comments: [
      { id: 1, author: '比亚迪老司机', avatar: '比', content: '这个站我也去过，确实不错', time: '1小时前' },
      { id: 2, author: '蔚来未来', avatar: '蔚', content: '停车免费太香了', time: '30分钟前' },
    ],
    showComments: false,
    expanded: false,
  },
  {
    id: 2,
    type: 'V2G心得',
    author: '比亚迪老司机',
    avatar: '比',
    time: '5小时前',
    title: 'V2G峰谷套利实战',
    content: '分享一下我的V2G使用心得，设置峰谷套利模式，一个月能省不少电费。谷电时段0.3元/度充电，峰电时段0.8元/度放电，差价0.5元/度，60度电池一天最多套利30元，有问题的朋友可以留言交流～',
    images: [],
    likes: 128,
    commentCount: 36,
    collects: 45,
    liked: false,
    collected: false,
    comments: [
      { id: 1, author: '特斯拉车主小王', avatar: '特', content: '电池损耗怎么办？', time: '4小时前' },
      { id: 2, author: '小鹏鹏', avatar: '鹏', content: '需要什么设备吗？', time: '3小时前' },
      { id: 3, author: '理想家', avatar: '理', content: '计算很详细，收藏了', time: '2小时前' },
    ],
    showComments: false,
    expanded: false,
  },
  {
    id: 3,
    type: '路线分享',
    author: '蔚来未来',
    avatar: '蔚',
    time: '昨天',
    title: '北京-天津电车主路线',
    content: '周末开电车去了趟天津，来回300多公里，中途在京津高速服务区充了一次电，国网120kW快充，20分钟补能到80%，体验还不错。大家有什么长途充电的技巧吗？',
    images: ['#ffb74d', '#e57373', '#ba68c8'],
    likes: 256,
    commentCount: 58,
    collects: 72,
    liked: false,
    collected: false,
    comments: [
      { id: 1, author: '比亚迪老司机', avatar: '比', content: '建议提前规划好充电站', time: '20小时前' },
      { id: 2, author: '特斯拉车主小王', avatar: '特', content: '我上次走的是武清那个服务区', time: '18小时前' },
    ],
    showComments: false,
    expanded: false,
  },
  {
    id: 4,
    type: '站点评测',
    author: '小鹏鹏',
    avatar: '鹏',
    time: '2天前',
    title: '望京SOHO超充站评测',
    content: '望京SOHO新开的超充站，600kW液冷超充，我的车最高能跑到250kW，5%到80%只要15分钟，简直像加油一样快！就是车位比较少，高峰期要排队，建议大家错峰去。充电费1.2元/度，服务费0.8元/度。',
    images: ['#64b5f6'],
    likes: 89,
    commentCount: 23,
    collects: 31,
    liked: false,
    collected: false,
    comments: [
      { id: 1, author: '理想家', avatar: '理', content: '250kW太猛了', time: '1天前' },
    ],
    showComments: false,
    expanded: false,
  },
  {
    id: 5,
    type: '提问求助',
    author: '理想家',
    avatar: '理',
    time: '3天前',
    title: '充电枪拔不下来怎么办？',
    content: '今天充电结束后充电枪怎么都拔不下来，按了解锁键也没用，最后打客服电话才解决，听说这是常见问题？有没有什么预防方法？',
    images: [],
    likes: 34,
    commentCount: 28,
    collects: 12,
    liked: false,
    collected: false,
    comments: [
      { id: 1, author: '比亚迪老司机', avatar: '比', content: '可能是锁止机构卡住了，可以先试试重新插拔', time: '3天前' },
      { id: 2, author: '特斯拉车主小王', avatar: '特', content: '国网桩偶尔会有这个问题', time: '2天前' },
    ],
    showComments: false,
    expanded: false,
  },
  {
    id: 6,
    type: '充电体验',
    author: '广汽埃安',
    avatar: '广',
    time: '4天前',
    title: '深夜充电省钱攻略',
    content: '发现一个省钱小技巧，很多充电站在23:00-7:00有夜间优惠，电费能便宜一半，如果家里没有充电桩，可以趁这个时段去充，还能顺便在车里休息。我家附近的特来电站夜间0.5元/度，白天要1块多。',
    images: ['#9575cd'],
    likes: 67,
    commentCount: 19,
    collects: 38,
    liked: false,
    collected: false,
    comments: [
      { id: 1, author: '蔚来未来', avatar: '蔚', content: '确实，夜间充电划算多了', time: '3天前' },
    ],
    showComments: false,
    expanded: false,
  },
  {
    id: 7,
    type: '站点评测',
    author: '哪吒车主',
    avatar: '哪',
    time: '5天前',
    title: '大兴机场充电站避坑',
    content: '大兴机场的充电站位置不太好找，在P2停车场B2层，标识不清楚。充电速度还行，60kW左右，但是服务费太贵了，一度电要收1.5元服务费，不建议专程去充，除非赶飞机。',
    images: [],
    likes: 45,
    commentCount: 12,
    collects: 5,
    liked: false,
    collected: false,
    comments: [
      { id: 1, author: '小鹏鹏', avatar: '鹏', content: '机场的充电站确实都贵', time: '4天前' },
      { id: 2, author: '广汽埃安', avatar: '广', content: '感谢避坑提醒', time: '4天前' },
    ],
    showComments: false,
    expanded: false,
  },
  {
    id: 8,
    type: 'V2G心得',
    author: '零跑达人',
    avatar: '零',
    time: '1周前',
    title: 'V2G接入电网补贴攻略',
    content: '终于拿到了V2G参与电网调峰的补贴资格，需要先在APP上申请，然后去指定站点做车辆检测，通过后就可以参与调峰放电了。上个月参与5次调峰，补贴到账300多块，还是挺香的。需要的材料：行驶证、购车发票、V2G协议。',
    images: ['#4db6ac', '#aed581'],
    likes: 198,
    commentCount: 42,
    collects: 89,
    liked: false,
    collected: false,
    comments: [
      { id: 1, author: '比亚迪老司机', avatar: '比', content: '这个补贴怎么申请？', time: '6天前' },
      { id: 2, author: '理想家', avatar: '理', content: '300块一个月不错了', time: '5天前' },
    ],
    showComments: false,
    expanded: false,
  },
  {
    id: 9,
    type: '路线分享',
    author: '极氪先锋',
    avatar: '极',
    time: '1周前',
    title: '北京-崇礼滑雪充电路线',
    content: '冬天去崇礼滑雪的充电攻略：京礼高速沿途有3个服务区有充电站，延庆服务区4个桩、赤城服务区6个桩、崇礼服务区8个桩，建议在赤城补一次电就够往返了。冬天续航打折，出发前一定充满！',
    images: ['#90a4ae'],
    likes: 156,
    commentCount: 33,
    collects: 67,
    liked: false,
    collected: false,
    comments: [
      { id: 1, author: '蔚来未来', avatar: '蔚', content: '冬天确实要多预留电量', time: '6天前' },
    ],
    showComments: false,
    expanded: false,
  },
  {
    id: 10,
    type: '提问求助',
    author: '问界车主',
    avatar: '问',
    time: '2周前',
    title: '快充伤电池吗？',
    content: '经常用快充会不会影响电池寿命？4S店说偶尔用没问题，但最好还是慢充为主。有没有懂行的朋友科普一下？我基本上都是在外面快充，一个月也就回家慢充一两次。',
    images: [],
    likes: 312,
    commentCount: 87,
    collects: 45,
    liked: false,
    collected: false,
    comments: [
      { id: 1, author: '比亚迪老司机', avatar: '比', content: 'BMS会做保护的，不用担心', time: '2周前' },
      { id: 2, author: '特斯拉车主小王', avatar: '特', content: '我快充两年了，衰减很小', time: '2周前' },
      { id: 3, author: '零跑达人', avatar: '零', content: '避免低电量快充就行', time: '1周前' },
    ],
    showComments: false,
    expanded: false,
  },
]

const EXPAND_LIMIT = 80

function Community() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS)
  const [activeType, setActiveType] = useState('all')
  const [sortBy, setSortBy] = useState<'hot' | 'new'>('hot')
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostType, setNewPostType] = useState('充电体验')
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [displayCount, setDisplayCount] = useState(5)
  const [hasMore, setHasMore] = useState(true)

  const filteredPosts = posts
    .filter(p => activeType === 'all' || p.type === activeType)
    .sort((a, b) => sortBy === 'hot' ? b.likes - a.likes : 0)

  const displayedPosts = filteredPosts.slice(0, displayCount)

  const handleLike = useCallback((postId: number) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    )
  }, [])

  const handleCollect = useCallback((postId: number) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, collected: !p.collected, collects: p.collected ? p.collects - 1 : p.collects + 1 }
          : p
      )
    )
  }, [])

  const handleToggleComments = useCallback((postId: number) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, showComments: !p.showComments } : p
      )
    )
  }, [])

  const handleToggleExpand = useCallback((postId: number) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, expanded: !p.expanded } : p
      )
    )
  }, [])

  const handleAddComment = useCallback((postId: number) => {
    const content = commentInputs[postId]?.trim()
    if (!content) return
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: Date.now(),
                  author: '我',
                  avatar: '我',
                  content,
                  time: '刚刚',
                },
              ],
              commentCount: p.commentCount + 1,
            }
          : p
      )
    )
    setCommentInputs(prev => {
      const next = { ...prev }
      delete next[postId]
      return next
    })
  }, [commentInputs])

  const handlePublish = useCallback(() => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Toast.show('请填写标题和内容')
      return
    }
    const newPost: Post = {
      id: Date.now(),
      type: newPostType,
      author: '我',
      avatar: '我',
      time: '刚刚',
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      images: [],
      likes: 0,
      commentCount: 0,
      collects: 0,
      liked: false,
      collected: false,
      comments: [],
      showComments: false,
      expanded: true,
    }
    setPosts(prev => [newPost, ...prev])
    setNewPostTitle('')
    setNewPostContent('')
    setShowNewPost(false)
    Toast.show({ icon: 'success', content: '发布成功' })
  }, [newPostType, newPostTitle, newPostContent])

  const handleLoadMore = useCallback(() => {
    if (displayCount >= filteredPosts.length) {
      setHasMore(false)
      return
    }
    setDisplayCount(prev => prev + 5)
  }, [displayCount, filteredPosts.length])

  return (
    <div className="community-page">
      <NavBar
        right={
          <Button size="mini" color="primary" onClick={() => setShowNewPost(!showNewPost)}>
            发帖
          </Button>
        }
      >
        车友社区
      </NavBar>

      {showNewPost && (
        <div className="new-post-panel">
          <div className="new-post-types">
            {POST_TYPES.filter(t => t.value !== 'all').map(t => (
              <Tag
                key={t.value}
                color={newPostType === t.value ? 'primary' : 'default'}
                onClick={() => setNewPostType(t.value)}
                className="type-tag"
              >
                {t.label}
              </Tag>
            ))}
          </div>
          <input
            className="new-post-title"
            placeholder="请输入标题"
            value={newPostTitle}
            onChange={e => setNewPostTitle(e.target.value)}
          />
          <TextArea
            placeholder="分享你的充电故事..."
            value={newPostContent}
            onChange={setNewPostContent}
            rows={4}
          />
          <div className="new-post-footer">
            <Button size="mini" color="default">+ 图片</Button>
            <Button size="mini" color="primary" onClick={handlePublish}>
              <SendOutline /> 发布
            </Button>
          </div>
        </div>
      )}

      <Tabs
        activeKey={sortBy}
        onChange={key => setSortBy(key as 'hot' | 'new')}
        className="sort-tabs"
      >
        <Tabs.Tab title="热门" key="hot" />
        <Tabs.Tab title="最新" key="new" />
      </Tabs>

      <div className="type-filter">
        {POST_TYPES.map(t => (
          <Tag
            key={t.value}
            color={activeType === t.value ? 'primary' : 'default'}
            onClick={() => { setActiveType(t.value); setDisplayCount(5); setHasMore(true) }}
            className="type-tag"
          >
            {t.label}
          </Tag>
        ))}
      </div>

      <Space direction="vertical" block className="posts-list">
        {displayedPosts.map(post => (
          <Card key={post.id} className="post-card">
            <div className="post-header">
              <div className="post-avatar">{post.avatar}</div>
              <div className="post-author-info">
                <span className="post-author">{post.author}</span>
                <span className="post-time">{post.time}</span>
              </div>
              <Tag color={TYPE_COLOR[post.type] || 'default'} className="post-type-tag">
                {post.type}
              </Tag>
            </div>

            <div className="post-title">{post.title}</div>

            <div className="post-content">
              {post.content.length > EXPAND_LIMIT && !post.expanded
                ? post.content.slice(0, EXPAND_LIMIT) + '...'
                : post.content}
              {post.content.length > EXPAND_LIMIT && (
                <span className="expand-btn" onClick={() => handleToggleExpand(post.id)}>
                  {post.expanded ? '收起' : '展开'}
                </span>
              )}
            </div>

            {post.images.length > 0 && (
              <div className="post-images">
                {post.images.map((color, i) => (
                  <div key={i} className="post-image" style={{ background: color }} />
                ))}
              </div>
            )}

            <div className="post-footer">
              <div
                className={`post-action ${post.liked ? 'active' : ''}`}
                onClick={() => handleLike(post.id)}
              >
                {post.liked ? <HeartOutline /> : <LikeOutline />}
                <span>{post.likes}</span>
              </div>
              <div
                className="post-action"
                onClick={() => handleToggleComments(post.id)}
              >
                <MessageOutline />
                <span>{post.commentCount}</span>
              </div>
              <div
                className={`post-action ${post.collected ? 'active' : ''}`}
                onClick={() => handleCollect(post.id)}
              >
                <StarOutline />
                <span>{post.collects}</span>
              </div>
            </div>

            {post.showComments && (
              <div className="comments-section">
                {post.comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-avatar">{c.avatar}</div>
                    <div className="comment-body">
                      <span className="comment-author">{c.author}</span>
                      <span className="comment-content">{c.content}</span>
                      <span className="comment-time">{c.time}</span>
                    </div>
                  </div>
                ))}
                <div className="comment-input-row">
                  <input
                    className="comment-input"
                    placeholder="写评论..."
                    value={commentInputs[post.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddComment(post.id) }}
                  />
                  <Button size="mini" color="primary" onClick={() => handleAddComment(post.id)}>
                    发送
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </Space>

      <div className="load-more">
        <Button
          block
          color="default"
          size="small"
          onClick={handleLoadMore}
          disabled={!hasMore}
        >
          {hasMore ? '加载更多' : '没有更多了'}
        </Button>
      </div>
    </div>
  )
}

export default Community
