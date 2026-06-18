import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { NavBar, Card, Tag, Button, List } from 'antd-mobile'
import {
  LocationOutline,
  ClockCircleOutline,
  CheckCircleOutline,
  CloseCircleOutline,
  SendOutline,
  CollectMoneyOutline,
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

const faultTypes = ['桩体故障', '通信异常', '充电中断', '支付失败', '枪头损坏']

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

function StationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [selectedFaultType, setSelectedFaultType] = useState('')
  const [faultDesc, setFaultDesc] = useState('')

  const station = stations.find(s => s.id === id)

  if (!station) {
    return (
      <div className="station-detail-page">
        <NavBar onBack={() => navigate(-1)}>充电站详情</NavBar>
        <div className="not-found">站点不存在</div>
      </div>
    )
  }

  const chargers = generateChargers(station)

  const getStatusColor = (status: string) => {
    switch (status) {
      case '空闲': return '#00b578'
      case '充电中': return '#1677ff'
      case '故障': return '#ff3141'
      case '离线': return '#999'
      default: return '#999'
    }
  }

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return '#ff3141'
    if (rate >= 50) return '#ff8f1f'
    return '#00b578'
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
            <List.Item prefix={<LocationOutline />} extra={station.address}>
              地址
            </List.Item>
            <List.Item prefix={<ClockCircleOutline />} extra={station.businessHours}>
              营业时间
            </List.Item>
            <List.Item
              prefix={<span className="coord-icon">📐</span>}
              extra={`${station.longitude}, ${station.latitude}`}
            >
              经纬度
            </List.Item>
          </List>
        </Card>

        <Card className="info-card" title="运营商来源信息">
          <List className="info-list">
            <List.Item extra={station.operator}>运营商名称</List.Item>
            <List.Item
              extra={
                <Tag fill="outline" style={{ color: protocolColors[station.protocol], borderColor: protocolColors[station.protocol] }}>
                  {station.protocol}
                </Tag>
              }
            >
              接入协议类型
            </List.Item>
            <List.Item
              extra={
                <span style={{ color: station.apiStatus === '在线' ? '#00b578' : '#ff3141' }}>
                  {station.apiStatus === '在线' ? <CheckCircleOutline /> : <CloseCircleOutline />}
                  {' '}{station.apiStatus}
                </span>
              }
            >
              API对接状态
            </List.Item>
            <List.Item extra={station.lastSyncTime}>上次同步时间</List.Item>
          </List>
        </Card>

        <Card className="info-card" title="桩枪实时状态">
          <div className="charger-grid">
            {chargers.map(charger => (
              <div
                key={charger.id}
                className={`charger-item ${charger.status === '故障' ? 'fault' : charger.status === '离线' ? 'offline' : ''}`}
              >
                <div className="charger-header">
                  <span className="charger-id">{charger.id}</span>
                  <span
                    className="charger-status-dot"
                    style={{ background: getStatusColor(charger.status) }}
                  />
                </div>
                <div className="charger-type">{charger.type} {charger.power}kW</div>
                <div className="charger-status" style={{ color: getStatusColor(charger.status) }}>
                  {charger.status}
                </div>
                {charger.soc !== null && (
                  <div className="charger-soc">
                    <div className="soc-label">SOC {charger.soc}%</div>
                    <div className="soc-bar">
                      <div className="soc-fill" style={{ width: `${charger.soc}%` }} />
                    </div>
                  </div>
                )}
                {charger.estimatedTime && (
                  <div className="charger-eta">{charger.estimatedTime}</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="info-card" title="协议接入详情">
          <List className="info-list">
            <List.Item
              extra={
                station.protocol === '国网协议' ? '国网自有桩' :
                station.protocol === '第三方API' ? '第三方API对接' : 'GB/T 27930直连'
              }
            >
              接入方式
            </List.Item>
            <List.Item
              extra={
                station.protocol === '国网协议' ? 'V2.1' :
                station.protocol === '第三方API' ? 'RESTful v3' : 'GB/T 27930-2015'
              }
            >
              协议版本
            </List.Item>
            <List.Item
              extra={
                <span style={{ color: '#00b578' }}>
                  <CheckCircleOutline /> 已连接
                </span>
              }
            >
              连接状态
            </List.Item>
          </List>
        </Card>

        <Card className="info-card" title="巡检信息">
          <List className="info-list">
            <List.Item extra={station.lastInspectionTime}>上次巡检时间</List.Item>
            <List.Item
              extra={
                station.inspectionStatus === '正常' ? (
                  <span style={{ color: '#00b578' }}><CheckCircleOutline /> 正常</span>
                ) : (
                  <span style={{ color: '#ff3141' }}><CloseCircleOutline /> 有异常</span>
                )
              }
            >
              巡检结果
            </List.Item>
          </List>
          {station.inspectionItems.length > 0 && (
            <div className="inspection-issues">
              <div className="issues-title">异常项列表</div>
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
              <span style={{ color: getOccupancyColor(station.occupancyRate), fontWeight: 700 }}>
                {station.occupancyRate}%
              </span>
            </div>
            <div className="detail-progress-bar">
              <div
                className="detail-progress-fill"
                style={{
                  width: `${station.occupancyRate}%`,
                  background: getOccupancyColor(station.occupancyRate),
                }}
              />
            </div>
            <div className="occupancy-row">
              <span><ClockCircleOutline /> 高峰时段预测</span>
              <span className="peak-time">{station.peakHours}</span>
            </div>
            <div className="occupancy-row">
              <span>排队等待数</span>
              <span className={`queue-count ${station.queueCount > 0 ? 'has-queue' : ''}`}>
                {station.queueCount}辆
              </span>
            </div>
          </div>
        </Card>

        <Card className="info-card fault-report-card" title="故障上报">
          <div className="fault-section">
            <div className="fault-label">故障类型</div>
            <div className="fault-type-list">
              {faultTypes.map(ft => (
                <div
                  key={ft}
                  className={selectedFaultType === ft ? 'fault-type-tag active' : 'fault-type-tag'}
                  onClick={() => setSelectedFaultType(ft)}
                >
                  {ft}
                </div>
              ))}
            </div>
            <div className="fault-label">故障描述</div>
            <textarea
              className="fault-textarea"
              placeholder="请描述故障情况..."
              value={faultDesc}
              onChange={e => setFaultDesc(e.target.value)}
            />
            <Button
              block
              color="danger"
              className="fault-submit-btn"
              disabled={!selectedFaultType || !faultDesc}
            >
              <SendOutline /> 提交故障上报
            </Button>
          </div>
        </Card>

        <div className="start-charging-wrapper">
          <Button
            block
            color="primary"
            size="large"
            className="start-charging-btn"
            onClick={() => navigate('/charging')}
          >
            <CollectMoneyOutline /> 开始充电
          </Button>
        </div>
      </div>
    </div>
  )
}

export default StationDetail
