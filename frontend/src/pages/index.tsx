import React, { useEffect } from 'react'
import { 
  Layout, 
  Menu, 
  Badge, 
  Card, 
  Statistic, 
  Row, 
  Col,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Tabs,
  Timeline,
  Descriptions,
  Modal,
  Form,
  InputNumber,
  message,
  Spin,
  Empty,
} from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  BellOutlined,
  WarningOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  ExportOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import type { Declaration, DeclarationStatus } from '@/types'
import { useAppStore } from '@/store'
import dayjs from 'dayjs'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout
const { Option } = Select
const { TabPane } = Tabs

const CheckOutlined = () => <span>✓</span>

interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  badge?: number
}

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { unreadCount, currentUser, actions } = useAppStore()

  useEffect(() => {
    actions.initConstants()
  }, [])

  const menuItems: MenuItem[] = [
    { key: '/', icon: <DashboardOutlined />, label: '状态看板' },
    { key: '/declarations', icon: <FileTextOutlined />, label: '报关单管理' },
    { key: '/todos', icon: <ClockCircleOutlined />, label: '待办事项' },
    { key: '/exceptions', icon: <WarningOutlined />, label: '异常队列' },
    { key: '/messages', icon: <BellOutlined />, label: '消息通知', badge: unreadCount },
  ]

  const selectedKey = location.pathname === '/' ? '/' : location.pathname

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} theme="dark">
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
        }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          海关报关系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.badge ? (
              <Badge count={item.badge} size="small" style={{ marginLeft: 8 }}>
                {item.label}
              </Badge>
            ) : item.label,
          }))}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            {menuItems.find(m => m.key === selectedKey)?.label || '海关报关系统'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={unreadCount} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => navigate('/messages')} />
            </Badge>
            <div>
              {currentUser?.name}
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {currentUser?.role}
              </Tag>
            </div>
          </div>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

