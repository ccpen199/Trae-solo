import { useState } from 'react'
import { NavBar, SearchBar, Button, Card, Tag, Space, List, Input, Toast } from 'antd-mobile'
import { LocationOutline, SetOutline, ClockCircleOutline, RightOutline, CollectMoneyOutline } from 'antd-mobile-icons'
import './index.css'

interface Waypoint {
  id: number
  value: string
}

interface VehicleParams {
  battery: number
  capacity: number
  consumption: number
}

interface RouteSegment {
  start: string
  end: string
  distance: number
  duration: number
  batteryConsumed: number
  batteryRemaining: number
  hasEnoughRange: boolean
}

interface ChargingStation {
  id: number
  name: string
  operator: string
  electricityPrice: number
  servicePrice: number
  totalPrice: number
  period: string
  idleGuns: number
  distance: number
  chargeTime: number
  chargeCost: number
}

interface PlanResult {
  totalDistance: number
  totalDuration: number
  chargeCount: number
  totalCost: number
  segments: RouteSegment[]
  stations: ChargingStation[]
}

const OPERATOR_COLORS: Record<string, string> = {
  '国网电动': 'primary',
  '特来电': 'success',
  '星星充电': 'warning',
  '小桔充电': 'danger',
}

const OPERATOR_LIST = ['国网电动', '特来电', '星星充电', '小桔充电']

const STATION_NAMES = [
  '国家电网充电站(京哈高速服务区)',
  '特来电超级充电站(通州万达)',
  '星星充电(朝阳公园站)',
  '小桔充电(大兴机场店)',
  '国家电网充电站(京沪高速)',
  '特来电充电站(海淀中关村)',
  '星星充电(望京SOHO)',
  '小桔充电(丰台科技园)',
]

function randomRange(min: number, max: number, decimals = 0): number {
  const value = Math.random() * (max - min) + min
  return decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value)
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h > 0 && m > 0) return `${h}小时${m}分`
  if (h > 0) return `${h}小时`
  return `${m}分钟`
}

function getPeriodTag(price: number): { label: string; color: string } {
  if (price < 0.4) return { label: '谷电', color: 'success' }
  if (price <= 0.8) return { label: '平时', color: 'primary' }
  return { label: '峰电', color: 'warning' }
}

function generateStations(segmentIndex: number, batteryNeeded: number, capacity: number): ChargingStation[] {
  const count = randomRange(3, 5)
  const stations: ChargingStation[] = []
  const usedNames = new Set<number>()

  for (let i = 0; i < count; i++) {
    let nameIdx: number
    do {
      nameIdx = randomRange(0, STATION_NAMES.length - 1)
    } while (usedNames.has(nameIdx))
    usedNames.add(nameIdx)

    const electricity = randomRange(0.25, 1.1, 2)
    const service = randomRange(0.3, 0.6, 2)
    const totalPrice = Number((electricity + service).toFixed(2))
    const kwhNeeded = (batteryNeeded / 100) * capacity
    const chargeCost = Number((kwhNeeded * totalPrice).toFixed(2))
    const power = randomRange(60, 120)
    const chargeTime = Number(((kwhNeeded / power) * 60).toFixed(0))

    stations.push({
      id: segmentIndex * 100 + i,
      name: STATION_NAMES[nameIdx],
      operator: OPERATOR_LIST[randomRange(0, OPERATOR_LIST.length - 1)],
      electricityPrice: electricity,
      servicePrice: service,
      totalPrice,
      period: getPeriodTag(totalPrice).label,
      idleGuns: randomRange(1, 8),
      distance: randomRange(2, 15, 1),
      chargeTime,
      chargeCost,
    })
  }

  return stations.sort((a, b) => a.totalPrice - b.totalPrice)
}

