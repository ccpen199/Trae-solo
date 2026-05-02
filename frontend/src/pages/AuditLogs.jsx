import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Tag,
  Select,
  DatePicker,
  Space,
  Button,
  Input,
  message,
  Descriptions,
  Modal,
  Collapse,
} from 'antd'
import { SearchOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { commonApi } from '../services/api'
import { formatDate, getRoleName } from '../utils/constants'

const { RangePicker } = DatePicker
const { Panel } = Collapse

const OPERATION_TYPES = {
  CREATE: '创建',
  UPDATE: '更新',
  DELETE: '删除',
  APPROVE: '审批通过',
  REJECT: '审批驳回',
  SUBMIT: '提交',
  CANCEL: '取消',
  LOCK: '锁定',
  CONVERT: '换算',
  SETTLE: '结算',
  EXCEPTION: '异常处理',
  LOGIN: '登录',
  LOGOUT: '登出',
}

const OPERATION_TYPE_COLORS = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  APPROVE: 'success',
  REJECT: 'error',
  SUBMIT: 'orange',
  CANCEL: 'default',
  LOCK: 'purple',
  CONVERT: 'cyan',
  SETTLE: 'gold',
  EXCEPTION: 'red',
  LOGIN: 'green',
  LOGOUT: 'default',
}

const RESOURCE_TYPES = {
  TRANSACTION: '交易单',
  PAYMENT: '支付记录',
  SETTLEMENT: '结算记录',
  KYC: 'KYC记录',
  EXCHANGE_RATE: '汇率',
  USER: '用户',
  ROLE: '角色',
  MERCHANT: '商户',
  TODO: '待办',
  MESSAGE: '消息',
}

function AuditLogs() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [filters, setFilters] = useState({
    operation_type: undefined,
    resource_type: undefined,
    user_id: undefined,
    start_date: undefined,
    end_date: undefined,
    keyword: undefined,
  })
  const [users, setUsers] = useState([])

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const loadUsers = async () => {
    try {
      const res = await commonApi.getUsers()
      if (res.data.success) {
        setUsers(res.data.data.users || [])
      }
    } catch (err) {
      console.error('Load users error:', err)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      }

      const res = await commonApi.getAuditLogs(params)
      if (res.data.success) {
        setData(res.data.data.logs || [])
        setPagination((prev) => ({
          ...prev,
          total: res.data.data.pagination?.total || 0,
        }))
      }
    } catch (err) {
      console.error('Load audit logs error:', err)
      message.error('加载审计日志失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
    loadData()
  }

  const handleReset = () => {
    setFilters({
      operation_type: undefined,
      resource_type: undefined,
      user_id: undefined,
      start_date: undefined,
      end_date: undefined,
      keyword: undefined,
    })
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const showDetail = (record) => {
    setSelectedLog(record)
    setDetailVisible(true)
  }

  const operationOptions = Object.entries(OPERATION_TYPES).map(([key, value]) => ({
    label: value,
    value: key,
  }))

  const resourceOptions = Object.entries(RESOURCE_TYPES).map(([key, value]) => ({
    label: value,
    value: key,
  }))

  const userOptions = users.map((u) => ({
    label: `${u.name} (${u.username})`,
    value: u.id,
  }))

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val) => formatDate(val),
    },
    {
      title: '操作人',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 140,
      render: (val, record) => (
        <span>
          {val || '-'}
          {record.user_role_code && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {getRoleName(record.user_role_code)}
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      key: 'operation_type',
      width: 120,
      render: (type) => (
        <Tag color={OPERATION_TYPE_COLORS[type] || 'default'}>
          {OPERATION_TYPES[type] || type}
        </Tag>
      ),
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 120,
      render: (type) => RESOURCE_TYPES[type] || type,
    },
    {
      title: '资源标识',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 180,
      render: (val, record) => (
        <span style={{ color: '#1890ff', cursor: 'pointer' }}>
          {record.resource_no || val}
        </span>
      ),
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120,
      render: (val) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => showDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ]

  const parseJson = (str) => {
    if (!str) return null
    try {
      return typeof str === 'string' ? JSON.parse(str) : str
    } catch {
      return str
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">审计日志</div>
        <div className="page-desc">系统操作审计日志，所有操作均被记录</div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap size="middle">
          <Input
            placeholder="搜索关键词"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, keyword: e.target.value || undefined }))
            }
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="操作类型"
            style={{ width: 140 }}
            allowClear
            value={filters.operation_type}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, operation_type: val }))
            }
            options={operationOptions}
          />
          <Select
            placeholder="资源类型"
            style={{ width: 140 }}
            allowClear
            value={filters.resource_type}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, resource_type: val }))
            }
            options={resourceOptions}
          />
          <Select
            placeholder="操作人"
            style={{ width: 180 }}
            allowClear
            value={filters.user_id}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, user_id: val }))
            }
            options={userOptions}
          />
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            style={{ width: 280 }}
            onChange={(dates) => {
              if (dates) {
                setFilters((prev) => ({
                  ...prev,
                  start_date: dates[0]?.format('YYYY-MM-DD'),
                  end_date: dates[1]?.format('YYYY-MM-DD'),
                }))
              } else {
                setFilters((prev) => ({
                  ...prev,
                  start_date: undefined,
                  end_date: undefined,
                }))
              }
            }}
          />
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }))
            },
          }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-text">暂无审计日志</div>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <InfoCircleOutlined />
            审计日志详情
          </Space>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={720}
      >
        {selectedLog && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="操作时间">
                {formatDate(selectedLog.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="操作人">
                {selectedLog.user_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="操作人角色">
                {getRoleName(selectedLog.user_role_code)}
              </Descriptions.Item>
              <Descriptions.Item label="操作类型">
                <Tag color={OPERATION_TYPE_COLORS[selectedLog.operation_type] || 'default'}>
                  {OPERATION_TYPES[selectedLog.operation_type] || selectedLog.operation_type}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="资源类型">
                {RESOURCE_TYPES[selectedLog.resource_type] || selectedLog.resource_type}
              </Descriptions.Item>
              <Descriptions.Item label="资源ID">
                {selectedLog.resource_id}
              </Descriptions.Item>
              <Descriptions.Item label="资源编号">
                {selectedLog.resource_no || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">
                {selectedLog.ip_address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="用户代理" span={2}>
                <span style={{ fontSize: 12, color: '#666' }}>
                  {selectedLog.user_agent || '-'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="操作描述" span={2}>
                {selectedLog.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedLog.old_values || selectedLog.new_values ? (
              <Card
                title="数据变更详情"
                size="small"
                style={{ marginTop: 16 }}
              >
                <Collapse ghost>
                  {selectedLog.old_values && (
                    <Panel header="变更前数据" key="old">
                      <pre
                        style={{
                          background: '#fff7e6',
                          padding: 12,
                          borderRadius: 4,
                          overflow: 'auto',
                          fontSize: 12,
                        }}
                      >
                        {JSON.stringify(parseJson(selectedLog.old_values), null, 2)}
                      </pre>
                    </Panel>
                  )}
                  {selectedLog.new_values && (
                    <Panel header="变更后数据" key="new">
                      <pre
                        style={{
                          background: '#f6ffed',
                          padding: 12,
                          borderRadius: 4,
                          overflow: 'auto',
                          fontSize: 12,
                        }}
                      >
                        {JSON.stringify(parseJson(selectedLog.new_values), null, 2)}
                      </pre>
                    </Panel>
                  )}
                </Collapse>
              </Card>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AuditLogs