const DashboardPage: React.FC = () => {
  const { statusCounts, statistics, kanbanData, loading, actions } = useAppStore()

  useEffect(() => {
    actions.fetchStatusCounts()
    actions.fetchStatistics()
    actions.fetchKanban()
  }, [])

  const refresh = () => {
    actions.fetchStatusCounts()
    actions.fetchStatistics()
    actions.fetchKanban()
  }

  const statusCards = statusCounts ? Object.entries(statusCounts).map(([key, value]) => ({
    status: key as DeclarationStatus,
    ...value,
  })).filter(c => c.count > 0) : []

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总报关单"
              value={statistics?.total || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中"
              value={statistics?.inProgress || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={statistics?.completed || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成率"
              value={statistics?.completionRate || 0}
              suffix="%"
              prefix={<ReloadOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="状态分布" 
        extra={<Button icon={<ReloadOutlined />} onClick={refresh}>刷新</Button>}
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          {statusCards.length > 0 ? statusCards.map(card => (
            <Col key={card.status} span={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{card.count}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{card.displayName}</div>
              </Card>
            </Col>
          )) : (
            <Col span={24}>
              <Empty description="暂无数据" />
            </Col>
          )}
        </Row>
      </Card>

      <Card title="状态看板 - 业务流程">
        <Spin spinning={loading}>
          <Row gutter={16}>
            {kanbanData ? Object.entries(kanbanData).map(([status, column]) => (
              <Col key={status} span={6}>
                <Card 
                  title={
                    <Space>
                      {column.statusName}
                      <Tag color="blue">{column.count}</Tag>
                    </Space>
                  }
                  size="small"
                  style={{ background: '#fafafa' }}
                >
                  <div style={{ maxHeight: 400, overflow: 'auto' }}>
                    {column.items.length > 0 ? column.items.map((item: any) => (
                      <Card 
                        key={item.id}
                        size="small"
                        style={{ marginBottom: 8, cursor: 'pointer' }}
                        hoverable
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                          {item.mainOrderNo}
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                          {item.shipper}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {dayjs(item.createdAt).format('MM-DD HH:mm')}
                          {item.isLocked && <Tag color="orange" style={{ marginLeft: 8 }}>已锁定</Tag>}
                        </div>
                      </Card>
                    )) : (
                      <Empty description="暂无数据" style={{ padding: 20 }} />
                    )}
                  </div>
                </Card>
              </Col>
            )) : (
              <Col span={24}>
                <Empty description="加载中..." />
              </Col>
            )}
          </Row>
        </Spin>
      </Card>
    </div>
  )
}

const DeclarationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { declarations, totalDeclarations, currentPage, pageSize, loading, actions } = useAppStore()
  const [searchParams, setSearchParams] = React.useState({
    status: undefined as string | undefined,
    search: '',
  })
  const [createModalVisible, setCreateModalVisible] = React.useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    actions.fetchDeclarations(searchParams)
  }

  const columns = [
    {
      title: '主单号',
      dataIndex: 'mainOrderNo',
      key: 'mainOrderNo',
      render: (text: string, record: Declaration) => (
        <a onClick={() => navigate(`/declarations/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: DeclarationStatus) => (
        <Tag color={actions.getStatusColor(status)}>
          {actions.getStatusName(status)}
        </Tag>
      ),
    },
    {
      title: '发货人',
      dataIndex: 'shipper',
      key: 'shipper',
    },
    {
      title: '收货人',
      dataIndex: 'consignee',
      key: 'consignee',
    },
    {
      title: '提单号',
      dataIndex: 'billOfLadingNo',
      key: 'billOfLadingNo',
    },
    {
      title: '创建人',
      dataIndex: ['creator', 'name'],
      key: 'creator',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Declaration) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/declarations/${record.id}`)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            disabled={record.isLocked}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  const handleCreate = async (values: any) => {
    const result = await actions.createDeclaration({
      ...values,
      items: values.items || [],
    })
    
    if (result.success) {
      message.success('创建成功')
      setCreateModalVisible(false)
      form.resetFields()
      fetchData()
    } else {
      message.error(result.errors?.[0] || '创建失败')
    }
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
              value={searchParams.status}
              onChange={(status) => setSearchParams({ ...searchParams, status })}
            >
              <Option value="PENDING_DATA_ENTRY">待资料录入</Option>
              <Option value="PENDING_CLASSIFICATION">待商品归类</Option>
              <Option value="PENDING_DECLARATION">待申报</Option>
              <Option value="PENDING_INSPECTION_TAX">待查验缴税</Option>
              <Option value="RELEASED_ARCHIVED">放行归档</Option>
              <Option value="REJECTED">已驳回</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Input
              placeholder="搜索主单号/发货人/收货人"
              prefix={<SearchOutlined />}
              value={searchParams.search}
              onChange={(e) => setSearchParams({ ...searchParams, search: e.target.value })}
              onPressEnter={fetchData}
            />
          </Col>
          <Col span={6}>
            <Space>
              <Button type="primary" onClick={fetchData} icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={fetchData} icon={<ReloadOutlined />}>
                刷新
              </Button>
            </Space>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ExportOutlined />}>导出</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
                新建报关单
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={declarations}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalDeclarations,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="新建报关单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="declarationType"
                label="报关类型"
                rules={[{ required: true, message: '请选择报关类型' }]}
              >
                <Select placeholder="请选择">
                  <Option value="IMPORT">进口</Option>
                  <Option value="EXPORT">出口</Option>
                  <Option value="TRANSIT">转关</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tradeMode"
                label="贸易方式"
                rules={[{ required: true, message: '请选择贸易方式' }]}
              >
                <Select placeholder="请选择">
                  <Option value="GENERAL">一般贸易</Option>
                  <Option value="PROCESSING">加工贸易</Option>
                  <Option value="BONDED">保税贸易</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customsCode"
                label="海关代码"
                rules={[{ required: true, message: '请输入海关代码' }]}
              >
                <Input placeholder="例如: 2200" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="iePort"
                label="进出口岸"
                rules={[{ required: true, message: '请输入进出口岸' }]}
              >
                <Input placeholder="例如: 上海港" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="shipper"
                label="发货人"
                rules={[{ required: true, message: '请输入发货人' }]}
              >
                <Input placeholder="请输入发货人名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="consignee"
                label="收货人"
                rules={[{ required: true, message: '请输入收货人' }]}
              >
                <Input placeholder="请输入收货人名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="transportMode"
                label="运输方式"
                rules={[{ required: true, message: '请选择运输方式' }]}
              >
                <Select placeholder="请选择">
                  <Option value="SEA">海运</Option>
                  <Option value="AIR">空运</Option>
                  <Option value="RAIL">铁路</Option>
                  <Option value="TRUCK">公路</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="billOfLadingNo"
                label="提单号"
              >
                <Input placeholder="请输入提单号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="voyageNo"
                label="航次号"
              >
                <Input placeholder="请输入航次号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currency"
                label="币制"
                initialValue="USD"
              >
                <Select>
                  <Option value="USD">美元 (USD)</Option>
                  <Option value="CNY">人民币 (CNY)</Option>
                  <Option value="EUR">欧元 (EUR)</Option>
                  <Option value="JPY">日元 (JPY)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="totalValue"
                label="总金额"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入总金额"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

const DeclarationDetailPage: React.FC<{ id: string }> = ({ id }) => {
  const navigate = useNavigate()
  const { selectedDeclaration, loading, actions } = useAppStore()
  const [availableActions, setAvailableActions] = React.useState<{ code: string; name: string }[]>([])
  const [actionModalVisible, setActionModalVisible] = React.useState(false)
  const [selectedAction, setSelectedAction] = React.useState<string>('')
  const [actionComment, setActionComment] = React.useState('')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    await actions.fetchDeclarationById(id)
    const res = await import('@/services/api').then(m => m.declarationApi.getAvailableActions(id))
    if (res.success) {
      setAvailableActions(res.data.availableActions)
    }
  }

  const handleAction = async () => {
    const result = await actions.performAction(id, selectedAction, actionComment)
    if (result.success) {
      message.success('操作成功')
      setActionModalVisible(false)
      loadData()
    } else {
      message.error(result.errors?.[0] || '操作失败')
    }
  }

  const declaration = selectedDeclaration

  if (loading && !declaration) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />
  }

  if (!declaration) {
    return <Empty description="报关单不存在" />
  }

  const tabs = [
    {
      key: 'basic',
      label: '基本信息',
      content: (
        <Card>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="主单号">{declaration.mainOrderNo}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={actions.getStatusColor(declaration.status)}>
                {actions.getStatusName(declaration.status)}
              </Tag>
              {declaration.isLocked && <Tag color="orange" style={{ marginLeft: 8 }}>已锁定</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="报关类型">{declaration.declarationType}</Descriptions.Item>
            <Descriptions.Item label="贸易方式">{declaration.tradeMode}</Descriptions.Item>
            <Descriptions.Item label="海关代码">{declaration.customsCode}</Descriptions.Item>
            <Descriptions.Item label="进出口岸">{declaration.iePort}</Descriptions.Item>
            <Descriptions.Item label="发货人" span={2}>{declaration.shipper}</Descriptions.Item>
            <Descriptions.Item label="收货人" span={2}>{declaration.consignee}</Descriptions.Item>
            <Descriptions.Item label="运输方式">{declaration.transportMode}</Descriptions.Item>
            <Descriptions.Item label="航次号">{declaration.voyageNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="提单号">{declaration.billOfLadingNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="币制">{declaration.currency || '-'}</Descriptions.Item>
            <Descriptions.Item label="总金额">{declaration.totalValue?.toLocaleString() || '-'}</Descriptions.Item>
            <Descriptions.Item label="总税费">{declaration.totalTax?.toLocaleString() || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建人">{declaration.creator?.name}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(declaration.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'items',
      label: `商品明细 (${declaration.items?.length || 0})`,
      content: (
        <Card>
          <Table
            dataSource={declaration.items}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '项号', dataIndex: 'lineNo', key: 'lineNo' },
              { title: '商品编码', dataIndex: 'hsCode', key: 'hsCode', render: (v: string) => v || '-' },
              { title: '商品名称', dataIndex: 'productName', key: 'productName' },
              { title: '规格型号', dataIndex: 'specification', key: 'specification', render: (v: string) => v || '-' },
              { title: '原产国', dataIndex: 'originCountry', key: 'originCountry', render: (v: string) => v || '-' },
              { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (v: number, r: any) => v ? `${v} ${r.unit}` : '-' },
              { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', render: (v: number) => v?.toLocaleString() || '-' },
              { title: '总价', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => v?.toLocaleString() || '-' },
              { title: '币制', dataIndex: 'currency', key: 'currency' },
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'taxes',
      label: `税费记录 (${declaration.taxes?.length || 0})`,
      content: (
        <Card extra={
          <Button type="primary" onClick={async () => {
            const result = await import('@/services/api').then(m => m.declarationApi.calculateTax(id))
            if (result.success) {
              message.success('税费计算成功')
              loadData()
            }
          }}>
            计算税费
          </Button>
        }>
          <Table
            dataSource={declaration.taxes}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '税费类型', dataIndex: 'taxType', key: 'taxType', render: (v: string) => {
                const types: Record<string, string> = {
                  TARIFF: '关税',
                  VAT: '增值税',
                  CONSUMPTION: '消费税',
                }
                return types[v] || v
              }},
              { title: '计税基数', dataIndex: 'taxBase', key: 'taxBase', render: (v: number) => v?.toLocaleString() || '-' },
              { title: '税率', dataIndex: 'taxRate', key: 'taxRate', render: (v: number) => v ? `${(v * 100).toFixed(2)}%` : '-' },
              { title: '税费金额', dataIndex: 'taxAmount', key: 'taxAmount', render: (v: number) => v?.toLocaleString() },
              { title: '币制', dataIndex: 'currency', key: 'currency' },
              { title: '汇率', dataIndex: 'exchangeRate', key: 'exchangeRate', render: (v: number) => v || '-' },
              { title: '缴纳状态', dataIndex: 'paidStatus', key: 'paidStatus', render: (v: string) => (
                <Tag color={v === 'PAID' ? 'green' : 'orange'}>
                  {v === 'PAID' ? '已缴纳' : v === 'PARTIAL' ? '部分缴纳' : '未缴纳'}
                </Tag>
              )},
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'timeline',
      label: '状态时间轴',
      content: (
        <Card>
          <Timeline mode="left">
            {declaration.statusHistory?.map((item, index) => (
              <Timeline.Item
                key={item.id}
                color={index === 0 ? 'blue' : 'gray'}
                label={dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              >
                <div style={{ fontWeight: 'bold' }}>
                  {item.fromStatus ? `${actions.getStatusName(item.fromStatus)} → ` : ''}
                  {actions.getStatusName(item.toStatus)}
                </div>
                <div style={{ color: '#666', fontSize: 12 }}>
                  操作人: {item.operatorName} ({item.operatorRole})
                </div>
                {item.comment && (
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    备注: {item.comment}
                  </div>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button onClick={() => navigate('/declarations')}>
                返回列表
              </Button>
              <span style={{ fontSize: 18, fontWeight: 'bold' }}>
                {declaration.mainOrderNo}
              </span>
              <Tag color={actions.getStatusColor(declaration.status)}>
                {actions.getStatusName(declaration.status)}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadData}
              >
                刷新
              </Button>
              {availableActions.map(action => (
                <Button
                  key={action.code}
                  type={action.code === 'SUBMIT_FOR_CLASSIFICATION' || action.code === 'CLASSIFY' || action.code === 'DECLARE' ? 'primary' : 'default'}
                  onClick={() => {
                    setSelectedAction(action.code)
                    setActionModalVisible(true)
                  }}
                >
                  {action.name}
                </Button>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="basic">
        {tabs.map(tab => (
          <TabPane tab={tab.label} key={tab.key}>
            {tab.content}
          </TabPane>
        ))}
      </Tabs>

      <Modal
        title={availableActions.find(a => a.code === selectedAction)?.name || '操作'}
        open={actionModalVisible}
        onCancel={() => setActionModalVisible(false)}
        onOk={handleAction}
      >
        <Form.Item label="备注">
          <Input.TextArea
            value={actionComment}
            onChange={(e) => setActionComment(e.target.value)}
            rows={4}
            placeholder="请输入操作备注（可选）"
          />
        </Form.Item>
      </Modal>
    </div>
  )
}

const TodosPage: React.FC = () => {
  const { todoItems, currentUser, actions } = useAppStore()

  useEffect(() => {
    if (currentUser) {
      actions.fetchTodos(currentUser.id)
    }
  }, [currentUser])

  return (
    <Card>
      <Table
        columns={[
          { title: '标题', dataIndex: 'title', key: 'title' },
          { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => (
            <Tag color={v === 'COMPLETED' ? 'green' : 'blue'}>
              {v === 'COMPLETED' ? '已完成' : '待处理'}
            </Tag>
          )},
          { title: '关联报关单', key: 'declaration', render: (_: any, record: any) => (
            record.declaration ? (
              <Space>
                <a>{record.declaration.mainOrderNo}</a>
                <Tag>{actions.getStatusName(record.declaration.status)}</Tag>
              </Space>
            ) : '-'
          )},
          { title: '优先级', dataIndex: 'priority', key: 'priority', render: (v: number) => (
            <Tag color={v > 1 ? 'red' : 'default'}>
              {v > 1 ? '高' : '普通'}
            </Tag>
          )},
          { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
        ]}
        dataSource={todoItems}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />
    </Card>
  )
}

const ExceptionsPage: React.FC = () => {
  return (
    <Card>
      <Empty description="暂无异常数据" />
    </Card>
  )
}

const MessagesPage: React.FC = () => {
  const { messages, currentUser, actions } = useAppStore()

  useEffect(() => {
    if (currentUser) {
      actions.fetchMessages(currentUser.id)
    }
  }, [currentUser])

  return (
    <Card>
      <Table
        columns={[
          { title: '标题', dataIndex: 'title', key: 'title' },
          { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
          { title: '类型', dataIndex: 'msgType', key: 'msgType', render: (v: string) => (
            <Tag color={v === 'TODO' ? 'blue' : 'default'}>
              {v === 'TODO' ? '待办通知' : '系统通知'}
            </Tag>
          )},
          { title: '状态', dataIndex: 'isRead', key: 'isRead', render: (v: boolean) => (
            <Tag color={v ? 'default' : 'blue'}>
              {v ? '已读' : '未读'}
            </Tag>
          )},
          { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
          {
            title: '操作',
            key: 'action',
            render: (_: any, record: any) => (
              !record.isRead ? (
                <Button type="link" onClick={() => actions.markMessageRead(record.id)}>
                  标记已读
                </Button>
              ) : null
            ),
          },
        ]}
        dataSource={messages}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />
    </Card>
  )
}

export {
  MainLayout,
  DashboardPage,
  DeclarationsPage,
  DeclarationDetailPage,
  TodosPage,
  ExceptionsPage,
  MessagesPage,
}
