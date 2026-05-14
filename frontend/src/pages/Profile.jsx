import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { userAPI, notificationAPI } from '../api/endpoints'
import { useAuth } from '../store/auth'
import { Card, Button, Avatar, AsyncStatus, Tag, Textarea, LoadingSpinner, EmptyState } from '../components/Common'
import { showToast } from '../api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export function UserProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await userAPI.getProfile(id)
      if (res.data?.success) setProfile(res.data.data)
    } catch (err) {
      setError(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleFollow = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const res = await userAPI.followUser(id)
      if (res.data?.success) {
        setProfile(p => ({
          ...p,
          is_following: res.data.data.followed,
          follower_count: res.data.data.followed ? p.follower_count + 1 : p.follower_count - 1
        }))
      }
    } catch (err) {}
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <AsyncStatus loading={loading} error={error} onRetry={loadData}>
        {profile && (
          <>
            <Card style={{ padding: '24px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <Avatar url={profile.avatar} name={profile.nickname || profile.username} size={80} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '600' }}>{profile.nickname || profile.username}</h2>
                    {profile.role !== 'user' && (
                      <Tag color={profile.role === 'admin' ? '#ef4444' : profile.role === 'editor' ? '#f59e0b' : '#8b5cf6'}>
                        {profile.role === 'admin' ? '管理员' : profile.role === 'editor' ? '编辑' : '审核'}
                      </Tag>
                    )}
                  </div>
                  {profile.bio && (
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>{profile.bio}</p>
                  )}
                  <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#6b7280', flexWrap: 'wrap' }}>
                    <span><strong style={{ color: '#1f2937' }}>{profile.follower_count}</strong> 粉丝</span>
                    <span><strong style={{ color: '#1f2937' }}>{profile.following_count}</strong> 关注</span>
                    <span><strong style={{ color: '#1f2937' }}>{profile.question_count}</strong> 提问</span>
                    <span><strong style={{ color: '#1f2937' }}>{profile.answer_count}</strong> 回答</span>
                    <span><strong style={{ color: '#1f2937' }}>{profile.article_count}</strong> 文章</span>
                  </div>
                </div>
                {user && user.id !== parseInt(id) && (
                  <Button
                    variant={profile.is_following ? 'secondary' : 'primary'}
                    onClick={handleFollow}
                  >
                    {profile.is_following ? '取消关注' : '关注'}
                  </Button>
                )}
              </div>
            </Card>

            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>查看更多内容请前往 <Link to={`/user/${id}`} style={{ color: '#3b82f6' }}>个人中心</Link></p>
            </div>
          </>
        )}
      </AsyncStatus>
    </div>
  )
}

export function MyProfilePage() {
  const [activeTab, setActiveTab] = useState('questions')
  const [data, setData] = useState([])
  const [followings, setFollowings] = useState([])
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, setUser } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [bio, setBio] = useState(user?.bio || '')
  const [nickname, setNickname] = useState(user?.nickname || '')
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    try {
      let res
      if (activeTab === 'questions') {
        res = await userAPI.getMyQuestions({ limit: 50 })
      } else if (activeTab === 'answers') {
        res = await userAPI.getMyAnswers({ limit: 50 })
      } else if (activeTab === 'articles') {
        res = await userAPI.getMyArticles({ limit: 50 })
      } else if (activeTab === 'favorites') {
        res = await userAPI.getMyFavorites({ limit: 50 })
      } else if (activeTab === 'followings') {
        res = await userAPI.getMyFollowings()
        setFollowings(res.data?.data || [])
      } else if (activeTab === 'followers') {
        res = await userAPI.getMyFollowers()
        setFollowers(res.data?.data || [])
      }
      if (res?.data?.success && activeTab !== 'followings' && activeTab !== 'followers') {
        setData(res.data.data.list || [])
      }
    } catch (err) {}
    setLoading(false)
  }

  useEffect(() => {
    if (user) loadData()
  }, [activeTab])

  const handleSaveProfile = async () => {
    try {
      const { authAPI } = await import('../api/endpoints')
      const res = await authAPI.updateProfile({ nickname, bio })
      if (res.data?.success) {
        setUser(res.data.data)
        localStorage.setItem('pmcaff_user', JSON.stringify(res.data.data))
        setEditMode(false)
        showToast('保存成功', 'success')
      }
    } catch (err) {}
  }

  const handleFollow = async (targetId) => {
    try {
      await userAPI.followUser(targetId)
      loadData()
    } catch (err) {}
  }

  const tabs = [
    { key: 'questions', label: '我的提问' },
    { key: 'answers', label: '我的回答' },
    { key: 'articles', label: '我的文章' },
    { key: 'favorites', label: '我的收藏' },
    { key: 'followings', label: '我的关注' },
    { key: 'followers', label: '我的粉丝' }
  ]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Avatar url={user?.avatar} name={user?.nickname || user?.username} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>昵称</label>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>个人简介</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="介绍一下自己..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button onClick={handleSaveProfile}>保存</Button>
                  <Button variant="secondary" onClick={() => setEditMode(false)}>取消</Button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600' }}>{user?.nickname || user?.username}</h2>
                  {user?.role !== 'user' && (
                    <Tag color={user?.role === 'admin' ? '#ef4444' : user?.role === 'editor' ? '#f59e0b' : '#8b5cf6'}>
                      {user?.role === 'admin' ? '管理员' : user?.role === 'editor' ? '编辑' : '审核'}
                    </Tag>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>@{user?.username}</p>
                {user?.bio && <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>{user.bio}</p>}
                <Button size="small" variant="secondary" onClick={() => setEditMode(true)}>
                  编辑资料
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #e5e7eb', padding: '0 20px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '14px 0',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: activeTab === tab.key ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === tab.key ? '600' : '400',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px' }}>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {activeTab === 'followings' && (
                <UserList users={followings} onFollow={handleFollow} />
              )}
              {activeTab === 'followers' && (
                <UserList users={followers} onFollow={handleFollow} showFollow />
              )}
              {activeTab === 'questions' && <QuestionList items={data} />}
              {activeTab === 'answers' && <AnswerList items={data} />}
              {activeTab === 'articles' && <ArticleList items={data} />}
              {activeTab === 'favorites' && <FavoriteList items={data} />}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