function RoutePage() {
  const [departure, setDeparture] = useState('我的位置')
  const [destination, setDestination] = useState('')
  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [paramsExpanded, setParamsExpanded] = useState(true)
  const [vehicleParams, setVehicleParams] = useState<VehicleParams>({
    battery: 70,
    capacity: 60,
    consumption: 15,
  })
  const [planning, setPlanning] = useState(false)
  const [planResult, setPlanResult] = useState<PlanResult | null>(null)

  const range = vehicleParams.capacity * (vehicleParams.battery / 100) / vehicleParams.consumption * 100

  const addWaypoint = () => {
    if (waypoints.length >= 3) return
    const newId = waypoints.length > 0 ? Math.max(...waypoints.map(w => w.id)) + 1 : 1
    setWaypoints([...waypoints, { id: newId, value: '' }])
  }

  const removeWaypoint = (id: number) => {
    setWaypoints(waypoints.filter(w => w.id !== id))
  }

  const updateWaypoint = (id: number, value: string) => {
    setWaypoints(waypoints.map(w => (w.id === id ? { ...w, value } : w)))
  }

  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === waypoints.length - 1) return
    const newPoints = [...waypoints]
    const target = direction === 'up' ? index - 1 : index + 1
    ;[newPoints[index], newPoints[target]] = [newPoints[target], newPoints[index]]
    setWaypoints(newPoints)
  }

  const generatePlan = () => {
    if (!destination.trim()) {
      Toast.show('请输入目的地')
      return
    }

    const allPoints = [
      departure || '我的位置',
      ...waypoints.map(w => w.value || `途经点${waypoints.indexOf(w) + 1}`),
      destination,
    ]

    setPlanning(true)
    Toast.show({ icon: 'loading', content: '规划中...', maskClickable: false })

    setTimeout(() => {
      const segments: RouteSegment[] = []
      let currentBattery = vehicleParams.battery
      let totalDistance = 0
      let totalDuration = 0
      let chargeCount = 0
      let totalCost = 0
      let allStations: ChargingStation[] = []

      for (let i = 0; i < allPoints.length - 1; i++) {
        const distance = randomRange(80, 250, 1)
        const duration = distance / 80
        const batteryConsumed = (distance / 100) * vehicleParams.consumption / vehicleParams.capacity * 100
        const batteryRemaining = Math.max(0, Number((currentBattery - batteryConsumed).toFixed(1)))
        const hasEnoughRange = currentBattery >= batteryConsumed

        if (!hasEnoughRange) {
          const needed = batteryConsumed - currentBattery + 20
          const stations = generateStations(i, needed, vehicleParams.capacity)
          allStations = [...allStations, ...stations]
          chargeCount++
          totalCost += stations[0].chargeCost
        }

        segments.push({
          start: allPoints[i],
          end: allPoints[i + 1],
          distance,
          duration,
          batteryConsumed: Number(batteryConsumed.toFixed(1)),
          batteryRemaining,
          hasEnoughRange,
        })

        totalDistance += distance
        totalDuration += duration
        currentBattery = hasEnoughRange ? batteryRemaining : 80
      }

      setPlanResult({
        totalDistance: Number(totalDistance.toFixed(1)),
        totalDuration,
        chargeCount,
        totalCost: Number(totalCost.toFixed(2)),
        segments,
        stations: allStations,
      })
      setPlanning(false)
    }, 1000)
  }

  return (
    <div className="route-page">
      <NavBar>AI路径规划</NavBar>

      <div className="route-body">
        <Card className="search-card">
          <div className="search-list">
            <div className="search-item start-item">
              <div className="search-dot start"></div>
              <SearchBar
                placeholder="输入起点"
                value={departure}
                onChange={setDeparture}
              />
            </div>

            {waypoints.map((wp, idx) => (
              <div key={wp.id} className="waypoint-block">
                <div className="waypoint-connector"></div>
                <div className="search-item waypoint-item">
                  <div className="search-dot waypoint"></div>
                  <SearchBar
                    placeholder={`途经点${idx + 1}`}
                    value={wp.value}
                    onChange={(v) => updateWaypoint(wp.id, v)}
                  />
                  <div className="waypoint-actions">
                    <div
                      className={`action-btn up ${idx === 0 ? 'disabled' : ''}`}
                      onClick={() => moveWaypoint(idx, 'up')}
                    >
                      ↑
                    </div>
                    <div
                      className={`action-btn down ${idx === waypoints.length - 1 ? 'disabled' : ''}`}
                      onClick={() => moveWaypoint(idx, 'down')}
                    >
                      ↓
                    </div>
                    <div className="action-btn delete" onClick={() => removeWaypoint(wp.id)}>
                      ×
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {waypoints.length < 3 && (
              <div className="add-waypoint-row">
                <div className="waypoint-connector"></div>
                <div className="add-waypoint-btn" onClick={addWaypoint}>
                  <span className="add-icon">+</span>
                  <span>添加途经点</span>
                </div>
              </div>
            )}

            <div className="waypoint-connector"></div>
            <div className="search-item end-item">
              <div className="search-dot end"></div>
              <SearchBar
                placeholder="输入目的地"
                value={destination}
                onChange={setDestination}
              />
            </div>
          </div>

          <Button
            block
            color="primary"
            size="large"
            className="plan-btn"
            onClick={generatePlan}
            loading={planning}
            disabled={planning}
          >
            智能规划路线
          </Button>
        </Card>

        <Card className="vehicle-card">
          <div className="vehicle-header" onClick={() => setParamsExpanded(!paramsExpanded)}>
            <div className="vehicle-title">
              <SetOutline />
              <span>车辆参数设置</span>
            </div>
            <RightOutline className={`expand-arrow ${paramsExpanded ? 'rotated' : ''}`} />
          </div>

          {paramsExpanded && (
            <div className="vehicle-body">
              <div className="param-row">
                <div className="param-label">当前电量</div>
                <div className="param-input-wrap">
                  <Input
                    type="number"
                    value={String(vehicleParams.battery)}
                    onChange={(v) => {
                      const num = Number(v)
                      if (isNaN(num)) return
                      setVehicleParams({ ...vehicleParams, battery: Math.min(100, Math.max(0, num)) })
                    }}
                    className="param-input"
                  />
                  <span className="param-unit">%</span>
                </div>
              </div>
              <div className="param-bar-wrap">
                <div className="param-bar">
                  <div
                    className="param-bar-fill battery"
                    style={{ width: `${vehicleParams.battery}%` }}
                  />
                </div>
              </div>

              <div className="param-row">
                <div className="param-label">电池容量</div>
                <div className="param-input-wrap">
                  <Input
                    type="number"
                    value={String(vehicleParams.capacity)}
                    onChange={(v) => {
                      const num = Number(v)
                      if (isNaN(num) || num <= 0) return
                      setVehicleParams({ ...vehicleParams, capacity: num })
                    }}
                    className="param-input"
                  />
                  <span className="param-unit">kWh</span>
                </div>
              </div>

              <div className="param-row">
                <div className="param-label">百公里电耗</div>
                <div className="param-input-wrap">
                  <Input
                    type="number"
                    value={String(vehicleParams.consumption)}
                    onChange={(v) => {
                      const num = Number(v)
                      if (isNaN(num) || num <= 0) return
                      setVehicleParams({ ...vehicleParams, consumption: num })
                    }}
                    className="param-input"
                  />
                  <span className="param-unit">kWh/100km</span>
                </div>
              </div>

              <div className="range-display">
                <div className="range-label">预估续航里程</div>
                <div className="range-value">{Math.round(range)}<small>km</small></div>
              </div>
            </div>
          )}
        </Card>

        {planResult && (
          <Space direction="vertical" block className="result-section">
            <Card className="overview-card">
              <div className="overview-title">规划结果总览</div>
              <div className="overview-grid">
                <div className="overview-item">
                  <div className="overview-label">
                    <LocationOutline /> 总距离
                  </div>
                  <div className="overview-value">{planResult.totalDistance}<small>km</small></div>
                </div>
                <div className="overview-item">
                  <div className="overview-label">
                    <ClockCircleOutline /> 总时长
                  </div>
                  <div className="overview-value">{formatDuration(planResult.totalDuration)}</div>
                </div>
                <div className="overview-item">
                  <div className="overview-label">
                    <SetOutline /> 充电次数
                  </div>
                  <div className="overview-value">{planResult.chargeCount}<small>次</small></div>
                </div>
                <div className="overview-item">
                  <div className="overview-label">
                    <CollectMoneyOutline /> 总费用
                  </div>
                  <div className="overview-value cost">¥{planResult.totalCost}</div>
                </div>
              </div>
            </Card>

            <Card className="segments-card">
              <div className="section-title">分段路线</div>
              <Space direction="vertical" block>
                {planResult.segments.map((seg, idx) => (
                  <div key={idx} className="segment-item">
                    <div className="segment-header">
                      <div className="segment-index">第{idx + 1}段</div>
                      <Tag color={seg.hasEnoughRange ? 'success' : 'danger'} className="range-tag">
                        {seg.hasEnoughRange ? '续航足够' : '续航不足'}
                      </Tag>
                    </div>

                    <div className="segment-points">
                      <div className="point-row">
                        <div className="point-dot start"></div>
                        <span className="point-name">{seg.start}</span>
                      </div>
                      <div className="point-connector">
                        <div className="connector-line"></div>
                        <div className="connector-info">
                          <span>{seg.distance}km</span>
                          <span className="dot-sep">·</span>
                          <span>{formatDuration(seg.duration)}</span>
                        </div>
                      </div>
                      <div className="point-row">
                        <div className="point-dot end"></div>
                        <span className="point-name">{seg.end}</span>
                      </div>
                    </div>

                    <div className="battery-section">
                      <div className="battery-row">
                        <span className="battery-label">电量消耗</span>
                        <div className="battery-bar-wrap">
                          <div className="battery-bar">
                            <div
                              className="battery-bar-fill consumed"
                              style={{ width: `${seg.batteryConsumed}%` }}
                            />
                          </div>
                          <span className="battery-val">-{seg.batteryConsumed}%</span>
                        </div>
                      </div>
                      <div className="battery-row">
                        <span className="battery-label">到达剩余</span>
                        <div className="battery-bar-wrap">
                          <div className="battery-bar">
                            <div
                              className={`battery-bar-fill ${seg.batteryRemaining < 20 ? 'low' : 'remaining'}`}
                              style={{ width: `${seg.batteryRemaining}%` }}
                            />
                          </div>
                          <span className={`battery-val ${seg.batteryRemaining < 20 ? 'low' : ''}`}>
                            {seg.batteryRemaining}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {!seg.hasEnoughRange && planResult.stations.length > 0 && (
                      <div className="stations-section">
                        <div className="stations-title">
                          <SetOutline /> 推荐充电站（按电价排序）
                        </div>
                        <List className="station-list">
                          {planResult.stations
                            .filter((_, sIdx) => sIdx >= idx * 3 && sIdx < idx * 3 + 5)
                            .map((station, sIdx) => {
                              const periodTag = getPeriodTag(station.totalPrice)
                              return (
                                <List.Item
                                  key={station.id}
                                  className="station-item"
                                  extra={
                                    <div className="station-extra">
                                      <div className="station-charge-time">{station.chargeTime}分钟</div>
                                      <div className="station-charge-cost">¥{station.chargeCost}</div>
                                    </div>
                                  }
                                >
                                  <div className="station-content">
                                    <div className="station-header">
                                      <span className="station-name">
                                        {sIdx === 0 && <Tag color="primary" className="recommend-tag">推荐</Tag>}
                                        {station.name}
                                      </span>
                                      <Tag
                                        color={OPERATOR_COLORS[station.operator]}
                                        className="operator-tag"
                                      >
                                        {station.operator}
                                      </Tag>
                                    </div>
                                    <div className="station-meta-row">
                                      <Tag color={periodTag.color} fill="outline" className="period-tag">
                                        {periodTag.label}
                                      </Tag>
                                      <span className="station-price">
                                        ¥{station.totalPrice}/度
                                        <span className="price-detail">
                                          (电¥{station.electricityPrice}+服¥{station.servicePrice})
                                        </span>
                                      </span>
                                    </div>
                                    <div className="station-info-row">
                                      <span className="info-item idle">空闲桩 {station.idleGuns}个</span>
                                      <span className="info-item distance">距路段 {station.distance}km</span>
                                    </div>
                                  </div>
                                </List.Item>
                              )
                            })}
                        </List>
                      </div>
                    )}
                  </div>
                ))}
              </Space>
            </Card>
          </Space>
        )}
      </div>
    </div>
  )
}

export default RoutePage
