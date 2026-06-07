import { useEffect, useState, useCallback } from 'react'
import {
  Table, Button, Modal, Form, Input, Select, Space, Tag,
  Popconfirm, message, Alert, Tooltip, Descriptions, Drawer
} from 'antd'
import { PlusOutlined, UserOutlined, TeamOutlined, SafetyOutlined, SettingOutlined, InfoCircleOutlined, AuditOutlined } from '@ant-design/icons'
import request from '../utils/request'

const roleMap = {
  owner: { text: '车主', color: 'green', icon: <UserOutlined />, desc: '车主自助服务权限，可申领OBU、充值、查询通行记录、发起争议申诉' },
  fleet_admin: { text: '车队管理者', color: 'orange', icon: <TeamOutlined />, desc: '车队管理权限，可管理多车辆账户、批量充值、查看车队通行数据' },
  operator: { text: '运维操作员', color: 'purple', icon: <SettingOutlined />, desc: '运维操作权限，可进行设备激活、升级、数据质量监控等技术操作' },
  platform: { text: '运营平台', color: 'blue', icon: <SettingOutlined />, desc: '运营管理权限，可查看运营数据、处理异常、管理结算、配置策略，无用户增删权限' },
  admin: { text: '系统管理员', color: 'red', icon: <SafetyOutlined />, desc: '拥有系统全部权限，可管理所有用户、设备、账户及所有配置' },
}

const statusMap = {
  active: { text: '正常', color: 'green' },
  disabled: { text: '停用', color: 'red' },
}

const roleOptions = Object.entries(roleMap).map(([value, { text }]) => ({ value, label: text }))

const demoUserDefaults = () => {
  const suffix = Date.now().toString().slice(-6)
  return {
    username: `demo_user_${suffix}`,
    password: 'Demo@123456',
    real_name: '演示用户',
    phone: `139${suffix.padStart(8, '0').slice(0, 8)}`,
    id_card: `110101199001${suffix}`,
    role: 'owner',
    vehicle_plate: `京A${suffix.slice(-5)}`,
    fleet_name: '演示车队',
  }
}

