import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Tabs,
  Statistic,
  Progress,
  List,
  Avatar,
  Modal,
  Form,
  Input,
  Select,
  message,
} from 'antd'
import {
  UserOutlined,
  HeartOutlined,
  SafetyOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  RiseOutlined,
  TeamOutlined,
  WarningOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'

const { Option } = Select

const mockDashboardStats = {
  totalUsers: 128456,
  todayUsers: 1256,
  totalOrders: 45678,
  todayOrders: 89,
  totalRevenue: 12567890,
  todayRevenue: 89560,
  totalHealthChecks: 23456,
  totalInsurances: 22222,
}

const mockUserGrowth = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['新增用户', '活跃用户'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '新增用户',
      type: 'line',
      smooth: true,
      data: [120, 150, 180, 210, 160, 280, 250],
      lineStyle: { color: '#1677ff' },
      areaStyle: { color: 'rgba(22, 119, 255, 0.1)' },
    },
    {
      name: '活跃用户',
      type: 'line',
      smooth: true,
      data: [450, 520, 480, 610, 550, 720, 680],
      lineStyle: { color: '#52c41a' },
      areaStyle: { color: 'rgba(82, 196, 26, 0.1)' },
    },
  ],
}

const mockRevenueChart = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['体检收入', '保险收入'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '体检收入',
      type: 'bar',
      data: [320000, 450000, 380000, 520000, 480000, 620000],
      itemStyle: { color: '#1677ff' },
    },
    {
      name: '保险收入',
      type: 'bar',
      data: [280000, 320000, 420000, 380000, 550000, 490000],
      itemStyle: { color: '#52c41a' },
    },
  ],
}

const mockUsers = Array.from({ length: 20 }).map((_, i) => ({
  key: String(i + 1),
  id: `U${String(i + 1).padStart(6, '0')}`,
  name: `用户${i + 1}`,
  phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
  email: `user${i + 1}@example.com`,
  role: i === 0 || i === 5 ? 'admin' : 'user',
  status: Math.random() > 0.2 ? 'active' : 'inactive',
  registerTime: dayjs().subtract(i, 'day').format('YYYY-MM-DD HH:mm:ss'),
  lastLoginTime: dayjs().subtract(Math.floor(Math.random() * 24), 'hour').format('YYYY-MM-DD HH:mm:ss'),
}))

