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
  Tag, 
  Descriptions, 
  Row, 
  Col,
  Card,
  App,
  Drawer
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { farmerApi, commonApi } from '../services/api'
import type { Farmer, Cooperative } from '../types'

const { Option } = Select

const Farmers = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [currentFarmer, setCurrentFarmer] = useState<Farmer | null>(null)
  const [form] = Form.useForm()
  const { message, confirm } = App.useApp()

  useEffect(() => {
    loadData()
    loadCooperatives()
  }, [page, pageSize, keyword])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await farmerApi.list({ page, pageSize, keyword })
      if (res.data.success) {
        setFarmers(res.data.data)
        setTotal(res.data.total || 0)
      }
    } catch (error) {
      message.error('加载农户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCooperatives = async () => {
    try {
      const res = await commonApi.getCooperatives()
      if (res.data.success) {
        setCooperatives(res.data.data)
      }
    } catch (error) {}
  }

  const handleAdd = () => {
    setCurrentFarmer(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (farmer: Farmer) => {
    setCurrentFarmer(farmer)
    form.setFieldsValue(farmer)
    setModalVisible(true)
  }

  const handleView = (farmer: Farmer) => {
    setCurrentFarmer(farmer)
    setDrawerVisible(true)
  }

  const handleDelete = (farmer: Farmer) => {
    confirm({
      title: '确认删除',
      content: `确定要删除农户「${farmer.name}」吗？`,
      onOk: async () => {
        try {
          const res = await farmerApi.delete(farmer.id!)
          if (res.data.success) {
            message.success('删除成功')
            loadData()
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败')
        }
      }
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (currentFarmer) {
        const res = await farmerApi.update(currentFarmer.id!, values)
        if (res.data.success) {
          message.success('更新成功')
          setModalVisible(false)
          loadData()
        }
      } else {
        const res = await farmerApi.create(values)
        if (res.data.success) {
          message.success('创建成功')
          setModalVisible(false)
          loadData()
        }
      }
    } catch (error: any) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || '保存失败')
    }
  }

  const getRiskTagColor = (tags: string) => {
    if (tags?.includes('低风险')) return 'green'
    if (tags?.includes('中风险')) return 'orange'
    return 'red'
  }

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '身份证号', dataIndex: 'id_card', key: 'id_card', width: 180 },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '种植面积(亩)', dataIndex: 'planting_area', key: 'planting_area', width: 100 },
    { title: '合作社', dataIndex: 'cooperative_name', key: 'cooperative_name', width: 150 },
    { 
      title: '风险等级', 
      dataIndex: 'risk_tags', 
      key: 'risk_tags',
      width: 100,
      render: (tags: string) => tags ? <Tag color={getRiskTagColor(tags)}>{tags}</Tag> : '-'
    },
    { 
      title: '信用评分', 
      dataIndex: 'credit_score', 
      key: 'credit_score',
      width: 100,
      render: (score: number) => (
        <span style={{ color: score >= 700 ? '#52c41a' : score >= 600 ? '#faad14' : '#ff4d4f', fontWeight: 'bold' }}>
          {score}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Farmer) => (
        <Space>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            详情
          </Button>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card 
        title="农户档案" 
        size="small"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索姓名/身份证/电话"
              allowClear
              style={{ width: 240 }}
              onSearch={(value) => { setKeyword(value); setPage(1) }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增农户
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={farmers}
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
        title={currentFarmer ? '编辑农户' : '新增农户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="id_card" 
                label="身份证号" 
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { len: 18, message: '身份证号必须为18位' }
                ]}
              >
                <Input placeholder="请输入身份证号" disabled={!!currentFarmer} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入电话' }]}>
                <Input placeholder="请输入电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="address" label="地址">
                <Input placeholder="请输入地址" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="planting_area" label="种植面积(亩)" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="historical_yield" label="历史产量" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cooperative_id" label="所属合作社">
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
              <Form.Item name="has_cooperative_guarantee" label="合作社担保" initialValue={0}>
                <Select>
                  <Option value={0}>无</Option>
                  <Option value={1}>有</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="guarantee_amount" label="担保金额" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="insurance_info" label="保险信息">
                <Input.TextArea rows={2} placeholder="请输入保险信息" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subsidy_info" label="补贴信息">
                <Input.TextArea rows={2} placeholder="请输入补贴信息" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="past_repayment_history" label="过往还款记录">
                <Input.TextArea rows={2} placeholder="请输入过往还款记录" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="risk_tags" label="风险标签">
                <Select mode="tags" placeholder="输入标签后回车">
                  <Option value="低风险">低风险</Option>
                  <Option value="中风险">中风险</Option>
                  <Option value="高风险">高风险</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="credit_score" label="信用评分" initialValue={600}>
                <InputNumber min={300} max={900} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="active">
                <Select>
                  <Option value="active">正常</Option>
                  <Option value="inactive">停用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer
        title="农户详情"
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {currentFarmer && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="姓名">{currentFarmer.name}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{currentFarmer.id_card}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{currentFarmer.phone}</Descriptions.Item>
            <Descriptions.Item label="地址">{currentFarmer.address}</Descriptions.Item>
            <Descriptions.Item label="种植面积">{currentFarmer.planting_area} 亩</Descriptions.Item>
            <Descriptions.Item label="历史产量">{currentFarmer.historical_yield}</Descriptions.Item>
            <Descriptions.Item label="所属合作社">{currentFarmer.cooperative_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="合作社担保">{currentFarmer.has_cooperative_guarantee ? '有' : '无'}</Descriptions.Item>
            <Descriptions.Item label="担保金额">¥{currentFarmer.guarantee_amount?.toFixed(2) || 0}</Descriptions.Item>
            <Descriptions.Item label="保险信息">{currentFarmer.insurance_info || '-'}</Descriptions.Item>
            <Descriptions.Item label="补贴信息">{currentFarmer.subsidy_info || '-'}</Descriptions.Item>
            <Descriptions.Item label="过往还款记录">{currentFarmer.past_repayment_history || '-'}</Descriptions.Item>
            <Descriptions.Item label="风险标签">{currentFarmer.risk_tags || '-'}</Descriptions.Item>
            <Descriptions.Item label="信用评分">
              <span style={{ color: currentFarmer.credit_score >= 700 ? '#52c41a' : currentFarmer.credit_score >= 600 ? '#faad14' : '#ff4d4f', fontWeight: 'bold' }}>
                {currentFarmer.credit_score}
              </span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}

export default Farmers
