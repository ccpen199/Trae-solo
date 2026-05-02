import React from 'react'
import { Card, List, Button, Tag, Empty, Statistic, Row, Col, message } from 'antd'
import {
  BookOutlined,
  FileTextOutlined,
  MessageOutlined,
  UserOutlined,
  PlusOutlined,
  RightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const mockStats = {
    pendingGrading: 12,
    pendingAnswers: 8,
    totalStudents: 45
  }

  const handleNavigate = (path) => {
    navigate(path)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>欢迎回来，{user?.username}！</h1>
        <p style={{ color: '#666', margin: 0 }}>今日待办事项</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="stat-card orange">
            <Statistic
              title="待批改作业"
              value={mockStats.pendingGrading}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card blue">
            <Statistic
              title="待回复问题"
              value={mockStats.pendingAnswers}
              valueStyle={{ color: '#1890ff' }}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card green">
            <Statistic
              title="辅导学员"
              value={mockStats.totalStudents}
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="待批改作业"
            extra={
              <Button type="link" onClick={() => handleNavigate('/assignments')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            <List
              dataSource={[
                { title: 'JavaScript 第一章课后作业', course: 'JavaScript 从入门到精通', count: 5, status: 'pending' },
                { title: 'React 组件开发测验', course: 'React 实战开发', count: 3, status: 'pending' },
                { title: 'Python 数据结构作业', course: 'Python 数据分析实战', count: 4, status: 'graded' }
              ]}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" size="small">
                      查看
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{item.title}</span>
                        <Tag color={item.status === 'pending' ? 'warning' : 'success'}>
                          {item.status === 'pending' ? `${item.count}份待批改` : '已完成'}
                        </Tag>
                      </div>
                    }
                    description={item.course}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="待回复问题"
            extra={
              <Button type="link" onClick={() => handleNavigate('/questions')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            <List
              dataSource={[
                { title: 'var 和 let 的区别是什么？', course: 'JavaScript 从入门到精通', user: '王学员', time: '2小时前' },
                { title: 'React 中如何处理表单数据？', course: 'React 实战开发', user: '李学员', time: '5小时前' },
                { title: 'Pandas 如何进行数据合并？', course: 'Python 数据分析实战', user: '张学员', time: '1天前' }
              ]}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" size="small">
                      回复
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<MessageOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
                    title={item.title}
                    description={
                      <div style={{ fontSize: 12, color: '#999' }}>
                        <span>{item.course}</span>
                        <span style={{ marginLeft: 12 }}>{item.user}</span>
                        <span style={{ marginLeft: 12 }}>{item.time}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="快捷操作" style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => handleNavigate('/assignments')}
            >
              <FileTextOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 12 }} />
              <div>作业批改</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => handleNavigate('/questions')}
            >
              <MessageOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 12 }} />
              <div>答疑回复</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => handleNavigate('/profile')}
            >
              <UserOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 12 }} />
              <div>个人中心</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => message.info('更多功能开发中...')}
            >
              <BookOutlined style={{ fontSize: 32, color: '#fa8c16', marginBottom: 12 }} />
              <div>课程资料</div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Dashboard
