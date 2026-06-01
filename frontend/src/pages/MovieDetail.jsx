import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Button, Rate, Tag, Descriptions, List, Avatar, Spin, message, Tabs } from 'antd'
import { ShoppingCartOutlined, HeartOutlined } from '@ant-design/icons'
import { getMovieDetail, getMovieCinemas, getSchedules } from '../services/api'
import dayjs from 'dayjs'

function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [cinemas, setCinemas] = useState([])
  const [schedules, setSchedules] = useState([])
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMovieDetail()
  }, [id])

  useEffect(() => {
    if (id) {
      loadSchedules()
      loadCinemas()
    }
  }, [id, selectedDate])

  const loadMovieDetail = async () => {
    setLoading(true)
    try {
      const res = await getMovieDetail(id)
      setMovie(res.data)
    } catch (err) {
      message.error('加载电影详情失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadCinemas = async () => {
    try {
      const res = await getMovieCinemas(id, { date: selectedDate })
      setCinemas(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadSchedules = async () => {
    try {
      const res = await getSchedules({ movie_id: id, date: selectedDate })
      setSchedules(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const getDates = () => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = dayjs().add(i, 'day')
      dates.push({
        value: date.format('YYYY-MM-DD'),
        label: i === 0 ? '今天' : i === 1 ? '明天' : date.format('M月D日'),
        week: date.format('周ddd'),
      })
    }
    return dates
  }

  if (loading || !movie) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  const tabItems = [
    {
      key: 'overview',
      label: '影片介绍',
      children: (
        <div style={{ padding: '20px 0' }}>
          <Descriptions column={1}>
            <Descriptions.Item label="导演">{movie.director}</Descriptions.Item>
            <Descriptions.Item label="演员">{movie.actors}</Descriptions.Item>
            <Descriptions.Item label="类型">{movie.genres}</Descriptions.Item>
            <Descriptions.Item label="制片国家">{movie.country}</Descriptions.Item>
            <Descriptions.Item label="语言">{movie.language}</Descriptions.Item>
            <Descriptions.Item label="上映日期">{dayjs(movie.release_date).format('YYYY年M月D日')}</Descriptions.Item>
            <Descriptions.Item label="片长">{movie.duration}分钟</Descriptions.Item>
            <Descriptions.Item label="剧情简介">{movie.description}</Descriptions.Item>
          </Descriptions>
          
          <div style={{ marginTop: '30px' }}>
            <h3>用户评论</h3>
            <List
              dataSource={movie.reviews || []}
              renderItem={review => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<Avatar size="large" />} />}
                    title={
                      <div>
                        <Rate disabled defaultValue={review.rating / 2} allowHalf style={{ fontSize: '12px' }} />
                        <span style={{ marginLeft: '10px' }}>{review.rating}</span>
                      </div>
                    }
                    description={review.content}
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'cinemas',
      label: '购票',
      children: (
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            {getDates().map(date => (
              <Button
                key={date.value}
                type={selectedDate === date.value ? 'primary' : 'default'}
                onClick={() => setSelectedDate(date.value)}
              >
                <div>{date.label}</div>
                <div style={{ fontSize: '12px', color: selectedDate === date.value ? 'white' : '#666' }}>
                  {date.week}
                </div>
              </Button>
            ))}
          </div>

          <List
            dataSource={cinemas}
            renderItem={cinema => (
              <List.Item style={{ background: '#fff', borderRadius: '8px', marginBottom: '15px', padding: '20px' }}>
                <List.Item.Meta
                  title={<h3 style={{ marginBottom: '10px' }}>{cinema.name}</h3>}
                  description={
                    <div>
                      <div style={{ marginBottom: '8px', color: '#666' }}>{cinema.address}</div>
                      <div style={{ marginBottom: '10px' }}>
                        <Tag color="blue">{cinema.features}</Tag>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {schedules
                          .filter(s => s.cinema_id === cinema.id)
                          .slice(0, 6)
                          .map(schedule => (
                            <Button
                              key={schedule.id}
                              type="default"
                              onClick={() => navigate(`/schedule/${schedule.id}`)}
                              style={{ borderColor: '#e74c3c', color: '#e74c3c' }}
                            >
                              {dayjs(schedule.start_time).format('HH:mm')}
                              <br />
                              <span style={{ fontSize: '12px' }}>¥{schedule.price}</span>
                            </Button>
                          ))}
                      </div>
                    </div>
                  }
                />
                <div className="price-tag">¥{cinema.min_price}起</div>
              </List.Item>
            )}
          />
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ background: 'linear-gradient(to right, #1a1a2e, #16213e)', color: 'white', padding: '40px 0' }}>
        <div className="container">
          <Row gutter={40}>
            <Col xs={24} sm={8} md={6}>
              <img 
                src={movie.poster} 
                alt={movie.title} 
                style={{ width: '100%', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} 
              />
            </Col>
            <Col xs={24} sm={16} md={18}>
              <h1 style={{ color: 'white', fontSize: '32px', marginBottom: '20px' }}>{movie.title}</h1>
              <p style={{ fontSize: '16px', marginBottom: '20px' }}>{movie.original_title}</p>
              
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Rate disabled defaultValue={movie.rating / 2} allowHalf style={{ fontSize: '20px' }} />
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#f39c12' }}>{movie.rating}</span>
                <span style={{ color: '#aaa' }}>{movie.rating_count}人评价</span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                {movie.genres?.split(',').map(genre => (
                  <Tag key={genre} style={{ marginRight: '10px', marginBottom: '10px' }}>{genre}</Tag>
                ))}
              </div>

              <div style={{ marginBottom: '20px', color: '#ccc' }}>
                <p>{movie.country} / {movie.language}</p>
                <p>{dayjs(movie.release_date).format('YYYY年M月D日')}上映 / {movie.duration}分钟</p>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => setActiveTab('cinemas')}
                  style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', border: 'none' }}
                >
                  立即购票
                </Button>
                <Button size="large" icon={<HeartOutlined />}>
                  {movie.wish_count}人想看
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '20px' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>
    </div>
  )
}

export default MovieDetail
