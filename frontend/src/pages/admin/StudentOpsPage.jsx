import { useState, useEffect } from 'react'
import { Card, Table, Form, Input, Button, Tag, Typography, Spin, Modal, message, Row, Col, Statistic, Descriptions, Space, Alert, List, Progress } from 'antd'
import { TeamOutlined, TrophyOutlined, SafetyCertificateOutlined, RiseOutlined, CheckCircleOutlined, StarOutlined, UserOutlined } from '@ant-design/icons'
import request from '../../utils/request'

const { Title, Text } = Typography

export default function StudentOpsPage() {
  const [peakData, setPeakData] = useState([])
  const [ambassadors, setAmbassadors] = useState([])
  const [certifications, setCertifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [predictModalOpen, setPredictModalOpen] = useState(false)
  const [predictForm] = Form.useForm()
  const [predicting, setPredicting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await request.get('/admin/student-ops')
      const data = res.data || res
      setPeakData(data.predictions || data.peak_predictions || data.peakData || [])
      setAmbassadors(data.ambassadors || [])
      setCertifications(data.certifications || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handlePredict = async () => {
    try {
      const values = await predictForm.validateFields()
      setPredicting(true)
      await request.post('/admin/student-ops/predictions', values)
      message.success('预测已更新')
      setPredictModalOpen(false)
      predictForm.resetFields()
      fetchData()
    } catch (e) {
    } finally {
      setPredicting(false)
    }
  }

  const handleApproveAmbassador = async (id) => {
    try {
      await request.put(`/admin/student-ops/ambassadors/${id}/approve`)
      message.success('已通过校园大使审核')
      fetchData()
    } catch (e) {
    }
  }

  const handleApproveCert = async (id) => {
    try {
      await request.put(`/admin/student-ops/certifications/${id}/approve`)
      message.success('学分认证已通过')
      fetchData()
    } catch (e) {
    }
  }

  const studentStats = [
    { title: '学生用户', value: 1256, icon: <UserOutlined />, color: '#1890ff' },
    { title: '校园大使', value: 38, icon: <StarOutlined />, color: '#faad14' },
    { title: '学分认证', value: 892, icon: <SafetyCertificateOutlined />, color: '#52c41a' },
    { title: '暑期预报名', value: 2341, icon: <RiseOutlined />, color: '#722ed1' }
  ]

  const peakColumns = [
    { title: '年份', dataIndex: 'year', key: 'year', width: 100 },
    { title: '季节', dataIndex: 'season', key: 'season', width: 100 },
    {
      title: '预测需求量',
      dataIndex: 'predicted_demand',
      key: 'predicted_demand',
      render: (val) => <Text strong>{val || 0}</Text>
    },
    {
      title: '实际需求量',
      dataIndex: 'actual_demand',
      key: 'actual_demand',
      render: (val) => val ? <Text type="success">{val}</Text> : <Text type="secondary">待统计</Text>
    },
    {
      title: '预测准确率',
      key: 'accuracy',
      render: (_, record) => {
        if (!record.actual_demand || !record.predicted_demand) return <Tag>计算中</Tag>
        const acc = Math.round((1 - Math.abs(record.actual_demand - record.predicted_demand) / record.actual_demand) * 100)
        return (
          <Tag color={acc >= 80 ? 'green' : acc >= 60 ? 'orange' : 'red'}>
            {acc}%
          </Tag>
        )
      }
    }
  ]

  const ambassadorColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '学校', dataIndex: 'university', key: 'university' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'approved' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status === 'approved' ? '已通过' : status === 'pending' ? '审核中' : '已拒绝'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        record.status === 'pending' && (
          <Button size="small" type="primary" onClick={() => handleApproveAmbassador(record.id)}>
            通过审核
          </Button>
        )
      )
    }
  ]

  const certColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '学校', dataIndex: 'university', key: 'university' },
    { title: '学分类型', dataIndex: 'credit_type', key: 'credit_type' },
    { title: '学分值', dataIndex: 'credit_value', key: 'credit_value' },
    {
      title: '认证状态',
      dataIndex: 'verified',
      key: 'verified',
      render: (verified) => (
        <Tag color={verified === 1 ? 'green' : 'orange'}>
          {verified === 1 ? '已认证' : '待审核'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        record.verified !== 1 && (
          <Button size="small" type="primary" onClick={() => handleApproveCert(record.id)}>
            通过认证
          </Button>
        )
      )
    }
  ]

  const recruitmentEvents = [
    { title: '2024暑期实习招聘', time: '6月15日-7月15日', progress: 75, status: '进行中' },
    { title: '校园大使招募', time: '5月20日-6月10日', progress: 100, status: '已结束' },
    { title: '新生开学季推广', time: '8月25日-9月10日', progress: 0, status: '待开始' }
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        <TeamOutlined /> 学生专项运营中心
      </Title>

      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
      ) : (
        <>
          <Alert
            message="学生运营概览"
            description={
              <Space>
                <RiseOutlined style={{ color: '#1890ff' }} />
                <Text>本月学生注册量环比增长 28%，暑期实习需求旺盛</Text>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={16} style={{ marginBottom: 24 }}>
            {studentStats.map((item, idx) => (
              <Col xs={12} sm={6} key={idx}>
                <Card>
                  <Statistic
                    title={item.title}
                    value={item.value}
                    valueStyle={{ color: item.color }}
                    prefix={item.icon}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <Card
            title={<><TrophyOutlined /> 高峰需求预测</>}
            extra={<Button type="primary" onClick={() => setPredictModalOpen(true)}>新增预测</Button>}
            style={{ marginBottom: 24 }}
          >
            <Table rowKey="id" columns={peakColumns} dataSource={peakData} pagination={false} size="small" />
          </Card>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <Card title={<><StarOutlined /> 校园大使管理</>}>
                <Table rowKey="id" columns={ambassadorColumns} dataSource={ambassadors} pagination={false} size="small" />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title={<><SafetyCertificateOutlined /> 学分认证列表</>}>
                <Table rowKey="id" columns={certColumns} dataSource={certifications} pagination={false} size="small" />
              </Card>
            </Col>
          </Row>

          <Card title="招聘活动进度">
            <List
              dataSource={recruitmentEvents}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text strong>{item.title}</Text>
                      <Tag color={item.status === '进行中' ? 'blue' : item.status === '已结束' ? 'green' : 'default'}>
                        {item.status}
                      </Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>活动时间：{item.time}</Text>
                    <Progress percent={item.progress} status={item.progress === 100 ? 'success' : 'active'} />
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </>
      )}

      <Modal
        title="新增高峰预测"
        open={predictModalOpen}
        onOk={handlePredict}
        onCancel={() => { setPredictModalOpen(false); predictForm.resetFields() }}
        okText="提交"
        cancelText="取消"
        confirmLoading={predicting}
      >
        <Form form={predictForm} layout="vertical">
          <Form.Item name="year" label="年份" rules={[{ required: true, message: '请输入年份' }]}>
            <Input type="number" placeholder="例如：2024" />
          </Form.Item>
          <Form.Item name="season" label="季节" rules={[{ required: true, message: '请输入季节' }]}>
            <Input placeholder="例如：暑期、寒假、春招" />
          </Form.Item>
          <Form.Item name="predicted_demand" label="预测需求量" rules={[{ required: true, message: '请输入预测需求量' }]}>
            <Input type="number" placeholder="请输入预测需求量" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
