import React from 'react'
import { Card, Table, Tag, Space, Input, Button, DatePicker } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useState, useEffect } from 'react'

interface AuditLog {
  id: string
  userId: string
  userName: string
  module: string
  action: string
  targetType: string
  targetId: string
  detail: string
  ipAddress: string
  createdAt: string
}

const moduleColorMap: Record<string, string> = {
  系统管理: 'blue',
  基础设置: 'green',
  运输网络: 'cyan',
  发运管理: 'orange',
  到货管理: 'purple',
  财务管理: 'magenta',
}

const actionColorMap: Record<string, string> = {
  新增: 'green',
  修改: 'blue',
  删除: 'red',
  登录: 'cyan',
  登出: 'default',
  导出: 'purple',
}

const mockLogs: AuditLog[] = [
  {
    id: '1',
    userId: '1',
    userName: 'admin',
    module: '系统管理',
    action: '登录',
    targetType: '用户',
    targetId: '1',
    detail: '用户 admin 登录系统',
    ipAddress: '192.168.1.100',
    createdAt: '2025-06-01 14:30:00',
  },
  {
    id: '2',
    userId: '1',
    userName: 'admin',
    module: '基础设置',
    action: '新增',
    targetType: '城市',
    targetId: '2',
    detail: '新增城市：深圳市',
    ipAddress: '192.168.1.100',
    createdAt: '2025-06-01 14:35:00',
  },
  {
    id: '3',
    userId: '1',
    userName: 'admin',
    module: '发运管理',
    action: '修改',
    targetType: '运输委托',
    targetId: 'TO20250601001',
    detail: '修改运输委托 TO20250601001 状态：在途',
    ipAddress: '192.168.1.100',
    createdAt: '2025-06-01 15:00:00',
  },
  {
    id: '4',
    userId: '2',
    userName: 'operator',
    module: '财务管理',
    action: '新增',
    targetType: '对账',
    targetId: 'RC20250601001',
    detail: '创建对账单 RC20250601001',
    ipAddress: '192.168.1.101',
    createdAt: '2025-06-01 15:30:00',
  },
  {
    id: '5',
    userId: '1',
    userName: 'admin',
    module: '系统管理',
    action: '删除',
    targetType: '用户',
    targetId: '3',
    detail: '删除用户 test',
    ipAddress: '192.168.1.100',
    createdAt: '2025-06-01 16:00:00',
  },
]

const AuditLogManagement: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AuditLog[]>(mockLogs)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const columns: ColumnsType<AuditLog> = [
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: '操作人',
      dataIndex: 'userName',
      key: 'userName',
      width: 100,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (text) => (
        <Tag color={moduleColorMap[text] || 'default'}>{text}</Tag>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 80,
      render: (text) => (
        <Tag color={actionColorMap[text] || 'default'}>{text}</Tag>
      ),
    },
    {
      title: '操作对象',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 100,
    },
    {
      title: '对象ID',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 150,
    },
    {
      title: '操作详情',
      dataIndex: 'detail',
      key: 'detail',
      width: 250,
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
    },
  ]

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  const handleReset = () => {
    setKeyword('')
  }

  return (
    <Card title="操作日志">
      <div className="search-form" style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="请输入关键词搜索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <DatePicker.RangePicker style={{ width: 280 }} />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total: mockLogs.length,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />
    </Card>
  )
}

export default AuditLogManagement
