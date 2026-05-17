import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Button, Spin, Tag, message, Card, Popconfirm } from 'antd'
import { DeleteOutlined, FileTextOutlined, EditOutlined } from '@ant-design/icons'
import useStore from '../store'
import { userApi } from '../api'
import { PageEmpty } from '../components/PageState'

const Notes = () => {
  const navigate = useNavigate()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const { isLoggedIn } = useStore()

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotes()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const data = await userApi.getUserNotes({ pageSize: 50 })
      setNotes(data?.list || [])
    } catch (error) {
      console.error('获取笔记失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await userApi.deleteNote(id)
      setNotes(prev => prev.filter(n => n.id !== id))
      message.success('已删除笔记')
    } catch (error) {
      console.error('删除失败:', error)
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
        <PageEmpty description="登录后查看您的笔记" />
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
          <FileTextOutlined style={{ color: '#faad14', marginRight: 8 }} />
          我的笔记 ({notes.length})
        </h3>
      </div>

      <List
        dataSource={notes}
        locale={{ emptyText: <PageEmpty description="还没有笔记，去阅读时添加吧" /> }}
        renderItem={item => (
          <Card
            size="small"
            style={{ marginBottom: 12 }}
            actions={[
              <Popconfirm
                title="确认删除"
                description="确定要删除这条笔记吗？"
                onConfirm={() => handleDelete(item.id)}
              >
                <Button type="text" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            ]}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>{item.book_title}</span>
                <Tag color="blue" style={{ fontSize: 10 }}>{item.chapter_title}</Tag>
              </div>
              <p style={{ color: '#666', marginBottom: 8 }}>{item.content}</p>
              <div style={{ color: '#999', fontSize: 12 }}>
                {new Date(item.created_at).toLocaleDateString()}
              </div>
            </div>
          </Card>
        )}
      />
    </div>
  )
}

export default Notes
