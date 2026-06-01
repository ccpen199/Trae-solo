import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Descriptions, List, Button, Tag, Spin, message, Tabs } from 'antd'
import { PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { getCinemaDetail, getCinemaMovies, getSchedules } from '../services/api'
import dayjs from 'dayjs'

function CinemaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cinema, setCinema] = useState(null)
  const [movies, setMovies] = useState([])
  const [schedules, setSchedules] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCinemaDetail()
    loadMovies()
  }, [id])

  useEffect(() => {
    if (selectedMovie) {
      loadSchedules()
    }
  }, [id, selectedMovie, selectedDate])

  const loadCinemaDetail = async () => {
    setLoading(true)
    try {
      const res = await getCinemaDetail(id)
      setCinema(res.data)
    } catch (err) {
      message.error('加载影院详情失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMovies = async () => {
    try {
      const res = await getCinemaMovies(id)
      setMovies(res.data)
      if (res.data.length > 0) {
        setSelectedMovie(res.data[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadSchedules = async () => {
    try {
      const res = await getSchedules({ cinema_id: id, movie_id: selectedMovie, date: selectedDate })
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
      })
    }
    return dates
  }

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const hallName = schedule.hall_name
    if (!acc[hallName]) {
      acc[hallName] = []
    }
    acc[hallName].push(schedule)
    return acc
  }, {})

  if (loading || !cinema) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  const selectedMovieInfo = movies.find(m => m.id === selectedMovie)

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1 style={{ color: 'white', marginBottom: '10px' }}>{cinema.name}</h1>
          <div style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', gap: '20px' }}>
            <span><EnvironmentOutlined style={{ marginRight: '5px' }} />{cinema.address}</span>
            <span><PhoneOutlined style={{ marginRight: '5px' }} />{cinema.phone}</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '30px' }}>
        <Tabs
          defaultActiveKey="movies"
          items={[
            {
              key: 'movies',
              label: '正在热映',
              children: (
                <div>
                  <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {movies.map(movie => (
                      <Button
                        key={movie.id}
                        type={selectedMovie === movie.id ? 'primary' : 'default'}
                        onClick={() => setSelectedMovie(movie.id)}
                        size="large"
                      >
                        {movie.title}
                      </Button>
                    ))}
                  </div>

                  {selectedMovieInfo && (
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                      <Row gutter={20}>
                        <Col xs={6} sm={4}>
                          <img src={selectedMovieInfo.poster} alt={selectedMovieInfo.title} style={{ width: '100%', borderRadius: '4px' }} />
                        </Col>
                        <Col xs={18} sm={20}>
                          <h3 style={{ marginBottom: '10px' }}>{selectedMovieInfo.title}</h3>
                          <p style={{ color: '#666', marginBottom: '10px' }}>
                            {selectedMovieInfo.genres} / {selectedMovieInfo.duration}分钟
                          </p>
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            {getDates().map(date => (
                              <Button
                                key={date.value}
                                type={selectedDate === date.value ? 'primary' : 'default'}
                                onClick={() => setSelectedDate(date.value)}
                              >
                                {date.label}
                              </Button>
                            ))}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {Object.entries(groupedSchedules).map(([hallName, hallSchedules]) => (
                    <div key={hallName} style={{ marginBottom: '20px' }}>
                      <h4 style={{ marginBottom: '15px', color: '#333' }}>{hallName}</h4>
                      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        {hallSchedules.map(schedule => (
                          <Button
                            key={schedule.id}
                            type="default"
                            onClick={() => navigate(`/schedule/${schedule.id}`)}
                            style={{
                              minWidth: '120px',
                              height: 'auto',
                              padding: '10px',
                              borderColor: '#e74c3c',
                              color: '#e74c3c',
                            }}
                          >
                            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                              {dayjs(schedule.start_time).format('HH:mm')}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {dayjs(schedule.start_time).format('HH:mm')}散场
                            </div>
                            <div style={{ fontSize: '14px', marginTop: '5px' }}>
                              ¥{schedule.price}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              key: 'info',
              label: '影院介绍',
              children: (
                <div style={{ background: '#fff', borderRadius: '8px', padding: '20px' }}>
                  <Descriptions column={1}>
                    <Descriptions.Item label="影院名称">{cinema.name}</Descriptions.Item>
                    <Descriptions.Item label="详细地址">{cinema.address}</Descriptions.Item>
                    <Descriptions.Item label="联系电话">{cinema.phone}</Descriptions.Item>
                    <Descriptions.Item label="特色服务">
                      <Tag color="blue">{cinema.features}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="最低票价" className="price-tag">
                      ¥{cinema.min_price}起
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}

export default CinemaDetail
