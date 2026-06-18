import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { NavBar, Card, Tag, Button, List, Dialog, Toast, Input, TextArea, Space } from 'antd-mobile'
import {
  LocationOutline,
  ClockCircleOutline,
  CheckCircleOutline,
  CloseCircleOutline,
  SendOutline,
  CollectMoneyOutline,
  SetOutline,
  RightOutline,
  MessageOutline,
} from 'antd-mobile-icons'
import { stations, operatorColors, protocolColors } from '../../mock/stations'
import './index.css'

interface Charger {
  id: string
  type: string
  power: number
  status: string
  soc: number | null
  estimatedTime: string | null
}

interface AlertItem {
  time: string
  type: string
  content: string
  status: string
}

interface WorkOrder {
  id: string
  problemType: string
  description: string
  responsible: string
  currentStep: number
  handler: string
  handlerPhone: string
  createTime: string
  estimateTime: string
  status: string
}

interface ReviewRecord {
  id: string
  workOrderId: string
  summary: string
  handler: string
  finishTime: string
  result: string
  reviewer: string
  reviewTime: string
}

const faultTypes = ['桩体故障', '通信异常', '充电中断', '支付失败', '枪头损坏']

const RESPONSIBLE_OPTIONS = ['运营商运维', '场站驻场', '第三方维修', '平台技术']

const STEPS = ['待派单', '已派单', '处理中', '待复查', '已完成']

function generateChargers(station: typeof stations[0]): Charger[] {
  const chargers: Charger[] = []
  let index = 1
  for (let i = 0; i < station.guns.charging; i++) {
    const soc = 20 + Math.floor(Math.random() * 60)
    chargers.push({
      id: `P${String(index).padStart(3, '0')}`,
      type: i % 3 === 0 ? '交流' : '直流',
      power: i % 3 === 0 ? 7 : 120,
      status: '充电中',
      soc,
      estimatedTime: `约${Math.max(5, 60 - Math.floor(soc * 0.6))}分钟`,
    })
    index++
  }
  for (let i = 0; i < station.guns.idle; i++) {
    chargers.push({
      id: `P${String(index).padStart(3, '0')}`,
      type: i % 2 === 0 ? '直流' : '交流',
      power: i % 2 === 0 ? 120 : 7,
      status: '空闲',
      soc: null,
      estimatedTime: null,
    })
    index++
  }
  for (let i = 0; i < station.guns.fault; i++) {
    chargers.push({
      id: `P${String(index).padStart(3, '0')}`,
      type: '直流',
      power: 120,
      status: '故障',
      soc: null,
      estimatedTime: null,
    })
    index++
  }
  for (let i = 0; i < station.guns.offline; i++) {
    chargers.push({
      id: `P${String(index).padStart(3, '0')}`,
      type: '直流',
      power: 120,
      status: '离线',
      soc: null,
      estimatedTime: null,
    })
    index++
  }
  return chargers
}

function generateAlerts(station: typeof stations[0]): AlertItem[] {
  const alerts: AlertItem[] = []
  const now = new Date()
  const fmt = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  if (station.guns.fault > 0) {
    alerts.push({
      time: fmt(now.getHours(), Math.max(0, now.getMinutes() - 12)),
      type: '故障告警',
      content: `P003直流桩过温保护，已自动停机`,
      status: '待处理',
    })
  }
  if (station.guns.offline > 0) {
    alerts.push({
      time: fmt(now.getHours(), Math.max(0, now.getMinutes() - 35)),
      type: '离线告警',
      content: `P005通信中断超过30分钟`,
      status: '处理中',
    })
  }
  if (station.inspectionStatus !== '正常') {
    alerts.push({
      time: fmt(Math.max(0, now.getHours() - 2), 15),
      type: '巡检异常',
      content: `巡检发现02号枪头磨损严重`,
      status: '待派单',
    })
  }
  alerts.push({
    time: fmt(Math.max(0, now.getHours() - 4), 8),
    type: '故障告警',
    content: `P001充电异常中断，订单结算失败`,
    status: '已完成',
  })
  alerts.push({
    time: fmt(Math.max(0, now.getHours() - 6), 42),
    type: '离线告警',
    content: `P004心跳丢失超过15分钟`,
    status: '已完成',
  })
  return alerts
}

