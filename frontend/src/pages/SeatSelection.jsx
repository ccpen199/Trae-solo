import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Row, Col, Typography, Button, message, Tag, Modal } from 'antd'
import { ClockCircleOutlined, EnvironmentOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { sessionAPI, orderAPI } from '../utils/api'
import MoviePoster from '../components/MoviePoster'
import dayjs from 'dayjs'

const { Title, Text } = Typography

function SeatSelection() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [soldSeats, setSoldSeats] = useState(new Set())
  const [lockedSeats, setLockedSeats] = useState(new Set())
  const [lockInfo, setLockInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSession()
  }, [id])

  const loadSession = async () => {
    try {
      const data = await sessionAPI.detail(id)
      setSession(data)
      setSoldSeats(new Set(data.seat_state?.sold || []))
      setLockedSeats(new Set(data.seat_state?.locked || []))
    } catch (e) {
      message.error('加载失败')
    }
  }

  const handleSeatClick = (row, col) => {
    const key = `${row}-${col}`
    if (soldSeats.has(key) || lockedSeats.has(key)) return

    if (selectedSeats.includes(key)) {
      setSelectedSeats(selectedSeats.filter(s => s !== key))
    } else {
      if (selectedSeats.length >= 6) {
        message.warning('最多选择6个座位')
        return
      }
      setSelectedSeats([...selectedSeats, key])
    }
  }

  const getSeatClass = (row, col) => {
    const key = `${row}-${col}`
    if (soldSeats.has(key)) return 'seat-sold'
    if (lockedSeats.has(key)) return 'seat-locked'
    if (selectedSeats.includes(key)) return 'seat-selected'
    return 'seat-available'
  }

  const handleLockSeats = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    if (selectedSeats.length === 0) {
      message.warning('请选择座位')
      return
    }

    setLoading(true)
    try {
      const data = await sessionAPI.lockSeats(id, selectedSeats)
      setLockInfo(data)
      message.success('座位锁定成功，请在15分钟内完成支付')
      
      navigate('/order-confirm', {
        state: {
          sessionId: id,
          session,
          seats: selectedSeats,
          orderNo: data.order_no,
          price: session.base_price * selectedSeats.length
        }
      })
    } catch (e) {
      message.error(e.response?.data?.error || '锁定失败')
      loadSession()
    } finally {
      setLoading(false)
    }
  }

  if (!session) return <div style={{ textAlign: 'center', padding: 60 }}>加载中...</div>

  const rows = session.seat_rows || 10
  const cols = session.seat_cols || 15

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <div className="screen">银幕 SCREEN</div>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="seat seat-available" style={{ width: 20, height: 20 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>可选</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="seat seat-selected" style={{ width: 20, height: 20 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>已选</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="seat seat-sold" style={{ width: 20, height: 20 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>已售</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="seat seat-locked" style={{ width: 20, height: 20 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>锁定</Text>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                {Array.from({ length: rows }, (_, row) => (
                  <div key={row} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ width: 20, textAlign: 'right', fontSize: 12, color: '#999' }}>{row + 1}</span>
                    {Array.from({ length: cols }, (_, col) => (
                      <div
                        key={`${row}-${col}`}
                        className={`seat ${getSeatClass(row, col)}`}
                        onClick={() => handleSeatClick(row, col)}
                        title={`${row + 1}排${col + 1}座`}
                      >
                        {col + 1}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ position: 'sticky', top: 24 }}>
              <MoviePoster movie={session} height={260} style={{ marginBottom: 16 }} />
              <Title level={4} style={{ marginBottom: 12 }}>{session.title}</Title>
              <div style={{ marginBottom: 12 }}>
                <ClockCircleOutlined style={{ marginRight: 8, color: '#999' }} />
                {dayjs(session.start_time).format('YYYY-MM-DD HH:mm')} - {dayjs(session.end_time).format('HH:mm')}
              </div>
              <div style={{ marginBottom: 12 }}>
                <EnvironmentOutlined style={{ marginRight: 8, color: '#999' }} />
                {session.cinema_name} {session.hall_name}
              </div>
              <Tag color="blue">{session.version}</Tag>
              <Tag color="purple">{session.language}</Tag>

              <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>已选座位：</Text>
                  {selectedSeats.length === 0 ? (
                    <Text type="secondary" style={{ marginLeft: 8 }}>请选择座位</Text>
                  ) : (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {selectedSeats.map(s => {
                        const [r, c] = s.split('-')
                        return <Tag key={s} color="orange">{parseInt(r) + 1}排{parseInt(c) + 1}座</Tag>
                      })}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f', marginBottom: 16 }}>
                  ¥{session.base_price * selectedSeats.length}
                  <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>
                    ({selectedSeats.length}张 × ¥{session.base_price})
                  </Text>
                </div>
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  icon={<ShoppingCartOutlined />}
                  onClick={handleLockSeats}
                  loading={loading}
                  disabled={selectedSeats.length === 0}
                >
                  确认选座
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default SeatSelection
