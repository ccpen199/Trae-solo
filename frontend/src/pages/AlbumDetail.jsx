import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Card, Button, Tag, List, Avatar, Input, Empty, Spin, message, Tabs } from 'antd'
import { FaHeart, FaPlay, FaStar, FaShareAlt, FaComment, FaFire } from 'react-icons/fa'
import { contentAPI } from '@/api'
import { useUserStore } from '@/store'

const { TextArea } = Input

function AlbumDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { setCurrentAlbum, setCurrentEpisode, setPlaying, isLoggedIn } = useUserStore()
  const [album, setAlbum] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlbumDetail()
  }, [id])

  const loadAlbumDetail = async () => {
    try {
      setLoading(true)
      const data = await contentAPI.getAlbumDetail(id)
      setAlbum(data)
      const commentsData = await contentAPI.getComments(id, { limit: 20 })
      setComments(commentsData.list || [])
    } catch (error) {
      message.error('加载专辑详情失败')
    } finally {
      setLoading(false)
    }
  }

  const playEpisode = (episode) => {
    if (!episode.is_free && !isLoggedIn) {
      message.warning('请先登录后再收听付费内容')
      navigate('/login')
      return
    }
    setCurrentAlbum(album)
    setCurrentEpisode(episode)
    setPlaying(true)
  }

  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    try {
      const result = await contentAPI.toggleFavorite(id)
      setAlbum(prev => ({ ...prev, is_favorited: result.is_favorited }))
      message.success(result.is_favorited ? '已收藏' : '已取消收藏')
    } catch (error) {
      console.error(error)
    }
  }

  const toggleSubscribe = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    try {
      const result = await contentAPI.toggleSubscribe(id)
      setAlbum(prev => ({ ...prev, is_subscribed: result.is_subscribed }))
      message.success(result.is_subscribed ? '已订阅更新' : '已取消订阅')
    } catch (error) {
      console.error(error)
    }
  }

  const submitComment = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    if (!commentText.trim()) {
      message.warning('请输入评论内容')
      return
    }
    try {
      await contentAPI.addComment(id, commentText.trim())
      message.success('评论成功')
      setCommentText('')
      loadAlbumDetail()
    } catch (error) {
      message.error('评论失败')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    )
  }

  if (!album) {
    return <Empty description="专辑不存在" />
  }

  return (
    <div>
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
      <Row gutter={24}>
        <Col xs={24} md={6}>
          <img
            src={album.cover}
            alt={album.title}
            style={{ width: '100%', borderRadius: 12 }}
          />
        </Col>
        <Col xs={24} md={18}>
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{album.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <Avatar src={album.author_avatar} size={32} />
              <span style={{ fontSize: 14, color: '#666' }}>{album.author_name}</span>
              <Tag color={album.is_free ? 'green' : 'gold'}>{album.is_free ? '免费' : '付费'}</Tag>
              <Tag color="blue">{album.category_name}</Tag>
            </div>
            <p style={{ color: '#666', lineHeight: 1.8, marginBottom: 16 }}>{album.description}</p>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#ff6b9d' }}>
                {(album.play_count / 10000).toFixed(1)}万
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>播放</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#ff6b9d' }}>
                {album.favorite_count}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>收藏</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#ff6b9d' }}>
                {album.subscribe_count}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>订阅</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#ff6b9d' }}>
                {album.comment_count}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>评论</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                type="primary"
                icon={<FaPlay />}
                size="large"
                style={{ borderRadius: 24, minWidth: 120 }}
                onClick={() => album.episodes?.[0] && playEpisode(album.episodes[0])}
              >
                开始播放
              </Button>
              <Button
                icon={<FaHeart />}
                size="large"
                style={{ borderRadius: 24 }}
                onClick={toggleFavorite}
                type={album.is_favorited ? 'primary' : 'default'}
              >
                {album.is_favorited ? '已收藏' : '收藏'}
              </Button>
              <Button
                icon={<FaStar />}
                size="large"
                style={{ borderRadius: 24 }}
                onClick={toggleSubscribe}
                type={album.is_subscribed ? 'primary' : 'default'}
              >
                {album.is_subscribed ? '已订阅' : '订阅'}
              </Button>
              <Button
                icon={<FaShareAlt />}
                size="large"
                style={{ borderRadius: 24 }}
                onClick={() => message.info('分享功能开发中')}
              >
                分享
              </Button>
            </div>
          </div>
        </Col>
      </Row>
      </Card>

      <Tabs
        defaultActiveKey="episodes"
        items={[
          {
            key: 'episodes',
            label: <span><FaPlay style={{ marginRight: 8 }} /> 剧集列表</span>,
            children: (
              <Card style={{ borderRadius: 12 }}>
                {album.episodes && album.episodes.length > 0 ? (
                  <List
                    dataSource={album.episodes}
                    renderItem={(episode, index) => (
                      <List.Item
                        actions={[
                          <Button
                            key="play"
                            type="link"
                            icon={<FaPlay />}
                            onClick={() => playEpisode(episode)}
                          >
                            播放
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar size={48} src={episode.cover || album.cover} />}
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 500 }}>{episode.title}</span>
                              {!episode.is_free && <Tag color="gold" size="small">付费</Tag>}
                            </div>
                          }
                          description={
                            <div style={{ display: 'flex', gap: 16, color: '#999', fontSize: 12 }}>
                              <span><FaFire /> {episode.play_count}次播放</span>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无剧集" />
                )}
              </Card>
            )
          },
          {
            key: 'comments',
            label: <span><FaComment style={{ marginRight: 8 }} /> 评论 ({album.comment_count})</span>,
            children: (
              <Card style={{ borderRadius: 12 }}>
                <div style={{ marginBottom: 24 }}>
                  <TextArea
                    rows={4}
                    placeholder="来说说你的看法吧..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    style={{ marginBottom: 12 }}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <Button type="primary" onClick={submitComment}>发表评论</Button>
                  </div>
                </div>
                {comments.length > 0 ? (
                  <List
                    dataSource={comments}
                    renderItem={comment => (
                      <List.Item>
                        <List.Item.Meta
                        avatar={<Avatar src={comment.user_avatar}>{comment.user_nickname?.[0]}</Avatar>}
                        title={comment.user_nickname}
                        description={comment.content}
                      />
                    </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无评论，快来抢沙发吧~" />
                )}
              </Card>
            )
          }
        ]}
      />
    </div>
  )
}

export default AlbumDetail
