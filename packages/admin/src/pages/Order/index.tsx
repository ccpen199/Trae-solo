import { useState } from 'react'
import { Table, Card, Button, Space, Input, Select, Tag, DatePicker, Modal, message } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Order } from '@/types'
import { formatDateTime, formatMoney, formatEnergy, formatDuration } from '@/utils'

const statusMap: Record<string, { color: string; text: string }> = {
  charging: { color: 'blue', text: '充电中' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'default', text: '已取消' },
  fault: { color: 'red', text: '异常' }
}

const mockData: Order[] = [
  { id: '1', orderNo: 'ORD2024061800001', userId: 'u001', userName: '张三', pileId: 'p001', pileName: 'A001', stationName: '浦东充电站', startTime: '2024-06-18 08:30:00', endTime: '2024-06-18 09:15:00', duration: 2700, energy: 45.5, amount: 68.25, status: 'completed' },
  { id: '2', orderNo: 'ORD2024061800002', userId: 'u002', userName: '李四', pileId: 'p002', pileName: 'A002', stationName: '浦东充电站', startTime: '2024-06-18 09:00:00', endTime: undefined, duration: undefined, energy: undefined, amount: undefined, status: 'charging' },
  { id: '3', orderNo: 'ORD2024061800003', userId: 'u003', userName: '王五', pileId: 'p003', pileName: 'B001', stationName: '虹桥充电站', startTime: '2024-06-18 07:45:00', endTime: '2024-06-18 08:30:00', duration: 2700, energy: 32.8, amount: 49.2, status: 'completed' },
  { id: '4', orderNo: 'ORD2024061700001', userId: 'u004', userName: '赵六', pileId: 'p004', pileName: 'B002', stationName: '虹桥充电站', startTime: '2024-06-17 20:15:00', endTime: '2024-06-17 21:00:00', duration: 2700, energy: 55.2, amount: 82.8, status: 'completed' },
  { id: '5', orderNo: 'ORD2024061700002', userId: 'u005', userName: '钱七', pileId: 'p005', pileName: 'C001', stationName: '徐汇充电站', startTime: '2024-06-17 15:30:00', endTime: '2024-06-17 15:35:00', duration: 300, energy: 0, amount: 0, status: 'cancelled' }
]

function Order() {
  const [data, setData] = useState<Order[]>(mockData)
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [stationId, setStationId] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[Date | null, Date | null] | null>(null)

  const columns: ColumnsType<Order> = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
    { title: '用户', dataIndex: 'userName', key: 'userName' },
    { title: '充电站', dataIndex: 'stationName', key: 'stationName' },
    { title: '充电桩', dataIndex: 'pileName', key: 'pileName' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status]
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', render: (t) => formatDateTime(t) },
    { title: '充电量', dataIndex: 'energy', key: 'energy', render: (e) => formatEnergy(e) },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (a) => formatMoney(a) },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          详情
        </Button>
      )
    }
  ]

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      let filtered = mockData
      if (keyword) {
        filtered = filtered.filter(
          (item) => item.orderNo.includes(keyword) || item.userName.includes(keyword)
        )
      }
      if (status) {
        filtered = filtered.filter((item) => item.status === status)
      }
      if (stationId) {
        filtered = filtered.filter((item) => item.stationName.includes(stationId))
      }
      setData(filtered)
      setLoading(false)
    }, 300)
  }

  const handleView = (record: Order) => {
    setCurrentOrder(record)
    setDetailVisible(true)
  }

  const statistics = {
    total: data.length,
    completed: data.filter((item) => item.status === 'completed').length,
    charging: data.filter((item) => item.status === 'charging').length,
    totalAmount: data.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索订单号/用户名"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="选择场站"
            style={{ width: 180 }}
            allowClear
            value={stationId}
            onChange={setStationId}
            options={[
              { value: '浦东充电站', label: '浦东充电站' },
              { value: '虹桥充电站', label: '虹桥充电站' },
              { value: '徐汇充电站', label: '徐汇充电站' }
            ]}
          />
          <Select
            placeholder="订单状态"
            style={{ width: 150 }}
            allowClear
            value={status}
            onChange={setStatus}
            options={[
              { value: 'charging', label: '充电中' },
              { value: 'completed', label: '已完成' },
              { value: 'cancelled', label: '已取消' },
              { value: 'fault', label: '异常' }
            ]}
          />
          <DatePicker.RangePicker
            showTime
            onChange={(_, dateStrings) => {
              if (dateStrings && dateStrings[0] && dateStrings[1]) {
                setDateRange([new Date(dateStrings[0]), new Date(dateStrings[1])])
              } else {
                setDateRange(null)
              }
            }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>

        <Space style={{ marginBottom: 16 }}>
          <span>总订单数: <b>{statistics.total}</b></span>
          <span>已完成: <b style={{ color: '#52c41a' }}>{statistics.completed}</b></span>
          <span>充电中: <b style={{ color: '#1890ff' }}>{statistics.charging}</b></span>
          <span>总金额: <b style={{ color: '#fa8c16' }}>{formatMoney(statistics.totalAmount)}</b></span>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            total: data.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentOrder && (
          <div>
            <p><b>订单号:</b> {currentOrder.orderNo}</p>
            <p><b>用户:</b> {currentOrder.userName}</p>
            <p><b>充电站:</b> {currentOrder.stationName}</p>
            <p><b>充电桩:</b> {currentOrder.pileName}</p>
            <p><b>状态:</b> <Tag color={statusMap[currentOrder.status].color}>{statusMap[currentOrder.status].text}</Tag></p>
            <p><b>开始时间:</b> {formatDateTime(currentOrder.startTime)}</p>
            <p><b>结束时间:</b> {formatDateTime(currentOrder.endTime)}</p>
            <p><b>充电时长:</b> {formatDuration(currentOrder.duration)}</p>
            <p><b>充电量:</b> {formatEnergy(currentOrder.energy)}</p>
            <p><b>金额:</b> {formatMoney(currentOrder.amount)}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Order
