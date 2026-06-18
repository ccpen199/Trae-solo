import { useState } from 'react'
import {
  Table, Card, Button, Space, Input, Select, Tag, Modal, message, Row, Col, Statistic,
  Drawer, Descriptions, Form, InputNumber, Tabs
} from 'antd'
import {
  SearchOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, SettingOutlined, FileTextOutlined, AuditOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatMoney } from '@/utils'

interface SettlementItem {
  id: string
  settlementNo: string
  operator: string
  orderCount: number
  chargeIncome: number
  serviceFee: number
  platformCut: number
  operatorShare: number
  status: 'pending' | 'settled' | 'failed'
  period: string
  createTime: string
  settleTime?: string
}

interface SplitRule {
  id: string
  operator: string
  serviceRate: number
  platformRate: number
  operatorRate: number
  minSettle: number
  settleCycle: string
  updateTime: string
}

interface OrderDetail {
  id: string
  orderNo: string
  userName: string
  pileCode: string
  stationName: string
  energy: number
  amount: number
  serviceFee: number
  time: string
}

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待结算' },
  settled: { color: 'green', text: '已结算' },
  failed: { color: 'red', text: '结算失败' }
}

const operatorList = ['国网', '特来电', '星星充电', '小桔充电', '云快充']

const mockData: SettlementItem[] = [
  { id: '1', settlementNo: 'SET20240618001', operator: '国网', orderCount: 356, chargeIncome: 85680.5, serviceFee: 8568.05, platformCut: 8568.05, operatorShare: 77012.45, status: 'settled', period: '2024-06-01~2024-06-15', createTime: '2024-06-18 02:00:00', settleTime: '2024-06-18 02:30:00' },
  { id: '2', settlementNo: 'SET20240618002', operator: '特来电', orderCount: 489, chargeIncome: 123450.8, serviceFee: 12345.08, platformCut: 12345.08, operatorShare: 111105.72, status: 'pending', period: '2024-06-01~2024-06-15', createTime: '2024-06-18 02:00:00' },
  { id: '3', settlementNo: 'SET20240618003', operator: '星星充电', orderCount: 242, chargeIncome: 58920.3, serviceFee: 5892.03, platformCut: 5892.03, operatorShare: 53028.27, status: 'pending', period: '2024-06-01~2024-06-15', createTime: '2024-06-18 02:00:00' },
  { id: '4', settlementNo: 'SET20240618004', operator: '小桔充电', orderCount: 178, chargeIncome: 42360.0, serviceFee: 4236.0, platformCut: 4236.0, operatorShare: 38124.0, status: 'pending', period: '2024-06-01~2024-06-15', createTime: '2024-06-18 02:00:00' },
  { id: '5', settlementNo: 'SET20240618005', operator: '云快充', orderCount: 134, chargeIncome: 31280.5, serviceFee: 3128.05, platformCut: 3128.05, operatorShare: 28152.45, status: 'failed', period: '2024-06-01~2024-06-15', createTime: '2024-06-18 02:00:00' },
  { id: '6', settlementNo: 'SET20240603001', operator: '国网', orderCount: 312, chargeIncome: 74230.0, serviceFee: 7423.0, platformCut: 7423.0, operatorShare: 66807.0, status: 'settled', period: '2024-05-16~2024-05-31', createTime: '2024-06-03 02:00:00', settleTime: '2024-06-03 02:25:00' },
  { id: '7', settlementNo: 'SET20240603002', operator: '特来电', orderCount: 428, chargeIncome: 10560.5, serviceFee: 10560.50, platformCut: 10560.50, operatorShare: 95164.50, status: 'settled', period: '2024-05-16~2024-05-31', createTime: '2024-06-03 02:00:00', settleTime: '2024-06-03 02:28:00' },
  { id: '8', settlementNo: 'SET20240603003', operator: '星星充电', orderCount: 210, chargeIncome: 48560.3, serviceFee: 4856.03, platformCut: 4856.03, operatorShare: 43704.27, status: 'settled', period: '2024-05-16~2024-05-31', createTime: '2024-06-03 02:00:00', settleTime: '2024-06-03 02:32:00' },
  { id: '9', settlementNo: 'SET20240603004', operator: '小桔充电', orderCount: 156, chargeIncome: 36820.0, serviceFee: 3682.0, platformCut: 3682.0, operatorShare: 33138.0, status: 'settled', period: '2024-05-16~2024-05-31', createTime: '2024-06-03 02:00:00', settleTime: '2024-06-03 02:35:00' },
  { id: '10', settlementNo: 'SET20240603005', operator: '云快充', orderCount: 118, chargeIncome: 27650.5, serviceFee: 2765.05, platformCut: 2765.05, operatorShare: 24885.45, status: 'settled', period: '2024-05-16~2024-05-31', createTime: '2024-06-03 02:00:00', settleTime: '2024-06-03 02:38:00' },
  { id: '11', settlementNo: 'SET20240518001', operator: '国网', orderCount: 298, chargeIncome: 68920.0, serviceFee: 6892.0, platformCut: 6892.0, operatorShare: 62028.0, status: 'settled', period: '2024-05-01~2024-05-15', createTime: '2024-05-18 02:00:00', settleTime: '2024-05-18 02:30:00' },
  { id: '12', settlementNo: 'SET20240518002', operator: '特来电', orderCount: 401, chargeIncome: 98560.8, serviceFee: 9856.08, platformCut: 9856.08, operatorShare: 88704.72, status: 'settled', period: '2024-05-01~2024-05-15', createTime: '2024-05-18 02:00:00', settleTime: '2024-05-18 02:35:00' }
]

