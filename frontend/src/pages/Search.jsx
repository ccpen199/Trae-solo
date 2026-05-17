import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input, Card, Row, Col, Tag, Empty, Spin, message } from 'antd'
import { FaSearch, FaPlay } from 'react-icons/fa'
import { contentAPI } from '@/api'
import { useUserStore } from '@/store'

const { Meta } = Card

function Search() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setCurrentAlbum, setCurrentEpisode, setPlaying } = useUserStore()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState(searchParams.get('q') || '')

  useEffect(() => {
    if (searchParams.get('q')) {
      doSearch(searchParams.get('q'))
    }
  }, [searchParams])

  const doSearch = async (q) => {
    try {
      setLoading(true)
      const result = await contentAPI.getAlbums({ keyword: q, limit: 50 })
      setAlbums(result.list || [])
    } catch (error) {
      message.error('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (keyword.trim()) {
      navigate(`/search?q=${encodeURIComponent(keyword.trim())}`)
    }
  }

  const playAlbum = (album) => {
    setCurrentAlbum(album)
    if (album.episodes?.[0]) {
      setCurrentEpisode(album.episodes[0])
    }
    setPlaying(true)
  }

  return (
    <div>
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <form onSubmit={handleSearch}>
          <Input.Search
            size="large"
            placeholder="搜索有声剧、主播..."
            enterButton={<FaSearch />}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={{ borderRadius: 24 }}
          />
        </form>
      </Card>

      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : albums.length > 0 ? (
        <Row gutter={[16, 16]}>
          {albums.map(album => (
            <Col xs={12} sm={8} md={6} lg={4} key={album.id}>
              <Card
                hoverable
                className="card-hover"
                style={{ borderRadius: 12, overflow: 'hidden' }}
                cover={
                  <div style={{ position: 'relative' }}>
                    <img
                      alt={album.title}
                      src={album.cover}
                      style={{ height: 180, objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => navigate(`/album/${album.id}`)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'rgba(255, 107, 157, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => { e.stopPropagation(); playAlbum(album) }}
                    >
                      <FaPlay />
                    </div>
                    <Tag color={album.is_free ? 'green' : 'gold'} style={{ position: 'absolute', top: 8, left: 8 }}>
                      {album.is_free ? '免费' : '付费'}
                    </Tag>
                  </div>
                }
                onClick={() => navigate(`/album/${album.id}`)}
              >
                <Meta
                  title={<div className="ellipsis" style={{ fontSize: 14, fontWeight: 600 }}>{album.title}</div>}
                  description={
                    <div>
                      <div className="ellipsis" style={{ color: '#999', fontSize: 12 }}>
                        {album.author_name}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="没有找到相关内容，换个关键词试试吧~" />
      )}
    </div>
  )
}

export default Search
