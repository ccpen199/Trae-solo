import { useState } from 'react'
import {
  Table, Card, Button, Space, Input, Select, Tag, Modal, Form, message,
  Tabs, Drawer, Descriptions, Row, Col, Statistic, Upload
} from 'antd'
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  UploadOutlined, EnvironmentOutlined, CheckCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatMoney, formatEnergy } from '@/utils'

interface StationItem {
  id: string
  name: string
  type: 'highway' | 'city'
  address: string
  operator: string
  pileCount: number
  dcCount: number
  acCount: number
  occupancyRate: number
  status: 'online' | 'offline' | 'maintenance'
  monthlyRevenue: number
  monthlyEnergy: number
  createTime: string
  lng: number
  lat: number
  contactPhone: string
}

interface PileInfo {
  id: string
  code: string
  type: 'dc' | 'ac'
  power: number
  status: 'idle' | 'charging' | 'offline' | 'fault'
  protocol: string
}

interface InspectionRecord {
  id: string
  inspector: string
  type: string
  result: string
  issues: string
  time: string
}

const statusMap: Record<string, { color: string; text: string }> = {
  online: { color: 'green', text: '运营中' },
  offline: { color: 'default', text: '停运' },
  maintenance: { color: 'orange', text: '维护中' }
}

const typeMap: Record<string, { color: string; text: string }> = {
  highway: { color: 'blue', text: '高速网络' },
  city: { color: 'purple', text: '城市公共桩' }
}

const pileStatusMap: Record<string, { color: string; text: string }> = {
  idle: { color: 'green', text: '空闲' },
  charging: { color: 'blue', text: '充电中' },
  offline: { color: 'default', text: '离线' },
  fault: { color: 'red', text: '故障' }
}

const operatorList = ['国网', '特来电', '星星充电', '小桔充电', '云快充']
const protocolList = ['OCPP1.6J', 'OCPP2.0', '国网协议', '二合一协议']

