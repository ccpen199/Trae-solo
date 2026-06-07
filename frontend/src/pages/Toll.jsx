import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table, Button, Modal, Form, Input, InputNumber, DatePicker,
  Space, Tag, Card, Timeline, Descriptions, message, Alert,
  Popconfirm, Drawer, List, Upload, Row, Col, Statistic
} from 'antd'
import {
  PlusOutlined, ExclamationCircleOutlined, FileTextOutlined,
  RiseOutlined, AlertOutlined, AuditOutlined, PictureOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import request from '../utils/request'

const { RangePicker } = DatePicker

const exceptionTypeLabels = {
  deduction_failed: { text: '扣费失败', color: 'red' },
  path_missing: { text: '路径缺失', color: 'orange' },
  duplicate_billing: { text: '重复计费', color: 'volcano' },
  abnormal_deduction: { text: '异常扣费', color: 'magenta' },
  missing_exit: { text: '缺失出口', color: 'cyan' },
}

const settlementStatusLabels = {
  pending: { text: '待对账', color: 'orange' },
  matched: { text: '已对账', color: 'green' },
  settled: { text: '已结算', color: 'blue' },
  disputed: { text: '有争议', color: 'red' },
}

export default function Toll() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dateRange, setDateRange] = useState(null)
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [gantryId, setGantryId] = useState('')
  const [stationId, setStationId] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addForm] = Form.useForm()
  const [addWarnings, setAddWarnings] = useState([])

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeRecord, setDisputeRecord] = useState(null)
  const [disputeLoading, setDisputeLoading] = useState(false)
  const [disputeForm] = Form.useForm()

  const [trajectoryPlate, setTrajectoryPlate] = useState('')
  const [trajectoryRange, setTrajectoryRange] = useState(null)
  const [trajectoryData, setTrajectoryData] = useState([])
  const [trajectoryLoading, setTrajectoryLoading] = useState(false)

  const [statementDrawer, setStatementDrawer] = useState(false)
  const [statementData, setStatementData] = useState(null)
  const [statementLoading, setStatementLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (dateRange && dateRange[0]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      if (vehiclePlate) params.vehiclePlate = vehiclePlate
      if (gantryId) params.gantryId = gantryId
      if (stationId) params.stationId = stationId
      const res = await request.get('/toll', { params })
      setData(res.data.list)
      setTotal(res.data.total)
    } catch {
      message.error('获取收费记录失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, dateRange, vehiclePlate, gantryId, stationId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTableChange = (pagination) => {
    setPage(pagination.current)
    setPageSize(pagination.pageSize)
  }

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleReset = () => {
    setDateRange(null)
    setVehiclePlate('')
    setGantryId('')
    setStationId('')
    setPage(1)
  }

  const handleAddOpen = () => {
    addForm.resetFields()
    setAddWarnings([])
    setAddOpen(true)
  }

  const handleAddOk = async () => {
    try {
      const values = await addForm.validateFields()
      setAddLoading(true)
      const res = await request.post('/toll', {
        ...values,
        entry_time: values.entry_time?.format?.('YYYY-MM-DD HH:mm:ss') || values.entry_time,
        exit_time: values.exit_time?.format?.('YYYY-MM-DD HH:mm:ss') || values.exit_time,
      })
      if (res.data.warnings && res.data.warnings.length > 0) {
        setAddWarnings(res.data.warnings)
      }
      message.success(res.data.message)
      if (!res.data.auto_exception) {
        setAddOpen(false)
        addForm.resetFields()
      }
      fetchData()
    } catch (err) {
      if (err.response?.data?.errors) {
        message.error(`校验失败：${err.response.data.errors.join('；')}`)
      } else if (err.response?.data?.error) {
        message.error(err.response.data.error)
      }
    } finally {
      setAddLoading(false)
    }
  }

  const handleDetail = async (record) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailRecord(null)
    try {
      const res = await request.get(`/toll/${record.id}`)
      setDetailRecord(res.data)
    } catch {
      message.error('获取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDisputeOpen = (record) => {
    setDisputeRecord(record)
    disputeForm.resetFields()
    setDisputeOpen(true)
  }

  const handleDisputeOk = async () => {
    try {
      const values = await disputeForm.validateFields()
      setDisputeLoading(true)
      await request.post('/disputes', {
        exception_event_id: disputeRecord.exception_id,
        description: values.description,
        evidence_urls: values.evidence_urls || [],
      })
      message.success('争议申诉已提交，运营人员会尽快处理')
      setDisputeOpen(false)
      fetchData()
    } catch (err) {
      message.error(err.response?.data?.error || '提交失败')
    } finally {
      setDisputeLoading(false)
    }
  }

  const handleStatement = async (record) => {
    setStatementDrawer(true)
    setStatementLoading(true)
    try {
      if (record.account_id) {
        const res = await request.get(`/accounts/${record.account_id}/statement`, {
          params: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
        })
        setStatementData(res.data)
      }
    } catch {
      message.error('获取月结单失败')
    } finally {
      setStatementLoading(false)
    }
  }

  const handleTrajectorySearch = async () => {
    if (!trajectoryPlate) {
      message.warning('请输入车牌号')
      return
    }
    setTrajectoryLoading(true)
    try {
      const params = { vehicle_plate: trajectoryPlate }
      if (trajectoryRange && trajectoryRange[0]) {
        params.startDate = trajectoryRange[0].format('YYYY-MM-DD')
        params.endDate = trajectoryRange[1].format('YYYY-MM-DD')
      }
      const res = await request.get('/toll/trajectory', { params })
      const list = (res.data.trajectory || res.data.list || []).sort(
        (a, b) => new Date(a.exit_time) - new Date(b.exit_time)
      )
      setTrajectoryData(list.map((item, index) => ({ id: `${item.gantry_id || item.toll_station_id || 'point'}-${index}`, ...item })))
    } catch {
      message.error('获取轨迹失败')
    } finally {
      setTrajectoryLoading(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '车牌号', dataIndex: 'vehicle_plate', key: 'vehicle_plate', width: 100,
      render: (val) => val && <Tag color="blue">{val}</Tag>,
    },
    { title: '用户', dataIndex: 'user_name', key: 'user_name', width: 100 },
    { title: '门架', dataIndex: 'gantry_name', key: 'gantry_name', width: 120 },
    { title: '收费站', dataIndex: 'toll_station_name', key: 'toll_station_name', width: 120 },
    { title: '入口时间', dataIndex: 'entry_time', key: 'entry_time', width: 140 },
    { title: '出口时间', dataIndex: 'exit_time', key: 'exit_time', width: 140 },
    {
      title: '费用', dataIndex: 'fee', key: 'fee', width: 90,
      render: (val) => (val != null ? `¥${Number(val).toFixed(2)}` : '-'),
    },
    {
      title: '结算状态', dataIndex: 'settlement_status', key: 'settlement_status', width: 100,
      render: (val) => val ? (
        <Tag color={settlementStatusLabels[val]?.color || 'default'}>
          {settlementStatusLabels[val]?.text || val}
        </Tag>
      ) : <Tag color="default">未结算</Tag>,
    },
    {
      title: '异常关联', key: 'exception', width: 120,
      render: (_, record) => record.has_exception ? (
        <Space>
          <Tag color={exceptionTypeLabels[record.exception_type]?.color || 'red'}>
            <AlertOutlined /> {exceptionTypeLabels[record.exception_type]?.text || record.exception_type}
          </Tag>
        </Space>
      ) : <span style={{ color: '#999' }}>无</span>,
    },
    {
      title: '争议状态', key: 'dispute', width: 100,
      render: (_, record) => record.has_dispute ? (
        <Tag color="purple">
          <AuditOutlined /> {record.dispute_status}
        </Tag>
      ) : <span style={{ color: '#999' }}>无</span>,
    },
    {
      title: '操作', key: 'action', width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleDetail(record)}>详情</Button>
          <Button type="link" size="small" onClick={() => handleStatement(record)}>
            <FileTextOutlined /> 月结单
          </Button>
          {record.has_exception && !record.has_dispute && (
            <Button type="link" size="small" danger onClick={() => handleDisputeOpen(record)}>
              <RiseOutlined /> 申诉
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const trajectoryColumns = [
    { title: '门架名称', dataIndex: 'gantry_name', key: 'gantry_name' },
    { title: '收费站名称', dataIndex: 'toll_station_name', key: 'toll_station_name' },
    { title: '入口时间', dataIndex: 'entry_time', key: 'entry_time' },
    { title: '出口时间', dataIndex: 'exit_time', key: 'exit_time' },
    {
      title: '费用', dataIndex: 'fee', key: 'fee',
      render: (val) => (val != null ? `¥${Number(val).toFixed(2)}` : '-'),
    },
    { title: '路段', dataIndex: 'road_segment', key: 'road_segment' },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontWeight: 600 }}>通行记录查询结果</h2>

      <Space style={{ marginBottom: 16 }} wrap>
        <RangePicker
          value={dateRange}
          onChange={(dates) => { setDateRange(dates); setPage(1) }}
          placeholder={['开始日期', '结束日期']}
        />
        <Input.Search
          placeholder="车牌号"
          allowClear value={vehiclePlate}
          onChange={(e) => setVehiclePlate(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 160 }}
        />
        <Input placeholder="门架ID" allowClear value={gantryId} onChange={(e) => setGantryId(e.target.value)} style={{ width: 140 }} />
        <Input placeholder="收费站ID" allowClear value={stationId} onChange={(e) => setStationId(e.target.value)} style={{ width: 140 }} />
        <Button type="primary" onClick={handleSearch}>查询</Button>
        <Button onClick={handleReset}>重置</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddOpen}>添加记录</Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `共 ${t} 条`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={
          <Space>
            <span>添加收费记录</span>
            {addWarnings.length > 0 && <Tag color="orange">含业务校验</Tag>}
          </Space>
        }
        open={addOpen}
        onOk={handleAddOk}
        onCancel={() => { setAddOpen(false); addForm.resetFields(); setAddWarnings([]) }}
        confirmLoading={addLoading}
        width={720}
        okText={addWarnings.length > 0 ? '确认提交' : '提交'}
      >
        {addWarnings.length > 0 && (
          <Alert
            message="业务校验警告"
            description={
              <div>
                {addWarnings.map((w, i) => <div key={i}>• {w}</div>)}
                <div style={{ marginTop: 8, color: '#fa541c' }}>
                  ⚠️ 系统将自动生成异常事件记录，请确认数据无误后提交
                </div>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={addForm} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="account_id" label="账户ID" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vehicle_plate" label="车牌号" rules={[{ required: true }]}>
                <Input placeholder="如：京A12345" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gantry_id" label="门架ID">
                <Input placeholder="门架编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gantry_name" label="门架名称">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="toll_station_id" label="收费站ID">
                <Input placeholder="收费站编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="toll_station_name" label="收费站名称">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="entry_time" label="入口时间" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="exit_time" label="出口时间" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fee" label="费用(元)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="road_segment" label="路段">
                <Input placeholder="如：G6京藏高速" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="evidence_urls" label="轨迹证据链接(可选)">
            <Input.TextArea rows={2} placeholder="多个链接用逗号分隔，如：https://img1.com,https://img2.com" />
          </Form.Item>
          <Alert
            description="校验规则：门架/收费站至少填一个；出口时间必须晚于入口；费用≥0；通行时间<1分钟或>8小时将触发异常检测；费用>500元标记复核。"
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        </Form>
      </Modal>

      <Modal
        title="收费记录详情"
        open={detailOpen}
        onCancel={() => { setDetailOpen(false); setDetailRecord(null) }}
        footer={null}
        width={720}
        loading={detailLoading}
      >
        {detailRecord && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="ID">{detailRecord.id}</Descriptions.Item>
            <Descriptions.Item label="账户">{detailRecord.account_no}</Descriptions.Item>
            <Descriptions.Item label="车牌号">{detailRecord.vehicle_plate}</Descriptions.Item>
            <Descriptions.Item label="费用">{detailRecord.fee != null ? `¥${Number(detailRecord.fee).toFixed(2)}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="门架" span={2}>{detailRecord.gantry_name} ({detailRecord.gantry_id || '-'})</Descriptions.Item>
            <Descriptions.Item label="收费站" span={2}>{detailRecord.toll_station_name} ({detailRecord.toll_station_id || '-'})</Descriptions.Item>
            <Descriptions.Item label="入口时间">{detailRecord.entry_time}</Descriptions.Item>
            <Descriptions.Item label="出口时间">{detailRecord.exit_time}</Descriptions.Item>
            <Descriptions.Item label="路段" span={2}>{detailRecord.road_segment}</Descriptions.Item>
            {detailRecord.evidence_urls && (
              <Descriptions.Item label="证据" span={2}>
                {detailRecord.evidence_urls.split(',').map((url, i) => (
                  <div key={i}><a href={url} target="_blank" rel="noreferrer"><PictureOutlined /> 证据{i + 1}</a></div>
                ))}
              </Descriptions.Item>
            )}
            {detailRecord.has_exception && (
              <Descriptions.Item label="关联异常" span={2}>
                <Tag color="red">{detailRecord.exception_type}</Tag>
                <span style={{ marginLeft: 8 }}>状态：{detailRecord.exception_status}</span>
              </Descriptions.Item>
            )}
            {detailRecord.has_dispute && (
              <Descriptions.Item label="争议申诉" span={2}>
                <Tag color="purple">已申诉</Tag>
                <span style={{ marginLeft: 8 }}>状态：{detailRecord.dispute_status}</span>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="发起争议申诉"
        open={disputeOpen}
        onOk={handleDisputeOk}
        onCancel={() => setDisputeOpen(false)}
        confirmLoading={disputeLoading}
        width={560}
      >
        {disputeRecord && (
          <div style={{ marginBottom: 16 }}>
            <Alert
              message={`异常类型：${disputeRecord.exception_type} · 通行记录ID：${disputeRecord.id}`}
              description={`车牌号：${disputeRecord.vehicle_plate}，费用：¥${Number(disputeRecord.fee).toFixed(2)}`}
              type="warning"
              showIcon
            />
          </div>
        )}
        <Form form={disputeForm} layout="vertical">
          <Form.Item name="description" label="申诉说明" rules={[{ required: true, message: '请填写申诉说明' }]}>
            <Input.TextArea rows={4} placeholder="请详细说明争议原因..." />
          </Form.Item>
          <Form.Item name="evidence_urls" label="证据链接(可选)">
            <Input.TextArea rows={2} placeholder="多个证据链接用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="ETC月结单"
        placement="right"
        width={640}
        open={statementDrawer}
        onClose={() => setStatementDrawer(false)}
        loading={statementLoading}
      >
        {statementData && (
          <div>
            <Card title="本月汇总" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="通行次数" value={statementData.summary?.total_count || 0} />
                </Col>
                <Col span={8}>
                  <Statistic title="总金额" value={statementData.summary?.total_amount || 0} precision={2} prefix="¥" />
                </Col>
                <Col span={8}>
                  <Statistic title="异常笔数" value={statementData.summary?.exception_count || 0} valueStyle={{ color: '#fa541c' }} />
                </Col>
              </Row>
            </Card>
            <Card title="明细记录">
              <List
                dataSource={statementData.details || []}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color="blue">{item.vehicle_plate}</Tag>
                          <span>{item.exit_time}</span>
                        </Space>
                      }
                      description={`${item.gantry_name || item.toll_station_name || '-'} · ${item.road_segment || '-'}`}
                    />
                    <div style={{ fontWeight: 600, color: '#fa541c' }}>¥{Number(item.fee).toFixed(2)}</div>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Drawer>

      <Card title="轨迹查询" style={{ marginTop: 24 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input placeholder="车牌号" value={trajectoryPlate} onChange={(e) => setTrajectoryPlate(e.target.value)} style={{ width: 180 }} />
          <RangePicker value={trajectoryRange} onChange={setTrajectoryRange} placeholder={['开始日期', '结束日期']} />
          <Button type="primary" onClick={handleTrajectorySearch} loading={trajectoryLoading}>查询轨迹</Button>
        </Space>

        {trajectoryData.length > 0 && (
          <>
            <Timeline
              style={{ marginTop: 16, marginBottom: 24 }}
              items={trajectoryData.map((item) => ({
                children: (
                  <div>
                    <div>
                      <Tag color="blue">{item.gantry_name || item.toll_station_name || '-'}</Tag>
                      {item.road_segment && <span>{item.road_segment}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {item.entry_time && <span>入: {item.entry_time}</span>}
                      {item.exit_time && <span style={{ marginLeft: 8 }}>出: {item.exit_time}</span>}
                      {item.fee != null && <span style={{ marginLeft: 8, color: '#f50' }}>¥{Number(item.fee).toFixed(2)}</span>}
                    </div>
                  </div>
                ),
              }))}
            />
            <Table rowKey="id" columns={trajectoryColumns} dataSource={trajectoryData} pagination={false} size="small" />
          </>
        )}
      </Card>
    </div>
  )
}
