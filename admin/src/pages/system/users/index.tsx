import React, { useState } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Avatar,
  Tag,
  Modal,
  Form,
  Drawer,
  Descriptions,
  Tabs,
  Switch,
  message,
  Divider,
  List,
  Alert
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  UserOutlined,
  EditOutlined,
  EyeOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { RangePicker } = DatePicker
const { TabPane } = Tabs
const { Option } = Select

interface UserRecord {
  key: string
  id: string
  username: string
  realName: string
  userType: 'natural' | 'legal' | 'admin'
  role: string
  roleId: string
  phone: string
  email: string
  department: string
  departmentId: string
  registerTime: string
  lastLoginTime: string
  status: 'active' | 'locked' | 'disabled'
  avatar?: string
  idCard?: string
  address?: string
  loginLogs?: LoginLogRecord[]
  operationLogs?: OperationLogRecord[]
}

interface LoginLogRecord {
  time: string
  ip: string
  device: string
  status: 'success' | 'failed'
}

interface OperationLogRecord {
  time: string
  module: string
  action: string
  description: string
}

const mockUsers: UserRecord[] = [
  {
    key: '1',
    id: 'U00001',
    username: 'admin',
    realName: '系统管理员',
    userType: 'admin',
    role: '超级管理员',
    roleId: 'R001',
    phone: '13800138000',
    email: 'admin@nx.gov.cn',
    department: '信息中心',
    departmentId: 'D001',
    registerTime: '2024-01-01 09:00:00',
    lastLoginTime: '2024-06-15 08:30:00',
    status: 'active',
    idCard: '110101199001011234',
    address: '北京市朝阳区政务中心',
    loginLogs: [
      { time: '2024-06-15 08:30:00', ip: '192.168.1.100', device: 'Windows 10 / Chrome', status: 'success' },
      { time: '2024-06-14 18:00:00', ip: '192.168.1.100', device: 'Windows 10 / Chrome', status: 'success' },
      { time: '2024-06-14 09:15:00', ip: '192.168.1.100', device: 'Windows 10 / Chrome', status: 'success' }
    ],
    operationLogs: [
      { time: '2024-06-15 10:30:00', module: '用户管理', action: '修改', description: '修改用户张三信息' },
      { time: '2024-06-15 09:45:00', module: '角色权限', action: '配置', description: '配置部门管理员角色权限' },
      { time: '2024-06-14 16:20:00', module: '系统管理', action: '新增', description: '新增部门医疗保障局' }
    ]
  },
  {
    key: '2',
    id: 'U00002',
    username: 'zhangsan',
    realName: '张三',
    userType: 'admin',
    role: '委办局管理员',
    roleId: 'R002',
    phone: '13800138001',
    email: 'zhangsan@nx.gov.cn',
    department: '市场监督管理局',
    departmentId: 'D002',
    registerTime: '2024-02-15 10:30:00',
    lastLoginTime: '2024-06-15 09:00:00',
    status: 'active',
    idCard: '110102198505055678',
    address: '北京市海淀区市场监管局',
    loginLogs: [
      { time: '2024-06-15 09:00:00', ip: '192.168.1.101', device: 'Windows 11 / Edge', status: 'success' }
    ],
    operationLogs: [
      { time: '2024-06-15 10:00:00', module: '服务事项', action: '新增', description: '新增食品经营许可事项' }
    ]
  },
  {
    key: '3',
    id: 'U00003',
    username: 'lisi',
    realName: '李四',
    userType: 'natural',
    role: '普通用户',
    roleId: 'R003',
    phone: '13800138002',
    email: 'lisi@nx.gov.cn',
    department: '公安局',
    departmentId: 'D003',
    registerTime: '2024-03-20 14:00:00',
    lastLoginTime: '2024-06-14 16:30:00',
    status: 'active',
    idCard: '110103199208089012',
    address: '北京市西城区公安局',
    loginLogs: [],
    operationLogs: []
  },
  {
    key: '4',
    id: 'U00004',
    username: 'wangwu',
    realName: '王五',
    userType: 'natural',
    role: '委办局办事员',
    roleId: 'R004',
    phone: '13800138003',
    email: 'wangwu@nx.gov.cn',
    department: '住房和城乡建设局',
    departmentId: 'D004',
    registerTime: '2024-04-10 11:20:00',
    lastLoginTime: '2024-06-10 08:00:00',
    status: 'locked',
    idCard: '110104198812123456',
    address: '北京市东城区住建局',
    loginLogs: [],
    operationLogs: []
  },
  {
    key: '5',
    id: 'U00005',
    username: 'zhaoliu',
    realName: '赵六',
    userType: 'legal',
    role: '委办局管理员',
    roleId: 'R002',
    phone: '13800138004',
    email: 'zhaoliu@nx.gov.cn',
    department: '人力资源和社会保障局',
    departmentId: 'D005',
    registerTime: '2024-05-05 09:30:00',
    lastLoginTime: '2024-06-15 07:45:00',
    status: 'active',
    idCard: '110105199103037890',
    address: '北京市朝阳区人社局',
    loginLogs: [],
    operationLogs: []
  },
  {
    key: '6',
    id: 'U00006',
    username: 'qianqi',
    realName: '钱七',
    userType: 'natural',
    role: '普通用户',
    roleId: 'R003',
    phone: '13800138005',
    email: 'qianqi@nx.gov.cn',
    department: '医疗保障局',
    departmentId: 'D006',
    registerTime: '2024-05-20 15:00:00',
    lastLoginTime: '2024-06-13 10:20:00',
    status: 'disabled',
    idCard: '110106199506061234',
    address: '北京市丰台区医保局',
    loginLogs: [],
    operationLogs: []
  }
]