const mockData: StationItem[] = [
  { id: '1', name: 'G1京哈-山海关服务区站', type: 'highway', address: '河北省秦皇岛市山海关区G1京哈高速山海关服务区', operator: '国网', pileCount: 24, dcCount: 16, acCount: 8, occupancyRate: 72.5, status: 'online', monthlyRevenue: 298500, monthlyEnergy: 45860.5, createTime: '2024-01-15 10:00:00', lng: 119.75, lat: 40.0, contactPhone: '0335-5058888' },
  { id: '2', name: 'G2京沪-济南服务区站', type: 'highway', address: '山东省济南市G2京沪高速济南服务区', operator: '特来电', pileCount: 32, dcCount: 24, acCount: 8, occupancyRate: 68.8, status: 'online', monthlyRevenue: 342800, monthlyEnergy: 52840.2, createTime: '2024-02-20 14:30:00', lng: 117.0, lat: 36.67, contactPhone: '0531-8765432' },
  { id: '3', name: 'G4京港澳-武汉站', type: 'highway', address: '湖北省武汉市G4京港澳高速武汉服务区', operator: '星星充电', pileCount: 36, dcCount: 28, acCount: 8, occupancyRate: 78.5, status: 'online', monthlyRevenue: 386200, monthlyEnergy: 59680.8, createTime: '2024-03-10 09:00:00', lng: 114.3, lat: 30.6, contactPhone: '027-8765432' },
  { id: '4', name: 'G15沈海-青岛站', type: 'highway', address: '山东省青岛市G15沈海高速青岛服务区', operator: '小桔充电', pileCount: 20, dcCount: 14, acCount: 6, occupancyRate: 55.3, status: 'maintenance', monthlyRevenue: 256800, monthlyEnergy: 39520.6, createTime: '2024-04-05 16:00:00', lng: 120.38, lat: 36.07, contactPhone: '0532-8765432' },
  { id: '5', name: 'G4京港澳-郑州站', type: 'highway', address: '河南省郑州市G4京港澳高速郑州服务区', operator: '云快充', pileCount: 28, dcCount: 20, acCount: 8, occupancyRate: 62.5, status: 'online', monthlyRevenue: 234600, monthlyEnergy: 36120.3, createTime: '2024-05-12 11:00:00', lng: 113.65, lat: 34.76, contactPhone: '0371-8765432' },
  { id: '6', name: 'G2京沪-泰安站', type: 'highway', address: '山东省泰安市G2京沪高速泰安服务区', operator: '国网', pileCount: 20, dcCount: 14, acCount: 6, occupancyRate: 58.3, status: 'online', monthlyRevenue: 198500, monthlyEnergy: 30560.5, createTime: '2024-01-20 08:00:00', lng: 117.13, lat: 36.2, contactPhone: '0538-8765432' },
  { id: '7', name: '浦东陆家嘴充电站', type: 'city', address: '上海市浦东新区陆家嘴环路1000号', operator: '特来电', pileCount: 30, dcCount: 20, acCount: 10, occupancyRate: 82.3, status: 'online', monthlyRevenue: 186500, monthlyEnergy: 28640.2, createTime: '2024-02-15 10:00:00', lng: 121.5, lat: 31.24, contactPhone: '021-58765432' },
  { id: '8', name: '虹桥天地充电站', type: 'city', address: '上海市闵行区虹桥路200号', operator: '星星充电', pileCount: 25, dcCount: 16, acCount: 9, occupancyRate: 75.6, status: 'online', monthlyRevenue: 168200, monthlyEnergy: 25860.5, createTime: '2024-03-05 14:00:00', lng: 121.32, lat: 31.19, contactPhone: '021-34765432' },
  { id: '9', name: '徐汇万科充电站', type: 'city', address: '上海市徐汇区漕溪北路300号', operator: '国网', pileCount: 15, dcCount: 10, acCount: 5, occupancyRate: 45.2, status: 'offline', monthlyRevenue: 89500, monthlyEnergy: 13820.3, createTime: '2024-04-10 09:00:00', lng: 121.43, lat: 31.18, contactPhone: '021-54765432' },
  { id: '10', name: '静安寺充电站', type: 'city', address: '上海市静安区南京西路400号', operator: '小桔充电', pileCount: 18, dcCount: 12, acCount: 6, occupancyRate: 88.5, status: 'online', monthlyRevenue: 152600, monthlyEnergy: 23480.6, createTime: '2024-05-08 11:00:00', lng: 121.44, lat: 31.22, contactPhone: '021-62765432' },
  { id: '11', name: 'G5京昆-西安站', type: 'highway', address: '陕西省西安市G5京昆高速西安服务区', operator: '特来电', pileCount: 18, dcCount: 12, acCount: 6, occupancyRate: 52.1, status: 'online', monthlyRevenue: 156300, monthlyEnergy: 24050.8, createTime: '2024-02-28 15:00:00', lng: 108.95, lat: 34.27, contactPhone: '029-8765432' },
  { id: '12', name: 'G6京藏-张家口站', type: 'highway', address: '河北省张家口市G6京藏高速张家口服务区', operator: '云快充', pileCount: 12, dcCount: 8, acCount: 4, occupancyRate: 48.5, status: 'online', monthlyRevenue: 125800, monthlyEnergy: 19360.5, createTime: '2024-03-15 10:00:00', lng: 114.88, lat: 40.82, contactPhone: '0313-8765432' },
  { id: '13', name: '杨浦五角场充电站', type: 'city', address: '上海市杨浦区五角场500号', operator: '星星充电', pileCount: 22, dcCount: 16, acCount: 6, occupancyRate: 71.2, status: 'online', monthlyRevenue: 142300, monthlyEnergy: 21860.3, createTime: '2024-06-01 08:00:00', lng: 121.51, lat: 31.3, contactPhone: '021-65765432' },
  { id: '14', name: 'G15沈海-福州站', type: 'highway', address: '福建省福州市G15沈海高速福州服务区', operator: '国网', pileCount: 24, dcCount: 16, acCount: 8, occupancyRate: 65.8, status: 'online', monthlyRevenue: 178200, monthlyEnergy: 27420.5, createTime: '2024-04-20 13:00:00', lng: 119.3, lat: 26.08, contactPhone: '0591-8765432' }
]

