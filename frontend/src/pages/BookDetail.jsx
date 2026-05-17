import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Tag, Descriptions, List, message, Spin, Space, Divider, Modal } from 'antd'
import { 
  HeartOutlined, 
  HeartFilled, 
  BookOutlined, 
  CloudOutlined,
  ShareAltOutlined,
  CheckOutlined
} from '@ant-design/icons'
import useStore from '../store'
import { bookApi, borrowApi, userApi } from '../api'
import { PageEmpty } from '../components/PageState'

const { confirm } = Modal

const BookDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [isBorrowed, setIsBorrowed] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const { isLoggedIn, user } = useStore()

  useEffect(() => {
    if (id) {
      fetchBookDetail()
    }
  }, [id])

  useEffect(() => {
    if (id && isLoggedIn) {
      checkBorrowStatus()
      checkWishlistStatus()
    }
  }, [id, isLoggedIn])

  const fetchBookDetail = async () => {
    try {
      setLoading(true)
      const data = await bookApi.getBookDetail(id)
      setBook(data)
      setChapters(data?.chapters || [])
    } catch (error) {
      console.error('获取书籍详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkBorrowStatus = async () => {
    try {
      const data = await borrowApi.checkStatus(id)
      setIsBorrowed(data?.isBorrowed || false)
    } catch (error) {
      console.error('检查借阅状态失败:', error)
    }
  }

  const checkWishlistStatus = async () => {
    try {
      const data = await userApi.checkWishlist(id)
      setIsInWishlist(data?.inWishlist || false)
    } catch (error) {
      console.error('检查心愿单状态失败:', error)
    }
  }

  const handleBorrow = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }

    try {
      await borrowApi.borrowBook(id)
      setIsBorrowed(true)
      message.success('借阅成功！')
    } catch (error) {
      console.error('借阅失败:', error)
    }
  }

  const handleToggleWishlist = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }

    try {
      if (isInWishlist) {
        await userApi.removeFromWishlist(id)
        setIsInWishlist(false)
        message.success('已从心愿单移除')
      } else {
        await userApi.addToWishlist(id)
        setIsInWishlist(true)
        message.success('已加入心愿单')
      }
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  const handleAddToCloudLibrary = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }

    try {
      await userApi.addToCloudLibrary(id)
      message.success('已加入云书馆')
    } catch (error) {
      console.error('加入云书馆失败:', error)
    }
  }

  const handleRead = (chapter) => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }

    if (!isBorrowed) {
      confirm({
        title: '需要借阅',
        content: '阅读本书需要先借阅，是否立即借阅？',
        onOk: handleBorrow
      })
      return
    }

    navigate(`/reader/${book.id}/${chapter?.id || chapters[0]?.id}`)
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!book) {
    return <PageEmpty description="书籍不存在" />
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{
        padding: 24,
        background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)'
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{
            width: 120,
            height: 180,
            borderRadius: 8,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 48,
            flexShrink: 0,
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
          }}>
            📖
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
              {book.title}
            </h2>
            <p style={{ color: '#666', marginBottom: 8 }}>
              作者：{book.author}
            </p>
            <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
              {book.is_free && <Tag color="green">免费</Tag>}
              {book.category && <Tag color="blue">{book.category}</Tag>}
              <Tag color="orange">{book.borrow_count || 0} 人借阅</Tag>
            </Space>
            <Space size="small">
              <Button 
                size="small" 
                icon={isInWishlist ? <HeartFilled style={{ color: '#eb2f96' }} /> : <HeartOutlined />}
                onClick={handleToggleWishlist}
              >
                {isInWishlist ? '已收藏' : '收藏'}
              </Button>
              <Button size="small" icon={<ShareAltOutlined />}>分享</Button>
            </Space>
          </div>
        </div>
      </div>

      <div className="page-content">
        <Card size="small" style={{ marginBottom: 16 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="出版社">{book.publisher || '未知'}</Descriptions.Item>
            <Descriptions.Item label="出版日期">{book.publish_date || '未知'}</Descriptions.Item>
            <Descriptions.Item label="页数">{book.pages || '未知'}</Descriptions.Item>
            <Descriptions.Item label="字数">{book.word_count || '未知'}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card size="small" title="简介" style={{ marginBottom: 16 }}>
          <p style={{ color: '#666', lineHeight: 1.8 }}>
            {book.description || '暂无简介'}
          </p>
        </Card>

        <Card 
          size="small" 
          title="目录" 
          extra={<Button type="text" size="small">全部</Button>}
          style={{ marginBottom: 16 }}
        >
          <List
            dataSource={chapters.slice(0, 5)}
            renderItem={(chapter, index) => (
              <List.Item
                onClick={() => handleRead(chapter)}
                style={{ cursor: 'pointer' }}
              >
                <List.Item.Meta
                  avatar={<span style={{ color: '#999' }}>{index + 1}</span>}
                  title={chapter.title}
                />
              </List.Item>
            )}
          />
          {chapters.length === 0 && (
            <PageEmpty description="暂无章节" />
          )}
        </Card>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        background: '#fff',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        display: 'flex',
        gap: 12,
        zIndex: 100
      }}>
        <Button 
          size="large" 
          icon={<CloudOutlined />}
          onClick={handleAddToCloudLibrary}
          style={{ flex: 1 }}
        >
          加入云书馆
        </Button>
        {isBorrowed ? (
          <Button 
            type="primary" 
            size="large" 
            icon={<BookOutlined />}
            onClick={() => handleRead(null)}
            style={{ flex: 2 }}
          >
            开始阅读
          </Button>
        ) : (
          <Button 
            type="primary" 
            size="large" 
            onClick={handleBorrow}
            style={{ flex: 2 }}
          >
            免费借阅
          </Button>
        )}
      </div>
    </div>
  )
}

export default BookDetail