const mockOrders = Array.from({ length: 15 }).map((_, i) => ({
  key: String(i + 1),
  id: `${i % 2 === 0 ? 'HC' : 'INS'}${String(i + 1).padStart(8, '0')}`,
  type: i % 2 === 0 ? '体检预约' : '保险购买',
  userName: `用户${i + 1}`,
  productName: i % 2 === 0 ? '全面体检套餐' : '百万医疗险',
  amount: Math.floor(Math.random() * 3000) + 100,
  status: ['pending', 'paid', 'completed', 'cancelled'][i % 4] as string,
  createTime: dayjs().subtract(i * 2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
}))

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待支付' },
  paid: { color: 'blue', text: '已支付' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'default', text: '已取消' },
  active: { color: 'green', text: '正常' },
  inactive: { color: 'red', text: '禁用' },
}

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [editingUser, setEditingUser] = useState<any>(null)
  const [userForm] = Form.useForm()

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    userForm.setFieldsValue(user)
  }

  const handleSaveUser = async () => {
    try {
      await userForm.validateFields()
      message.success('用户信息更新成功')
      setEditingUser(null)
    } catch {
      // 表单验证失败
    }
  }

  const handleDeleteUser = (user: any) => {
    Modal.confirm({
      title: '确认删除用户',
      content: `确定要删除用户 ${user.name} 吗？此操作不可恢复。`,
      onOk: () => {
        message.success('用户删除成功')
      },
    })
  }

  const handleToggleUserStatus = (user: any) => {
    Modal.confirm({
      title: user.status === 'active' ? '确认禁用用户' : '确认启用用户',
      content: `确定要${user.status === 'active' ? '禁用' : '启用'}用户 ${user.name} 吗？`,
      onOk: () => {
        message.success(`用户${user.status === 'active' ? '禁用' : '启用'}成功`)
      },
    })
  }

  const userColumns = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      className: 'font-mono',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <Avatar icon={<UserOutlined />} className="bg-[#1677ff]" />
          <span>{name}</span>
        </div>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].text}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'registerTime',
      key: 'registerTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={record.status === 'active' ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleUserStatus(record)}
            danger={record.status === 'active'}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteUser(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const orderColumns = [
    {
      title: '订单编号',
      dataIndex: 'id',
      key: 'id',
      className: 'font-mono',
    },
    {
      title: '订单类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === '体检预约' ? 'blue' : 'green'}>{type}</Tag>
      ),
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '商品',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span className="text-[#f5222d] font-semibold">¥{amount}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].text}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
  ]

  const renderDashboard = () => (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title={
                <div className="flex items-center justify-center gap-2">
                  <TeamOutlined className="text-[#1677ff]" />
                  <span>总用户数</span>
                </div>
              }
              value={mockDashboardStats.totalUsers}
              suffix="人"
              className="text-[#1677ff]"
              valueStyle={{ color: '#1677ff' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              今日新增 <span className="text-[#52c41a] font-semibold">+{mockDashboardStats.todayUsers}</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title={
                <div className="flex items-center justify-center gap-2">
                  <ShoppingOutlined className="text-[#52c41a]" />
                  <span>总订单数</span>
                </div>
              }
              value={mockDashboardStats.totalOrders}
              suffix="单"
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              今日订单 <span className="text-[#1677ff] font-semibold">{mockDashboardStats.todayOrders}</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title={
                <div className="flex items-center justify-center gap-2">
                  <RiseOutlined className="text-[#fa8c16]" />
                  <span>总收入</span>
                </div>
              }
              value={mockDashboardStats.totalRevenue}
              suffix="元"
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
              formatter={(value) => `¥${Number(value).toLocaleString()}`}
            />
            <div className="mt-2 text-sm text-gray-500">
              今日收入 <span className="text-[#52c41a] font-semibold">¥{mockDashboardStats.todayRevenue.toLocaleString()}</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title={
                <div className="flex items-center justify-center gap-2">
                  <WarningOutlined className="text-[#f5222d]" />
                  <span>风险预警</span>
                </div>
              }
              value={128}
              suffix="条"
              valueStyle={{ color: '#f5222d' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              待处理 <span className="text-[#f5222d] font-semibold">25</span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="用户增长趋势">
            <ReactECharts option={mockUserGrowth} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="收入统计">
            <ReactECharts option={mockRevenueChart} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="业务占比">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <HeartOutlined className="text-3xl text-[#1677ff] mb-2" />
                  <div className="text-2xl font-bold text-[#1677ff]">{mockDashboardStats.totalHealthChecks}</div>
                  <div className="text-gray-500">体检预约</div>
                  <Progress
                    percent={Math.round(mockDashboardStats.totalHealthChecks / (mockDashboardStats.totalHealthChecks + mockDashboardStats.totalInsurances) * 100)}
                    status="active"
                    strokeColor="#1677ff"
                    className="mt-2"
                  />
                </div>
              </Col>
              <Col span={12}>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <SafetyOutlined className="text-3xl text-[#52c41a] mb-2" />
                  <div className="text-2xl font-bold text-[#52c41a]">{mockDashboardStats.totalInsurances}</div>
                  <div className="text-gray-500">保险购买</div>
                  <Progress
                    percent={Math.round(mockDashboardStats.totalInsurances / (mockDashboardStats.totalHealthChecks + mockDashboardStats.totalInsurances) * 100)}
                    status="active"
                    strokeColor="#52c41a"
                    className="mt-2"
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近活动">
            <List
              dataSource={mockOrders.slice(0, 6)}
              renderItem={(item) => (
                <List.Item className="px-0">
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={item.type === '体检预约' ? <HeartOutlined /> : <SafetyOutlined />}
                        className={item.type === '体检预约' ? 'bg-[#1677ff]' : 'bg-[#52c41a]'}
                      />
                    }
                    title={
                      <div className="flex justify-between">
                        <span>{item.userName} {item.type === '体检预约' ? '预约了' : '购买了'} {item.productName}</span>
                        <Tag color={statusMap[item.status].color}>{statusMap[item.status].text}</Tag>
                      </div>
                    }
                    description={
                      <div className="flex justify-between text-sm">
                        <span className="text-[#f5222d]">¥{item.amount}</span>
                        <span className="text-gray-400">{item.createTime}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">管理后台</h2>

      <Card bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="px-6 pt-2"
          items={[
            { key: 'dashboard', label: '数据概览' },
            { key: 'users', label: '用户管理' },
            { key: 'orders', label: '订单管理' },
            { key: 'health-checks', label: '体检管理' },
            { key: 'insurances', label: '保险管理' },
          ]}
        />

        <div className="px-6 pb-6">
          {activeTab === 'dashboard' && renderDashboard()}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button type="primary" icon={<UserOutlined />}>
                  新增用户
                </Button>
              </div>
              <Table
                columns={userColumns}
                dataSource={mockUsers}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
              />
            </div>
          )}

          {activeTab === 'orders' && (
            <Table
              columns={orderColumns}
              dataSource={mockOrders}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          )}

          {activeTab === 'health-checks' && (
            <div className="text-center py-12 text-gray-500">
              <FileTextOutlined className="text-4xl mb-4" />
              <p>体检管理功能开发中...</p>
            </div>
          )}

          {activeTab === 'insurances' && (
            <div className="text-center py-12 text-gray-500">
              <SafetyOutlined className="text-4xl mb-4" />
              <p>保险管理功能开发中...</p>
            </div>
          )}
        </div>
      </Card>

      <Modal
        title="编辑用户"
        open={!!editingUser}
        onCancel={() => setEditingUser(null)}
        onOk={handleSaveUser}
        width={600}
      >
        <Form form={userForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="邮箱" rules={[{ type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="role" label="角色" rules={[{ required: true }]}>
                <Select>
                  <Option value="user">普通用户</Option>
                  <Option value="admin">管理员</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select>
              <Option value="active">正常</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Admin
