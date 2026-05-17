import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Card, 
  List, 
  Avatar, 
  Button, 
  Statistic, 
  Row, 
  Col, 
  Tag, 
  message,
  Modal,
  Spin
} from 'antd'
import {
  UserOutlined,
  CloudOutlined,
  HeartOutlined,
  FileTextOutlined,
  MessageOutlined,
  CrownOutlined,
  LogoutOutlined,
  TrophyOutlined,
  GiftOutlined,
  QuestionCircleOutlined,
  SettingOutlined
} from '@ant-design/icons'
import useStore from '../store'
import { userApi } from '../api'
import { PageEmpty } from '../components/PageState'

const { confirm } = Modal

const Profile = () => {
  const navigate = useNavigate()
  const { user, logout, isLoggedIn } = useStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await userApi.getReadingStats()
      setStats(data)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      onOk: () => {
        logout()
        message.success('已退出登录')
        navigate('/login')
      }
    })
  }

  const menuItems = [
    {
      key: 'cloud-library',
      icon: <CloudOutlined />,
      title: '云书馆',
      desc: '我的藏书',
      path: '/cloud-library',
      color: '#1890ff'
    },
    {
      key: 'wishlist',
      icon: <HeartOutlined />,
      title: '心愿单',
      desc: '想看的书',
      path: '/wishlist',
      color: '#eb2f96'
    },
    {
      key: 'notes',
      icon: <FileTextOutlined />,
      title: '我的笔记',
      desc: '阅读心得',
      path: '/notes',
      color: '#faad14'
    },
    {
      key: 'messages',
      icon: <MessageOutlined />,
      title: '消息中心',
      desc: '系统通知',
      path: '/messages',
      color: '#52c41a'
    },
    {
      key: 'vip',
      icon: <CrownOutlined />,
      title: 'VIP会员',
      desc: '专属特权',
      path: '/vip',
      color: '#fa8c16'
    },
    {
      key: 'tasks',
      icon: <TrophyOutlined />,
      title: '任务中心',
      desc: '赚积分',
      path: '/vip',
      color: '#722ed1'
    },
    {
      key: 'gift',
      icon: <GiftOutlined />,
      title: '兑换礼包',
      desc: '福利中心',
      path: '/vip',
      color: '#13c2c2'
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      title: '帮助反馈',
      desc: '问题咨询',
      path: '/vip',
      color: '#f5222d'
    }
  ]

  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
      }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>📚</div>
        <h2 style={{ marginBottom: 16 }}>登录后查看更多</h2>
        <p style={{ color: '#999', marginBottom: 24 }}>登录后可同步阅读记录、收藏喜欢的书籍</p>
        <Button type="primary" size="large" onClick={() => navigate('/login')}>
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
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar 
            size={64} 
            icon={<UserOutlined />}
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          />
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: 4, fontSize: 18 }}>
              {user?.nickname || user?.username}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user?.is_vip ? (
                <Tag color="gold" icon={<CrownOutlined />}>VIP会员</Tag>
              ) : (
                <Tag color="default">普通用户</Tag>
              )}
            </div>
          </div>
          <Button 
            type="text" 
            icon={<SettingOutlined />}
            onClick={handleLogout}
          />
        </div>
      </Card>

      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="借阅书籍"
              value={stats?.borrowCount || 0}
              valueStyle={{ color: '#1890ff', fontSize: 20 }}
              prefix={<BookOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="阅读分钟"
              value={stats?.readMinutes || 0}
              valueStyle={{ color: '#52c41a', fontSize: 20 }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="笔记数量"
              value={stats?.noteCount || 0}
              valueStyle={{ color: '#faad14', fontSize: 20 }}
              prefix={<FileTextOutlined />}
            />
          </Col>
        </Row>
      </Card>

      <List
        grid={{ gutter: 12, column: 4 }}
        dataSource={menuItems}
        renderItem={item => (
          <List.Item onClick={() => navigate(item.path)} style={{ cursor: 'pointer' }}>
            <div style={{ 
              textAlign: 'center', 
              padding: '16px 8px',
              background: `${item.color}10`,
              borderRadius: 12,
              transition: 'all 0.3s'
            }}>
              <div style={{ 
                fontSize: 24, 
                color: item.color,
                marginBottom: 8
              }}>
                {item.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</div>
            </div>
          </List.Item>
        )}
      />

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button 
          type="text" 
          danger 
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          退出登录
        </Button>
      </div>
    </div>
  )
}

export default Profile
