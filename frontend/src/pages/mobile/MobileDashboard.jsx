import React, { useState } from 'react'
import {
  Card,
  Space,
  Typography,
  Avatar,
  List,
  Badge,
  Divider,
  Skeleton
} from 'antd'
import {
  PlusOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
  UserOutlined,
  BellOutlined,
  RightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import MobilePage from '../../components/MobilePage'
import DataCard from '../../components/DataCard'
import StatusBadge from '../../components/StatusBadge'

const { Text, Title } = Typography

const MobileDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const quickActions = [
    {
      icon: <PlusOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
      title: '发布岗位',
      color: '#1677ff',
      path: '/m/jobs'
    },
    {
      icon: <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      title: '查看简历',
      color: '#52c41a',
      path: '/m/candidates'
    },
    {
      icon: <CalendarOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      title: '今日面试',
      color: '#722ed1',
      path: '/interviews'
    },
    {
      icon: <BarChartOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      title: '数据统计',
      color: '#fa8c16',
      path: '/analytics'
    }
  ]

  const todoList = [
    {
      id: 1,
      type: 'interview',
      title: '张三 - 前端开发工程师',
      time: '10:00 - 11:00',
      status: 'pending'
    },
    {
      id: 2,
      type: 'offer',
      title: '李四 - Offer待发送',
      time: '今天 14:00前',
      status: 'pending'
    },
    {
      id: 3,
      type: 'review',
      title: '王五 - 简历待审核',
      time: '今天 18:00前',
      status: 'pending'
    }
  ]

  const statCards = [
    {
      icon: <FileTextOutlined />,
      title: '今日投递',
      value: 36,
      changeRate: 12.5,
      color: '#1677ff'
    },
    {
      icon: <UserOutlined />,
      title: '待面试',
      value: 8,
      changeRate: -3.2,
      color: '#722ed1'
    },
    {
      icon: <BellOutlined />,
      title: '待处理',
      value: 15,
      changeRate: 8.3,
      color: '#fa8c16'
    }
  ]

  const handleQuickAction = (path) => {
    navigate(path)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '早上好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }

  return (
    <MobilePage
      title=""
      showBack={false}
      rightExtra={
        <Badge count={3} size="small">
          <BellOutlined style={{ fontSize: 20, color: '#666' }} />
        </Badge>
      }
    >
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Card
          style={{
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
            border: 'none'
          }}
          styles={{ body: {  padding: 20 } }}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar
                size={56}
                icon={<UserOutlined />}
                style={{ background: '#fff', color: '#1677ff' }}
              />
              <Space direction="vertical" size={4} style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                  {getGreeting()}
                </Text>
                <Title
                  level={4}
                  style={{ margin: 0, color: '#fff', fontSize: 20 }}
                >
                  HR 李明
                </Title>
              </Space>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 8
              }}
            >
              <div style={{ textAlign: 'center', flex: 1 }}>
                <Text
                  style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11 }}
                >
                  今日新增
                </Text>
                <div
                  style={{
                    color: '#fff',
                    fontSize: 24,
                    fontWeight: 600,
                    marginTop: 4
                  }}
                >
                  36
                </div>
              </div>
              <div
                style={{
                  width: 1,
                  background: 'rgba(255,255,255,0.3)',
                  margin: '0 16px'
                }}
              />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <Text
                  style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11 }}
                >
                  面试安排
                </Text>
                <div
                  style={{
                    color: '#fff',
                    fontSize: 24,
                    fontWeight: 600,
                    marginTop: 4
                  }}
                >
                  5
                </div>
              </div>
              <div
                style={{
                  width: 1,
                  background: 'rgba(255,255,255,0.3)',
                  margin: '0 16px'
                }}
              />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <Text
                  style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11 }}
                >
                  待处理
                </Text>
                <div
                  style={{
                    color: '#fff',
                    fontSize: 24,
                    fontWeight: 600,
                    marginTop: 4
                  }}
                >
                  12
                </div>
              </div>
            </div>
          </Space>
        </Card>

        <Card
          style={{ borderRadius: 12 }}
          styles={{ body: {  padding: 16 } }}
          title={
            <Text strong style={{ fontSize: 15 }}>
              快捷操作
            </Text>
          }
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12
            }}
          >
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={() => handleQuickAction(action.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '8px 4px'
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${action.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 6
                  }}
                >
                  {action.icon}
                </div>
                <Text style={{ fontSize: 12, color: '#333' }}>
                  {action.title}
                </Text>
              </div>
            ))}
          </div>
        </Card>

        <Card
          style={{ borderRadius: 12 }}
          styles={{ body: {  padding: 0 } }}
          title={
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 16px'
              }}
            >
              <Text strong style={{ fontSize: 15 }}>
                今日待办
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                查看全部 <RightOutlined style={{ fontSize: 10 }} />
              </Text>
            </div>
          }
        >
          {loading ? (
            <List
              itemLayout="horizontal"
              dataSource={[1, 2, 3]}
              renderItem={() => (
                <List.Item>
                  <Skeleton avatar paragraph={{ rows: 1 }} active />
                </List.Item>
              )}
            />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={todoList}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: '12px 16px' }}
                  onClick={() => navigate(`/interviews/${item.id}`)}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background:
                            item.type === 'interview'
                              ? '#722ed115'
                              : item.type === 'offer'
                              ? '#52c41a15'
                              : '#fa8c1615',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color:
                            item.type === 'interview'
                              ? '#722ed1'
                              : item.type === 'offer'
                              ? '#52c41a'
                              : '#fa8c16'
                        }}
                      >
                        {item.type === 'interview' ? (
                          <CalendarOutlined />
                        ) : item.type === 'offer' ? (
                          <FileTextOutlined />
                        ) : (
                          <UserOutlined />
                        )}
                      </div>
                    }
                    title={
                      <Text style={{ fontSize: 14, fontWeight: 500 }}>
                        {item.title}
                      </Text>
                    }
                    description={
                      <Space size={8} align="center">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.time}
                        </Text>
                        <StatusBadge
                          type="interview_status"
                          status={item.status}
                        />
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        <Divider style={{ margin: 0 }} />

        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text strong style={{ fontSize: 15, padding: '0 4px' }}>
            数据概览
          </Text>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12
            }}
          >
            {statCards.map((card, index) => (
              <DataCard
                key={index}
                icon={card.icon}
                title={card.title}
                value={card.value}
                changeRate={card.changeRate}
                color={card.color}
                style={{ borderRadius: 8 }}
              />
            ))}
          </div>
        </Space>
      </Space>
    </MobilePage>
  )
}

export default MobileDashboard
