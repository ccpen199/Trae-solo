import React, { useState, useMemo } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  List,
  Button,
  Space,
  Input,
  Tree,
  Modal,
  Form,
  Select,
  Tabs,
  Table,
  Avatar,
  Tag,
  message,
  Popconfirm,
  Tooltip,
  Divider,
  Statistic,
  Descriptions,
  Switch
} from 'antd'
import {
  SafetyCertificateOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  LockOutlined,
  DownOutlined,
  UpOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  ExportOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { TreeProps } from 'antd/es/tree'

const { Title } = Typography
const { Option } = Select

interface RoleRecord {
  id: string
  name: string
  code: string
  description: string
  userCount: number
  status: 'active' | 'inactive'
  createTime: string
  isSystem: boolean
  dataScope: 'all' | 'dept' | 'self'
  sort: number
}

interface UserRecord {
  key: string
  id: string
  username: string
  realName: string
  phone: string
  email: string
  department: string
  status: 'active' | 'inactive'
}

interface PermissionNode {
  key: string
  title: string
  children?: PermissionNode[]
  icon?: string
}

const permissionTreeData: PermissionNode[] = [
  {
    key: 'auth',
    title: '认证授权',
    children: [
      { key: 'auth:view', title: '查看' },
      { key: 'auth:login', title: '登录' },
      { key: 'auth:logout', title: '登出' },
      { key: 'auth:token', title: '令牌管理' },
      { key: 'auth:third-party', title: '第三方登录' }
    ]
  },
  {
    key: 'services',
    title: '服务事项',
    children: [
      { key: 'services:view', title: '查看' },
      { key: 'services:add', title: '新增' },
      { key: 'services:edit', title: '修改' },
      { key: 'services:delete', title: '删除' },
      { key: 'services:export', title: '导出' },
      { key: 'services:approve', title: '审批' }
    ]
  },
  {
    key: 'certificates',
    title: '电子证照',
    children: [
      { key: 'certificates:view', title: '查看' },
      { key: 'certificates:add', title: '新增' },
      { key: 'certificates:edit', title: '修改' },
      { key: 'certificates:delete', title: '删除' },
      { key: 'certificates:export', title: '导出' },
      { key: 'certificates:authorize', title: '授权' },
      { key: 'certificates:verify', title: '核验' }
    ]
  },
  {
    key: 'tickets',
    title: '工单系统',
    children: [
      { key: 'tickets:view', title: '查看' },
      { key: 'tickets:add', title: '新增' },
      { key: 'tickets:edit', title: '修改' },
      { key: 'tickets:delete', title: '删除' },
      { key: 'tickets:export', title: '导出' },
      { key: 'tickets:dispatch', title: '派单' },
      { key: 'tickets:handle', title: '办理' }
    ]
  },
  {
    key: 'dashboard',
    title: '数据看板',
    children: [
      { key: 'dashboard:view', title: '查看' },
      { key: 'dashboard:export', title: '导出' },
      { key: 'dashboard:config', title: '配置' }
    ]
  },
  {
    key: 'audit-logs',
    title: '审计日志',
    children: [
      { key: 'audit-logs:view', title: '查看' },
      { key: 'audit-logs:export', title: '导出' },
      { key: 'audit-logs:analyze', title: '分析' }
    ]
  },
  {
    key: 'system',
    title: '系统管理',
    children: [
      {
        key: 'system:users',
        title: '用户管理',
        children: [
          { key: 'system:users:view', title: '查看' },
          { key: 'system:users:add', title: '新增' },
          { key: 'system:users:edit', title: '修改' },
          { key: 'system:users:delete', title: '删除' },
          { key: 'system:users:reset-password', title: '重置密码' },
          { key: 'system:users:assign-role', title: '分配角色' }
        ]
      },
      {
        key: 'system:roles',
        title: '角色权限',
        children: [
          { key: 'system:roles:view', title: '查看' },
          { key: 'system:roles:add', title: '新增' },
          { key: 'system:roles:edit', title: '修改' },
          { key: 'system:roles:delete', title: '删除' },
          { key: 'system:roles:permission', title: '配置权限' },
          { key: 'system:roles:copy', title: '复制角色' }
        ]
      },
      {
        key: 'system:departments',
        title: '部门管理',
        children: [
          { key: 'system:departments:view', title: '查看' },
          { key: 'system:departments:add', title: '新增' },
          { key: 'system:departments:edit', title: '修改' },
          { key: 'system:departments:delete', title: '删除' }
        ]
      },
      {
        key: 'system:config',
        title: '系统配置',
        children: [
          { key: 'system:config:view', title: '查看' },
          { key: 'system:config:edit', title: '修改' }
        ]
      }
    ]
  }
]

const mockRoles: RoleRecord[] = [
  {
    id: 'R001',
    name: '超级管理员',
    code: 'super_admin',
    description: '拥有系统所有权限，可管理全部模块和数据',
    userCount: 2,
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    isSystem: true,
    dataScope: 'all',
    sort: 1
  },
  {
    id: 'R002',
    name: '委办局管理员',
    code: 'dept_admin',
    description: '管理本部门用户和数据，可配置本部门权限',
    userCount: 12,
    status: 'active',
    createTime: '2024-01-15 10:00:00',
    isSystem: true,
    dataScope: 'dept',
    sort: 2
  },
  {
    id: 'R003',
    name: '委办局办事员',
    code: 'dept_clerk',
    description: '负责日常业务办理，具有基础的业务操作权限',
    userCount: 86,
    status: 'active',
    createTime: '2024-01-20 14:00:00',
    isSystem: true,
    dataScope: 'self',
    sort: 3
  },
  {
    id: 'R004',
    name: '普通用户',
    code: 'normal_user',
    description: '基础功能访问权限，可查询和办理个人相关业务',
    userCount: 1156,
    status: 'active',
    createTime: '2024-01-20 15:00:00',
    isSystem: true,
    dataScope: 'self',
    sort: 4
  },
  {
    id: 'R005',
    name: '审计员',
    code: 'auditor',
    description: '审计日志查看和分析权限，负责系统审计工作',
    userCount: 4,
    status: 'active',
    createTime: '2024-02-10 09:00:00',
    isSystem: true,
    dataScope: 'all',
    sort: 5
  },
  {
    id: 'R006',
    name: '证照管理员',
    code: 'cert_admin',
    description: '负责电子证照库的管理和维护工作',
    userCount: 8,
    status: 'active',
    createTime: '2024-03-01 10:00:00',
    isSystem: false,
    dataScope: 'dept',
    sort: 6
  },
  {
    id: 'R007',
    name: '工单审核员',
    code: 'ticket_auditor',
    description: '负责工单的审核和督办工作',
    userCount: 15,
    status: 'active',
    createTime: '2024-04-05 11:00:00',
    isSystem: false,
    dataScope: 'dept',
    sort: 7
  }
]

const mockRoleUsers: UserRecord[] = [
  {
    key: '1',
    id: 'U00001',
    username: 'admin',
    realName: '系统管理员',
    phone: '13800138000',
    email: 'admin@nx.gov.cn',
    department: '信息中心',
    status: 'active'
  },
  {
    key: '2',
    id: 'U00002',
    username: 'sysadmin',
    realName: '系统运维',
    phone: '13800138001',
    email: 'sysadmin@nx.gov.cn',
    department: '信息中心',
    status: 'active'
  }
]

const dataScopeOptions = [
  { value: 'all', label: '全部数据' },
  { value: 'dept', label: '本部门数据' },
  { value: 'self', label: '仅本人数据' }
]

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<RoleRecord[]>(mockRoles)
  const [selectedRole, setSelectedRole] = useState<RoleRecord | null>(mockRoles[0])
  const [searchText, setSearchText] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'add' | 'edit' | 'copy'>('add')
  const [form] = Form.useForm()
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['auth', 'services', 'certificates', 'tickets', 'dashboard', 'audit-logs', 'system'])
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>(['auth:view', 'auth:login', 'dashboard:view'])
  const [activeTab, setActiveTab] = useState('permission')

  const filteredRoles = useMemo(() => {
    if (!searchText) return roles
    return roles.filter(
      (r) =>
        r.name.includes(searchText) ||
        r.code.includes(searchText) ||
        r.description.includes(searchText)
    )
  }, [roles, searchText])

  const onCheck: TreeProps['onCheck'] = (checkedKeysValue) => {
    setCheckedKeys(checkedKeysValue as React.Key[])
  }

  const onExpand = (expandedKeysValue: React.Key[]) => {
    setExpandedKeys(expandedKeysValue)
  }

  const handleExpandAll = () => {
    const allKeys: string[] = []
    const collectKeys = (nodes: PermissionNode[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          allKeys.push(node.key)
          collectKeys(node.children)
        }
      })
    }
    collectKeys(permissionTreeData)
    setExpandedKeys(allKeys)
  }

  const handleCollapseAll = () => {
    setExpandedKeys([])
  }

  const handleSelectAll = () => {
    const allKeys: string[] = []
    const collectKeys = (nodes: PermissionNode[]) => {
      nodes.forEach((node) => {
        allKeys.push(node.key)
        if (node.children) {
          collectKeys(node.children)
        }
      })
    }
    collectKeys(permissionTreeData)
    setCheckedKeys(allKeys)
    message.success('已选择全部权限')
  }

  const handleClearAll = () => {
    setCheckedKeys([])
    message.success('已清空所有权限')
  }

  const handleAddRole = () => {
    setModalType('add')
    form.resetFields()
    setModalVisible(true)
  }

  const handleEditRole = (role: RoleRecord) => {
    setModalType('edit')
    form.setFieldsValue({
      name: role.name,
      code: role.code,
      description: role.description,
      dataScope: role.dataScope,
      status: role.status === 'active'
    })
    setModalVisible(true)
  }

  const handleCopyRole = (role: RoleRecord) => {
    setModalType('copy')
    form.setFieldsValue({
      name: role.name + '_副本',
      code: role.code + '_copy',
      description: '复制自：' + role.description,
      dataScope: role.dataScope,
      status: true
    })
    setModalVisible(true)
  }

  const handleDeleteRole = (role: RoleRecord) => {
    if (role.isSystem) {
      message.error('系统内置角色不可删除')
      return
    }
    setRoles(roles.filter((r) => r.id !== role.id))
    if (selectedRole?.id === role.id) {
      setSelectedRole(roles[0] || null)
    }
    message.success('角色删除成功')
  }

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      console.log('Form values:', values)
      setModalVisible(false)
      const messages = { add: '新增角色成功', edit: '编辑角色成功', copy: '复制角色成功' }
      message.success(messages[modalType])
    })
  }

  const handleSavePermission = () => {
    message.success('权限配置保存成功')
  }

  const userColumns: ColumnsType<UserRecord> = [
    {
      title: '用户信息',
      dataIndex: 'userInfo',
      key: 'userInfo',
      render: (_: unknown, record: UserRecord) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#0958d9' }} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{record.realName}</div>
            <div style={{ fontSize: 11, color: '#999' }}>@{record.username}</div>
          </div>
        </Space>
      )
    },
    {
      title: '所属部门',
      dataIndex: 'department',
      key: 'department',
      width: 150
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
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      )
    }
  ]

  const permissionCount = useMemo(() => {
    let total = 0
    let leafTotal = 0
    const countNodes = (nodes: PermissionNode[]) => {
      nodes.forEach((node) => {
        total++
        if (!node.children || node.children.length === 0) {
          leafTotal++
        } else {
          countNodes(node.children)
        }
      })
    }
    countNodes(permissionTreeData)
    return { total, leafTotal, selected: checkedKeys.length }
  }, [checkedKeys])

  return (
    <div>
      <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
        <SafetyCertificateOutlined style={{ color: '#0958d9', marginRight: 8 }} />
        角色权限管理
      </Title>

      <Row gutter={16}>
        <Col span={6}>
          <Card
            style={{ borderRadius: 8, height: 'calc(100vh - 140px)' }}
            styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14 }}>角色列表</span>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddRole}>
                  新增
                </Button>
              </div>
            }
          >
            <div style={{ padding: '0 16px 12px' }}>
              <Input
                placeholder="搜索角色名称/编码"
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="small"
                allowClear
              />
            </div>

            <List
              size="small"
              dataSource={filteredRoles}
              style={{ flex: 1, overflow: 'auto' }}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  onClick={() => setSelectedRole(item)}
                  style={{
                    cursor: 'pointer',
                    padding: '12px 16px',
                    backgroundColor: selectedRole?.id === item.id ? '#e6f4ff' : undefined,
                    borderLeft: selectedRole?.id === item.id ? '3px solid #0958d9' : '3px solid transparent'
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 6,
                          backgroundColor: item.isSystem ? '#e6f4ff' : '#f6ffed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <SafetyCertificateOutlined
                          style={{ color: item.isSystem ? '#0958d9' : '#52c41a', fontSize: 18 }}
                        />
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                        {item.isSystem && (
                          <Tag color="geekblue" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                            内置
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ fontSize: 11, color: '#bfbfbf' }}>{item.code}</div>
                        <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                          <TeamOutlined style={{ marginRight: 4 }} />
                          {item.userCount}人
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={18}>
          {selectedRole ? (
            <Card
              style={{ borderRadius: 8, height: 'calc(100vh - 140px)' }}
              styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <SafetyCertificateOutlined style={{ color: '#0958d9' }} />
                    <span style={{ fontWeight: 500, fontSize: 15 }}>{selectedRole.name}</span>
                    <Tag color={selectedRole.status === 'active' ? 'success' : 'default'}>
                      {selectedRole.status === 'active' ? '启用' : '禁用'}
                    </Tag>
                    {selectedRole.isSystem && <Tag color="geekblue">系统内置</Tag>}
                  </Space>
                  <Space>
                    <Tooltip title="编辑角色">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditRole(selectedRole)}
                      />
                    </Tooltip>
                    <Tooltip title="复制角色">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyRole(selectedRole)}
                      />
                    </Tooltip>
                    <Tooltip title={selectedRole.isSystem ? '系统内置角色不可删除' : '删除角色'}>
                      <Popconfirm
                        title="确认删除"
                        description="确定要删除该角色吗？删除后关联用户的角色权限将被撤销。"
                        okText="确认删除"
                        cancelText="取消"
                        okType="danger"
                        disabled={selectedRole.isSystem}
                        onConfirm={() => handleDeleteRole(selectedRole)}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={selectedRole.isSystem}
                        />
                      </Popconfirm>
                    </Tooltip>
                  </Space>
                </div>
              }
            >
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                items={[
                  {
                    key: 'permission',
                    label: '权限配置',
                    children: (
                      <div style={{ padding: '0 24px 16px', flex: 1, overflow: 'auto' }}>
                        <div
                          style={{
                            marginBottom: 16,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Space size={16}>
                            <span style={{ color: '#8c8c8c', fontSize: 13 }}>
                              已选权限：
                              <span style={{ color: '#0958d9', fontWeight: 500 }}>
                                {permissionCount.selected}
                              </span>
                              /{permissionCount.leafTotal} 个
                            </span>
                          </Space>
                          <Space>
                            <Button size="small" icon={<DownOutlined />} onClick={handleExpandAll}>
                              全部展开
                            </Button>
                            <Button size="small" icon={<UpOutlined />} onClick={handleCollapseAll}>
                              全部折叠
                            </Button>
                            <Divider type="vertical" />
                            <Button size="small" icon={<CheckOutlined />} onClick={handleSelectAll}>
                              全选
                            </Button>
                            <Button size="small" icon={<CloseOutlined />} onClick={handleClearAll}>
                              清空
                            </Button>
                          </Space>
                        </div>

                        <Card
                          size="small"
                          title={
                            <Space>
                              <SettingOutlined style={{ color: '#0958d9' }} />
                              菜单权限
                            </Space>
                          }
                          style={{ marginBottom: 16 }}
                        >
                          <Tree
                            checkable
                            expandedKeys={expandedKeys}
                            onExpand={onExpand}
                            checkedKeys={checkedKeys}
                            onCheck={onCheck}
                            treeData={permissionTreeData as any}
                            defaultExpandAll
                          />
                        </Card>

                        <Card
                          size="small"
                          title={
                            <Space>
                              <LockOutlined style={{ color: '#0958d9' }} />
                              数据权限
                            </Space>
                          }
                        >
                          <Space direction="vertical" style={{ width: '100%' }} size={12}>
                            <div>
                              <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
                                数据权限范围：
                              </div>
                              <Space>
                                {dataScopeOptions.map((option) => (
                                  <Tag.CheckableTag
                                    key={option.value}
                                    checked={selectedRole.dataScope === option.value}
                                    style={{ padding: '4px 16px', fontSize: 13 }}
                                  >
                                    {option.label}
                                  </Tag.CheckableTag>
                                ))}
                              </Space>
                            </div>
                            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                              数据权限决定用户可以查看和操作的数据范围
                            </div>
                          </Space>
                        </Card>

                        <div style={{ marginTop: 24, textAlign: 'right' }}>
                          <Space>
                            <Button>重置</Button>
                            <Button type="primary" onClick={handleSavePermission}>
                              保存权限配置
                            </Button>
                          </Space>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'users',
                    label: `角色用户 (${selectedRole.userCount})`,
                    children: (
                      <div style={{ padding: '0 24px 16px' }}>
                        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                          <Input
                            placeholder="搜索用户"
                            prefix={<SearchOutlined />}
                            style={{ width: 240 }}
                            size="small"
                            allowClear
                          />
                          <Space>
                            <Button size="small" icon={<PlusOutlined />} type="primary">
                              添加用户
                            </Button>
                            <Button size="small" icon={<ExportOutlined />}>
                              移除用户
                            </Button>
                          </Space>
                        </div>
                        <Table
                          columns={userColumns}
                          dataSource={mockRoleUsers}
                          pagination={{
                            pageSize: 8,
                            total: selectedRole.userCount,
                            size: 'small'
                          }}
                          size="small"
                        />
                      </div>
                    )
                  },
                  {
                    key: 'info',
                    label: '角色信息',
                    children: (
                      <div style={{ padding: '0 24px 16px' }}>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                          <Col span={6}>
                            <Card size="small">
                              <Statistic
                                title="用户数量"
                                value={selectedRole.userCount}
                                prefix={<TeamOutlined style={{ color: '#0958d9' }} />}
                                valueStyle={{ color: '#0958d9', fontSize: 20 }}
                              />
                            </Card>
                          </Col>
                          <Col span={6}>
                            <Card size="small">
                              <Statistic
                                title="权限数量"
                                value={permissionCount.selected}
                                prefix={<SafetyCertificateOutlined style={{ color: '#52c41a' }} />}
                                valueStyle={{ color: '#52c41a', fontSize: 20 }}
                              />
                            </Card>
                          </Col>
                          <Col span={6}>
                            <Card size="small">
                              <Statistic
                                title="创建时间"
                                value={selectedRole.createTime.split(' ')[0]}
                                valueStyle={{ fontSize: 16, color: '#8c8c8c' }}
                              />
                            </Card>
                          </Col>
                          <Col span={6}>
                            <Card size="small">
                              <Statistic
                                title="排序号"
                                value={selectedRole.sort}
                                valueStyle={{ fontSize: 20, color: '#722ed1' }}
                              />
                            </Card>
                          </Col>
                        </Row>

                        <Card title="基本信息" size="small">
                          <Descriptions column={2} size="small">
                            <Descriptions.Item label="角色名称">{selectedRole.name}</Descriptions.Item>
                            <Descriptions.Item label="角色编码">{selectedRole.code}</Descriptions.Item>
                            <Descriptions.Item label="角色描述" span={2}>
                              {selectedRole.description}
                            </Descriptions.Item>
                            <Descriptions.Item label="数据权限">
                              {dataScopeOptions.find((o) => o.value === selectedRole.dataScope)?.label}
                            </Descriptions.Item>
                            <Descriptions.Item label="状态">
                              <Tag color={selectedRole.status === 'active' ? 'success' : 'default'}>
                                {selectedRole.status === 'active' ? '启用' : '禁用'}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="是否内置">
                              {selectedRole.isSystem ? '是（系统内置）' : '否'}
                            </Descriptions.Item>
                            <Descriptions.Item label="创建时间">{selectedRole.createTime}</Descriptions.Item>
                          </Descriptions>
                        </Card>
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          ) : (
            <Card style={{ borderRadius: 8, height: 'calc(100vh - 140px)' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#bfbfbf'
                }}
              >
                <SafetyCertificateOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>请选择一个角色查看详情</div>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title={
          modalType === 'add' ? '新增角色' : modalType === 'edit' ? '编辑角色' : '复制角色'
        }
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={520}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="角色名称"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="请输入角色名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="角色编码"
                rules={[{ required: true, message: '请输入角色编码' }]}
              >
                <Input placeholder="请输入角色编码" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="角色描述"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入角色描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dataScope"
                label="数据权限"
                rules={[{ required: true, message: '请选择数据权限' }]}
              >
                <Select placeholder="请选择数据权限">
                  {dataScopeOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="sort" label="排序号">
            <Input type="number" placeholder="数字越小越靠前" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Roles
