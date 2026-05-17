import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Tabs, Empty, Spin, message, Tag } from 'antd'
import { FaHeart, FaHistory, FaClock, FaStar } from 'react-icons/fa'
import { userAPI } from '@/api'
import { useUserStore } from '@/store'

const { Meta } = Card

function MyListen() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [activeTab, setActiveTab] = useState('favorites')
  const [favorites, setFavorites] = useState([])
  const [history, setHistory] = useState([])
  const [subscribes, setSubscribes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      const [favRes, histRes, subRes] = await Promise.all([
        userAPI.getFavorites({ limit: 50 }),
        userAPI.getHistory({ limit: 50 }),
        userAPI.getSubscribes({ limit: 50 }),
      ])
      setFavorites(favRes.list || [])
      setHistory(histRes.list || [])
      setSubscribes(subRes.list || [])
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const renderAlbumGrid = (data) => {
    if (data.length === 0) {
      return <Empty description="暂无数据" />
    }
    return (
      <Row gutter={[16, 16]}>
        {data.map(item => {
          const album = item.album || item
          return (
            <Col xs={12} sm={8} md={6} lg={4} key={album.id}>
              <Card
                hoverable
                className="card-hover"
                style={{ borderRadius: 12, overflow: 'hidden' }}
                cover={
                  <img
                    alt={album.title}
                    src={album.cover}
                    style={{ height: 180, objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => navigate(`/album/${album.id}`)}
                  />
                }
                onClick={() => navigate(`/album/${album.id}`)}
              >
                <Meta
                  title={<div className="ellipsis" style={{ fontSize: 14, fontWeight: 600 }}>{album.title}</div>}
                  description={<div className="ellipsis" style={{ color: '#999', fontSize: 12 }}>{album.author_name}</div>}
                />
              </Card>
            </Col>
          )
        })}
      </Row>
    )
  }

  if (!user) {
    return <Empty description="请先登录" />
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>我的听书</h1>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'favorites',
              label: <span><FaHeart style={{ marginRight: 8 }} />收藏</span>,
              children: renderAlbumGrid(favorites)
            },
            {
              key: 'subscribes',
              label: <span><FaStar style={{ marginRight: 8 }} />订阅</span>,
              children: renderAlbumGrid(subscribes)
            },
            {
              key: 'history',
              label: <span><FaHistory style={{ marginRight: 8 }} />历史</span>,
              children: renderAlbumGrid(history)
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default MyListen
