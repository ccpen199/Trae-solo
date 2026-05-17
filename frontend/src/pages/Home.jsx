import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Carousel, Tag, Spin, Empty, message } from 'antd'
import { FaFire, FaHeart, FaClock, FaPlay } from 'react-icons/fa'
import { contentAPI, liveAPI } from '@/api'
import { useUserStore } from '@/store'

const { Meta } = Card

function Home() {
  const navigate = useNavigate()
  const { setCurrentAlbum, setCurrentEpisode, setPlaying } = useUserStore()
  const [banners, setBanners] = useState([])
  const [categories, setCategories] = useState([])
  const [recommendAlbums, setRecommendAlbums] = useState([])
  const [hotAlbums, setHotAlbums] = useState([])
  const [liveRooms, setLiveRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const results = await Promise.allSettled([
        contentAPI.getBanners(),
        contentAPI.getCategories(),
        contentAPI.getRecommendAlbums({ limit: 8 }),
        contentAPI.getAlbums({ limit: 8, sort: 'hot' }),
        liveAPI.getRooms({ limit: 4 })
      ])
      
      const bannersRes = results[0].status === 'fulfilled' ? results[0].value : []
      const categoriesRes = results[1].status === 'fulfilled' ? results[1].value : []
      const recommendRes = results[2].status === 'fulfilled' ? results[2].value : []
      const hotRes = results[3].status === 'fulfilled' ? results[3].value : { list: [] }
      const liveRes = results[4].status === 'fulfilled' ? results[4].value : { list: [] }

      setBanners(Array.isArray(bannersRes) ? bannersRes : [])
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : [])
      setRecommendAlbums(Array.isArray(recommendRes) ? recommendRes : [])
      setHotAlbums(hotRes?.list || (Array.isArray(hotRes) ? hotRes : []))
      setLiveRooms(liveRes?.list || (Array.isArray(liveRes) ? liveRes : []))
    } catch (error) {
      console.error('加载首页数据失败:', error)
      message.error('部分数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  const playEpisode = async (album, episode = null) => {
    try {
      setCurrentAlbum(album)
      if (episode) {
        setCurrentEpisode(episode)
      } else {
        const albumDetail = await contentAPI.getAlbumDetail(album.id)
        if (albumDetail.episodes && albumDetail.episodes.length > 0) {
          setCurrentEpisode(albumDetail.episodes[0])
        }
      }
      setPlaying(true)
    } catch (error) {
      console.error('播放失败:', error)
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
      <Carousel autoplay effect="fade" style={{ marginBottom: 32, borderRadius: 12, overflow: 'hidden' }}>
        {banners.map(banner => (
          <div key={banner.id}>
            <img
              src={banner.image}
              alt={banner.title}
              style={{ width: '100%', height: 280, objectFit: 'cover', cursor: 'pointer' }}
              onClick={() => banner.link && navigate(banner.link)}
            />
          </div>
        ))}
      </Carousel>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>分类浏览</h2>
        <Row gutter={[16, 16]}>
          {categories.slice(0, 8).map(category => (
            <Col xs={6} sm={4} md={3} key={category.id}>
              <Card
                hoverable
                className="card-hover"
                style={{ textAlign: 'center', borderRadius: 12, cursor: 'pointer' }}
                onClick={() => navigate(`/search?category=${category.id}`)}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{category.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{category.name}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaFire style={{ color: '#ff6b9d' }} /> 热门推荐
          </h2>
          <a style={{ color: '#ff6b9d', cursor: 'pointer' }} onClick={() => navigate('/search')}>查看更多 →</a>
        </div>
        <Row gutter={[16, 16]}>
          {recommendAlbums.map(album => (
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
                      style={{ height: 180, objectFit: 'cover' }}
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
                        cursor: 'pointer',
                        opacity: 0,
                        transition: 'opacity 0.3s'
                      }}
                      className="play-btn"
                      onClick={(e) => { e.stopPropagation(); playEpisode(album) }}
                    >
                      <FaPlay />
                    </div>
                    {album.is_free ? (
                      <Tag color="green" style={{ position: 'absolute', top: 8, left: 8 }}>免费</Tag>
                    ) : (
                      <Tag color="gold" style={{ position: 'absolute', top: 8, left: 8 }}>付费</Tag>
                    )}
                  </div>
                }
                onClick={() => navigate(`/album/${album.id}`)}
              >
                <Meta
                  title={<div className="ellipsis" style={{ fontSize: 14, fontWeight: 600 }}>{album.title}</div>}
                  description={
                    <div>
                      <div className="ellipsis" style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>
                        {album.author_name}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#999' }}>
                        <span><FaFire style={{ marginRight: 4 }} />{(album.play_count / 10000).toFixed(1)}万</span>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaClock style={{ color: '#ff6b9d' }} /> 正在直播
          </h2>
          <a style={{ color: '#ff6b9d', cursor: 'pointer' }} onClick={() => navigate('/live')}>查看更多 →</a>
        </div>
        {liveRooms.length > 0 ? (
          <Row gutter={[16, 16]}>
            {liveRooms.map(room => (
              <Col xs={12} sm={8} md={6} key={room.id}>
                <Card
                  hoverable
                  className="card-hover"
                  style={{ borderRadius: 12, overflow: 'hidden' }}
                  cover={
                    <div style={{ position: 'relative' }}>
                      <img
                        alt={room.title}
                        src={room.cover || `https://picsum.photos/400/225?random=${room.id}`}
                        style={{ height: 140, objectFit: 'cover' }}
                      />
                      <Tag color="red" style={{ position: 'absolute', top: 8, left: 8 }}>
                        🔴 直播中
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
          <Empty description="暂无直播" />
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaHeart style={{ color: '#ff6b9d' }} /> 热门有声剧
          </h2>
          <a style={{ color: '#ff6b9d', cursor: 'pointer' }} onClick={() => navigate('/search')}>查看更多 →</a>
        </div>
        <Row gutter={[16, 16]}>
          {hotAlbums.map(album => (
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
                      style={{ height: 180, objectFit: 'cover' }}
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
                      onClick={(e) => { e.stopPropagation(); playEpisode(album) }}
                    >
                      <FaPlay />
                    </div>
                    {album.is_free ? (
                      <Tag color="green" style={{ position: 'absolute', top: 8, left: 8 }}>免费</Tag>
                    ) : (
                      <Tag color="gold" style={{ position: 'absolute', top: 8, left: 8 }}>付费</Tag>
                    )}
                  </div>
                }
                onClick={() => navigate(`/album/${album.id}`)}
              >
                <Meta
                  title={<div className="ellipsis" style={{ fontSize: 14, fontWeight: 600 }}>{album.title}</div>}
                  description={
                    <div>
                      <div className="ellipsis" style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>
                        {album.author_name}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#999' }}>
                        <span><FaFire style={{ marginRight: 4 }} />{(album.play_count / 10000).toFixed(1)}万</span>
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
