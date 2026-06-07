import { useEffect, useState, useCallback } from 'react'
import {
  Table,
  Card,
  Tag,
  Typography,
  Space,
  Select,
  Button,
  Tooltip,
} from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import request from '../utils/request'

const { Text, Paragraph } = Typography

const actionTypeMap = {
  CREATE: { text: '新增', color: 'green' },
  UPDATE: { text: '修改', color: 'blue' },
  DELETE: { text: '删除', color: 'red' },
  LOGIN: { text: '登录', color: 'cyan' },
  LOGOUT: { text: '登出', color: 'default' },
  EXPORT: { text: '导出', color: 'purple' },
}

const actionTypeOptions = Object.entries(actionTypeMap).map(([value, { text }]) => ({
  value,
  label: text,
}))

const resourceTypeOptions = [
  { value: 'user', label: '用户' },
  { value: 'account', label: '账户' },
  { value: 'toll_record', label: '通行记录' },
  { value: 'exception', label: '异常事件' },
  { value: 'dispute', label: '申诉' },
  { value: 'settlement', label: '结算' },
  { value: 'blacklist', label: '黑名单' },
  { value: 'system', label: '系统' },
]

const trackedActions = [
  { action: '用户登录', type: 'LOGIN', resource: 'user', desc: '记录登录时间与IP地址' },
  { action: '用户登出', type: 'LOGOUT', resource: 'user', desc: '记录登出时间' },
  { action: '新增用户', type: 'CREATE', resource: 'user', desc: '记录操作者与新增用户信息' },
  { action: '修改用户信息', type: 'UPDATE', resource: 'user', desc: '记录修改前后字段变更' },
  { action: '删除用户', type: 'DELETE', resource: 'user', desc: '记录被删除用户标识' },
  { action: '账户余额变动', type: 'UPDATE', resource: 'account', desc: '记录充值/扣费/退款操作' },
  { action: '异常事件处理', type: 'UPDATE', resource: 'exception', desc: '记录状态变更与处理结果' },
  { action: '申诉处理', type: 'UPDATE', resource: 'dispute', desc: '记录审核与处理结果' },
  { action: '结算确认/争议', type: 'UPDATE', resource: 'settlement', desc: '记录结算状态变更' },
  { action: '黑名单增删', type: 'CREATE/DELETE', resource: 'blacklist', desc: '记录黑名单变更操作' },
  { action: '数据导出', type: 'EXPORT', resource: 'system', desc: '记录导出范围与操作者' },
]

const trackedColumns = [
  {
    title: '操作名称',
    dataIndex: 'action',
    key: 'action',
    width: 160,
  },
  {
    title: '操作类型',
    dataIndex: 'type',
    key: 'type',
    width: 120,
    render: (val) => {
      const cfg = actionTypeMap[val] || { text: val, color: 'default' }
      return <Tag color={cfg.color}>{cfg.text}</Tag>
    },
  },
  {
    title: '资源类型',
    dataIndex: 'resource',
    key: 'resource',
    width: 120,
  },
  {
    title: '说明',
    dataIndex: 'desc',
    key: 'desc',
  },
]

export default function AuditLogs() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [actionFilter, setActionFilter] = useState(undefined)
  const [resourceFilter, setResourceFilter] = useState(undefined)
  const [hasApi, setHasApi] = useState(true)

  const fetchData = useCallback(async () => {
    if (!hasApi) return
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (actionFilter) params.action_type = actionFilter
      if (resourceFilter) params.resource_type = resourceFilter
      const res = await request.get('/audit-logs', { params })
      setData(res.data.list || [])
      setTotal(res.data.total || 0)
    } catch {
      setHasApi(false)
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, actionFilter, resourceFilter, hasApi])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTableChange = (pagination) => {
    setPage(pagination.current)
    setPageSize(pagination.pageSize)
  }

  const handleReset = () => {
    setActionFilter(undefined)
    setResourceFilter(undefined)
    setPage(1)
  }

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '操作用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100,
    },
    {
      title: '操作类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 100,
      render: (val) => {
        const cfg = actionTypeMap[val] || { text: val, color: 'default' }
        return <Tag color={cfg.color}>{cfg.text}</Tag>
      },
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 120,
    },
    {
      title: '资源ID',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 100,
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: { showTitle: false },
      render: (val) => (
        <Tooltip placement="topLeft" title={val}>
          {val || '-'}
        </Tooltip>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontWeight: 600 }}>审计日志</h2>

      {!hasApi && (
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>审计日志系统说明</Text>
            <Paragraph>
              审计日志在数据库中持续记录所有关键操作，当前尚未开放独立的列表查询API。
              如需查询完整日志，请通过数据库直接访问 <Text code>audit_logs</Text> 表。
            </Paragraph>
            <Text type="secondary">
              以下表格展示了系统跟踪的操作类型。后端接口就绪后，此页面将自动切换为完整查询模式。
            </Text>
          </Space>
        </Card>
      )}

      {hasApi && (
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="操作类型筛选"
            allowClear
            value={actionFilter}
            onChange={(value) => {
              setActionFilter(value)
              setPage(1)
            }}
            options={actionTypeOptions}
            style={{ width: 160 }}
          />
          <Select
            placeholder="资源类型筛选"
            allowClear
            value={resourceFilter}
            onChange={(value) => {
              setResourceFilter(value)
              setPage(1)
            }}
            options={resourceTypeOptions}
            style={{ width: 160 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      )}

      {hasApi ? (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={handleTableChange}
        />
      ) : (
        <Card title="系统跟踪的操作列表">
          <Table
            rowKey="action"
            columns={trackedColumns}
            dataSource={trackedActions}
            pagination={false}
            size="small"
          />
        </Card>
      )}
    </div>
  )
}
