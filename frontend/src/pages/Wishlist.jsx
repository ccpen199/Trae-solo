import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Button, Spin, Empty, Tag, message, Card } from 'antd'
import { DeleteOutlined, BookOutlined, HeartOutlined } from '@ant-design/icons'
import useStore from '../store'
import { userApi } from '../api'
import { PageEmpty } from '../components/PageState'

const Wishlist = () => {
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const { isLoggedIn } = useStore()

  useEffect(() => {
    if (isLoggedIn) {
      fetchBooks()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn])

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const data = await userApi.getWishlist({ pageSize: 50 })
      setBooks(data?.list || [])
    } catch (error) {
      console.error('获取心愿单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (bookId, e) => {
    e.stopPropagation()
    try {
      await userApi.removeFromWishlist(bookId)
      setBooks(prev => prev.filter(b => b.book_id !== bookId))
      message.success('已从心愿单移除')
    } catch (error) {
      console.error('移除失败:', error)
    }
  }

  const handleAddToCloudLibrary = async (bookId, e) => {
    e.stopPropagation()
    try {
      await userApi.addToCloudLibrary(bookId)
      message.success('已加入云书馆')
    } catch (error) {
      console.error('加入失败:', error)
    }
  }

  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <PageEmpty description="登录后查看您的心愿单" />
        <Button type="primary" onClick={() => navigate('/login')} style={{ marginTop: 16 }}>
          立即登录
        </Button>
      </div>
    )
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
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 'bold', margin: 0 }}>
          <HeartOutlined style={{ color: '#eb2f96', marginRight: 8 }} />
          心愿单 ({books.length})
        </h3>
      </div>

      <List
        dataSource={books}
        locale={{ emptyText: <PageEmpty description="心愿单为空，去收藏一些书籍吧" /> }}
        renderItem={item => (
          <Card
            size="small"
            style={{ marginBottom: 12, cursor: 'pointer' }}
            onClick={() => navigate(`/book/${item.book_id}`)}
            actions={[
              <Button 
                type="text" 
                icon={<BookOutlined />}
                onClick={(e) => { e.stopPropagation(); handleAddToCloudLibrary(item.book_id, e) }}
              >
                加入云书馆
              </Button>,
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                onClick={(e) => handleRemove(item.book_id, e)}
              >
                移除
              </Button>
            ]}
          >
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{
                width: 60,
                height: 90,
                borderRadius: 6,
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
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>{item.author}</div>
                <div>
                  {item.is_free && (
                    <Tag color="green" style={{ fontSize: 10, padding: '0 4px' }}>
                      免费
                    </Tag>
                  )}
                  {item.category && (
                    <Tag color="blue" style={{ fontSize: 10, padding: '0 4px' }}>
                      {item.category}
                    </Tag>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      />
    </div>
  )
}

export default Wishlist
