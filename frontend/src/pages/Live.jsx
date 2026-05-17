import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Tag, Spin, Empty, message } from 'antd'
import { FaBroadcastTower } from 'react-icons/fa'
import { liveAPI } from '@/api'

const { Meta } = Card

function Live() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      setLoading(true)
      const result = await liveAPI.getRooms({ limit: 50 })
      setRooms(result.list || [])
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
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
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FaBroadcastTower style={{ color: '#ff6b9d' }} />
          直播广场
        </h1>
      </div>

      {rooms.length > 0 ? (
        <Row gutter={[16, 16]}>
          {rooms.map(room => (
            <Col xs={24} sm={12} md={8} lg={6} key={room.id}>
              <Card
                hoverable
                className="card-hover"
                style={{ borderRadius: 12, overflow: 'hidden' }}
                cover={
                  <div style={{ position: 'relative', height: 180 }}>
                    <img
                      alt={room.title}
                      src={room.cover || `https://picsum.photos/400/180?random=${room.id}`}
                      style={{ height: 180, objectFit: 'cover', width: '100%' }}
                    />
                    <Tag color={room.is_live ? 'red' : 'default'} style={{ position: 'absolute', top: 8, left: 8 }}>
                      {room.is_live ? '🔴 直播中' : '未开播'}
                    </Tag>
                    <div style={{ position: 'absolute', bottom: 8, right: 8, color: 'white', fontSize: 12, background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 10 }}>
                      {room.viewer_count}人观看
                    </div>
                  </div>
                }
                onClick={() => navigate(`/live/${room.id}`)}
              >
                <Meta
                  title={<div className="ellipsis" style={{ fontSize: 14, fontWeight: 600 }}>{room.title}</div>}
                  description={<div className="ellipsis" style={{ color: '#999', fontSize: 12 }}>{room.anchor?.nickname || '主播'}</div>}
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="暂无直播房间" />
      )}
    </div>
  )
}

export default Live