const generatePiles = (station: StationItem): PileInfo[] => {
  const piles: PileInfo[] = []
  const code = station.name.substring(0, 6).toUpperCase()
  for (let i = 0; i < station.pileCount; i++) {
    const isDc = i < station.dcCount
    const statuses: PileInfo['status'][] = ['idle', 'charging', 'offline', 'fault']
    const sIdx = i % 4 === 3 && station.status === 'maintenance' ? 3 : i % 4
    piles.push({
      id: `${station.id}-p${i + 1}`,
      code: `${code}-${isDc ? 'DC' : 'AC'}${String(i + 1).padStart(3, '0')}`,
      type: isDc ? 'dc' : 'ac',
      power: isDc ? (i % 3 === 0 ? 120 : i % 3 === 1 ? 60 : 180) : 7,
      status: statuses[sIdx],
      protocol: protocolList[i % protocolList.length]
    })
  }
  return piles
}

const inspectionData: Record<string, InspectionRecord[]> = {
  '1': [
    { id: '1', inspector: '巡检员甲', type: '定期巡检', result: '正常', issues: '', time: '2024-06-15 09:00:00' },
    { id: '2', inspector: '巡检员乙', type: '故障排查', result: '异常', issues: 'DC003通信模块故障，已更换', time: '2024-06-10 14:30:00' },
    { id: '3', inspector: '巡检员甲', type: '定期巡检', result: '正常', issues: '', time: '2024-06-01 10:00:00' }
  ],
  '3': [
    { id: '4', inspector: '巡检员丙', type: '定期巡检', result: '正常', issues: '', time: '2024-06-16 08:30:00' },
    { id: '5', inspector: '巡检员丁', type: '设备升级', result: '正常', issues: 'OCPP协议升级至2.0版本', time: '2024-06-08 16:00:00' }
  ]
}

