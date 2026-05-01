import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Typography,
  Select,
  DatePicker,
  Button,
  Space,
  message,
  Spin,
  Input,
} from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import { pointsApi } from '../services/api'
import dayjs from 'dayjs'
import type { TablePaginationConfig } from 'antd/es/table'

const { Title } = Typography
const { RangePicker } = DatePicker

interface Transaction {
  id: string
  transactionNo: string
  type: string
  status: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  businessType: string
  businessNo: string
  description: string
  createdAt: string
  confirmedAt: string
}

const Transactions: React.FC = () => {
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchTransactions()
  }, [pagination.current, pagination.pageSize, filters])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      }

      if (filters.type) {
        params.type = filters.type
      }
      if (filters.startDate) {
        params.startDate = filters.startDate
      }
      if (filters.endDate) {
        params.endDate = filters.endDate
      }

      const response = await pointsApi.getTransactions(params)
      const result = response.data.data
      setData(result?.items || [])
      setPagination((prev) => ({
        ...prev,
        total: result?.total || 0,
      }))
    } catch (error: any) {
      message.error(error.message || '获取积分流水失败')
    } finally {
      setLoading(false)
    }
  }

  const getTransactionTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      earn: '获得积分',
      spend: '消费积分',
      freeze: '冻结积分',
      unfreeze: '解冻积分',
      expire: '积分过期',
      adjust: '积分调整',
      rollback: '积分回滚',
    }
    return typeMap[type] || type
  }

  const getTransactionTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      earn: 'success',
      spend: 'error',
      freeze: 'warning',
      unfreeze: 'processing',
      expire: 'default',
      adjust: 'blue',
      rollback: 'purple',
    }
    return colorMap[type] || 'default'
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待入账',
      confirmed: '已确认',
      cancelled: '已取消',
      failed: '失败',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'warning',
      confirmed: 'success',
      cancelled: 'default',
      failed: 'error',
    }
    return colorMap[status] || 'default'
  }

  const columns = [
    {
      title: '流水号',
      dataIndex: 'transactionNo',
      key: 'transactionNo',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={getTransactionTypeColor(type)}>
          {getTransactionTypeText(type)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number, record: Transaction) => {
        const isPositive = ['earn', 'unfreeze', 'rollback', 'adjust'].includes(record.type)
        return (
          <span style={{ color: isPositive ? '#52c41a' : '#ff4d4f' }}>
            {isPositive ? '+' : '-'}{amount}
          </span>
        )
      },
    },
    {
      title: '变动前余额',
      dataIndex: 'balanceBefore',
      key: 'balanceBefore',
      width: 120,
    },
    {
      title: '变动后余额',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 120,
    },
    {
      title: '业务类型',
      dataIndex: 'businessType',
      key: 'businessType',
      width: 120,
    },
    {
      title: '业务单号',
      dataIndex: 'businessNo',
      key: 'businessNo',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '确认时间',
      dataIndex: 'confirmedAt',
      key: 'confirmedAt',
      width: 180,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ]

  const handleTableChange = (pag: TablePaginationConfig) => {
    setPagination((prev) => ({
      ...prev,
      current: pag.current,
      pageSize: pag.pageSize,
    }))
  }

  const handleDateChange = (dates: any) => {
    if (dates) {
      setFilters((prev) => ({
        ...prev,
        startDate: dates[0]?.startOf('day').toISOString(),
        endDate: dates[1]?.endOf('day').toISOString(),
      }))
    } else {
      setFilters((prev) => ({
        ...prev,
        startDate: '',
        endDate: '',
      }))
    }
  }

  return (
    <Spin spinning={loading}>
      <Title level={4} style={{ marginBottom: 24 }}>
        积分流水
      </Title>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            style={{ width: 150 }}
            placeholder="交易类型"
            allowClear
            value={filters.type || undefined}
            onChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
          >
            <Select.Option value="earn">获得积分</Select.Option>
            <Select.Option value="spend">消费积分</Select.Option>
            <Select.Option value="freeze">冻结积分</Select.Option>
            <Select.Option value="unfreeze">解冻积分</Select.Option>
            <Select.Option value="expire">积分过期</Select.Option>
            <Select.Option value="adjust">积分调整</Select.Option>
            <Select.Option value="rollback">积分回滚</Select.Option>
          </Select>

          <RangePicker
            onChange={handleDateChange}
            placeholder={['开始日期', '结束日期']}
          />

          <Button
            icon={<ReloadOutlined />}
            onClick={fetchTransactions}
          >
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1800 }}
        />
      </Card>
    </Spin>
  )
}

export default Transactions
