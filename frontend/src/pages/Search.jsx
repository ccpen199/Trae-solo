import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Tabs, List, Tag, Button, Spin, Empty, Card, Space } from 'antd'
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import useStore from '../store'
import { bookApi, searchApi } from '../api'

const { Search: SearchInput } = Input

const SearchPage = () => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [searchHistory, setSearchHistory] = useState([])
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const { isLoggedIn } = useStore()

  useEffect(() => {
    if (isLoggedIn) {
      fetchSearchHistory()
    }
  }, [isLoggedIn])

  const fetchSearchHistory = async () => {
    try {
      const data = await searchApi.getHistory()
      setSearchHistory(data?.history || [])
    } catch (error) {
      console.error('获取搜索历史失败:', error)
    }
  }

  const handleSearch = async (value) => {
    if (!value.trim()) return
    
    setKeyword(value)
    setLoading(true)
    setHasSearched(true)
    
    try {
      if (isLoggedIn) {
        await searchApi.saveHistory(value)
        setSearchHistory(prev => {
          const newHistory = [value, ...prev.filter(h => h !== value)]
          return newHistory.slice(0, 20)
        })
      }

      const data = await bookApi.getBooks({ keyword: value, pageSize: 50 })
      setBooks(data?.list || [])
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = async () => {
    try {
      await searchApi.clearHistory()
      setSearchHistory([])
    } catch (error) {
      console.error('清空搜索历史失败:', error)
    }
  }

  const handleDeleteHistory = (item) => {
    setSearchHistory(prev => prev.filter(h => h !== item))
  }

  const handleBookClick = (book) => {
    navigate(`/book/${book.id}`)
  }

  const categories = [
    { name: '小说', icon: '📖' },
    { name: '文学', icon: '📚' },
    { name: '历史', icon: '🏛️' },
    { name: '哲学', icon: '🧠' },
    { name: '科技', icon: '🔬' },
    { name: '经济', icon: '💰' },
    { name: '艺术', icon: '🎨' },
    { name: '教育', icon: '📝' }
  ]

  const tabItems = [
    {
      key: 'recommend',
      label: '推荐',
      children: (
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 16, fontWeight: 500 }}>热门分类</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: 16 
            }}>
              {categories.map(cat => (
                <Card
                  key={cat.name}
                  size="small"
                  onClick={() => handleSearch(cat.name)}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{cat.icon}</div>
                  <div style={{ fontSize: 12 }}>{cat.name}</div>
                </Card>
              ))}
            </div>
          </div>

          {isLoggedIn && searchHistory.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontWeight: 500 }}>搜索历史</h4>
                <Button 
                  type="text" 
                  size="small" 
                  icon={<DeleteOutlined />}
                  onClick={handleClearHistory}
                >
                  清空
                </Button>
              </div>
              <Space wrap size={[8, 8]}>
                {searchHistory.map((item, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={(e) => {
                      e.preventDefault()
                      handleDeleteHistory(item)
                    }}
                    onClick={() => handleSearch(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    {item}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'results',
      label: '结果',
      children: (
        <div style={{ padding: '16px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" tip="搜索中..." />
            </div>
          ) : books.length > 0 ? (
            <List
              dataSource={books}
              renderItem={book => (
                <List.Item onClick={() => handleBookClick(book)} style={{ cursor: 'pointer' }}>
                  <Card size="small" style={{ width: '100%' }}>
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
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{book.title}</div>
                        <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>{book.author}</div>
                        <div style={{ color: '#666', fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {book.description}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          {book.is_free && <Tag color="green" style={{ fontSize: 10 }}>免费</Tag>}
                          <Tag color="blue" style={{ fontSize: 10 }}>{book.category}</Tag>
                        </div>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          ) : hasSearched ? (
            <Empty description="未找到相关书籍" />
          ) : (
            <Empty description="请输入关键词搜索" />
          )}
        </div>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <SearchInput
          placeholder="搜索书籍、作者..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          onChange={(e) => setKeyword(e.target.value)}
          value={keyword}
        />
      </div>

      <Tabs
        activeKey={hasSearched && keyword ? 'results' : 'recommend'}
        onChange={() => setHasSearched(false)}
        items={tabItems}
      />
    </div>
  )
}

export default SearchPage
