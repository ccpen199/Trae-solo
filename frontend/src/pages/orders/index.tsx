首页 → 体检预约 → 套餐筛选 → 套餐详情 → 预约提交 → 订单支付 → 体检完成
                                          ↓
首页 → 保险商城 → 产品对比 → 产品详情 → 智能核保 → 投保提交 → 保单生效
                                          ↓
首页 → 健康档案 → 报告上传 → OCR解析 → 指标趋势 → 风险评估 → 干预建议
                                          ↓
后台 → 保司准入 → 佣金结算 → 审计日志 → 隐私隔离 → 用户管理 → 订单管理首页 → 体检预约 → 套餐筛选 → 套餐详情 → 预约提交 → 订单支付 → 体检完成
                                          ↓
首页 → 保险商城 → 产品对比 → 产品详情 → 智能核保 → 投保提交 → 保单生效
                                          ↓
首页 → 健康档案 → 报告上传 → OCR解析 → 指标趋势 → 风险评估 → 干预建议
                                          ↓
后台 → 保司准入 → 佣金结算 → 审计日志 → 隐私隔离 → 用户管理 → 订单管理首页 → 体检预约 → 套餐筛选 → 套餐详情 → 预约提交 → 订单支付 → 体检完成
                                          ↓
首页 → 保险商城 → 产品对比 → 产品详情 → 智能核保 → 投保提交 → 保单生效
                                          ↓
首页 → 健康档案 → 报告上传 → OCR解析 → 指标趋势 → 风险评估 → 干预建议
                                          ↓
后台 → 保司准入 → 佣金结算 → 审计日志 → 隐私隔离 → 用户管理 → 订单管理首页 → 体检预约 → 套餐筛选 → 套餐详情 → 预约提交 → 订单支付 → 体检完成
                                          ↓
首页 → 保险商城 → 产品对比 → 产品详情 → 智能核保 → 投保提交 → 保单生效
                                          ↓
首页 → 健康档案 → 报告上传 → OCR解析 → 指标趋势 → 风险评估 → 干预建议
                                          ↓
后台 → 保司准入 → 佣金结算 → 审计日志 → 隐私隔离 → 用户管理 → 订单管理首页 → 体检预约 → 套餐筛选 → 套餐详情 → 预约提交 → 订单支付 → 体检完成
                                          ↓
首页 → 保险商城 → 产品对比 → 产品详情 → 智能核保 → 投保提交 → 保单生效
                                          ↓
首页 → 健康档案 → 报告上传 → OCR解析 → 指标趋势 → 风险评估 → 干预建议
                                          ↓
后台 → 保司准入 → 佣金结算 → 审计日志 → 隐私隔离 → 用户管理 → 订单管理首页 → 体检预约 → 套餐筛选 → 套餐详情 → 预约提交 → 订单支付 → 体检完成
                                          ↓
首页 → 保险商城 → 产品对比 → 产品详情 → 智能核保 → 投保提交 → 保单生效
                                          ↓
首页 → 健康档案 → 报告上传 → OCR解析 → 指标趋势 → 风险评估 → 干预建议
                                          ↓
后台 → 保司准入 → 佣金结算 → 审计日志 → 隐私隔离 → 用户管理 → 订单管理首页 → 体检预约 → 套餐筛选 → 套餐详情 → 预约提交 → 订单支付 → 体检完成
                                          ↓
首页 → 保险商城 → 产品对比 → 产品详情 → 智能核保 → 投保提交 → 保单生效
                                          ↓
首页 → 健康档案 → 报告上传 → OCR解析 → 指标趋势 → 风险评估 → 干预建议
                                          ↓
后台 → 保司准入 → 佣金结算 → 审计日志 → 隐私隔离 → 用户管理 → 订单管理首页 → 体检预约 → 套餐筛选 → 套餐详情 → 预约提交 → 订单支付 → 体检完成
                                          ↓
首页 → 保险商城 → 产品对比 → 产品详情 → 智能核保 → 投保提交 → 保单生效
                                          ↓
首页 → 健康档案 → 报告上传 → OCR解析 → 指标趋势 → 风险评估 → 干预建议
                                          ↓
后台 → 保司准入 → 佣金结算 → 审计日志 → 隐私隔离 → 用户管理 → 订单管理import { useState } from 'react'
import { Card, Table, Tabs, Tag, Button, Space, Modal, message, Badge } from 'antd'
import {
  EyeOutlined,
  HeartOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

type OrderType = 'health_check' | 'insurance'

interface Order {
  key: string
  id: string
  type: OrderType
  name: string
  price: number
  status: 'pending' | 'paid' | 'completed' | 'cancelled' | 'refunded'
  createTime: string
  payTime?: string
  description?: string
}

const mockOrders: Order[] = [
  {
    key: '1',
    id: 'HC202405150001',
    type: 'health_check',
    name: '全面体检套餐A',
    price: 1299,
    status: 'completed',
    createTime: '2024-05-15 10:30:00',
    payTime: '2024-05-15 10:35:00',
    description: '北京协和医院体检中心',
  },
  {
    key: '2',
    id: 'INS202405100002',
    type: 'insurance',
    name: '百万医疗险',
    price: 299,
    status: 'paid',
    createTime: '2024-05-10 14:20:00',
    payTime: '2024-05-10 14:25:00',
    description: '平安保险 · 保障期限1年',
  },
  {
    key: '3',
    id: 'HC202405200003',
    type: 'health_check',
    name: '精英体检套餐',
    price: 2599,
    status: 'pending',
    createTime: '2024-05-20 09:15:00',
    description: '上海瑞金医院体检中心',
  },
  {
    key: '4',
    id: 'INS202404010004',
    type: 'insurance',
    name: '综合意外险',
    price: 199,
    status: 'completed',
    createTime: '2024-04-01 16:45:00',
    payTime: '2024-04-01 16:50:00',
    description: '太平洋保险 · 保障期限1年',
  },
  {
    key: '5',
    id: 'HC202403100005',
    type: 'health_check',
    name: '入职体检套餐',
    price: 399,
    status: 'cancelled',
    createTime: '2024-03-10 11:00:00',
    description: '杭州邵逸夫医院体检中心',
  },
  {
    key: '6',
    id: 'INS202401150006',
    type: 'insurance',
    name: '重疾保障计划',
    price: 3599,
    status: 'paid',
    createTime: '2024-01-15 10:00:00',
    payTime: '2024-01-15 10:10:00',
    description: '中国人寿 · 保障期限1年',
  },
]

const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  pending: { color: 'orange', text: '待支付', icon: <ClockCircleOutlined /> },
  paid: { color: 'blue', text: '已支付', icon: <CheckCircleOutlined /> },
  completed: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
  cancelled: { color: 'default', text: '已取消', icon: <ExclamationCircleOutlined /> },
  refunded: { color: 'purple', text: '已退款', icon: <ExclamationCircleOutlined /> },
}

