import { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Row,
  Col,
  message,
  Popconfirm,
  Drawer,
  Descriptions,
  Badge,
  Divider,
  Timeline,
  Alert,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  MailOutlined,
  QrcodeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { packageApi, smsApi, cabinetApi, dashboardApi } from '../api'
import dayjs from 'dayjs'

const { Option } = Select

const brandMap = {
  sf: '顺丰速运', yto: '圆通速递', zto: '中通快递', sto: '申通快递',
  jd: '京东物流', ems: 'EMS', yd: '韵达快递', tt: '天天快递',
  qf: '全峰快递', dbl: '德邦物流', jf: '极兔速递', ups: 'UPS', unknown: '未知'
}

const brandColors = {
  sf: '#000', yto: '#ff6600', zto: '#0066cc', sto: '#ff5000',
  jd: '#e01d26', ems: '#006633', yd: '#0056a6', tt: '#ff6600',
  qf: '#000', dbl: '#333', jf: '#ff0000', ups: '#351c15'
}

const statusMap = {
  pending: { text: '待入库', color: 'default' },
  stored: { text: '已存柜', color: 'blue' },
  picked: { text: '已取件', color: 'success' },
  overdue: { text: '已滞留', color: 'warning' }
}

const codeLifecycleTypeMap = {
  generated: '生成',
  sent: '已发送',
  resent: '已重发',
  expired: '已过期',
  used: '已使用'
}

const smsStatusMap = {
  sent: { text: '已发送', color: 'success' },
  failed: { text: '发送失败', color: 'error' },
  pending: { text: '待发送', color: 'processing' }
}

function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || '-'
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

export default function PackageList() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ status: '', brand: '' })
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentPackage, setCurrentPackage] = useState(null)
  const [smsTemplates, setSmsTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [cabinets, setCabinets] = useState([])
  const [ocrResult, setOcrResult] = useState(null)
  const [overview, setOverview] = useState({})
  const [statusCounts, setStatusCounts] = useState({ total: 0, stored: 0, picked: 0, overdue: 0, pending: 0 })
  const [batchResultVisible, setBatchResultVisible] = useState(false)
  const [batchResult, setBatchResult] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadPackages()
    loadSmsTemplates()
    loadCabinets()
    loadOverview()
  }, [pagination.current, pagination.pageSize, filters])

  const loadOverview = async () => {
    try {
      const response = await dashboardApi.getOverview()
      setOverview(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  const loadPackages = async () => {
    setLoading(true)
    try {
      const response = await packageApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      })
      setPackages(response.data.list)
      setPagination(prev => ({ ...prev, total: response.data.total }))
      if (response.data.statusCounts) {
        setStatusCounts(response.data.statusCounts)
      }
    } catch (error) {
      message.error('加载包裹列表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadSmsTemplates = async () => {
    try {
      const response = await smsApi.getTemplates()
      setSmsTemplates(response.data)
      if (response.data && response.data.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(response.data[0].id)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const loadCabinets = async () => {
    try {
      const response = await cabinetApi.getList({ pageSize: 100 })
      setCabinets(response.data.list)
    } catch (error) {
      console.error(error)
    }
  }

  const handleTrackingNumberBlur = async (e) => {
    const trackingNumber = e.target.value
    if (trackingNumber) {
      try {
        const response = await packageApi.parseOCR(trackingNumber)
        setOcrResult(response.data)
        form.setFieldsValue({
          brand: response.data.brand
        })
        message.success(`识别成功: ${response.data.brandName}`)
      } catch (error) {
        message.error('面单识别失败')
      }
    }
  }

  const handleCreate = async (values) => {
    try {
      await packageApi.create(values)
      message.success('包裹入库成功')
      setCreateModalVisible(false)
      form.resetFields()
      setOcrResult(null)
      loadPackages()
    } catch (error) {
      message.error('包裹入库失败')
    }
  }

  const handleBatchRemind = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要提醒的包裹')
      return
    }
    if (!selectedTemplateId) {
      message.warning('请选择短信模板')
      return
    }
    try {
      const response = await packageApi.batchRemind({ packageIds: selectedRowKeys, templateId: selectedTemplateId })
      const templateName = smsTemplates.find(t => t.id === selectedTemplateId)?.name || '未知模板'
      setBatchResult({
        templateName,
        results: response.data.results || []
      })
      setBatchResultVisible(true)
      setSelectedRowKeys([])
      loadPackages()
    } catch (error) {
      message.error('批量提醒失败')
    }
  }

  const handleResendCode = async (id) => {
    try {
      const response = await packageApi.resendCode(id)
      message.success(`取件码已重发: ${response.data.pickupCode}`)
      loadPackages()
    } catch (error) {
      message.error('重发取件码失败')
    }
  }

  const handlePickup = async (id) => {
    try {
      await packageApi.pickup(id)
      message.success('确认取件成功')
      loadPackages()
      if (detailVisible && currentPackage && currentPackage.id === id) {
        setCurrentPackage(prev => ({ ...prev, status: 'picked' }))
      }
    } catch (error) {
      message.error('确认取件失败')
    }
  }

  const showDetail = async (record) => {
    setCurrentPackage(record)
    setDetailVisible(true)
  }

  const columns = [
    {
      title: '运单号',
      dataIndex: 'tracking_number',
      key: 'tracking_number',
      width: 180,
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '快递公司',
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
      render: (brand) => (
        <Tag color={brandColors[brand]}>{brandMap[brand] || brand}</Tag>
      )
    },
    {
      title: '收件人',
      dataIndex: 'receiver_name',
      key: 'receiver_name',
      width: 100
    },
    {
      title: '联系电话',
      dataIndex: 'receiver_phone',
      key: 'receiver_phone',
      width: 130,
      render: (phone) => maskPhone(phone)
    },
    {
      title: '取件码',
      dataIndex: 'pickup_code',
      key: 'pickup_code',
      width: 100,
      render: (code) => code ? <Tag color="orange">{code}</Tag> : '-'
    },
    {
      title: '存放柜机',
      dataIndex: 'cabinet_name',
      key: 'cabinet_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusInfo = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: '存入时间',
      dataIndex: 'stored_at',
      key: 'stored_at',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => showDetail(record)}>详情</Button>
          {(record.status === 'stored' || record.status === 'overdue') && (
            <Button type="link" size="small" onClick={() => handleResendCode(record.id)}>
              <QrcodeOutlined /> 重发取件码
            </Button>
          )}
          {(record.status === 'stored' || record.status === 'overdue') && (
            <Popconfirm
              title="确认该包裹已取件？"
              onConfirm={() => handlePickup(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small">
                <CheckCircleOutlined /> 确认取件
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={4}>
            <Statistic title="全部" value={statusCounts.total} />
          </Col>
          <Col span={4}>
            <Statistic title="待入库" value={statusCounts.pending} valueStyle={{ color: '#8c8c8c' }} />
          </Col>
          <Col span={4}>
            <Statistic title="已存柜" value={statusCounts.stored} valueStyle={{ color: '#1890ff' }} />
          </Col>
          <Col span={4}>
            <Statistic title="已取件" value={statusCounts.picked} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={4}>
            <Statistic title="已滞留" value={statusCounts.overdue} valueStyle={{ color: '#faad14' }} />
          </Col>
          <Col span={4}>
            <Statistic title="滞留率" value={statusCounts.total > 0 ? ((statusCounts.overdue / statusCounts.total) * 100).toFixed(1) : 0} suffix="%" valueStyle={{ color: statusCounts.overdue > 0 ? '#ff4d4f' : '#52c41a' }} />
          </Col>
        </Row>
      </Card>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space wrap>
            <Button
              type={!filters.status ? 'primary' : 'default'}
              onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
            >
              全部
            </Button>
            <Button
              type={filters.status === 'stored' ? 'primary' : 'default'}
              onClick={() => setFilters(prev => ({ ...prev, status: 'stored' }))}
            >
              已存柜
            </Button>
            <Button
              type={filters.status === 'overdue' ? 'primary' : 'default'}
              danger
              onClick={() => setFilters(prev => ({ ...prev, status: 'overdue' }))}
            >
              已滞留 ({overview.overduePackages || 0})
            </Button>
            <Button
              type={filters.status === 'picked' ? 'primary' : 'default'}
              onClick={() => setFilters(prev => ({ ...prev, status: 'picked' }))}
            >
              已取件
            </Button>
            <Divider type="vertical" />
            <Input
              placeholder="搜索运单号"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="快递公司"
              style={{ width: 130 }}
              allowClear
              onChange={(v) => setFilters(prev => ({ ...prev, brand: v }))}
            >
              {Object.entries(brandMap).map(([key, value]) => (
                <Option key={key} value={key}>{value}</Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadPackages}>刷新</Button>
          </Space>
          <Space>
            <Select
              placeholder="选择短信模板"
              style={{ width: 180 }}
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
            >
              {smsTemplates.map(t => (
                <Option key={t.id} value={t.id}>{t.name}</Option>
              ))}
            </Select>
            <Popconfirm
              title="确认批量发送提醒短信？"
              description={
                <div>
                  <div>已选择 {selectedRowKeys.length} 个包裹</div>
                  {selectedTemplateId && (
                    <div style={{ marginTop: 4 }}>
                      短信模板: {smsTemplates.find(t => t.id === selectedTemplateId)?.name || '未选择'}
                    </div>
                  )}
                  {filters.status === 'overdue' && (
                    <div style={{ color: '#faad14', marginTop: 8 }}>
                      <WarningOutlined /> 当前为滞留件筛选模式
                    </div>
                  )}
                </div>
              }
              onConfirm={handleBatchRemind}
              disabled={selectedRowKeys.length === 0}
              okText="确认发送"
              cancelText="取消"
            >
              <Button
                icon={<MailOutlined />}
                disabled={selectedRowKeys.length === 0}
                danger={filters.status === 'overdue'}
              >
                批量提醒 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
              包裹入库
            </Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={packages}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title="包裹入库"
        open={createModalVisible}
        onCancel={() => { setCreateModalVisible(false); form.resetFields(); setOcrResult(null) }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="trackingNumber"
                label="运单号"
                rules={[{ required: true, message: '请输入运单号' }]}
              >
                <Input placeholder="输入运单号，自动识别快递公司" onBlur={handleTrackingNumberBlur} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="brand"
                label="快递公司"
                rules={[{ required: true, message: '请选择快递公司' }]}
              >
                <Select placeholder="选择快递公司">
                  {Object.entries(brandMap).map(([key, value]) => (
                    <Option key={key} value={key}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="receiverName"
                label="收件人姓名"
                rules={[{ required: true, message: '请输入收件人姓名' }]}
              >
                <Input placeholder="请输入收件人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="receiverPhone"
                label="收件人电话"
                rules={[{ required: true, message: '请输入收件人电话' }]}
              >
                <Input placeholder="请输入收件人电话" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="cabinetId"
                label="存放柜机"
                rules={[{ required: true, message: '请选择柜机' }]}
              >
                <Select placeholder="选择柜机">
                  {cabinets.map(cabinet => (
                    <Option key={cabinet.id} value={cabinet.id}>{cabinet.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="boxId"
                label="格口编号"
                rules={[{ required: true, message: '请输入格口编号' }]}
              >
                <Input placeholder="如: A01" />
              </Form.Item>
            </Col>
          </Row>
          {ocrResult && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', borderRadius: 4 }}>
              <Badge status="success" text="面单识别结果" />
              <div style={{ marginTop: 8 }}>
                快递公司: {ocrResult.brandName} (置信度: {(ocrResult.confidence * 100).toFixed(0)}%)
              </div>
            </div>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认入库</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量提醒结果"
        open={batchResultVisible}
        onCancel={() => setBatchResultVisible(false)}
        footer={<Button onClick={() => setBatchResultVisible(false)}>关闭</Button>}
        width={500}
      >
        {batchResult && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Tag color="blue">模板: {batchResult.templateName}</Tag>
            </div>
            <Table
              size="small"
              pagination={false}
              dataSource={batchResult.results}
              rowKey={(r, i) => i}
              columns={[
                { title: '包裹ID', dataIndex: 'packageId', key: 'packageId', width: 80 },
                { title: '收件人', dataIndex: 'receiverName', key: 'receiverName', width: 100 },
                { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 120, render: (p) => maskPhone(p) },
                {
                  title: '结果',
                  dataIndex: 'success',
                  key: 'success',
                  width: 80,
                  render: (s) => s
                    ? <Tag color="success">成功</Tag>
                    : <Tag color="error">失败</Tag>
                }
              ]}
            />
          </div>
        )}
      </Modal>

      <Drawer
        title="包裹详情"
        placement="right"
        width={640}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentPackage && (
          <>
            {currentPackage.isNearOverdue && (
              <Alert
                message="即将滞留"
                description={`该包裹已存放 ${currentPackage.hoursSinceStored || 0} 小时，滞留阈值为 ${currentPackage.overdueThreshold || 24} 小时，即将变为滞留状态`}
                type="warning"
                showIcon
                icon={<ClockCircleOutlined />}
                style={{ marginBottom: 16 }}
              />
            )}

            <Card title="收件人信息" size="small" style={{ marginBottom: 16 }} type="inner">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="收件人姓名" span={1}>
                  <span style={{ fontWeight: 500 }}>{currentPackage.receiver_name}</span>
                </Descriptions.Item>
                <Descriptions.Item label="联系电话" span={1}>
                  {currentPackage.receiver_phone}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="快递员责任链" size="small" style={{ marginBottom: 16 }} type="inner">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="入库快递员">
                  <Tag color="blue">{currentPackage.courier_name || '-'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="快递员ID">
                  <span style={{ fontFamily: 'monospace' }}>{currentPackage.courier_id || '-'}</span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="包裹信息" size="small" style={{ marginBottom: 16 }} type="inner">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="运单号">
                  <span style={{ fontFamily: 'monospace' }}>{currentPackage.tracking_number}</span>
                </Descriptions.Item>
                <Descriptions.Item label="快递公司">
                  <Tag color={brandColors[currentPackage.brand]}>
                    {brandMap[currentPackage.brand] || currentPackage.brand}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="取件码">
                  {currentPackage.pickup_code ? (
                    <Tag color="orange" style={{ fontSize: 18, padding: '4px 12px' }}>
                      {currentPackage.pickup_code}
                    </Tag>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="存放柜机">
                  {currentPackage.cabinet_name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusMap[currentPackage.status]?.color}>
                    {statusMap[currentPackage.status]?.text || currentPackage.status}
                  </Tag>
                  {currentPackage.is_overdue === 1 && (
                    <Tag color="red" style={{ marginLeft: 8 }}>已滞留</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="存入时间">
                  {currentPackage.stored_at ? dayjs(currentPackage.stored_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="取件时间">
                  {currentPackage.picked_at ? dayjs(currentPackage.picked_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="已存放时长">
                  {currentPackage.hoursSinceStored != null ? (
                    <span style={{ color: currentPackage.hoursSinceStored >= (currentPackage.overdueThreshold || 24) ? '#ff4d4f' : '#52c41a', fontWeight: 500 }}>
                      {currentPackage.hoursSinceStored} 小时
                    </span>
                  ) : (
                    currentPackage.is_overdue === 1 ? (
                      <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
                        {currentPackage.overdue_hours || 24} 小时
                      </span>
                    ) : (
                      <span style={{ color: '#52c41a' }}>正常</span>
                    )
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="滞留阈值">
                  {currentPackage.overdueThreshold != null ? `${currentPackage.overdueThreshold} 小时` : '24 小时'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {currentPackage.codeLifecycle && currentPackage.codeLifecycle.length > 0 && (
              <Card title="取件码生命周期" size="small" style={{ marginBottom: 16 }} type="inner">
                <Timeline
                  items={currentPackage.codeLifecycle.map((item, index) => ({
                    color: item.status === 'expired' ? 'red' : item.status === 'used' ? 'green' : 'blue',
                    children: (
                      <div key={index}>
                        <div>
                          <Tag color={item.status === 'expired' ? 'red' : item.status === 'used' ? 'green' : 'blue'}>
                            {codeLifecycleTypeMap[item.type] || item.type}
                          </Tag>
                          <span style={{ fontFamily: 'monospace', fontWeight: 500, marginLeft: 8 }}>{item.code}</span>
                        </div>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                          {item.time ? dayjs(item.time).format('YYYY-MM-DD HH:mm:ss') : '-'}
                        </div>
                      </div>
                    )
                  }))}
                />
              </Card>
            )}

            {currentPackage.smsRecords && currentPackage.smsRecords.length > 0 && (
              <Card title="短信记录" size="small" style={{ marginBottom: 16 }} type="inner">
                <Table
                  size="small"
                  pagination={false}
                  dataSource={currentPackage.smsRecords}
                  rowKey={(r, i) => i}
                  columns={[
                    {
                      title: '内容',
                      dataIndex: 'content',
                      key: 'content',
                      ellipsis: true,
                      width: 200
                    },
                    {
                      title: '接收号码',
                      dataIndex: 'phone',
                      key: 'phone',
                      width: 120,
                      render: (p) => maskPhone(p)
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      key: 'status',
                      width: 90,
                      render: (s) => {
                        const info = smsStatusMap[s] || { text: s, color: 'default' }
                        return <Tag color={info.color}>{info.text}</Tag>
                      }
                    },
                    {
                      title: '发送时间',
                      dataIndex: 'created_at',
                      key: 'created_at',
                      width: 160,
                      render: (t) => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-'
                    }
                  ]}
                />
              </Card>
            )}
          </>
        )}
      </Drawer>
    </div>
  )
}
