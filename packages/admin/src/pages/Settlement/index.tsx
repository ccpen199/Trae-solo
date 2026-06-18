import { useState } from 'react'
import { Table, Card, Button, Space, Input, Select, Tag, DatePicker, Modal, message, Row, Col, Statistic } from 'antd'
import { SearchOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatMoney } from '@/utils'

interface SettlementItem {
  id: string
  settlementNo: string
  operator: string
  amount: number
  fee: number
  actualAmount: number
  status: 'pending' | 'settled' | 'failed'
  orderCount: number
  createTime: string
  settleTime?: string
}

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待结算' },
  settled: { color: 'green', text: '已结算' },
  failed: { color: 'red', text: '结算失败' }
}

const mockData: SettlementItem[] = [
  { id: '1', settlementNo: 'SET20240618001', operator: '国网电动', amount: 15680.5, fee: 1568.05, actualAmount: 14112.45, status: 'settled', orderCount: 256, createTime: '2024-06-18 02:00:00', settleTime: '2024-06-18 02:30:00' },
  { id: '2', settlementNo: 'SET20240618002', operator: '特来电', amount: 23450.8, fee: 2345.08, actualAmount: 21105.72, status: 'pending', orderCount: 389, createTime: '2024-06-18 02:00:00' },
  { id: '3', settlementNo: 'SET20240618003', operator: '星星充电', amount: 8920.3, fee: 892.03, actualAmount: 8028.27, status: 'pending', orderCount: 142, createTime: '2024-06-18 02:00:00' },
  { id: '4', settlementNo: 'SET20240617001', operator: '国网电动', amount: 14230.0, fee: 1423.0, actualAmount: 12807.0, status: 'settled', orderCount: 234, createTime: '2024-06-17 02:00:00', settleTime: '2024-06-17 02:25:00' },
  { id: '5', settlementNo: 'SET20240617002', operator: '特来电', amount: 21560.5, fee: 2156.05, actualAmount: 19404.45, status: 'settled', orderCount: 356, createTime: '2024-06-17 02:00:00', settleTime: '2024-06-17 02:28:00' }
]

function Settlement() {
  const [data, setData] = useState<SettlementItem[]>(mockData)
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<SettlementItem | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string | undefined>()

  const columns: ColumnsType<SettlementItem> = [
    { title: '结算单号', dataIndex: 'settlementNo', key: 'settlementNo', width: 180 },
    { title: '运营商', dataIndex: 'operator', key: 'operator' },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount' },
    { title: '总金额', dataIndex: 'amount', key: 'amount', render: (a) => formatMoney(a) },
    { title: '平台服务费', dataIndex: 'fee', key: 'fee', render: (f) => formatMoney(f) },
    { title: '实际结算', dataIndex: 'actualAmount', key: 'actualAmount', render: (a) => formatMoney(a) },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status]
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', render: (t) => formatDateTime(t) },
    { title: '结算时间', dataIndex: 'settleTime', key: 'settleTime', render: (t) => formatDateTime(t) },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleView(record)}>
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
          (item) => item.settlementNo.includes(keyword) || item.operator.includes(keyword)
        )
      }
      if (status) {
        filtered = filtered.filter((item) => item.status === status)
      }
      setData(filtered)
      setLoading(false)
    }, 300)
  }

  const handleView = (record: SettlementItem) => {
    setCurrentRecord(record)
    setDetailVisible(true)
  }

  const handleBatchSettle = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要结算的记录')
      return
    }
    Modal.confirm({
      title: '确认批量结算',
      content: `确定要结算选中的 ${selectedRowKeys.length} 条记录吗？`,
      onOk: () => {
        setData(
          data.map((item) =>
            selectedRowKeys.includes(item.id) ? { ...item, status: 'settled', settleTime: new Date().toISOString() } : item
          )
        )
        setSelectedRowKeys([])
        message.success('批量结算成功')
      }
    })
  }

  const statistics = {
    total: data.length,
    pending: data.filter((item) => item.status === 'pending').length,
    settled: data.filter((item) => item.status === 'settled').length,
    totalAmount: data.reduce((sum, item) => sum + item.amount, 0)
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="结算单总数" value={statistics.total} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待结算" value={statistics.pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已结算" value={statistics.settled} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="结算总金额" value={statistics.totalAmount} precision={2} prefix={<DollarOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索结算单号/运营商"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="结算状态"
            style={{ width: 150 }}
            allowClear
            value={status}
            onChange={setStatus}
            options={[
              { value: 'pending', label: '待结算' },
              { value: 'settled', label: '已结算' },
              { value: 'failed', label: '结算失败' }
            ]}
          />
          <DatePicker.RangePicker onChange={() => {}} />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button type="primary" onClick={handleBatchSettle} disabled={selectedRowKeys.length === 0}>
            批量结算
          </Button>
        </Space>

        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record: SettlementItem) => ({
              disabled: record.status !== 'pending'
            })
          }}
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
        title="结算详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={500}
      >
        {currentRecord && (
          <div>
            <p><b>结算单号:</b> {currentRecord.settlementNo}</p>
            <p><b>运营商:</b> {currentRecord.operator}</p>
            <p><b>订单数:</b> {currentRecord.orderCount}</p>
            <p><b>总金额:</b> {formatMoney(currentRecord.amount)}</p>
            <p><b>平台服务费:</b> {formatMoney(currentRecord.fee)}</p>
            <p><b>实际结算:</b> {formatMoney(currentRecord.actualAmount)}</p>
            <p><b>状态:</b> <Tag color={statusMap[currentRecord.status].color}>{statusMap[currentRecord.status].text}</Tag></p>
            <p><b>创建时间:</b> {formatDateTime(currentRecord.createTime)}</p>
            <p><b>结算时间:</b> {formatDateTime(currentRecord.settleTime)}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Settlement
