import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Card, Button, Typography, Tag, List, Rate, Input, message, Avatar, Modal } from 'antd'
import { StarOutlined, ClockCircleOutlined, EnvironmentOutlined, CalendarOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { movieAPI } from '../utils/api'
import MoviePoster from '../components/MoviePoster'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [reviews, setReviews] = useState([])
  const [sessions, setSessions] = useState([])
  const [reviewModal, setReviewModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')

  useEffect(() => {
    loadMovie()
  }, [id])

  const loadMovie = async () => {
    try {
      const data = await movieAPI.detail(id)
      setMovie(data)
      setReviews(data.reviews || [])
      setSessions(data.sessions || [])
    } catch (e) {
      message.error('加载失败')
    }
  }

  const submitReview = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      message.warning('请先登录')
      navigate('/login')
      return
    }
    try {
      await movieAPI.addReview(id, { rating, content: reviewContent })
      message.success('评论成功')
      setReviewModal(false)
      loadMovie()
    } catch (e) {
      message.error('评论失败')
    }
  }

  if (!movie) return <div style={{ textAlign: 'center', padding: 60 }}>加载中...</div>

  const groupedSessions = {}
  sessions.forEach(s => {
    const date = dayjs(s.start_time).format('YYYY-MM-DD')
    if (!groupedSessions[date]) groupedSessions[date] = {}
    if (!groupedSessions[date][s.cinema_name]) groupedSessions[date][s.cinema_name] = []
    groupedSessions[date][s.cinema_name].push(s)
  })

  const dates = Object.keys(groupedSessions).sort().slice(0, 7)

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col xs={24} md={6}>
            <MoviePoster movie={movie} height={360} />
          </Col>
          <Col xs={24} md={18}>
            <Title level={2} style={{ marginBottom: 16 }}>{movie.title}</Title>
            {movie.original_title && <Text type="secondary">{movie.original_title}</Text>}
            
            <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StarOutlined style={{ color: '#faad14', fontSize: 24 }} />
                <span style={{ fontSize: 28, fontWeight: 'bold', color: '#faad14' }}>{movie.rating?.toFixed(1)}</span>
              </div>
              <Tag color="blue">{movie.country}</Tag>
              <Tag color="green">{movie.language}</Tag>
              <Tag color="orange">{movie.duration}分钟</Tag>
            </div>

            <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
              {movie.versions?.split(',').map(v => <Tag key={v} color="purple">{v}</Tag>)}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 8, color: '#666' }}>
                <CalendarOutlined /> 上映日期：{movie.release_date}
              </div>
              <Paragraph style={{ color: '#666', lineHeight: 1.8 }}>{movie.description}</Paragraph>
            </div>

            <Button type="primary" size="large" onClick={() => document.getElementById('sessions-section')?.scrollIntoView({ behavior: 'smooth' })}>
              🎫 立即购票
            </Button>
            <Button size="large" style={{ marginLeft: 12 }} onClick={() => setReviewModal(true)}>
              ✍️ 写影评
            </Button>
          </Col>
        </Row>
      </Card>

      <div id="sessions-section" style={{ marginBottom: 24 }}>
        <Title level={3}>🎬 排期场次</Title>
        {dates.map(date => (
          <Card key={date} title={dayjs(date).format('MM月DD日 dddd')} style={{ marginBottom: 16 }}>
            {Object.entries(groupedSessions[date] || {}).map(([cinemaName, cinemaSessions]) => (
              <div key={cinemaName} style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 12 }}>
                  <EnvironmentOutlined /> {cinemaName}
                </div>
                <Row gutter={[12, 12]}>
                  {cinemaSessions.map(s => (
                    <Col key={s.id}>
                      <Card 
                        size="small" 
                        hoverable
                        onClick={() => navigate(`/sessions/${s.id}`)}
                        style={{ width: 140, textAlign: 'center' }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                          {dayjs(s.start_time).format('HH:mm')}
                        </div>
                        <div style={{ color: '#999', fontSize: 12, margin: '4px 0' }}>
                          {s.hall_name}
                        </div>
                        <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                          ¥{s.base_price}
                        </div>
                        <Tag color="blue" style={{ marginTop: 4 }}>{s.version}</Tag>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ))}
          </Card>
        ))}
      </div>

      <Card title={`📝 影评 (${reviews.length})`}>
        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无影评，快来发表第一条评论吧</div>
        ) : (
          <List
            dataSource={reviews}
            renderItem={review => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar>{review.nickname?.[0]}</Avatar>}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span>{review.nickname}</span>
                      <Rate disabled value={review.rating} style={{ fontSize: 12 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(review.created_at).format('YYYY-MM-DD HH:mm')}</Text>
                    </div>
                  }
                  description={review.content}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="写影评"
        open={reviewModal}
        onOk={submitReview}
        onCancel={() => setReviewModal(false)}
        okText="提交"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>评分：</div>
          <Rate value={rating} onChange={setRating} />
        </div>
        <div>
          <div style={{ marginBottom: 8 }}>评论内容：</div>
          <TextArea
            rows={4}
            value={reviewContent}
            onChange={e => setReviewContent(e.target.value)}
            placeholder="分享你的观影感受..."
          />
        </div>
      </Modal>
    </div>
  )
}

export default MovieDetail
