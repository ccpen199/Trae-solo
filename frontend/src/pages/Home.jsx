import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Carousel, Row, Col, Card, Rate, Tabs, Tag, Spin, message } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import { getBanners, getMovies } from '../services/api'
import dayjs from 'dayjs'

const { Meta } = Card

function Home() {
  const navigate = useNavigate()
  const [banners, setBanners] = useState([])
  const [showingMovies, setShowingMovies] = useState([])
  const [comingMovies, setComingMovies] = useState([])
  const [activeTab, setActiveTab] = useState('showing')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [bannerRes, showingRes, comingRes] = await Promise.all([
        getBanners(),
        getMovies({ showing: 1, size: 20 }),
        getMovies({ showing: 0, size: 10 }),
      ])
      setBanners(bannerRes.data)
      setShowingMovies(showingRes.data.list || [])
      setComingMovies(comingRes.data.list || [])
    } catch (err) {
      message.error('加载数据失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getMovieStatus = (movie) => {
    if (movie.is_showing) {
      return <Tag color="green">热映中</Tag>
    }
    return <Tag color="orange">{dayjs(movie.release_date).format('M月D日')}上映</Tag>
  }

  const tabItems = [
    {
      key: 'showing',
      label: '正在热映',
      children: (
        <Row gutter={[24, 24]}>
          {showingMovies.map(movie => (
            <Col xs={12} sm={8} md={6} lg={4} key={movie.id}>
              <Card
                hoverable
                className="card-hover"
                cover={
                  <div onClick={() => navigate(`/movie/${movie.id}`)} style={{ position: 'relative' }}>
                    <img src={movie.poster} alt={movie.title} className="movie-poster" />
                    <PlayCircleOutlined 
                      style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        fontSize: '48px',
                        color: 'white',
                        opacity: 0.9
                      }} 
                    />
                  </div>
                }
                onClick={() => navigate(`/movie/${movie.id}`)}
              >
                <Meta 
                  title={movie.title} 
                  description={
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Rate disabled defaultValue={movie.rating / 2} allowHalf style={{ fontSize: '12px' }} />
                        <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{movie.rating}</span>
                      </div>
                      {getMovieStatus(movie)}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
    {
      key: 'coming',
      label: '即将上映',
      children: (
        <Row gutter={[24, 24]}>
          {comingMovies.map(movie => (
            <Col xs={12} sm={8} md={6} lg={4} key={movie.id}>
              <Card
                hoverable
                className="card-hover"
                cover={
                  <div onClick={() => navigate(`/movie/${movie.id}`)} style={{ position: 'relative' }}>
                    <img src={movie.poster} alt={movie.title} className="movie-poster" />
                  </div>
                }
                onClick={() => navigate(`/movie/${movie.id}`)}
              >
                <Meta 
                  title={movie.title} 
                  description={
                    <div>
                      <div style={{ marginBottom: '8px' }}>
                        {movie.wish_count}人想看
                      </div>
                      {getMovieStatus(movie)}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
  ]

  return (
    <Spin spinning={loading}>
      <div className="page-header">
        <div className="container">
          <h1 style={{ color: 'white', marginBottom: 0 }}>淘票票，发现好电影</h1>
        </div>
      </div>

      <div className="container">
        <Carousel autoplay style={{ marginBottom: '30px', borderRadius: '8px', overflow: 'hidden' }}>
          {banners.map(banner => (
            <div key={banner.id}>
              <img 
                src={banner.image_url} 
                alt={banner.title} 
                style={{ width: '100%', height: '300px', objectFit: 'cover' }} 
              />
            </div>
          ))}
        </Carousel>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
      </div>
    </Spin>
  )
}

export default Home