const splitRules: SplitRule[] = [
  { id: '1', operator: '国网', serviceRate: 10, platformRate: 10, operatorRate: 90, minSettle: 5000, settleCycle: '半月结', updateTime: '2024-05-01' },
  { id: '2', operator: '特来电', serviceRate: 10, platformRate: 10, operatorRate: 90, minSettle: 3000, settleCycle: '半月结', updateTime: '2024-05-01' },
  { id: '3', operator: '星星充电', serviceRate: 10, platformRate: 10, operatorRate: 90, minSettle: 2000, settleCycle: '月结', updateTime: '2024-05-01' },
  { id: '4', operator: '小桔充电', serviceRate: 10, platformRate: 10, operatorRate: 90, minSettle: 2000, settleCycle: '月结', updateTime: '2024-05-01' },
  { id: '5', operator: '云快充', serviceRate: 10, platformRate: 10, operatorRate: 90, minSettle: 1000, settleCycle: '月结', updateTime: '2024-05-01' }
]

const orderDetails: Record<string, OrderDetail[]> = {
  '1': [
    { id: '1', orderNo: 'ORD20240601001', userName: '张三', pileCode: 'G2-JN-DC003', stationName: 'G2京沪-济南服务区站', energy: 45.6, amount: 68.4, serviceFee: 6.84, time: '2024-06-01 09:12:33' },
    { id: '2', orderNo: 'ORD20240601002', userName: '李四', pileCode: 'G2-JN-DC005', stationName: 'G2京沪-济南服务区站', energy: 32.1, amount: 48.15, serviceFee: 4.82, time: '2024-06-01 10:30:18' },
    { id: '3', orderNo: 'ORD20240601003', userName: '王五', pileCode: 'G2-TA-DC002', stationName: 'G2京沪-泰安站', energy: 56.8, amount: 85.2, serviceFee: 8.52, time: '2024-06-01 14:22:05' },
    { id: '4', orderNo: 'ORD20240601004', userName: '赵六', pileCode: 'G2-JN-DC008', stationName: 'G2京沪-济南服务区站', energy: 28.5, amount: 42.75, serviceFee: 4.28, time: '2024-06-02 08:45:12' },
    { id: '5', orderNo: 'ORD20240601005', userName: '钱七', pileCode: 'G2-TA-DC001', stationName: 'G2京沪-泰安站', energy: 38.9, amount: 58.35, serviceFee: 5.84, time: '2024-06-02 16:10:44' }
  ]
}

