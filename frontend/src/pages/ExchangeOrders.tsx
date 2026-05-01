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
  Modal,
  Descriptions,
} from 'antd'
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import { exchangeApi } from '../services/api'
import dayjs from 'dayjs'
import type { TablePaginationConfig } from 'antd/es/table'

const { Title } = Typography
const { RangePicker } = DatePicker

interface Order {
  id: string
  orderNo: string
  memberId: string
  exchangeType: string
  status: string
  itemId: string
  itemName: string
  quantity: number
  pointsPerUnit: number
  totalPoints: number
  frozenPoints: number
  deductedPoints: number
  rolledbackPoints: number
  businessNo: string
  freezeExpiresAt: string
  createdAt: string
  frozenAt: string
  confirmedAt: string
  completedAt: string
  cancelledAt: string
  failedAt: string
}

const ExchangeOrders: React.FC = () => {
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Order[]>([])
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [filters, setFilters] = useState({
    status: '',
    exchangeType: '',
    startDate: '',
    endDate: '',
  })
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const isStaff = ['manager', 'employee', 'admin'].includes(user?.role || '')

  useEffect(() => {
    fetchOrders()
  }, [pagination.current, pagination.pageSize, filters])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      }

      if (filters.status) {
        params.status = filters.status
      }
      if (filters.exchangeType) {
        params.exchangeType = filters.exchangeType
      }
      if (filters.startDate) {
        params.startDate = filters.startDate
      }
      if (filters.endDate) {
        params.endDate = filters.endDate
      }

      const response = await exchangeApi.getOrders(params)
      const result = response.data.data
      setData(result?.items || [])
      setPagination((prev) => ({
        ...prev,
        total: result?.total || 0,
      }))
    } catch (error: any) {
      message.error(error.message || '获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      created: '已创建',
      frozen: '已冻结',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消',
      failed: '失败',
      rollbacked: '已回滚',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      created: 'processing',
      frozen: 'warning',
      confirmed: 'processing',
      completed: 'success',
      cancelled: 'default',
      failed: 'error',
      rollbacked: 'purple',
    }
    return colorMap[status] || 'default'
  }

  const getExchangeTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      product: '实物商品',
      coupon: '代金券',
      service: '服务',
      cash: '现金',
    }
    return typeMap[type] || type
  }

  const handleConfirm = async (order: Order) => {
    try {
      await exchangeApi.confirmExchange(order.id)
      message.success('订单确认成功')
      fetchOrders()
    } catch (error: any) {
      message.error(error.message || '确认失败')
    }
  }

  const handleCancel = async (order: Order) => {
    Modal.confirm({
      title: '确认取消订单',
      content: '取消订单将退还已冻结的积分，是否继续？',
      onOk: async () => {
        try {
          await exchangeApi.cancelExchange(order.id)
          message.success('订单已取消')
          fetchOrders()
        } catch (error: any) {
          message.error(error.message || '取消失败')
        }
      },
    })
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
    },
    {
      title: '商品名称',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'exchangeType',
      key: 'exchangeType',
      width: 100,
      render: (type: string) => getExchangeTypeText(type),
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
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '单积分',
      dataIndex: 'pointsPerUnit',
      key: 'pointsPerUnit',
      width: 100,
    },
    {
      title: '总积分',
      dataIndex: 'totalPoints',
      key: 'totalPoints',
      width: 100,
      render: (points: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {points}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: Order) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedOrder(record)
              setDetailVisible(true)
            }}
          >
            详情
          </Button>

          {record.status === 'frozen' && isStaff && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirm(record)}
            >
              确认
            </Button>
          )}

          {['created', 'frozen'].includes(record.status) && (
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancel(record)}
            >
              取消
            </Button>
          )}
        </Space>
      ),
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
        兑换订单
      </Title>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            style={{ width: 150 }}
            placeholder="订单状态"
            allowClear
            value={filters.status || undefined}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
          >
            <Select.Option value="created">已创建</Select.Option>
            <Select.Option value="frozen">已冻结</Select.Option>
            <Select.Option value="confirmed">已确认</Select.Option>
            <Select.Option value="completed">已完成</Select.Option>
            <Select.Option value="cancelled">已取消</Select.Option>
            <Select.Option value="failed">失败</Select.Option>
            <Select.Option value="rollbacked">已回滚</Select.Option>
          </Select>

          <Select
            style={{ width: 150 }}
            placeholder="兑换类型"
            allowClear
            value={filters.exchangeType || undefined}
            onChange={(value) => setFilters((prev) => ({ ...prev, exchangeType: value }))}
          >
            <Select.Option value="product">实物商品</Select.Option>
            <Select.Option value="coupon">代金券</Select.Option>
            <Select.Option value="service">服务</Select.Option>
            <Select.Option value="cash">现金</Select.Option>
          </Select>

          <RangePicker
            onChange={handleDateChange}
            placeholder={['开始日期', '结束日期']}
          />

          <Button
            icon={<ReloadOutlined />}
            onClick={fetchOrders}
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
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="订单号" span={2}>
              {selectedOrder.orderNo}
            </Descriptions.Item>
            <Descriptions.Item label="商品名称">
              {selectedOrder.itemName}
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              {getExchangeTypeText(selectedOrder.exchangeType)}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(selectedOrder.status)}>
                {getStatusText(selectedOrder.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="数量">
              {selectedOrder.quantity}
            </Descriptions.Item>
            <Descriptions.Item label="单积分">
              {selectedOrder.pointsPerUnit}
            </Descriptions.Item>
            <Descriptions.Item label="总积分">
              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                {selectedOrder.totalPoints}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="冻结积分">
              {selectedOrder.frozenPoints || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="已扣减积分">
              {selectedOrder.deductedPoints || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="已退回积分">
              {selectedOrder.rolledbackPoints || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="业务单号">
              {selectedOrder.businessNo || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {selectedOrder.createdAt ? dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="冻结时间">
              {selectedOrder.frozenAt ? dayjs(selectedOrder.frozenAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="确认时间">
              {selectedOrder.confirmedAt ? dayjs(selectedOrder.confirmedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="完成时间">
              {selectedOrder.completedAt ? dayjs(selectedOrder.completedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Spin>
  )
}

export default ExchangeOrders