export default function Users() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [form] = Form.useForm()
  const [selectedRole, setSelectedRole] = useState('owner')
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [detailUser, setDetailUser] = useState(null)
  const [disableConfirm, setDisableConfirm] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      const res = await request.get('/users', { params })
      setData(res.data.list)
      setTotal(res.data.total)
    } catch {
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAdd = () => {
    setEditingUser(null)
    setSelectedRole('owner')
    form.resetFields()
    form.setFieldsValue(demoUserDefaults())
    setModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditingUser(record)
    setSelectedRole(record.role)
    form.setFieldsValue({
      username: record.username,
      real_name: record.real_name,
      phone: record.phone,
      id_card: record.id_card,
      role: record.role,
      vehicle_plate: record.vehicle_plate,
      fleet_name: record.fleet_name,
    })
    setModalOpen(true)
  }

  const handleViewDetail = async (record) => {
    setDetailDrawer(true)
    setDetailUser(record)
  }

  const handleDisableCheck = async (record) => {
    try {
      const res = await request.delete(`/users/${record.id}`)
      setDisableConfirm({ record, data: res.data })
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.error === '停用确认') {
        setDisableConfirm({ record, data: err.response.data })
      } else {
        message.error(err.response?.data?.error || '操作失败')
      }
    }
  }

  const handleDisableConfirm = async () => {
    if (!disableConfirm) return
    try {
      await request.delete(`/users/${disableConfirm.record.id}?confirm=yes`)
      message.success(`用户 ${disableConfirm.record.username} 已停用，操作已记录审计日志`)
      setDisableConfirm(null)
      fetchUsers()
    } catch (err) {
      message.error(err.response?.data?.error || '停用失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      setConfirmLoading(true)
      const actionText = editingUser ? '编辑' : '添加'
      if (editingUser) {
        if (!values.password) delete values.password
        await request.put(`/users/${editingUser.id}`, values)
        message.success(`编辑用户成功，操作已记录审计日志`)
      } else {
        await request.post('/users', values)
        message.success(`添加用户成功，操作已记录审计日志`)
      }
      setModalOpen(false)
      form.resetFields()
      setEditingUser(null)
      fetchUsers()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '操作失败')
      }
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleModalCancel = () => {
    setModalOpen(false)
    form.resetFields()
    setEditingUser(null)
  }

  const handleTableChange = (pagination) => {
    setPage(pagination.current)
    setPageSize(pagination.pageSize)
  }

  const handleSearch = (value) => {
    setSearch(value)
    setPage(1)
  }

  const handleRoleFilter = (value) => {
    setRoleFilter(value)
    setPage(1)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'real_name', key: 'real_name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '角色', dataIndex: 'role', key: 'role', width: 130,
      render: (role) => {
        const cfg = roleMap[role] || { text: role, color: 'default' }
        return (
          <Tooltip title={cfg.desc}>
            <Tag color={cfg.color}>{cfg.icon} {cfg.text}</Tag>
          </Tooltip>
        )
      },
    },
    { title: '车牌号', dataIndex: 'vehicle_plate', key: 'vehicle_plate' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status) => {
        const cfg = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={cfg.color}>{cfg.text}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            <InfoCircleOutlined /> 详情
          </Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'active' && (
            <Popconfirm
              title={
                <div>
                  <div>确认停用该用户？</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    此操作将记录审计日志
                  </div>
                </div>
              }
              onConfirm={() => handleDisableCheck(record)}
              okText="继续"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>停用</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontWeight: 600 }}>用户管理</h2>

      <Alert
        message="角色权限说明"
        description={
          <Space wrap>
            {Object.entries(roleMap).map(([key, cfg]) => (
              <Tag key={key} color={cfg.color} style={{ padding: '4px 10px', fontSize: 12 }}>
                {cfg.icon} {cfg.text}：{cfg.desc}
              </Tag>
            ))}
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search placeholder="搜索用户名/姓名/手机号" allowClear onSearch={handleSearch} style={{ width: 260 }} />
        <Select placeholder="角色筛选" allowClear value={roleFilter} onChange={handleRoleFilter} options={roleOptions} style={{ width: 160 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加用户</Button>
        <Tag color="blue" style={{ marginLeft: 'auto' }}>
          <AuditOutlined /> 所有增删改操作均记录审计日志
        </Tag>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={confirmLoading}
        width={600}
      >
        {selectedRole && roleMap[selectedRole] && (
          <Alert
            message={`${roleMap[selectedRole].icon} ${roleMap[selectedRole].text} 权限`}
            description={roleMap[selectedRole].desc}
            type={roleMap[selectedRole].color}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={editingUser ? [] : [{ required: true }]}>
            <Input.Password placeholder={editingUser ? '不修改请留空' : ''} />
          </Form.Item>
          <Form.Item name="real_name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="phone" label="手机号" style={{ flex: 1, marginBottom: 0 }}>
              <Input />
            </Form.Item>
            <Form.Item name="id_card" label="身份证号" style={{ flex: 1, marginBottom: 0 }}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="role" label="角色" rules={[{ required: true }]} style={{ marginTop: 16 }}>
            <Select options={roleOptions} onChange={(v) => setSelectedRole(v)} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="vehicle_plate" label="车牌号" style={{ flex: 1, marginBottom: 0 }}>
              <Input placeholder="车主必填" />
            </Form.Item>
            <Form.Item name="fleet_name" label="车队名" style={{ flex: 1, marginBottom: 0 }}>
              <Input placeholder="车队管理者可选" />
            </Form.Item>
          </Space>
          <Alert
            description="此操作将记录审计日志，包括操作人、操作类型、修改内容和IP地址。"
            type="info"
            showIcon
            icon={<AuditOutlined />}
            style={{ marginTop: 16 }}
          />
        </Form>
      </Modal>

      <Modal
        title="用户停用确认"
        open={!!disableConfirm}
        onOk={handleDisableConfirm}
        onCancel={() => setDisableConfirm(null)}
        okText="确认停用"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        {disableConfirm?.data && (
          <div>
            <Alert
              message="停用前请确认以下关联资源"
              description={
                <div>
                  <div>用户：<strong>{disableConfirm.data.username}</strong>（{roleMap[disableConfirm.data.role]?.text || disableConfirm.data.role}）</div>
                  <div>关联ETC账户：<strong>{disableConfirm.data.linked_accounts}</strong> 个</div>
                  <div>关联OBU设备：<strong>{disableConfirm.data.linked_devices}</strong> 台</div>
                  <div>近30天通行记录：<strong>{disableConfirm.data.recent_toll_records}</strong> 条</div>
                  <div style={{ marginTop: 8, color: '#fa541c' }}>{disableConfirm.data.warning}</div>
                </div>
              }
              type="warning"
              showIcon
            />
            <div style={{ marginTop: 12, color: '#999', fontSize: 12 }}>
              <AuditOutlined /> 确认停用后，操作将永久记录审计日志
            </div>
          </div>
        )}
      </Modal>

      <Drawer
        title="用户详情"
        placement="right"
        width={500}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {detailUser && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="ID">{detailUser.id}</Descriptions.Item>
            <Descriptions.Item label="用户名">{detailUser.username}</Descriptions.Item>
            <Descriptions.Item label="姓名">{detailUser.real_name}</Descriptions.Item>
            <Descriptions.Item label="手机号">{detailUser.phone}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{detailUser.id_card}</Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag color={roleMap[detailUser.role]?.color}>{roleMap[detailUser.role]?.icon} {roleMap[detailUser.role]?.text}</Tag>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{roleMap[detailUser.role]?.desc}</div>
            </Descriptions.Item>
            <Descriptions.Item label="车牌号">{detailUser.vehicle_plate}</Descriptions.Item>
            <Descriptions.Item label="车队名">{detailUser.fleet_name}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[detailUser.status]?.color}>{statusMap[detailUser.status]?.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{detailUser.created_at}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{detailUser.updated_at}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}
