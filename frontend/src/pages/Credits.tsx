import { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  Tag, 
  Card,
  App,
  Descriptions,
  Row,
  Col,
  Alert
} from 'antd'
import { PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { creditApi, farmerApi, commonApi } from '../services/api'
import type { CreditApproval, Farmer, Cooperative } from '../types'

const { Option } = Select

const Credits = () => {
  const [credits, setCredits] = useState<CreditApproval[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentCredit, setCurrentCredit] = useState<CreditApproval | null>(null)
  const [calculatedInfo, setCalculatedInfo] = useState<any>(null)
  const [form] = Form.useForm()
  const { message, confirm } = App.useApp()

  useEffect(() => {
    loadData()
    loadFarmers()
    loadCooperatives()
  }, [page, pageSize, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (statusFilter) params.status = statusFilter
      const res = await creditApi.list(params)
      if (res.data.success) {
        setCredits(res.data.data)
        setTotal(res.data.total || 0)
      }
    } catch (error) {
      message.error('加载授信列表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadFarmers = async () => {
    try {
      const res = await farmerApi.list({ pageSize: 1000 })
      if (res.data.success) {
        setFarmers(res.data.data)
      }
    } catch (error) {}
  }

  const loadCooperatives = async () => {
    try {
      const res = await commonApi.getCooperatives()
      if (res.data.success) {
        setCooperatives(res.data.data)
      }
    } catch (error) {}
  }

  const handleFarmerChange = async (farmerId: number) => {
    const requestedAmount = form.getFieldValue('requested_amount') || 0
    const cooperativeId = form.getFieldValue('cooperative_id')
    
    if (farmerId && requestedAmount > 0) {
      try {
        const res = await creditApi.calculate({ farmer_id: farmerId, requested_amount: requestedAmount, cooperative_id: cooperativeId })
        if (res.data.success) {
          setCalculatedInfo(res.data.data)
          if (res.data.data.canApprove) {
            form.setFieldValue('approved_amount', res.data.data.suggested_amount)
          }
        }
      } catch (error) {}
    }
  }

  const handleAdd = () => {
    setCurrentCredit(null)
    setCalculatedInfo(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleApprove = (credit: CreditApproval) => {
    confirm({
      title: '确认审批通过',
      content: `确定要通过农户「${credit.farmer_name}」的授信申请吗？审批额度：¥${credit.requested_amount.toFixed(2)}`,
      onOk: async () => {
        try {
          const res = await creditApi.approve(credit.id!, {
            approved_amount: credit.requested_amount,
            approval_notes: '审批通过'
          })
          if (res.data.success) {
            message.success('审批通过')
            loadData()
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '审批失败')
        }
      }
    })
  }

  const handleReject = (credit: CreditApproval) => {
    Modal.confirm({
      title: '拒绝授信',
      content: '请输入拒绝原因：',
      okText: '确认拒绝',
      cancelText: '取消',
      children: (
        <Input.TextArea id="rejectReason" placeholder="请输入拒绝原因" rows={3} />
      ),
      onOk: async () => {
        const reason = (document.getElementById('rejectReason') as HTMLTextAreaElement)?.value || '拒绝'
        try {
          const res = await creditApi.reject(credit.id!, { approval_notes: reason })
          if (res.data.success) {
            message.success('已拒绝')
            loadData()
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '操作失败')
        }
      }
    })
  }

  const handleView = (credit: CreditApproval) => {
    setCurrentCredit(credit)
    setDetailVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const data = {
        ...values,
        validity_start: values.validity_start?.format('YYYY-MM-DD'),
        validity_end: values.validity_end?.format('YYYY-MM-DD'),
        approval_status: values.approval_status || 'pending',
        approved_amount: values.approved_amount || 0
      }
      
      const res = await creditApi.create(data)
      if (res.data.success) {
        message.success('创建成功')
        setModalVisible(false)
        loadData()
      }
    } catch (error: any) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || '保存失败')
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending': return <Tag color="orange">待审批</Tag>
      case 'approved': return <Tag color="green">已通过</Tag>
      case 'rejected': return <Tag color="red">已拒绝</Tag>
      default: return <Tag>{status}</Tag>
    }
  }

  const columns = [
    { title: '农户', dataIndex: 'farmer_name', key: 'farmer_name', width: 100 },
    { title: '作物周期', dataIndex: 'crop_cycle', key: 'crop_cycle', width: 120 },
    { title: '农资品类', dataIndex: 'product_category', key: 'product_category', width: 120 },
    { 
      title: '申请额度', 
      dataIndex: 'requested_amount', 
      key: 'requested_amount',
      width: 120,
      render: (v: number) => `¥${v.toFixed(2)}`
    },
    { 
      title: '审批额度', 
      dataIndex: 'approved_amount', 
      key: 'approved_amount',
      width: 120,
      render: (v: number) => v > 0 ? `¥${v.toFixed(2)}` : '-'
    },
    { 
      title: '已用/可用', 
      key: 'usage',
      width: 160,
      render: (_: any, record: CreditApproval) => (
        <span>
          ¥{record.used_amount.toFixed(2)} / ¥{record.available_amount.toFixed(2)}
        </span>
      )
    },
    { title: '有效期', key: 'validity', width: 200, render: (_: any, record: CreditApproval) => `${record.validity_start} 至 ${record.validity_end}` },
    { title: '状态', dataIndex: 'approval_status', key: 'approval_status', width: 100, render: getStatusTag },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: CreditApproval) => (
        <Space>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
          {record.approval_status === 'pending' && (
            <>
              <Button size="small" type="link" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>通过</Button>
              <Button size="small" type="link" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>拒绝</Button>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card 
        title="授信审批" 
        size="small"
        extra={
          <Space>
            <Select
              placeholder="状态筛选"
              style={{ width: 140 }}
              allowClear
              value={statusFilter || undefined}
              onChange={(value) => { setStatusFilter(value); setPage(1) }}
            >
              <Option value="pending">待审批</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增授信
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={credits}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
      </Card>

      <Modal
        title="新增授信申请"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="farmer_id" label="农户" rules={[{ required: true, message: '请选择农户' }]}>
                <Select 
                  placeholder="请选择农户" 
                  showSearch
                  optionFilterProp="children"
                  onChange={handleFarmerChange}
                >
                  {farmers.map(farmer => (
                    <Option key={farmer.id} value={farmer.id}>{farmer.name} - {farmer.id_card}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cooperative_id" label="合作社">
                <Select placeholder="请选择合作社" allowClear>
                  {cooperatives.map(coop => (
                    <Option key={coop.id} value={coop.id}>{coop.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="crop_cycle" label="作物周期" rules={[{ required: true, message: '请输入作物周期' }]}>
                <Input placeholder="如：2024年夏播" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="product_category" label="农资品类" rules={[{ required: true, message: '请输入农资品类' }]}>
                <Select mode="tags" placeholder="输入品类后回车">
                  <Option value="化肥">化肥</Option>
                  <Option value="农药">农药</Option>
                  <Option value="种子">种子</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="requested_amount" label="申请额度" rules={[{ required: true, message: '请输入申请额度' }]}>
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  formatter={(value) => `¥ ${value}`}
                  parser={(value) => value?.replace(/[^\d.]/g, '') as any}
                  onChange={() => {
                    const farmerId = form.getFieldValue('farmer_id')
                    if (farmerId) handleFarmerChange(farmerId)
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="approved_amount" label="建议审批额度">
                <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `¥ ${value}`} parser={(value) => value?.replace(/[^\d.]/g, '') as any} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="validity_start" label="有效期开始" rules={[{ required: true, message: '请选择开始日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="validity_end" label="有效期结束" rules={[{ required: true, message: '请选择结束日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="risk_tags" label="风险标签">
            <Select mode="tags" placeholder="输入标签后回车">
              <Option value="低风险">低风险</Option>
              <Option value="中风险">中风险</Option>
              <Option value="高风险">高风险</Option>
            </Select>
          </Form.Item>
          <Form.Item name="approval_status" label="审批状态" initialValue="pending">
            <Select>
              <Option value="pending">待审批</Option>
              <Option value="approved">直接通过</Option>
              <Option value="rejected">直接拒绝</Option>
            </Select>
          </Form.Item>

          {calculatedInfo && (
            <Alert
              message={calculatedInfo.canApprove ? '授信评估结果' : '授信评估结果'}
              description={
                calculatedInfo.canApprove ? (
                  <div>
                    <div>可授信状态：可授信</div>
                    <div>建议额度：¥{calculatedInfo.suggested_amount.toFixed(2)}</div>
                    <div>信用评分：{calculatedInfo.credit_score}</div>
                    <div>风险等级：{calculatedInfo.risk_level}</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: '#ff4d4f' }}>不可授信原因：{calculatedInfo.reason}</div>
                    <div>信用评分：{calculatedInfo.credit_score}</div>
                  </div>
                )
              }
              type={calculatedInfo.canApprove ? 'success' : 'error'}
              showIcon
            />
          )}
        </Form>
      </Modal>

      <Modal
        title="授信详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentCredit && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="农户">{currentCredit.farmer_name}</Descriptions.Item>
            <Descriptions.Item label="合作社">{currentCredit.cooperative_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="作物周期">{currentCredit.crop_cycle}</Descriptions.Item>
            <Descriptions.Item label="农资品类">{currentCredit.product_category}</Descriptions.Item>
            <Descriptions.Item label="申请额度">¥{currentCredit.requested_amount.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="审批额度">¥{currentCredit.approved_amount.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="已用额度">¥{currentCredit.used_amount.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="可用额度">¥{currentCredit.available_amount.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="有效期">{currentCredit.validity_start} 至 {currentCredit.validity_end}</Descriptions.Item>
            <Descriptions.Item label="风险标签">{currentCredit.risk_tags || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(currentCredit.approval_status)}</Descriptions.Item>
            <Descriptions.Item label="审批备注">{currentCredit.approval_notes || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default Credits