const userTypeConfig = {
  natural: { label: '自然人', color: 'blue' },
  legal: { label: '法人', color: 'purple' },
  admin: { label: '管理员', color: 'red' }
}

const statusConfig = {
  active: { label: '正常', color: 'success' },
  locked: { label: '锁定', color: 'warning' },
  disabled: { label: '禁用', color: 'error' }
}

const departmentOptions = [
  '信息中心',
  '市场监督管理局',
  '公安局',
  '住房和城乡建设局',
  '人力资源和社会保障局',
  '医疗保障局'
]

const Users: React.FC = () => {
  const [userList, setUserList] = useState<UserRecord[]>(mockUsers)
  const [modalVisible, setModalVisible] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null)
  const [modalType, setModalType] = useState<'add' | 'edit'>('add')
  const [form] = Form.useForm()
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  const columns: ColumnsType<UserRecord> = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (text: string) => <span style={{ color: '#8c8c8c', fontSize: 12 }}>{text}</span>
    },
    {
      title: '用户信息',
      dataIndex: 'userInfo',
      key: 'userInfo',
      width: 200,
      render: (_: unknown, record: UserRecord) => (
        <Space>
          <Avatar style={{ backgroundColor: '#0958d9' }} icon={<UserOutlined />} src={record.avatar} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.realName}</div>
            <div style={{ fontSize: 12, color: '#999' }}>@{record.username}</div>
          </div>
        </Space>
      )
    },
    {
      title: '用户类型',
      dataIndex: 'userType',
      key: 'userType',
      width: 80,
      render: (type: keyof typeof userTypeConfig) => {
        const config = userTypeConfig[type]
        return <Tag color={config.color}>{config.label}</Tag>
      }
    },
    {
      title: '所属角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (text: string) => (
        <Tag color="geekblue" style={{ margin: 0 }}>
          <SafetyCertificateOutlined style={{ marginRight: 4 }} />
          {text}
        </Tag>
      )
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true
    },
    {
      title: '所属部门',
      dataIndex: 'department',
      key: 'department',
      width: 150
    },
    {
      title: '注册时间',
      dataIndex: 'registerTime',
      key: 'registerTime',
      width: 170
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      width: 170,
      render: (text: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
          <span style={{ fontSize: 12 }}>{text}</span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: keyof typeof statusConfig) => {
        const config = statusConfig[status]
        return <Tag color={config.color as any}>{config.label}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_: unknown, record: UserRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger={record.status === 'active'}
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
          <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => handleResetPassword(record)}>
            重置密码
          </Button>
        </Space>
      )
    }
  ]

  const handleViewDetail = (record: UserRecord) => {
    setCurrentUser(record)
    setDrawerVisible(true)
  }

  const handleEdit = (record: UserRecord) => {
    setModalType('edit')
    setCurrentUser(record)
    form.setFieldsValue({
      username: record.username,
      realName: record.realName,
      userType: record.userType,
      phone: record.phone,
      email: record.email,
      department: record.departmentId,
      status: record.status
    })
    setModalVisible(true)
  }

  const handleAdd = () => {
    setModalType('add')
    form.resetFields()
    setModalVisible(true)
  }

  const handleToggleStatus = (record: UserRecord) => {
    const newStatus = record.status === 'active' ? 'disabled' : 'active'
    setUserList(
      userList.map((u) => (u.key === record.key ? { ...u, status: newStatus as any } : u))
    )
    message.success(`用户已${newStatus === 'active' ? '启用' : '禁用'}`)
  }

  const handleResetPassword = (record: UserRecord) => {
    Modal.confirm({
      title: '重置密码确认',
      content: `确定要重置用户「${record.realName}」的密码吗？重置后密码将变为默认密码。`,
      okText: '确定重置',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        message.success('密码重置成功，默认密码：123456')
      }
    })
  }

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      console.log('Form values:', values)
      setModalVisible(false)
      message.success(modalType === 'add' ? '新增用户成功' : '编辑用户成功')
    })
  }

  const handleAssignRole = () => {
    setSelectedRoles(currentUser?.roleId ? [currentUser.roleId] : [])
    setRoleModalVisible(true)
  }

  const handleRoleModalOk = () => {
    setRoleModalVisible(false)
    message.success('角色分配成功')
  }

  return (
    <div>
      <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
        <TeamOutlined style={{ color: '#0958d9', marginRight: 8 }} />
        用户管理
      </Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="总用户数"
              value={1258}
              prefix={<UserOutlined style={{ color: '#0958d9' }} />}
              valueStyle={{ color: '#0958d9', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="今日新增"
              value={18}
              prefix={<PlusOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="活跃用户"
              value={892}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="锁定用户"
              value={35}
              prefix={<LockOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 8 }}>
        <div style={{ marginBottom: 16 }}>
          <Space wrap size={10}>
            <Input
              placeholder="用户名"
              prefix={<SearchOutlined />}
              style={{ width: 160 }}
              allowClear
            />
            <Input
              placeholder="真实姓名"
              prefix={<SearchOutlined />}
              style={{ width: 160 }}
              allowClear
            />
            <Input
              placeholder="手机号"
              prefix={<SearchOutlined />}
              style={{ width: 160 }}
              allowClear
            />
            <Select placeholder="用户类型" style={{ width: 130 }} allowClear>
              <Option value="natural">自然人</Option>
              <Option value="legal">法人</Option>
              <Option value="admin">管理员</Option>
            </Select>
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Option value="active">正常</Option>
              <Option value="locked">锁定</Option>
              <Option value="disabled">禁用</Option>
            </Select>
            <Select placeholder="所属部门" style={{ width: 160 }} allowClear>
              {departmentOptions.map((dept) => (
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
              ))}
            </Select>
            <RangePicker placeholder={['开始日期', '结束日期']} style={{ width: 260 }} />
            <Button type="primary">查询</Button>
            <Button>重置</Button>
          </Space>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增用户
            </Button>
            <Button icon={<FileTextOutlined />}>导出</Button>
          </Space>
          <div style={{ color: '#8c8c8c', fontSize: 13 }}>
            共 <span style={{ color: '#0958d9', fontWeight: 500 }}>1258</span> 条记录
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={userList}
          pagination={{
            pageSize: 10,
            total: 1258,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`
          }}
          scroll={{ x: 1400 }}
          size="small"
        />
      </Card>

      <Modal
        title={modalType === 'add' ? '新增用户' : '编辑用户'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="realName"
                label="真实姓名"
                rules={[{ required: true, message: '请输入真实姓名' }]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="userType"
                label="用户类型"
                rules={[{ required: true, message: '请选择用户类型' }]}
              >
                <Select placeholder="请选择用户类型">
                  <Option value="natural">自然人</Option>
                  <Option value="legal">法人</Option>
                  <Option value="admin">管理员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="所属部门"
                rules={[{ required: true, message: '请选择部门' }]}
              >
                <Select placeholder="请选择部门">
                  {departmentOptions.map((dept) => (
                    <Option key={dept} value={dept}>
                      {dept}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[{ required: true, message: '请输入手机号' }]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Switch defaultChecked />
              </Form.Item>
            </Col>
          </Row>
          {modalType === 'add' && (
            <Alert
              message="默认密码：123456，请提醒用户首次登录后修改密码"
              type="info"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
        </Form>
      </Modal>

      <Drawer
        title="用户详情"
        placement="right"
        width={640}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>关闭</Button>
            <Button type="primary" onClick={handleAssignRole}>
              分配角色
            </Button>
          </Space>
        }
      >
        {currentUser && (
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Avatar size={80} style={{ backgroundColor: '#0958d9' }} icon={<UserOutlined />} />
                <div style={{ marginTop: 12, fontSize: 18, fontWeight: 500 }}>
                  {currentUser.realName}
                </div>
                <div style={{ color: '#8c8c8c' }}>@{currentUser.username}</div>
                <div style={{ marginTop: 8 }}>
                  <Tag color={userTypeConfig[currentUser.userType].color as any}>
                    {userTypeConfig[currentUser.userType].label}
                  </Tag>
                  <Tag color="geekblue">
                    <SafetyCertificateOutlined style={{ marginRight: 4 }} />
                    {currentUser.role}
                  </Tag>
                  <Tag color={statusConfig[currentUser.status].color as any}>
                    {statusConfig[currentUser.status].label}
                  </Tag>
                </div>
              </div>

              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="用户ID">{currentUser.id}</Descriptions.Item>
                <Descriptions.Item label="所属部门">{currentUser.department}</Descriptions.Item>
                <Descriptions.Item label="手机号">{currentUser.phone}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{currentUser.email}</Descriptions.Item>
                <Descriptions.Item label="身份证号">{currentUser.idCard}</Descriptions.Item>
                <Descriptions.Item label="注册时间">{currentUser.registerTime}</Descriptions.Item>
                <Descriptions.Item label="最后登录">{currentUser.lastLoginTime}</Descriptions.Item>
                <Descriptions.Item label="联系地址" span={2}>
                  {currentUser.address}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab="角色权限" key="role">
              <Card
                title="当前角色"
                size="small"
                extra={<Button type="link" size="small" onClick={handleAssignRole}>分配角色</Button>}
                style={{ marginBottom: 16 }}
              >
                <Space>
                  <Tag color="geekblue" style={{ padding: '4px 12px', fontSize: 14 }}>
                    <SafetyCertificateOutlined style={{ marginRight: 6 }} />
                    {currentUser.role}
                  </Tag>
                </Space>
              </Card>

              <Card title="权限概览" size="small">
                <Row gutter={[16, 16]}>
                  {[
                    { name: '认证授权', count: 5 },
                    { name: '服务事项', count: 12 },
                    { name: '电子证照', count: 8 },
                    { name: '工单系统', count: 6 },
                    { name: '数据看板', count: 3 },
                    { name: '审计日志', count: 2 },
                    { name: '系统管理', count: 10 }
                  ].map((item) => (
                    <Col span={8} key={item.name}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 500, color: '#0958d9' }}>
                          {item.count}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                          {item.name}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </TabPane>

            <TabPane tab="登录日志" key="login">
              <List
                dataSource={currentUser.loginLogs || []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: item.status === 'success' ? '#52c41a' : '#ff4d4f',
                            marginTop: 6
                          }}
                        />
                      }
                      title={item.time}
                      description={
                        <Space>
                          <span>IP: {item.ip}</span>
                          <Divider type="vertical" />
                          <span>{item.device}</span>
                        </Space>
                      }
                    />
                    <Tag color={item.status === 'success' ? 'success' : 'error'}>
                      {item.status === 'success' ? '成功' : '失败'}
                    </Tag>
                  </List.Item>
                )}
              />
              {(currentUser.loginLogs?.length || 0) === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#bfbfbf' }}>
                  暂无登录记录
                </div>
              )}
            </TabPane>

            <TabPane tab="操作记录" key="operation">
              <List
                dataSource={currentUser.operationLogs || []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<ClockCircleOutlined style={{ color: '#0958d9' }} />}
                      title={item.description}
                      description={
                        <Space>
                          <span style={{ fontSize: 12 }}>{item.time}</span>
                          <Divider type="vertical" />
                          <Tag color="blue" style={{ margin: 0 }}>
                            {item.module}
                          </Tag>
                          <Tag color="green">{item.action}</Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
              {(currentUser.operationLogs?.length || 0) === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#bfbfbf' }}>
                  暂无操作记录
                </div>
              )}
            </TabPane>
          </Tabs>
        )}
      </Drawer>

      <Modal
        title="分配角色"
        open={roleModalVisible}
        onOk={handleRoleModalOk}
        onCancel={() => setRoleModalVisible(false)}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="选择角色">
            <Select
              mode="multiple"
              placeholder="请选择角色"
              value={selectedRoles}
              onChange={setSelectedRoles}
              style={{ width: '100%' }}
            >
              <Option value="R001">超级管理员</Option>
              <Option value="R002">委办局管理员</Option>
              <Option value="R003">普通用户</Option>
              <Option value="R004">委办局办事员</Option>
              <Option value="R005">审计员</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users