function UserList({ users, onFollow, showFollow }) {
  if (!users || users.length === 0) return <EmptyState title="暂无数据" />
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {users.map(u => (
        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px' }}>
          <Link to={`/user/${u.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit', flex: 1 }}>
            <Avatar url={u.avatar} name={u.nickname} size={48} />
            <div>
              <p style={{ fontWeight: '500' }}>{u.nickname}</p>
              {u.bio && <p style={{ fontSize: '12px', color: '#9ca3af' }}>{u.bio}</p>}
            </div>
          </Link>
          {showFollow && (
            <Button size="small" variant="secondary" onClick={() => onFollow(u.id)}>关注</Button>
          )}
        </div>
      ))}
    </div>
  )
}

function QuestionList({ items }) {
  if (!items || items.length === 0) return <EmptyState title="暂无提问" description="去提一个问题吧" />
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map(item => (
        <Link key={item.id} to={`/question/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ padding: '12px', borderRadius: '8px', transition: 'background 0.2s' }}>
            <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>{item.title}</h4>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9ca3af', flexWrap: 'wrap' }}>
              <span>{dayjs(item.created_at).fromNow()}</span>
              <span>💬 {item.answer_count}</span>
              <span>❤️ {item.like_count}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function AnswerList({ items }) {
  if (!items || items.length === 0) return <EmptyState title="暂无回答" />
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map(item => (
        <div key={item.id} style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
          <Link to={`/question/${item.question_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <p style={{ color: '#3b82f6', fontSize: '14px', marginBottom: '8px' }}>回答了：{item.question_title}</p>
          </Link>
          <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.content}
          </p>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
            {dayjs(item.created_at).fromNow()} · ❤️ {item.like_count}
          </div>
        </div>
      ))}
    </div>
  )
}

function ArticleList({ items }) {
  if (!items || items.length === 0) return <EmptyState title="暂无文章" />
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map(item => (
        <Link key={item.id} to={`/article/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ padding: '12px' }}>
            <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>{item.title}</h4>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9ca3af', flexWrap: 'wrap' }}>
              <span>{dayjs(item.created_at).fromNow()}</span>
              <span>👁 {item.view_count}</span>
              <span>❤️ {item.like_count}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function FavoriteList({ items }) {
  if (!items || items.length === 0) return <EmptyState title="暂无收藏" />
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map(item => (
        <Link
          key={item.id}
          to={item.target_type === 'article' ? `/article/${item.target_id}` : '#'}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ padding: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
              <Tag color={item.target_type === 'article' ? '#10b981' : '#3b82f6'}>
                {item.target_type === 'article' ? '文章' : '其他'}
              </Tag>
            </div>
            <h4 style={{ fontWeight: '500' }}>{item.title}</h4>
            {item.excerpt && <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>{item.excerpt}</p>}
          </div>
        </Link>
      ))}
    </div>
  )
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await notificationAPI.getList({ limit: 50 })
      if (res.data?.success) {
        setNotifications(res.data.data.list || [])
        setUnreadCount(res.data.data.unread_count || 0)
      }
    } catch (err) {}
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAsRead('all')
      setNotifications(n => n.map(item => ({ ...item, is_read: 1 })))
      setUnreadCount(0)
      showToast('已全部标记为已读', 'success')
    } catch (err) {}
  }

  const getNotificationText = (type) => {
    const texts = {
      like: '赞了你的',
      comment: '评论了你的',
      answer: '回答了你的问题',
      follow: '关注了你',
      mention: '提到了你'
    }
    return texts[type] || '有新动态'
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Card style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
            消息中心
            {unreadCount > 0 && <Tag color="#ef4444" style={{ marginLeft: '8px' }}>{unreadCount} 条未读</Tag>}
          </h2>
          {unreadCount > 0 && (
            <Button size="small" variant="secondary" onClick={handleMarkAllRead}>
              全部已读
            </Button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <EmptyState title="暂无消息" icon="🔔" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '16px 12px',
                  borderBottom: '1px solid #f3f4f6',
                  background: n.is_read ? 'transparent' : '#f8fafc'
                }}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Avatar url={n.actor_avatar} name={n.actor_nickname} size={40} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: '#374151' }}>
                      <span style={{ fontWeight: '500' }}>{n.actor_nickname || '系统'}</span>
                      <span style={{ marginLeft: '4px' }}>{getNotificationText(n.type)}</span>
                    </p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                      {dayjs(n.created_at).fromNow()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
