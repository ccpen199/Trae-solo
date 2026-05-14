import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Card, 
  List, 
  Typography, 
  Avatar, 
  Spin, 
  Result,
  Button,
  Tag,
  message,
  Modal
} from 'antd'
import { 
  UserOutlined, 
  SafetyOutlined, 
  WalletOutlined, 
  HeartOutlined,
  MessageOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import request from '../utils/request'
import useUserStore from '../store/user'

const { Title, Text } = Typography

const Settings = () => {
  const navigate = useNavigate()
  const { user, logout } = useUserStore()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [profile, setProfile] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await request.get('/user/profile')
      setProfile(res.data)
    } catch (err) {
      console.error('Load profile error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '确认退出',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        logout()
        message.success('已退出登录')
        navigate('/')
      }
    })
  }

  const menuItems = [
    {
      icon: <UserOutlined />,
      title: '个人资料',
      description: '修改昵称、头像等信息',
      action: () => navigate('/settings/profile')
    },
    {
      icon: <SafetyOutlined />,
      title: '实名认证',
      description: profile?.is_verified === 1 ? '已完成实名认证' : '完成实名认证享受更多权益',
      tag: profile?.is_verified === 1 ? (
        <Tag color="green">已认证</Tag>
      ) : (
        <Tag color="orange">未认证</Tag>
      ),
      action: () => navigate('/settings/verify')
    },
    {
      icon: <WalletOutlined />,
      title: '押金管理',
      description: `账户余额: ¥${profile?.balance?.toFixed(2) || '0.00'}`,
      action: () => navigate('/settings/deposit')
    },
    {
      icon: <HeartOutlined />,
      title: '我的收藏',
      description: '查看收藏的家电',
      action: () => navigate('/favorites')
    },
    {
      icon: <MessageOutlined />,
      title: '联系客服',
      description: '有问题请联系客服',
      action: () => message.info('客服热线: 400-1234-5678')
    }
  ]

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="个人信息加载失败，请点击重试"
        extra={
          <Button type="primary" onClick={loadData}>
            重新加载
          </Button>
        }
      />
    )
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Avatar size={80} src={profile?.avatar} icon={<UserOutlined />} />
          <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
            {profile?.nickname || '用户'}
          </Title>
          <Text type="secondary">{profile?.phone}</Text>
          <div style={{ marginTop: 16 }}>
            {profile?.is_verified === 1 ? (
              <Tag color="green" icon={<SafetyOutlined />}>已实名认证</Tag>
            ) : (
              <Tag color="orange">未实名认证</Tag>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <Title level={4} style={{ marginBottom: 16 }}>设置</Title>
        <List
          itemLayout="horizontal"
          dataSource={menuItems}
          renderItem={(item) => (
            <List.Item
              onClick={item.action}
              style={{ cursor: 'pointer' }}
              hoverable
            >
              <List.Item.Meta
                avatar={<div style={{ fontSize: 24 }}>{item.icon}</div>}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.title}
                    {item.tag}
                  </div>
                }
                description={item.description}
              />
              <Button type="text">›</Button>
            </List.Item>
          )}
        />

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button 
            danger 
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Settings
