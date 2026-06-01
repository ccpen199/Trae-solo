import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  Input,
  message,
  Statistic,
  Row,
  Col,
  Badge,
  Alert,
  Tooltip
} from 'antd'
import { 
  EyeOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  WarningOutlined,
  StopOutlined,
  UnlockOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = '/api'

const Exceptions = () => {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [form] = Form.useForm()
  const [filterStatus, setFilterStatus] = useState('')
  const [stats, setStats] = useState({ 
    autoBlocked: 0, 
    pending: 0, 
    processing: 0, 
    resolved: 0, 
    closed: 0 
  })

  const exceptionTypes = {
    price: { text: '价格异常', color: 'orange' },
    supplier: { text: '供应商异常', color: 'red' },
    supplier_risk: { text: '风险事项', color: 'volcano' },
    clause: { text: '条款异常', color: 'blue' },
    other: { text: '其他异常', color: 'default' }
  }

  const statusTypes = {
    auto_blocked: { text: '系统拦截', color: 'red', icon: <StopOutlined /> },
    pending: { text: '待处理', color: 'orange', icon: <WarningOutlined /> },
    processing: { text: '处理中', color: 'blue', icon: <ClockCircleOutlined /> },
    manual_review: { text: '人工复核', color: 'purple', icon: <ClockCircleOutlined /> },
    resolved: { text: '已解决', color: 'green', icon: <CheckCircleOutlined /> },
    closed: { text: '已关闭', color: 'default', icon: <CheckCircleOutlined /> }
  }

  const severityTypes = {
    high: { text: '严重', color: 'red' },
    medium: { text: '中等', color: 'orange' },
    low: { text: '轻微', color: 'blue' }
  }

  useEffect(() => {
    loadData()
  }, [filterStatus])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/exceptions`, {
        params: { status: filterStatus || undefined }
      })
      const list = res.data.data || []
      setData(list)
      
      setStats({
        autoBlocked: list.filter(i => i.status === 'auto_blocked').length,
        pending: list.filter(i => i.status === 'pending').length,
        processing: list.filter(i => i.status === 'processing' || i.status === 'manual_review').length,
        resolved: list.filter(i => i.status === 'resolved').length,
        closed: list.filter(i => i.status === 'closed').length
      })
    } catch (e) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = (record) => {
    setCurrentRecord(record)
    form.setFieldsValue({
      status: record.status === 'auto_blocked' ? 'resolved' : record.status,
      handler_name: record.handler_name || '',
      handle_result: record.handle_result || '',
      remarks: record.remarks || ''
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await axios.put(`${API_BASE}/exceptions/${currentRecord.id}`, {
        ...values,
        handler_id: 'user_003',
        handler_name: '李经理'
      })
      message.success('处理成功，拦截已自动解除')
      setModalVisible(false)
      loadData()
    } catch (e) {
      message.error('处理失败')
    }
  }

  const columns = [
    {
      title: '拦截状态',
      dataIndex: 'is_auto_blocked',
      width: 100,
      fixed: 'left',
      render: (v, r) => (
        v ? (
          <Tooltip title="系统自动拦截，需人工处理后解除">
            <Tag color="red" icon={<StopOutlined />}>已拦截</Tag>
          </Tooltip>
        ) : (
          <Tag color="green" icon={<UnlockOutlined />}>正常</Tag>
        )
      )
    },
    {
      title: '处理状态',
      dataIndex: 'status',
      width: 100,
      render: t => (
        <Badge
          status={
            t === 'auto_blocked' ? 'error' : 
            t === 'pending' ? 'warning' : 
            t === 'resolved' ? 'success' : 
            'processing'
          }
          text={statusTypes[t]?.text}
        />
      )
    },
    { title: '编号', dataIndex: 'negotiation_code', width: 140 },
    { title: '谈判项目', dataIndex: 'negotiation_title', ellipsis: true, width: 200 },
    {
      title: '异常类型',
      dataIndex: 'exception_type',
      width: 120,
      render: t => <Tag color={exceptionTypes[t]?.color}>{exceptionTypes[t]?.text}</Tag>
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      width: 100,
      render: t => <Tag color={severityTypes[t]?.color}>{severityTypes[t]?.text}</Tag>
    },
    { title: '异常标题', dataIndex: 'title', ellipsis: true, width: 200 },
    { title: '详细描述', dataIndex: 'description', ellipsis: true },
    { title: '检测时间', dataIndex: 'detected_at', width: 180 },
    { title: '处理人', dataIndex: 'handler_name', width: 100 },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button
            type={r.status === 'auto_blocked' ? 'primary' : 'link'}
            size="small"
            onClick={() => handleProcess(r)}
            danger={r.status === 'auto_blocked'}
          >
            {r.status === 'auto_blocked' ? '处理并解除' : '处理'}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/negotiation/${r.negotiation_id}`)}
          >
            查看项目
          </Button>
        </Space>
      )
    }
  ]

  const hasAutoBlocked = stats.autoBlocked > 0

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">异常处理中心</h1>
        <div style={{ color: '#666', fontSize: 13 }}>
          系统自动检测异常，严重异常自动拦截 | 来源：价格对比、风险检查
        </div>
      </div>

      {hasAutoBlocked && (
        <Alert
          message="系统拦截预警"
          description={`当前有 ${stats.autoBlocked} 个严重异常被系统自动拦截，请及时处理，相关谈判项目已被锁定。`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Card>
            <Statistic
              title="系统拦截"
              value={stats.autoBlocked}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pending}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="处理中"
              value={stats.processing}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="已解决"
              value={stats.resolved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已关闭"
              value={stats.closed}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <span>状态筛选：</span>
          <Select
            style={{ width: 150 }}
            allowClear
            placeholder="全部"
            value={filterStatus || undefined}
            onChange={setFilterStatus}
            options={Object.entries(statusTypes).map(([k, v]) => ({ value: k, label: v.text }))}
          />
          <Button onClick={loadData}>刷新</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1600 }}
        />
      </Card>

      <Modal
        title={currentRecord?.is_auto_blocked ? '处理拦截异常（解除拦截）' : '处理异常'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText={currentRecord?.is_auto_blocked ? '处理并解除拦截' : '保存处理结果'}
        okButtonProps={{ danger: currentRecord?.is_auto_blocked }}
      >
        {currentRecord && (
          <>
            {currentRecord.is_auto_blocked && (
              <Alert
                message="此异常已触发系统拦截"
                description="处理完成后，系统将自动解除对相关谈判项目的拦截状态。"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <div style={{ marginBottom: 16, padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>异常信息</div>
              <div><strong>项目：</strong>{currentRecord.negotiation_title}</div>
              <div><strong>异常：</strong>{currentRecord.title}</div>
              <div><strong>描述：</strong>{currentRecord.description}</div>
              <div><strong>严重程度：</strong>
                <Tag color={severityTypes[currentRecord.severity]?.color}>
                  {severityTypes[currentRecord.severity]?.text}
                </Tag>
              </div>
            </div>
          </>
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="处理状态"
            rules={[{ required: true }]}
          >
            <Select
              options={Object.entries(statusTypes)
                .filter(([k]) => k !== 'auto_blocked')
                .map(([k, v]) => ({ value: k, label: v.text }))}
            />
          </Form.Item>

          <Form.Item
            name="handle_result"
            label="处理结果"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'manual_review', label: '人工复核通过' },
                { value: 'observing', label: '继续观察' },
                { value: 'resolved', label: '问题已解决' },
                { value: 'closed', label: '异常已关闭' }
              ]}
            />
          </Form.Item>

          <Form.Item name="remarks" label="处理说明" rules={[{ required: true }]}>
            <Input.TextArea 
              rows={4} 
              placeholder="请输入处理说明，包括：问题原因、处理措施、下一步行动" 
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Exceptions
