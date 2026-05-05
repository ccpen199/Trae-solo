import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, Empty, Spin } from 'antd'
import {
  AppstoreOutlined,
  SafetyOutlined,
  ApiOutlined,
  BellOutlined,
  PlusOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { applicationApi } from '@/utils/api'

interface Application {
  id: string
  name: string
  appKey: string
  type: string
  status: string
  isSandbox: boolean
  createdAt: string
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])

  const statusColorMap: Record<string, string> = {
    DRAFT: 'default',
    PENDING_REVIEW: 'warning',
    ACTIVE: 'success',
    SUSPENDED: 'error',
    BANNED: 'error'
  }

  const statusNameMap: Record<string, string> = {
    DRAFT: '草稿',
    PENDING_REVIEW: '审核中',
    ACTIVE: '已上线',
    SUSPENDED: '已暂停',
    BANNED: '已禁用'
  }

  const typeNameMap: Record<string, string> = {
    WEB_APP: '网页应用',
    NATIVE_APP: '原生应用',
    SERVICE_PROVIDER: '服务提供商',
    THIRD_PARTY_SYSTEM: '第三方系统'
  }

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const res: any = await applicationApi.getList({ pageSize: 5 })
      if (res.success) {
        setApplications(res.data.applications || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const columns = [
    {
      title: '应用名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'App Key',
      dataIndex: 'appKey',
      key: 'appKey',
      render: (text: string) => (
        <span className="app-key-display" style={{ fontSize: 12 }}>
          {text}
        </span>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => typeNameMap[type] || type
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'}>
          {statusNameMap[status] || status}
        </Tag>
      )
    },
    {
      title: '沙箱',
      dataIndex: 'isSandbox',
      key: 'isSandbox',
      render: (isSandbox: boolean) => (
        <Tag color={isSandbox ? 'blue' : 'default'}>
          {isSandbox ? '沙箱' : '生产'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Application) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/applications/${record.id}`)}
        >
          查看
        </Button>
      )
    }
  ]

  const statsData = [
    {
      title: '应用总数',
      value: applications.length,
      icon: <AppstoreOutlined />,
      color: '#1677ff'
    },
    {
      title: '已上线',
      value: applications.filter(a => a.status === 'ACTIVE').length,
      icon: <SafetyOutlined />,
      color: '#52c41a'
    },
    {
      title: 'API调用（今日）',
      value: 0,
      icon: <ApiOutlined />,
      color: '#722ed1'
    },
    {
      title: '待处理通知',
      value: 0,
      icon: <BellOutlined />,
      color: '#fa8c16'
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>控制台</h1>
        <p>欢迎使用TIP开放平台治理系统</p>
      </div>

      <Row gutter={[24, 24]}>
        {statsData.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={
                  <span style={{ color: stat.color }}>
                    {stat.icon}
                  </span>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title="我的应用"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/applications?create=true')}
              >
                创建应用
              </Button>
            }
          >
            {loading ? (
              <div className="loading-center">
                <Spin />
              </div>
            ) : applications.length > 0 ? (
              <Table
                columns={columns}
                dataSource={applications}
                rowKey="id"
                pagination={false}
              />
            ) : (
              <Empty
                description={
                  <span>
                    暂无应用，点击
                    <Button
                      type="link"
                      onClick={() => navigate('/applications?create=true')}
                    >
                      创建应用
                    </Button>
                    开始
                  </span>
                }
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="快速入门">
            <div style={{ lineHeight: 2 }}>
              <p>1. <strong>创建应用</strong>：填写应用信息，获取App Key和Secret</p>
              <p>2. <strong>配置权限</strong>：申请需要的API权限范围</p>
              <p>3. <strong>提交审核</strong>：平台审核通过后上线</p>
              <p>4. <strong>调用API</strong>：使用App Key调用开放API</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="平台公告">
            <div style={{ lineHeight: 2 }}>
              <Tag color="blue">新功能</Tag>
              <span style={{ marginLeft: 8 }}>Webhook推送已支持更多事件类型</span>
              <br />
              <Tag color="green">优化</Tag>
              <span style={{ marginLeft: 8 }}>API调用流控策略已升级</span>
              <br />
              <Tag color="warning">提醒</Tag>
              <span style={{ marginLeft: 8 }}>沙箱环境App Key请用于测试</span>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
