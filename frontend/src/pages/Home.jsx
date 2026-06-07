import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Typography, Button, Input, Select, message } from 'antd'
import { SearchOutlined, EnvironmentOutlined, StarOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { movieAPI, cinemaAPI } from '../utils/api'
import MoviePoster from '../components/MoviePoster'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

function Home() {
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [cinemas, setCinemas] = useState([])
  const [city, setCity] = useState('北京')
  const [searchText, setSearchText] = useState('')

  const cities = ['北京', '上海', '广州', '深圳', '杭州']

  useEffect(() => {
    loadMovies()
    loadCinemas()
  }, [city])

  const loadMovies = async () => {
    try {
      const data = await movieAPI.list({ status: 1, pageSize: 8 })
      setMovies(data.list || [])
    } catch (e) {
      message.error('加载电影失败')
    }
  }

  const loadCinemas = async () => {
    try {
      const data = await cinemaAPI.list({ city, pageSize: 6 })
      setCinemas(data.list || [])
    } catch (e) {
      message.error('加载影院失败')
    }
  }

  const handleSearch = () => {
    if (searchText) {
      navigate(`/movies?keyword=${encodeURIComponent(searchText)}`)
    }
  }

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '60px 24px', borderRadius: 12, marginBottom: 32, color: 'white' }}>
        <Title style={{ color: 'white', marginBottom: 8 }}>发现精彩电影</Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
          全国 500+ 连锁影院，热映大片实时选座购票
        </Paragraph>
        <div style={{ display: 'flex', gap: 12, maxWidth: 600, marginTop: 24 }}>
          <Select value={city} onChange={setCity} style={{ width: 120 }} prefix={<EnvironmentOutlined />}>
            {cities.map(c => <Option key={c} value={c}>{c}</Option>)}
          </Select>
          <Input.Search
            placeholder="搜索电影、影院..."
            size="large"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>🔥 热映电影</Title>
          <Button type="link" onClick={() => navigate('/movies')}>查看全部 →</Button>
        </div>
        <Row gutter={[16, 16]}>
          {movies.map(movie => (
            <Col xs={12} sm={8} md={6} key={movie.id}>
              <Card
                hoverable
                cover={
                  <div style={{ height: 280, overflow: 'hidden' }}>
                    <MoviePoster movie={movie} height="100%" style={{ borderRadius: 0 }} />
                  </div>
                }
                onClick={() => navigate(`/movies/${movie.id}`)}
              >
                <Card.Meta
                  title={<div style={{ fontWeight: 'bold' }}>{movie.title}</div>}
                  description={
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#faad14', marginBottom: 4 }}>
                        <StarOutlined /> {movie.rating?.toFixed(1)}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{movie.duration}分钟 | {movie.country}</Text>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            <EnvironmentOutlined /> {city}附近影院
          </Title>
          <Button type="link" onClick={() => navigate('/cinemas')}>查看全部 →</Button>
        </div>
        <Row gutter={[16, 16]}>
          {cinemas.map(cinema => (
            <Col xs={24} sm={12} md={8} key={cinema.id}>
              <Card hoverable onClick={() => navigate(`/cinemas/${cinema.id}`)}>
                <Card.Meta
                  title={<div style={{ fontWeight: 'bold' }}>{cinema.name}</div>}
                  description={
                    <div>
                      <Paragraph ellipsis={{ rows: 1 }} style={{ marginBottom: 8, color: '#666' }}>
                        {cinema.address}
                      </Paragraph>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {cinema.equipment_types?.split(',').map(eq => (
                          <span key={eq} style={{ padding: '2px 8px', background: '#e6f7ff', color: '#1890ff', borderRadius: 4, fontSize: 12 }}>
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}

export default Home