function Station() {
  const [data, setData] = useState<StationItem[]>(mockData)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<StationItem | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentStation, setCurrentStation] = useState<StationItem | null>(null)
  const [form] = Form.useForm()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [operatorFilter, setOperatorFilter] = useState<string | undefined>()
  const [activeTab, setActiveTab] = useState('highway')
  const [importModalVisible, setImportModalVisible] = useState(false)

  const filteredData = data.filter(item => {
    if (activeTab !== 'all' && item.type !== activeTab) return false
    if (keyword && !item.name.includes(keyword) && !item.address.includes(keyword)) return false
    if (statusFilter && item.status !== statusFilter) return false
    if (operatorFilter && item.operator !== operatorFilter) return false
    return true
  })

  const columns: ColumnsType<StationItem> = [
    { title: '站点名称', dataIndex: 'name', key: 'name', width: 200, ellipsis: true },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 110,
      render: (type: string) => { const info = typeMap[type]; return <Tag color={info.color}>{info.text}</Tag> }
    },
    { title: '运营商', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '桩数', dataIndex: 'pileCount', key: 'pileCount', width: 70 },
    {
      title: '占用率', dataIndex: 'occupancyRate', key: 'occupancyRate', width: 100,
      render: (rate: number) => <span style={{ color: rate >= 75 ? '#f5222d' : rate >= 50 ? '#fa8c16' : '#52c41a' }}>{rate}%</span>
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status: string) => { const info = statusMap[status]; return <Tag color={info.color}>{info.text}</Tag> }
    },
    { title: '月营收', dataIndex: 'monthlyRevenue', key: 'monthlyRevenue', width: 110, render: (v) => formatMoney(v) },
    { title: '月充电量', dataIndex: 'monthlyEnergy', key: 'monthlyEnergy', width: 110, render: (v) => formatEnergy(v) },
    {
      title: '操作', key: 'action', width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleView(record)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      )
    }
  ]

  const pileColumns: ColumnsType<PileInfo> = [
    { title: '桩编号', dataIndex: 'code', key: 'code', width: 150 },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 80,
      render: (type: string) => <Tag color={type === 'dc' ? 'blue' : 'green'}>{type === 'dc' ? '直流' : '交流'}</Tag>
    },
    { title: '功率(kW)', dataIndex: 'power', key: 'power', width: 100 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status: string) => { const info = pileStatusMap[status]; return <Tag color={info.color}>{info.text}</Tag> }
    },
    { title: '协议', dataIndex: 'protocol', key: 'protocol', width: 120 }
  ]

  const inspectionColumns: ColumnsType<InspectionRecord> = [
    { title: '巡检人', dataIndex: 'inspector', key: 'inspector', width: 100 },
    { title: '巡检类型', dataIndex: 'type', key: 'type', width: 100 },
    {
      title: '结果', dataIndex: 'result', key: 'result', width: 80,
      render: (r: string) => <Tag color={r === '正常' ? 'green' : 'orange'}>{r}</Tag>
    },
    { title: '问题描述', dataIndex: 'issues', key: 'issues', ellipsis: true, render: (v) => v || '-' },
    { title: '时间', dataIndex: 'time', key: 'time', width: 160, render: (t) => formatDateTime(t) }
  ]

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false) }, 300)
  }

  const handleView = (record: StationItem) => {
    setCurrentStation(record)
    setDetailVisible(true)
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: StationItem) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = (record: StationItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除充电站"${record.name}"吗？`,
      onOk: () => {
        setData(data.filter(item => item.id !== record.id))
        message.success('删除成功')
      }
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        setData(data.map(item => item.id === editingRecord.id ? { ...item, ...values } : item))
        message.success('更新成功')
      } else {
        const newItem: StationItem = {
          ...values,
          id: String(Date.now()),
          dcCount: values.dcCount || 0,
          acCount: values.acCount || 0,
          occupancyRate: 0,
          monthlyRevenue: 0,
          monthlyEnergy: 0,
          createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          lng: 116.4,
          lat: 39.9,
          contactPhone: values.contactPhone || ''
        }
        setData([newItem, ...data])
        message.success('创建成功')
      }
      setModalVisible(false)
    } catch {}
  }

  const handleImport = () => {
    message.success('场站数据导入成功')
    setImportModalVisible(false)
  }

  const highwayCount = data.filter(s => s.type === 'highway').length
  const cityCount = data.filter(s => s.type === 'city').length
  const onlineCount = data.filter(s => s.status === 'online').length
  const totalPiles = data.reduce((s, i) => s + i.pileCount, 0)

  const tabItems = [
    { key: 'all', label: '全部场站' },
    { key: 'highway', label: <span><EnvironmentOutlined /> 高速网络</span> },
    { key: 'city', label: <span><ThunderboltOutlined /> 城市公共桩</span> }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="场站总数" value={data.length} prefix={<EnvironmentOutlined />} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="高速网络" value={highwayCount} prefix={<EnvironmentOutlined />} valueStyle={{ color: '#722ed1' }} suffix={<span style={{ fontSize: 14, color: '#999' }}>/ 城市公共 {cityCount}</span>} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="运营中" value={onlineCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} suffix={<span style={{ fontSize: 14, color: '#999' }}>/ 总 {data.length}</span>} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="充电桩总数" value={totalPiles} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        <Space style={{ marginBottom: 16 }} wrap>
          <Input placeholder="搜索站点名称/地址" prefix={<SearchOutlined />} style={{ width: 240 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} />
          <Select placeholder="状态" style={{ width: 120 }} allowClear value={statusFilter} onChange={setStatusFilter} options={[{ value: 'online', label: '运营中' }, { value: 'offline', label: '停运' }, { value: 'maintenance', label: '维护中' }]} />
          <Select placeholder="运营商" style={{ width: 120 }} allowClear value={operatorFilter} onChange={setOperatorFilter} options={operatorList.map(o => ({ value: o, label: o }))} />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增场站</Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>批量导入</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{ total: filteredData.length, pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Drawer
        title={currentStation?.name}
        width={780}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentStation && (
          <>
            <Descriptions column={2} bordered style={{ marginBottom: 24 }} size="small">
              <Descriptions.Item label="站点名称">{currentStation.name}</Descriptions.Item>
              <Descriptions.Item label="类型"><Tag color={typeMap[currentStation.type].color}>{typeMap[currentStation.type].text}</Tag></Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{currentStation.address}</Descriptions.Item>
              <Descriptions.Item label="运营商">{currentStation.operator}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusMap[currentStation.status].color}>{statusMap[currentStation.status].text}</Tag></Descriptions.Item>
              <Descriptions.Item label="充电桩数">{currentStation.pileCount} (直流{currentStation.dcCount} / 交流{currentStation.acCount})</Descriptions.Item>
              <Descriptions.Item label="占用率">
                <span style={{ color: currentStation.occupancyRate >= 75 ? '#f5222d' : currentStation.occupancyRate >= 50 ? '#fa8c16' : '#52c41a' }}>
                  {currentStation.occupancyRate}%
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="月营收">{formatMoney(currentStation.monthlyRevenue)}</Descriptions.Item>
              <Descriptions.Item label="月充电量">{formatEnergy(currentStation.monthlyEnergy)}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentStation.contactPhone}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(currentStation.createTime)}</Descriptions.Item>
            </Descriptions>

            <Card title="充电桩列表" size="small" style={{ marginBottom: 16 }}>
              <Table
                columns={pileColumns}
                dataSource={generatePiles(currentStation)}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 6, showTotal: (t) => `共 ${t} 台` }}
              />
            </Card>

            <Card title="巡检记录" size="small">
              <Table
                columns={inspectionColumns}
                dataSource={inspectionData[currentStation.id] || inspectionData['1']}
                rowKey="id"
                size="small"
                pagination={false}
              />
            </Card>
          </>
        )}
      </Drawer>

      <Modal
        title={editingRecord ? '编辑场站' : '新增场站'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="站点名称" rules={[{ required: true, message: '请输入站点名称' }]}>
            <Input placeholder="请输入站点名称" />
          </Form.Item>
          <Form.Item name="type" label="场站类型" rules={[{ required: true, message: '请选择场站类型' }]}>
            <Select placeholder="请选择场站类型" options={[{ value: 'highway', label: '高速网络' }, { value: 'city', label: '城市公共桩' }]} />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true, message: '请输入地址' }]}>
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="pileCount" label="充电桩总数" rules={[{ required: true, message: '请输入充电桩数量' }]}>
                <Input type="number" placeholder="总数" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dcCount" label="直流桩数">
                <Input type="number" placeholder="直流" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="acCount" label="交流桩数">
                <Input type="number" placeholder="交流" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="operator" label="运营商" rules={[{ required: true, message: '请选择运营商' }]}>
            <Select placeholder="请选择运营商" options={operatorList.map(o => ({ value: o, label: o }))} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态" options={[{ value: 'online', label: '运营中' }, { value: 'offline', label: '停运' }, { value: 'maintenance', label: '维护中' }]} />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入场站"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => setImportModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="上传文件">
            <Upload.Dragger beforeUpload={() => false} maxCount={1} accept=".xlsx,.xls,.csv">
              <p className="ant-upload-drag-icon"><UploadOutlined style={{ fontSize: 32, color: '#1890ff' }} /></p>
              <p>点击或拖拽文件到此区域上传</p>
              <p style={{ color: '#999', fontSize: 12 }}>支持 .xlsx / .xls / .csv 格式</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Station
