import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Select, DatePicker, Card, Descriptions, Modal, Tag, message, Input, Popover } from 'antd'
import { ReloadOutlined, SearchOutlined, EyeOutlined, MailOutlined } from '@ant-design/icons'
import { logApi } from '../../services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const LogList = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    status: '',
    dateRange: null
  })

  const moduleMap = {
    system: '系统',
    user: '用户',
    supplier: '供应商',
    product: '商品',
    stock: '库存',
    inventory: '库存',
    log: '日志'
  }

  const actionMap = {
    login: '登录',
    logout: '登出',
    create: '创建',
    update: '修改',
    delete: '删除',
    stock_in: '入库',
    stock_out: '出库',
    export: '导出'
  }

  const moduleOptions = [
    { label: '全部模块', value: '' },
    { label: '系统', value: 'system' },
    { label: '用户', value: 'user' },
    { label: '供应商', value: 'supplier' },
    { label: '商品', value: 'product' },
    { label: '库存', value: 'stock' },
    { label: '日志', value: 'log' }
  ]

  const statusOptions = [
    { label: '全部状态', value: '' },
    { label: '成功', value: 'success' },
    { label: '失败', value: 'failed' }
  ]

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = {
        page,
        page_size: pageSize,
        ...(filters.module && { module: filters.module }),
        ...(filters.action && { action: filters.action }),
        ...(filters.status && { status: filters.status })
      }
      
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.start_date = filters.dateRange[0].format('YYYY-MM-DD')
        params.end_date = filters.dateRange[1].format('YYYY-MM-DD')
      }

      const result = await logApi.getLogs(params)
      if (result.success) {
        setData(result.data.list)
        setPagination({
          current: result.data.pagination.page,
          pageSize: result.data.pagination.page_size,
          total: result.data.pagination.total
        })
      }
    } catch (error) {
      console.error('Fetch logs failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSearch = () => {
    fetchData(1, pagination.pageSize)
  }

  const handleReset = () => {
    setFilters({
      module: '',
      action: '',
      status: '',
      dateRange: null
    })
    fetchData(1, pagination.pageSize)
  }

  const handleView = (record) => {
    setSelectedRecord(record)
    setDetailVisible(true)
  }

  const handleMail = () => {
    Modal.confirm({
      title: '邮件群发',
      content: '确定要将日志通过邮件发送吗？',
      onOk: async () => {
        try {
          await logApi.sendLogsByEmail({
            module: filters.module,
            status: filters.status
          })
          message.success('邮件发送成功')
        } catch (error) {
          console.error('Send email failed:', error)
          message.error('邮件发送失败')
        }
      }
    })
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '操作用户',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '操作模块',
      dataIndex: 'module',
      key: 'module',
      render: (module) => (
        <Tag color="blue">
          {moduleMap[module] || module}
        </Tag>
      )
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      render: (action) => actionMap[action] || action
    },
    {
      title: '操作对象',
      dataIndex: 'target_name',
      key: 'target_name',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'success' : 'error'}>
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address'
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
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
          onClick={() => handleView(record)}
        >
          详情
        </Button>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">操作日志</div>
        <div className="page-description">查询和管理系统操作日志</div>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            style={{ width: 150 }}
            placeholder="操作模块"
            value={filters.module}
            onChange={(value) => setFilters({ ...filters, module: value })}
            options={moduleOptions}
          />
          <Select
            style={{ width: 150 }}
            placeholder="操作状态"
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            options={statusOptions}
          />
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            format="YYYY-MM-DD"
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      <div className="table-toolbar">
        <div></div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
            刷新
          </Button>
          <Button icon={<MailOutlined />} onClick={handleMail}>
            邮件发送
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          ...pagination,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => fetchData(page, pageSize)
        }}
      />

      <Modal
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="ID">{selectedRecord.id}</Descriptions.Item>
            <Descriptions.Item label="操作用户">{selectedRecord.username}</Descriptions.Item>
            <Descriptions.Item label="操作模块">
              {moduleMap[selectedRecord.module] || selectedRecord.module}
            </Descriptions.Item>
            <Descriptions.Item label="操作类型">
              {actionMap[selectedRecord.action] || selectedRecord.action}
            </Descriptions.Item>
            <Descriptions.Item label="操作对象ID">{selectedRecord.target_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="操作对象名称">{selectedRecord.target_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selectedRecord.status === 'success' ? 'success' : 'error'}>
                {selectedRecord.status === 'success' ? '成功' : '失败'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="操作时间">
              {selectedRecord.created_at ? dayjs(selectedRecord.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">{selectedRecord.ip_address || '-'}</Descriptions.Item>
            <Descriptions.Item label="User Agent">
              <Popover content={selectedRecord.user_agent} title="User Agent">
                <span style={{ cursor: 'pointer', color: '#1890ff' }}>
                  查看详情
                </span>
              </Popover>
            </Descriptions.Item>
            <Descriptions.Item label="操作消息" span={2}>
              {selectedRecord.message || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default LogList