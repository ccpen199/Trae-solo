import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Typography, Input, Pagination, message } from 'antd'
import { SearchOutlined, StarOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { movieAPI } from '../utils/api'
import MoviePoster from '../components/MoviePoster'

const { Title, Text } = Typography

function Movies() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')

  useEffect(() => {
    loadMovies()
  }, [page, keyword])

  const loadMovies = async () => {
    try {
      const data = await movieAPI.list({ status: 1, page, pageSize: 12, keyword })
      setMovies(data.list || [])
      setTotal(data.total || 0)
    } catch (e) {
      message.error('加载失败')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>🎬 热映电影</Title>
        <Input.Search
          placeholder="搜索电影..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onSearch={() => setPage(1)}
          style={{ width: 300 }}
        />
      </div>

      <Row gutter={[16, 16]}>
        {movies.map(movie => (
          <Col xs={12} sm={8} md={6} key={movie.id}>
            <Card
              hoverable
              cover={
                <div style={{ height: 320, overflow: 'hidden' }}>
                  <MoviePoster movie={movie} height="100%" style={{ borderRadius: 0 }} />
                </div>
              }
              onClick={() => navigate(`/movies/${movie.id}`)}
            >
              <Card.Meta
                title={<div style={{ fontWeight: 'bold', fontSize: 16 }}>{movie.title}</div>}
                description={
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#faad14', margin: '8px 0' }}>
                      <StarOutlined /> <span style={{ fontSize: 16 }}>{movie.rating?.toFixed(1)}</span>
                    </div>
                    <Text type="secondary">{movie.duration}分钟 | {movie.country} | {movie.versions}</Text>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {movies.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          暂无电影数据
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Pagination
          current={page}
          total={total}
          pageSize={12}
          onChange={setPage}
          showSizeChanger={false}
        />
      </div>
    </div>
  )
}

export default Movies