const Orders = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)

  const filteredOrders = activeTab === 'all'
    ? mockOrders
    : activeTab === 'health_check'
    ? mockOrders.filter((o) => o.type === 'health_check')
    : mockOrders.filter((o) => o.type === 'insurance')

  const handleCancel = (order: Order) => {
    Modal.confirm({
      title: '确认取消订单',
      content: `确定要取消订单 ${order.id} 吗？`,
      onOk: () => {
        message.success('订单已取消')
      },
    })
  }

  const handlePay = (order: Order) => {
    Modal.confirm({
      title: '确认支付',
      content: `确定要支付订单 ${order.id}，金额 ¥${order.price} 吗？`,
      onOk: () => {
        message.success('支付成功')
      },
    })
  }

  const columns: ColumnsType<Order> = [
    {
      title: '订单信息',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: record.type === 'health_check' ? '#e6f7ff' : '#f6ffed',
            }}
          >
            {record.type === 'health_check' ? (
              <HeartOutlined className="text-[#1677ff]" />
            ) : (
              <SafetyOutlined className="text-[#52c41a]" />
            )}
          </div>
          <div>
            <div className="font-semibold">{record.name}</div>
            <div className="text-gray-500 text-sm">{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: '订单编号',
      dataIndex: 'id',
      key: 'id',
      className: 'font-mono',
    },
    {
      title: '金额',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span className="text-[#f5222d] font-semibold">¥{price}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const { color, text, icon } = statusMap[status]
        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        )
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setViewingOrder(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handlePay(record)}
              >
                去支付
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => handleCancel(record)}
              >
                取消
              </Button>
            </>
          )}
          {record.status === 'paid' && record.type === 'health_check' && (
            <Button type="link" size="small">
              查看预约
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const pendingCount = mockOrders.filter((o) => o.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">我的订单</h2>
        {pendingCount > 0 && (
          <Badge count={pendingCount} offset={[-5, 0]}>
            <Button type="primary" onClick={() => setActiveTab('all')}>
              待支付订单
            </Button>
          </Badge>
        )}
      </div>

      <Card bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="px-6 pt-2"
          items={[
            { key: 'all', label: `全部订单 (${mockOrders.length})` },
            { key: 'health_check', label: `体检预约 (${mockOrders.filter((o) => o.type === 'health_check').length})` },
            { key: 'insurance', label: `保险订单 (${mockOrders.filter((o) => o.type === 'insurance').length})` },
          ]}
        />
        <Table
          columns={columns}
          dataSource={filteredOrders}
          pagination={{ pageSize: 10 }}
          className="px-6"
        />
      </Card>

      <Modal
        title="订单详情"
        open={!!viewingOrder}
        onCancel={() => setViewingOrder(null)}
        width={600}
        footer={[
          <Button key="close" onClick={() => setViewingOrder(null)}>
            关闭
          </Button>,
        ]}
      >
        {viewingOrder && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1677ff]">订单状态</span>
                <Tag color={statusMap[viewingOrder.status].color} icon={statusMap[viewingOrder.status].icon}>
                  {statusMap[viewingOrder.status].text}
                </Tag>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">订单编号</span>
                <p className="font-semibold font-mono">{viewingOrder.id}</p>
              </div>
              <div>
                <span className="text-gray-500">订单类型</span>
                <p className="font-semibold">
                  {viewingOrder.type === 'health_check' ? '体检预约' : '保险购买'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">商品名称</span>
                <p className="font-semibold">{viewingOrder.name}</p>
              </div>
              <div>
                <span className="text-gray-500">订单金额</span>
                <p className="font-semibold text-[#f5222d]">¥{viewingOrder.price}</p>
              </div>
              <div>
                <span className="text-gray-500">创建时间</span>
                <p className="font-semibold">{viewingOrder.createTime}</p>
              </div>
              {viewingOrder.payTime && (
                <div>
                  <span className="text-gray-500">支付时间</span>
                  <p className="font-semibold">{viewingOrder.payTime}</p>
                </div>
              )}
            </div>

            {viewingOrder.description && (
              <div className="pt-4 border-t">
                <span className="text-gray-500">备注信息</span>
                <p className="font-semibold mt-1">{viewingOrder.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Orders
