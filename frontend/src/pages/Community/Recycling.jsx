import React, { useState, useEffect } from 'react'
import { Card, List, Button, Progress, Modal, Form, Input, Select, message, Spin, Descriptions, Table, Tag, Statistic, Row, Col } from 'antd'
import { GiftOutlined, PlusOutlined, EnvironmentOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { getRecyclingRecords, submitRecycling, getRecyclingPoints, getRecyclingItems } from '../../api/community'
import dayjs from 'dayjs'
import { useAuth } from '../../hooks/useAuth'

const { Option } = Select
const { TextArea } = Input

function Recycling() {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [points, setPoints] = useState(0)
  const [items, setItems] = useState([])
  const [submitModal, setSubmitModal] = useState(false)
  const [stats, setStats] = useState(null)
  const [form] = Form.useForm()
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [recordsData, pointsData, itemsData] = await Promise.all([
        getRecyclingRecords(),
        getRecyclingPoints(),
        getRecyclingItems(),
      ])
      
      setRecords(Array.isArray(recordsData) ? recordsData : recordsData?.list || [])
      setPoints(pointsData?.points || pointsData || 0)
      setItems(Array.isArray(itemsData) ? itemsData : [])
      
      const totalRecycled = recordsData?.reduce?.((sum, r) => sum + (r.quantity || 0), 0) || 12
      const co2Saved = totalRecycled * 2.5
      const treesSaved = Math.floor(totalRecycled * 0.01)
      
      setStats({
        totalRecycled,
        co2Saved,
        treesSaved,
        totalPoints: points,
        level: Math.floor(points / 100) + 1,
        nextLevelPoints: (Math.floor(points / 100) + 1) * 100 - points,
      })
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    try {
      await submitRecycling(values)
      message.success('回收申请提交成功，请等待上门取件')
      setSubmitModal(false)
      form.resetFields()
      fetchData()
    } catch (error) {
      message.error('提交失败')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'orange',
      'collected': 'blue',
      'completed': 'green',
      'cancelled': 'default'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = {
      'pending': '待上门',
      'collected': '已收取',
      'completed': '已完成',
      'cancelled': '已取消'
    }
    return texts[status] || status
  }

  const recyclingItems = items.length > 0 ? items : [
    { id: 1, name: '纸箱', unit: 'kg', points_per_unit: 10 },
    { id: 2, name: '塑料', unit: 'kg', points_per_unit: 15 },
    { id: 3, name: '泡沫', unit: 'kg', points_per_unit: 8 },
    { id: 4, name: '缓冲物', unit: '个', points_per_unit: 2 },
    { id: 5, name: '快递袋', unit: '个', points_per_unit: 1 },
  ]

  const mockRecords = [
    {
      id: 1,
      item_name: '纸箱',
      quantity: 5,
      unit: 'kg',
      points: 50,
      status: 'completed',
      created_at: dayjs().subtract(3, 'day').toISOString(),
      collected_at: dayjs().subtract(2, 'day').toISOString(),
    },
    {
      id: 2,
      item_name: '塑料',
      quantity: 2,
      unit: 'kg',
      points: 30,
      status: 'completed',
      created_at: dayjs().subtract(7, 'day').toISOString(),
      collected_at: dayjs().subtract(6, 'day').toISOString(),
    },
    {
      id: 3,
      item_name: '纸箱',
      quantity: 8,
      unit: 'kg',
      points: 80,
      status: 'pending',
      created_at: dayjs().subtract(1, 'day').toISOString(),
    },
    {
      id: 4,
      item_name: '缓冲物',
      quantity: 20,
      unit: '个',
      points: 40,
      status: 'collected',
      created_at: dayjs().subtract(2, 'day').toISOString(),
      collected_at: dayjs().subtract(1, 'day').toISOString(),
    },
  ]

  const displayRecords = records.length > 0 ? records : mockRecords

  const columns = [
    {
      title: '物品',
      dataIndex: 'item_name',
      key: 'item_name',
    },
    {
      title: '数量',
      key: 'quantity',
      render: (_, record) => `${record.quantity} ${record.unit}`,
    },
    {
      title: '获得积分',
      dataIndex: 'points',
      key: 'points',
      render: (points) => <span style={{ color: '#faad14', fontWeight: 500 }}>+{points}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '完成时间',
      dataIndex: 'collected_at',
      key: 'collected_at',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '---',
    },
  ]

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>绿色回收</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setSubmitModal(true)}>
          提交回收
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card">
            <Statistic
              title="当前积分"
              value={stats?.totalPoints || points}
              suffix="分"
              prefix={<GiftOutlined />}
              valueStyle={{ color: 'white' }}
            />
            {stats && (
              <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8, fontSize: 12 }}>
                Lv.{stats.level}，再得 {stats.nextLevelPoints} 分升级
              </p>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card green">
            <Statistic
              title="累计回收"
              value={stats?.totalRecycled || 0}
              suffix="kg"
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card orange">
            <Statistic
              title="CO₂减排"
              value={stats?.co2Saved || 0}
              suffix="kg"
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card blue">
            <Statistic
              title="相当于种树"
              value={stats?.treesSaved || 0}
              suffix="棵"
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="回收物品及积分规则" style={{ marginBottom: 24 }}>
        <div className="recycling-progress">
          <Progress
            percent={Math.min((points / 1000) * 100, 100)}
            showInfo={false}
            strokeColor={{
              '0%': '#52c41a',
              '100%': '#1890ff',
            }}
          />
          <p style={{ textAlign: 'center', marginTop: 8, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
            积分目标：1000分，当前进度 {Math.min(Math.round((points / 1000) * 100), 100)}%
          </p>
        </div>

        <List
          dataSource={recyclingItems}
          renderItem={(item) => (
            <div className="recycling-item">
              <div>
                <span style={{ fontWeight: 500 }}>{item.name}</span>
                <span style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 8, fontSize: 12 }}>
                  单位：{item.unit}
                </span>
              </div>
              <span className="points-badge">+{item.points_per_unit} 积分/{item.unit}</span>
            </div>
          )}
        />
      </Card>

      <Card title="回收记录">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={displayRecords}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Spin>
      </Card>

      <Card title="积分兑换说明" style={{ marginTop: 24 }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="100积分">
            快递优惠券5元
          </Descriptions.Item>
          <Descriptions.Item label="300积分">
            快递优惠券20元 或 社区超市代金券15元
          </Descriptions.Item>
          <Descriptions.Item label="500积分">
            免费寄件券1张（限5kg以内） 或 精美环保袋
          </Descriptions.Item>
          <Descriptions.Item label="1000积分">
            季度免费寄件卡（每月3次） 或 绿植盆栽
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title="提交回收申请"
        open={submitModal}
        onCancel={() => setSubmitModal(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="itemId"
            label="回收物品"
            rules={[{ required: true, message: '请选择回收物品' }]}
          >
            <Select placeholder="请选择要回收的物品">
              {recyclingItems.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.name}（+{item.points_per_unit}积分/{item.unit}）
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <Input type="number" min={0.1} step={0.1} placeholder="请输入数量" />
          </Form.Item>

          <Form.Item
            name="address"
            label="取件地址"
            rules={[{ required: true, message: '请输入取件地址' }]}
          >
            <TextArea rows={2} placeholder="请输入详细取件地址" defaultValue={user?.address || ''} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="pickupDate"
                label="期望日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <Input type="date" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="pickupTime"
                label="时间段"
                rules={[{ required: true, message: '请选择时间段' }]}
              >
                <Select placeholder="请选择时间段">
                  <Option value="morning">上午 09:00-12:00</Option>
                  <Option value="afternoon">下午 14:00-18:00</Option>
                  <Option value="evening">晚间 18:00-20:00</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea rows={2} placeholder="其他需要说明的信息" />
          </Form.Item>

          <Alert
            message="温馨提示"
            description="请将回收物品整理好，放置在门口或方便取件的位置。工作人员上门前会电话联系您。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交申请
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Recycling