function generateWorkOrders(station: typeof stations[0]): WorkOrder[] {
  const today = '20260618'
  const orders: WorkOrder[] = []
  let seq = 1
  if (station.guns.fault > 0) {
    orders.push({
      id: `WO${today}${String(seq).padStart(4, '0')}`,
      problemType: '桩体故障',
      description: '03号直流桩过温保护触发，疑似散热风扇故障',
      responsible: '运营商运维',
      currentStep: 2,
      handler: '王工',
      handlerPhone: '138****1234',
      createTime: '2026-06-18 14:20',
      estimateTime: '2026-06-18 18:00',
      status: '处理中',
    })
    seq++
  }
  if (station.inspectionStatus !== '正常') {
    orders.push({
      id: `WO${today}${String(seq).padStart(4, '0')}`,
      problemType: '巡检异常',
      description: '巡检发现02号充电枪头磨损，影响充电接触',
      responsible: '场站驻场',
      currentStep: 1,
      handler: '李师傅',
      handlerPhone: '139****5678',
      createTime: '2026-06-18 10:15',
      estimateTime: '2026-06-18 16:30',
      status: '已派单',
    })
    seq++
  }
  if (station.guns.offline > 0) {
    orders.push({
      id: `WO${today}${String(seq).padStart(4, '0')}`,
      problemType: '通信异常',
      description: '05号桩通信模组异常，TCP连接无法建立',
      responsible: '第三方维修',
      currentStep: 3,
      handler: '赵工程师',
      handlerPhone: '137****9012',
      createTime: '2026-06-18 13:58',
      estimateTime: '2026-06-18 17:30',
      status: '待复查',
    })
    seq++
  }
  orders.push({
    id: `WO202606170008`,
    problemType: '支付异常',
    description: '01号桩订单结算失败，用户反馈无法完成支付',
    responsible: '平台技术',
    currentStep: 4,
    handler: '孙工',
    handlerPhone: '136****3456',
    createTime: '2026-06-17 19:22',
    estimateTime: '2026-06-17 21:00',
    status: '已完成',
  })
  return orders
}

function generateReviews(): ReviewRecord[] {
  return [
    {
      id: 'RV20260617001',
      workOrderId: 'WO202606170008',
      summary: '01号桩订单结算模块热修复',
      handler: '孙工',
      finishTime: '2026-06-17 20:45',
      result: '通过',
      reviewer: '运营-张主管',
      reviewTime: '2026-06-17 21:10',
    },
    {
      id: 'RV20260616003',
      workOrderId: 'WO202606160015',
      summary: '04号桩显示屏更换',
      handler: '运营商运维-王工',
      finishTime: '2026-06-16 15:30',
      result: '通过',
      reviewer: '运营-李主管',
      reviewTime: '2026-06-16 16:00',
    },
    {
      id: 'RV20260615007',
      workOrderId: 'WO202606150022',
      summary: '接地电阻异常整改',
      handler: '第三方维修-刘工',
      finishTime: '2026-06-15 11:20',
      result: '需二次处理',
      reviewer: '技术-王经理',
      reviewTime: '2026-06-15 14:00',
    },
    {
      id: 'RV20260614002',
      workOrderId: 'WO202606140005',
      summary: '急停按钮复位开关更换',
      handler: '场站驻场-赵师傅',
      finishTime: '2026-06-14 10:00',
      result: '通过',
      reviewer: '运营-张主管',
      reviewTime: '2026-06-14 10:45',
    },
  ]
}

function StationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const station = stations.find(s => s.id === id)

  const [selectedFaultType, setSelectedFaultType] = useState('')
  const [faultDesc, setFaultDesc] = useState('')
  const [newWorkOrders, setNewWorkOrders] = useState<WorkOrder[]>([])
  const [newAlerts, setNewAlerts] = useState<AlertItem[]>([])

  if (!station) {
    return (
      <div className="station-detail-page">
        <NavBar onBack={() => navigate(-1)}>充电站详情</NavBar>
        <div className="not-found">站点不存在</div>
      </div>
    )
  }

  const chargers = generateChargers(station)
  const initialAlerts = generateAlerts(station)
  const initialWorkOrders = generateWorkOrders(station)
  const reviewRecords = generateReviews()
  const allAlerts = [...newAlerts, ...initialAlerts]
  const allWorkOrders = [...newWorkOrders, ...initialWorkOrders]

  const alertStats = useMemo(() => {
    const pending = allAlerts.filter(a => a.status === '待处理').length
    const processing = allAlerts.filter(a => a.status === '处理中').length
    const dispatched = allAlerts.filter(a => a.status === '待派单').length
    return { pending, processing, dispatched }
  }, [allAlerts])

  const workOrderStats = useMemo(() => {
    const open = allWorkOrders.filter(w => w.currentStep < 4).length
    const done = allWorkOrders.filter(w => w.currentStep >= 4).length
    return { open, done }
  }, [allWorkOrders])

  const faultGunsCount = station.guns.fault + station.guns.offline
  const inspectionIssueCount = station.inspectionItems.length

  const getStatusColor = (status: string) => {
    switch (status) {
      case '空闲': return '#00b578'
      case '充电中': return '#1677ff'
      case '故障': return '#ff3141'
      case '离线': return '#999'
      default: return '#999'
    }
  }

  const getAlertTypeColor = (type: string) => {
    if (type === '故障告警') return '#ff3141'
    if (type === '离线告警') return '#666'
    return '#ff8f1f'
  }

  const getAlertStatusTag = (status: string) => {
    if (status === '已完成') return <Tag color="success">{status}</Tag>
    if (status === '处理中') return <Tag color="primary">{status}</Tag>
    if (status === '待派单') return <Tag color="warning">{status}</Tag>
    return <Tag color="danger">{status}</Tag>
  }

  const getWorkOrderStatusColor = (st: string) => {
    if (st === '已完成') return '#00b578'
    if (st === '处理中') return '#ff8f1f'
    if (st === '待复查') return '#722ed1'
    if (st === '已派单') return '#1677ff'
    return '#8c8c8c'
  }

  const getStepStatusClass = (index: number, current: number) => {
    if (index < current) return 'step-done'
    if (index === current) return 'step-active'
    return 'step-pending'
  }

  const showInspectionDialog = () => {
    Dialog.show({
      title: '巡检异常详情',
      content: (
        <div className="inspection-dialog">
          <div className="inspection-dialog-item"><ClockCircleOutline /><span>上次巡检：{station.lastInspectionTime}</span></div>
          <div className="inspection-dialog-item"><SetOutline /><span>巡检单号：INSP202606180023</span></div>
          <div className="inspection-dialog-item"><MessageOutline /><span>巡检员：巡检组-刘师傅</span></div>
          <div className="inspection-dialog-title">异常项：</div>
          {station.inspectionItems.map((item, idx) => (
            <div key={idx} className="inspection-dialog-anomaly">
              <span className="anomaly-dot" />
              {item}
            </div>
          ))}
          <div className="inspection-dialog-title">处理建议：</div>
          <div className="inspection-dialog-anomaly">
            <span className="anomaly-dot suggestion" />
            建议48小时内安排场站驻场更换磨损部件，关联工单已自动创建
          </div>
        </div>
      ),
      closeOnAction: true,
      actions: [[{ key: 'ok', text: '我知道了' }]],
    })
  }

  const showWorkOrderTracking = (order: WorkOrder) => {
    Dialog.show({
      title: `工单详情 ${order.id}`,
      content: (
        <div className="wo-tracking-dialog">
          <div className="wo-row"><span className="wo-label">问题类型</span><Tag color="primary">{order.problemType}</Tag></div>
          <div className="wo-row"><span className="wo-label">责任方</span><span>{order.responsible}</span></div>
          <div className="wo-row"><span className="wo-label">处理人</span><span>{order.handler} {order.handlerPhone}</span></div>
          <div className="wo-row"><span className="wo-label">创建时间</span><span>{order.createTime}</span></div>
          <div className="wo-row"><span className="wo-label">预计完成</span><span>{order.estimateTime}</span></div>
          <div className="wo-steps">
            {STEPS.map((step, idx) => (
              <div key={step} className={`wo-step ${getStepStatusClass(idx, order.currentStep)}`}>
                <div className="wo-step-dot" />
                <div className="wo-step-text">{step}</div>
                {idx < STEPS.length - 1 && <div className="wo-step-line" />}
              </div>
            ))}
          </div>
          <div className="wo-desc-title">问题描述：</div>
          <div className="wo-desc">{order.description}</div>
        </div>
      ),
      closeOnAction: true,
      actions: [[{ key: 'ok', text: '关闭' }]],
    })
  }

  const handleSubmitFault = () => {
    if (!selectedFaultType || !faultDesc) {
      Toast.show('请选择故障类型并填写描述')
      return
    }
    const today = '20260618'
    const seq = String(newWorkOrders.length + 99).padStart(4, '0')
    const woId = `WO${today}${seq}`
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const newAlert: AlertItem = {
      time: timeStr,
      type: '故障告警',
      content: `用户上报：${selectedFaultType} - ${faultDesc.slice(0, 20)}${faultDesc.length > 20 ? '...' : ''}`,
      status: '待处理',
    }
    const newWO: WorkOrder = {
      id: woId,
      problemType: selectedFaultType,
      description: faultDesc,
      responsible: '自动分配中',
      currentStep: 0,
      handler: '待派单',
      handlerPhone: '-',
      createTime: `2026-06-18 ${timeStr}`,
      estimateTime: '2026-06-18 24:00前',
      status: '待派单',
    }
    setNewAlerts(prev => [newAlert, ...prev])
    setNewWorkOrders(prev => [newWO, ...prev])
    setSelectedFaultType('')
    setFaultDesc('')
    Toast.show({ icon: 'success', content: `上报成功，工单 ${woId} 已创建` })
  }

  return (
    <div className="station-detail-page">
      <NavBar onBack={() => navigate(-1)}>充电站详情</NavBar>

      <div className="detail-content">
        <Card className="info-card">
          <div className="station-title-row">
            <h2 className="detail-station-name">{station.name}</h2>
            <Tag color={operatorColors[station.operator]}>{station.operator}</Tag>
          </div>
          <List className="info-list">
            <List.Item prefix={<LocationOutline />} extra={station.address}>地址</List.Item>
            <List.Item prefix={<ClockCircleOutline />} extra={station.businessHours}>营业时间</List.Item>
            <List.Item prefix={<span className="coord-icon">📐</span>} extra={`${station.longitude}, ${station.latitude}`}>经纬度</List.Item>
          </List>
        </Card>

        <Card className="info-card alert-stats-card" title="实时告警统计">
          <div className="alert-stats-grid">
            <div className="alert-stat-item danger">
              <div className="alert-stat-value">{faultGunsCount}</div>
              <div className="alert-stat-label">故障+离线桩</div>
            </div>
            <div className="alert-stat-item warning">
              <div className="alert-stat-value">{inspectionIssueCount}</div>
              <div className="alert-stat-label">巡检异常</div>
            </div>
            <div className="alert-stat-item pending">
              <div className="alert-stat-value">{workOrderStats.open}</div>
              <div className="alert-stat-label">未关闭工单</div>
            </div>
            <div className="alert-stat-item done">
              <div className="alert-stat-value">{workOrderStats.done}</div>
              <div className="alert-stat-label">已完成工单</div>
            </div>
          </div>
          <div className="alert-timeline">
            <div className="alert-timeline-title">实时告警时间轴</div>
            {allAlerts.map((alert, idx) => (
              <div key={idx} className="alert-timeline-item">
                <div className="timeline-dot" style={{ background: getAlertTypeColor(alert.type) }} />
                <div className="timeline-content">
                  <div className="timeline-top">
                    <span className="timeline-time">{alert.time}</span>
                    <Tag color={alert.type === '故障告警' ? 'danger' : alert.type === '离线告警' ? 'default' : 'warning'} round style={{ fontSize: 10 }}>
                      {alert.type}
                    </Tag>
                    {getAlertStatusTag(alert.status)}
                  </div>
                  <div className="timeline-desc">{alert.content}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="info-card" title="运营商来源信息">
          <List className="info-list">
            <List.Item extra={station.operator}>运营商名称</List.Item>
            <List.Item extra={<Tag fill="outline" style={{ color: protocolColors[station.protocol], borderColor: protocolColors[station.protocol] }}>{station.protocol}</Tag>}>接入协议类型</List.Item>
            <List.Item extra={<span style={{ color: station.apiStatus === '在线' ? '#00b578' : '#ff3141' }}>{station.apiStatus === '在线' ? <CheckCircleOutline /> : <CloseCircleOutline />} {station.apiStatus}</span>}>API对接状态</List.Item>
            <List.Item extra={station.lastSyncTime}>上次同步时间</List.Item>
          </List>
        </Card>

        <Card className="info-card" title="桩枪实时状态">
          <div className="charger-grid">
            {chargers.map(charger => (
              <div key={charger.id} className={`charger-item ${charger.status === '故障' ? 'fault' : charger.status === '离线' ? 'offline' : ''}`}>
                <div className="charger-header">
                  <span className="charger-id">{charger.id}</span>
                  <span className="charger-status-dot" style={{ background: getStatusColor(charger.status) }} />
                </div>
                <div className="charger-type">{charger.type} {charger.power}kW</div>
                <div className="charger-status" style={{ color: getStatusColor(charger.status) }}>{charger.status}</div>
                {charger.soc !== null && (
                  <div className="charger-soc">
                    <div className="soc-label">SOC {charger.soc}%</div>
                    <div className="soc-bar"><div className="soc-fill" style={{ width: `${charger.soc}%` }} /></div>
                  </div>
                )}
                {charger.estimatedTime && <div className="charger-eta">{charger.estimatedTime}</div>}
              </div>
            ))}
          </div>
        </Card>

        <Card className="info-card" title="协议接入详情">
          <List className="info-list">
            <List.Item extra={station.protocol === '国网协议' ? '国网自有桩' : station.protocol === '第三方API' ? '第三方API对接' : 'GB/T 27930直连'}>接入方式</List.Item>
            <List.Item extra={station.protocol === '国网协议' ? 'V2.1' : station.protocol === '第三方API' ? 'RESTful v3' : 'GB/T 27930-2015'}>协议版本</List.Item>
            <List.Item extra={<span style={{ color: '#00b578' }}><CheckCircleOutline /> 已连接</span>}>连接状态</List.Item>
          </List>
        </Card>

        <Card className="info-card" title="巡检信息">
          <List className="info-list">
            <List.Item extra={station.lastInspectionTime}>上次巡检时间</List.Item>
            <List.Item extra={station.inspectionStatus === '正常' ? (<span style={{ color: '#00b578' }}><CheckCircleOutline /> 正常</span>) : (<span style={{ color: '#ff3141' }}><CloseCircleOutline /> 有异常</span>)}>巡检结果</List.Item>
          </List>
          {station.inspectionItems.length > 0 && (
            <div className="inspection-issues">
              <div className="issues-title-row">
                <div className="issues-title">异常项列表</div>
                <Button size="mini" color="primary" fill="outline" onClick={showInspectionDialog}>
                  查看巡检详情
                </Button>
              </div>
              {station.inspectionItems.map((item, idx) => (
                <div key={idx} className="issue-item">
                  <CloseCircleOutline className="issue-icon" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="info-card" title="实时占用情况">
          <div className="occupancy-detail">
            <div className="occupancy-row">
              <span>当前占用率</span>
              <span style={{ color: station.occupancyRate >= 80 ? '#ff3141' : station.occupancyRate >= 50 ? '#ff8f1f' : '#00b578', fontWeight: 700 }}>{station.occupancyRate}%</span>
            </div>
            <div className="detail-progress-bar">
              <div className="detail-progress-fill" style={{ width: `${station.occupancyRate}%`, background: station.occupancyRate >= 80 ? '#ff3141' : station.occupancyRate >= 50 ? '#ff8f1f' : '#00b578' }} />
            </div>
            <div className="occupancy-row"><span><ClockCircleOutline /> 高峰时段预测</span><span className="peak-time">{station.peakHours}</span></div>
            <div className="occupancy-row"><span>排队等待数</span><span className={`queue-count ${station.queueCount > 0 ? 'has-queue' : ''}`}>{station.queueCount}辆</span></div>
          </div>
        </Card>

        <Card className="info-card workorder-card" title="巡检处理工单">
          <div className="wo-summary-row">
            <Tag color="warning">未关闭 {workOrderStats.open}</Tag>
            <Tag color="success">已完成 {workOrderStats.done}</Tag>
            <span className="wo-summary-tip">点击工单查看进度跟踪</span>
          </div>
          <Space direction="vertical" block>
            {allWorkOrders.map((wo, idx) => (
              <div key={`${wo.id}-${idx}`} className="wo-card" onClick={() => showWorkOrderTracking(wo)}>
                <div className="wo-card-header">
                  <div className="wo-card-id">
                    <SetOutline /> {wo.id}
                  </div>
                  <Tag color={wo.status === '已完成' ? 'success' : wo.status === '待复查' ? 'purple' : wo.status === '处理中' ? 'warning' : 'primary'} round style={{ fontSize: 10 }}>
                    {wo.status}
                  </Tag>
                </div>
                <div className="wo-card-title">
                  <Tag color="primary" round style={{ fontSize: 10 }}>{wo.problemType}</Tag>
                  <span className="wo-responsible">责任方：{wo.responsible}</span>
                </div>
                <div className="wo-card-desc">{wo.description}</div>
                <div className="wo-card-info">
                  <span>处理人：{wo.handler}</span>
                  <RightOutline className="wo-card-arrow" />
                </div>
                <div className="wo-mini-steps">
                  {STEPS.map((step, sIdx) => (
                    <div key={step} className={`wo-mini-step ${getStepStatusClass(sIdx, wo.currentStep)}`}>
                      <div className="wo-mini-dot" />
                      {sIdx < STEPS.length - 1 && <div className="wo-mini-line" />}
                    </div>
                  ))}
                </div>
                <div className="wo-mini-labels">
                  {STEPS.map((step, sIdx) => (
                    <span key={step} className={`wo-mini-label ${getStepStatusClass(sIdx, wo.currentStep)}`}>
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </Space>
        </Card>

        <Card className="info-card review-card" title="历史复查记录">
          <Space direction="vertical" block>
            {reviewRecords.map(r => (
              <div key={r.id} className="review-item">
                <div className="review-header">
                  <span className="review-id">{r.workOrderId}</span>
                  <Tag color={r.result === '通过' ? 'success' : 'danger'} round style={{ fontSize: 10 }}>
                    复查：{r.result}
                  </Tag>
                </div>
                <div className="review-summary">{r.summary}</div>
                <div className="review-meta-row">
                  <span>处理：{r.handler}</span>
                  <span>{r.finishTime}</span>
                </div>
                <div className="review-meta-row review-meta-reviewer">
                  <span>复查：{r.reviewer}</span>
                  <span>{r.reviewTime}</span>
                </div>
              </div>
            ))}
          </Space>
        </Card>

        <Card className="info-card fault-report-card" title="故障上报">
          <div className="fault-tip">
            <MessageOutline />
            <span>上报后将自动创建工单，责任方将在15分钟内响应</span>
          </div>
          <div className="fault-section">
            <div className="fault-label">故障类型</div>
            <div className="fault-type-list">
              {faultTypes.map(ft => (
                <div key={ft} className={selectedFaultType === ft ? 'fault-type-tag active' : 'fault-type-tag'} onClick={() => setSelectedFaultType(ft)}>{ft}</div>
              ))}
            </div>
            <div className="fault-label">故障描述</div>
            <TextArea
              className="fault-textarea"
              placeholder="请描述故障情况，如具体桩号、发生时间、现象等..."
              rows={4}
              value={faultDesc}
              onChange={val => setFaultDesc(val)}
            />
            {newWorkOrders.length > 0 && (
              <div className="new-wo-tracking">
                <div className="new-wo-title">我刚刚上报的工单：</div>
                {newWorkOrders.map(nwo => (
                  <div key={nwo.id} className="new-wo-row" onClick={() => showWorkOrderTracking(nwo)}>
                    <SetOutline />
                    <span className="new-wo-id">{nwo.id}</span>
                    <Tag color="default" round style={{ fontSize: 10 }}>{nwo.status}</Tag>
                    <RightOutline />
                  </div>
                ))}
              </div>
            )}
            <Button block color="danger" className="fault-submit-btn" disabled={!selectedFaultType || !faultDesc} onClick={handleSubmitFault}>
              <SendOutline /> 提交故障上报
            </Button>
          </div>
        </Card>

        <div className="start-charging-wrapper">
          <Button block color="primary" size="large" className="start-charging-btn" onClick={() => navigate('/charging')}>
            <CollectMoneyOutline /> 开始充电
          </Button>
        </div>
      </div>
    </div>
  )
}

export default StationDetail