const months = ['1月', '2月', '3月', '4月', '5月', '6月']

const trendOption = {
  title: { text: '月度结算趋势', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'axis' },
  legend: { data: ['结算总额', '平台抽成'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
  xAxis: { type: 'category', data: months },
  yAxis: { type: 'value', name: '元' },
  series: [
    { name: '结算总额', type: 'line', smooth: true, data: [285600, 312400, 298500, 345800, 378200, 401500], itemStyle: { color: '#1890ff' }, areaStyle: { opacity: 0.15 } },
    { name: '平台抽成', type: 'line', smooth: true, data: [28560, 31240, 29850, 34580, 37820, 40150], itemStyle: { color: '#fa8c16' }, areaStyle: { opacity: 0.15 } }
  ]
}

const pieOption = {
  title: { text: '各运营商结算占比', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
  legend: { orient: 'vertical', left: 'left' },
  series: [{
    type: 'pie', radius: ['40%', '70%'],
    data: [
      { value: 168830, name: '国网', itemStyle: { color: '#1890ff' } },
      { value: 216576, name: '特来电', itemStyle: { color: '#52c41a' } },
      { value: 107480, name: '星星充电', itemStyle: { color: '#fa8c16' } },
      { value: 79180, name: '小桔充电', itemStyle: { color: '#722ed1' } },
      { value: 58931, name: '云快充', itemStyle: { color: '#eb2f96' } }
    ]
  }]
}

const serviceFeeBarOption = {
  title: { text: '服务费收入趋势', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: months },
  yAxis: { type: 'value', name: '元' },
  series: [{
    name: '服务费', type: 'bar', data: [28560, 31240, 29850, 34580, 37820, 40150],
    itemStyle: {
      color: (() => {
        return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#1890ff' },
          { offset: 1, color: '#69c0ff' }
        ])
      })()
    }
  }]
}

function Settlement() {
  const [data, setData] = useState<SettlementItem[]>(mockData)
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<SettlementItem | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [operatorFilter, setOperatorFilter] = useState<string | undefined>()
  const [ruleModalVisible, setRuleModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<SplitRule | null>(null)
  const [rules, setRules] = useState<SplitRule[]>(splitRules)
  const [ruleForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState('list')

  const columns: ColumnsType<SettlementItem> = [
    { title: '结算单号', dataIndex: 'settlementNo', key: 'settlementNo', width: 170 },
    { title: '运营商', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount', width: 80 },
    { title: '充电收入', dataIndex: 'chargeIncome', key: 'chargeIncome', width: 120, render: (v) => formatMoney(v) },
    { title: '服务费', dataIndex: 'serviceFee', key: 'serviceFee', width: 100, render: (v) => formatMoney(v) },
    { title: '平台抽成', dataIndex: 'platformCut', key: 'platformCut', width: 110, render: (v) => formatMoney(v) },
    { title: '运营商分成', dataIndex: 'operatorShare', key: 'operatorShare', width: 120, render: (v) => formatMoney(v) },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => { const info = statusMap[status]; return <Tag color={info.color}>{info.text}</Tag> }
    },
    { title: '结算周期', dataIndex: 'period', key: 'period', width: 180 },
    {
      title: '操作', key: 'action', width: 80,
      render: (_, record) => <Button type="link" size="small" onClick={() => handleView(record)}>详情</Button>
    }
  ]

  const ruleColumns: ColumnsType<SplitRule> = [
    { title: '运营商', dataIndex: 'operator', key: 'operator', width: 120 },
    { title: '服务费率(%)', dataIndex: 'serviceRate', key: 'serviceRate', width: 120 },
    { title: '平台分成比例(%)', dataIndex: 'platformRate', key: 'platformRate', width: 140 },
    { title: '运营商分成(%)', dataIndex: 'operatorRate', key: 'operatorRate', width: 130 },
    { title: '最低结算额(元)', dataIndex: 'minSettle', key: 'minSettle', width: 130, render: (v) => formatMoney(v) },
    { title: '结算周期', dataIndex: 'settleCycle', key: 'settleCycle', width: 100 },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 120 },
    {
      title: '操作', key: 'action', width: 80,
      render: (_, record) => <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleEditRule(record)}>编辑</Button>
    }
  ]

  const orderColumns: ColumnsType<OrderDetail> = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 170 },
    { title: '用户', dataIndex: 'userName', key: 'userName', width: 80 },
    { title: '桩编号', dataIndex: 'pileCode', key: 'pileCode', width: 140 },
    { title: '场站', dataIndex: 'stationName', key: 'stationName', ellipsis: true },
    { title: '充电量', dataIndex: 'energy', key: 'energy', width: 100, render: (v) => `${v} kWh` },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 90, render: (v) => formatMoney(v) },
    { title: '服务费', dataIndex: 'serviceFee', key: 'serviceFee', width: 90, render: (v) => formatMoney(v) },
    { title: '时间', dataIndex: 'time', key: 'time', width: 170, render: (t) => formatDateTime(t) }
  ]

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      let filtered = mockData
      if (keyword) {
        filtered = filtered.filter(item => item.settlementNo.includes(keyword) || item.operator.includes(keyword))
      }
      if (statusFilter) {
        filtered = filtered.filter(item => item.status === statusFilter)
      }
      if (operatorFilter) {
        filtered = filtered.filter(item => item.operator === operatorFilter)
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
        setData(data.map(item =>
          selectedRowKeys.includes(item.id) ? { ...item, status: 'settled' as const, settleTime: new Date().toISOString().replace('T', ' ').substring(0, 19) } : item
        ))
        setSelectedRowKeys([])
        message.success('批量结算成功')
      }
    })
  }

  const handleEditRule = (rule: SplitRule) => {
    setEditingRule(rule)
    ruleForm.setFieldsValue(rule)
    setRuleModalVisible(true)
  }

  const handleSaveRule = async () => {
    try {
      const values = await ruleForm.validateFields()
      if (editingRule) {
        setRules(rules.map(r => r.id === editingRule.id ? { ...r, ...values, updateTime: new Date().toISOString().substring(0, 10) } : r))
        message.success('分账规则更新成功')
      }
      setRuleModalVisible(false)
    } catch {}
  }

  const pendingItems = data.filter(i => i.status === 'pending')
  const settledItems = data.filter(i => i.status === 'settled')
  const failedItems = data.filter(i => i.status === 'failed')
  const totalAmount = data.reduce((sum, i) => sum + i.chargeIncome, 0)
  const pendingAmount = pendingItems.reduce((sum, i) => sum + i.chargeIncome, 0)
  const settledAmount = settledItems.reduce((sum, i) => sum + i.chargeIncome, 0)
  const failedAmount = failedItems.reduce((sum, i) => sum + i.chargeIncome, 0)

  const tabItems = [
    { key: 'list', label: '结算明细' },
    { key: 'rules', label: '分账规则' },
    { key: 'charts', label: '结算报表' }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="本月结算总额" value={totalAmount} precision={2} prefix={<DollarOutlined />} valueStyle={{ color: '#1890ff' }} formatter={(v) => formatMoney(Number(v))} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="待结算金额" value={pendingAmount} precision={2} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} formatter={(v) => formatMoney(Number(v))} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="已结算金额" value={settledAmount} precision={2} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} formatter={(v) => formatMoney(Number(v))} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="结算失败" value={failedAmount} precision={2} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#f5222d' }} formatter={(v) => formatMoney(Number(v))} /></Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        {activeTab === 'list' && (
          <>
            <Space style={{ marginBottom: 16 }} wrap>
              <Input placeholder="搜索结算单号/运营商" prefix={<SearchOutlined />} style={{ width: 240 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} />
              <Select placeholder="结算状态" style={{ width: 130 }} allowClear value={statusFilter} onChange={setStatusFilter} options={[{ value: 'pending', label: '待结算' }, { value: 'settled', label: '已结算' }, { value: 'failed', label: '结算失败' }]} />
              <Select placeholder="运营商" style={{ width: 130 }} allowClear value={operatorFilter} onChange={setOperatorFilter} options={operatorList.map(o => ({ value: o, label: o }))} />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
              <Button type="primary" icon={<AuditOutlined />} onClick={handleBatchSettle} disabled={selectedRowKeys.length === 0}>
                批量结算 ({selectedRowKeys.length})
              </Button>
            </Space>
            <Table
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
                getCheckboxProps: (record: SettlementItem) => ({ disabled: record.status !== 'pending' })
              }}
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={loading}
              pagination={{ total: data.length, pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
            />
          </>
        )}

        {activeTab === 'rules' && (
          <Table columns={ruleColumns} dataSource={rules} rowKey="id" pagination={false} />
        )}

        {activeTab === 'charts' && (
          <Row gutter={16}>
            <Col span={12}>
              <Card style={{ marginBottom: 16 }}><ReactECharts option={trendOption} style={{ height: 320 }} /></Card>
              <Card><ReactECharts option={serviceFeeBarOption} style={{ height: 280 }} /></Card>
            </Col>
            <Col span={12}>
              <Card><ReactECharts option={pieOption} style={{ height: 400 }} /></Card>
            </Col>
          </Row>
        )}
      </Card>

      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            <span>结算详情</span>
          </Space>
        }
        width={720}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <>
            <Descriptions column={2} bordered style={{ marginBottom: 24 }}>
              <Descriptions.Item label="结算单号">{currentRecord.settlementNo}</Descriptions.Item>
              <Descriptions.Item label="运营商">{currentRecord.operator}</Descriptions.Item>
              <Descriptions.Item label="订单数">{currentRecord.orderCount}</Descriptions.Item>
              <Descriptions.Item label="结算周期">{currentRecord.period}</Descriptions.Item>
              <Descriptions.Item label="充电收入">{formatMoney(currentRecord.chargeIncome)}</Descriptions.Item>
              <Descriptions.Item label="服务费">{formatMoney(currentRecord.serviceFee)}</Descriptions.Item>
              <Descriptions.Item label="平台抽成">{formatMoney(currentRecord.platformCut)}</Descriptions.Item>
              <Descriptions.Item label="运营商分成">{formatMoney(currentRecord.operatorShare)}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusMap[currentRecord.status].color}>{statusMap[currentRecord.status].text}</Tag></Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(currentRecord.createTime)}</Descriptions.Item>
              <Descriptions.Item label="结算时间">{formatDateTime(currentRecord.settleTime)}</Descriptions.Item>
            </Descriptions>
            <Card title="订单明细" size="small">
              <Table
                columns={orderColumns}
                dataSource={orderDetails[currentRecord.id] || orderDetails['1']}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </>
        )}
      </Drawer>

      <Modal
        title="编辑分账规则"
        open={ruleModalVisible}
        onOk={handleSaveRule}
        onCancel={() => setRuleModalVisible(false)}
        destroyOnClose
      >
        <Form form={ruleForm} layout="vertical">
          <Form.Item label="运营商" name="operator">
            <Input disabled />
          </Form.Item>
          <Form.Item label="服务费率(%)" name="serviceRate" rules={[{ required: true, message: '请输入服务费率' }]}>
            <InputNumber min={0} max={30} precision={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="平台分成比例(%)" name="platformRate" rules={[{ required: true, message: '请输入平台分成比例' }]}>
            <InputNumber min={0} max={50} precision={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="运营商分成比例(%)" name="operatorRate" rules={[{ required: true, message: '请输入运营商分成比例' }]}>
            <InputNumber min={0} max={100} precision={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="最低结算额(元)" name="minSettle" rules={[{ required: true, message: '请输入最低结算额' }]}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="结算周期" name="settleCycle" rules={[{ required: true, message: '请选择结算周期' }]}>
            <Select options={[{ value: '半月结', label: '半月结' }, { value: '月结', label: '月结' }, { value: '周结', label: '周结' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Settlement
