import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Carousel, Tag, Spin, Empty, Button } from 'antd'
import { SearchOutlined, FireOutlined, BookOutlined } from '@ant-design/icons'
import useStore from '../store'
import { bookApi } from '../api'
import { PageEmpty } from '../components/PageState'

const { Meta } = Card

const Home = () => {
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [recommendBooks, setRecommendBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const { user, isLoggedIn } = useStore()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [booksData, recommendData, categoriesData] = await Promise.all([
        bookApi.getBooks({ page: 1, pageSize: 10, sort: 'borrow_count' }),
        bookApi.getRecommendBooks(6),
        bookApi.getCategories()
      ])
      
      setBooks(booksData?.list || [])
      setRecommendBooks(recommendData?.books || [])
      setCategories(categoriesData?.categories || [])
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const banners = [
    {
      id: 1,
      title: '新书首发',
      description: '本周热门新书推荐',
      color: '#1890ff'
    },
    {
      id: 2,
      title: '会员专享',
      description: '开通VIP，畅享全站图书',
      color: '#eb2f96'
    },
    {
      id: 3,
      title: '限时免费',
      description: '精选好书，限时免费阅读',
      color: '#52c41a'
    }
  ]

  const handleBookClick = (book) => {
    navigate(`/book/${book.id}`)
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div className="page-content" style={{ paddingBottom: 100 }}>
      <div style={{ marginBottom: 16 }}>
        <Card 
          size="small"
          onClick={() => navigate('/search')}
          style={{ 
            cursor: 'pointer', 
            background: '#f5f5f5',
            border: 'none',
            borderRadius: 20
          }}
          bodyStyle={{ padding: '8px 16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', color: '#999' }}>
            <SearchOutlined style={{ marginRight: 8 }} />
            <span>搜索书籍、作者...</span>
          </div>
        </Card>
      </div>

      <Carousel style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden' }}>
        {banners.map(banner => (
          <div key={banner.id} onClick={() => navigate('/vip')} style={{ cursor: 'pointer' }}>
            <div style={{
              height: 160,
              background: `linear-gradient(135deg, ${banner.color} 0%, ${banner.color}cc 100%)`,
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff'
            }}>
              <div>
                <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
                  {banner.title}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                  {banner.description}
                </p>
              </div>
              <div style={{ fontSize: 60, opacity: 0.3 }}>📚</div>
            </div>
          </div>
        ))}
      </Carousel>

      <div style={{ marginBottom: 24 }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 'bold', margin: 0 }}>
            <FireOutlined style={{ color: '#faad14', marginRight: 8 }} />
            热门借阅
          </h3>
          <Button type="text" size="small" onClick={() => navigate('/search')}>
            更多
          </Button>
        </div>

        <List
          grid={{ gutter: 12, column: 3 }}
          dataSource={books}
          locale={{ emptyText: <PageEmpty description="暂无书籍" /> }}
          renderItem={book => (
            <List.Item onClick={() => handleBookClick(book)} style={{ cursor: 'pointer' }}>
              <div>
                <div style={{
                  aspectRatio: '2/3',
                  borderRadius: 8,
                  overflow: 'hidden',
                  marginBottom: 8,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 32
                }}>
                  📖
                </div>
                <div className="text-ellipsis" style={{ fontWeight: 500, fontSize: 14 }}>
                  {book.title}
                </div>
                <div className="text-ellipsis" style={{ color: '#999', fontSize: 12 }}>
                  {book.author}
                </div>
                {book.is_free && (
                  <Tag color="green" style={{ marginTop: 4, fontSize: 10, padding: '0 4px' }}>
                    免费
                  </Tag>
                )}
              </div>
            </List.Item>
          )}
        />
      </div>

      <div>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 'bold', margin: 0 }}>
            <BookOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            精选推荐
          </h3>
          <Button type="text" size="small" onClick={() => navigate('/search')}>
            更多
          </Button>
        </div>

        <List
          dataSource={recommendBooks}
          locale={{ emptyText: <PageEmpty description="暂无推荐" /> }}
          renderItem={book => (
            <List.Item onClick={() => handleBookClick(book)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 60,
                  height: 90,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                  flexShrink: 0
                }}>
                  📖
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{book.title}</div>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>{book.author}</div>
                  <div className="text-two-lines" style={{ color: '#666', fontSize: 12 }}>
                    {book.description}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {book.is_free && (
                      <Tag color="green" style={{ fontSize: 10, padding: '0 4px' }}>
                        免费
                      </Tag>
                    )}
                    <Tag color="blue" style={{ fontSize: 10, padding: '0 4px' }}>
                      {book.borrow_count || 0} 人借阅
                    </Tag>
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>
    </div>
  )
}

export default Home
