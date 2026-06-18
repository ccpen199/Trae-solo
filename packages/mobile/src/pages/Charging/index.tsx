import { useState, useEffect, useRef, useCallback } from 'react'
import { NavBar, Card, Tag, Space, Button, TextArea, Toast, Dialog } from 'antd-mobile'
import { SetOutline, ClockCircleOutline, CollectMoneyOutline, RightOutline } from 'antd-mobile-icons'
import './index.css'

const FAULT_TYPES = ['充电中断', '功率异常', '枪头无法拔出', '计费异常', '通信断开', '其他']
const FAULT_STEPS = ['已上报', '处理中', '已解决']
const MAX_POWER_POINTS = 30

function generatePowerHistory(base: number) {
  const arr: number[] = []
  for (let i = 0; i < MAX_POWER_POINTS; i++) {
    arr.push(+(base + (Math.random() - 0.5) * 10).toFixed(1))
  }
  return arr
}

function Charging() {
  const [soc, setSoc] = useState(32)
  const [power, setPower] = useState(45.6)
  const [charged, setCharged] = useState(19.2)
  const [duration, setDuration] = useState(0)
  const [elecCost, setElecCost] = useState(14.35)
  const [serviceCost, setServiceCost] = useState(4.78)
  const [powerHistory, setPowerHistory] = useState<number[]>(() => generatePowerHistory(45))
  const [showFaultPanel, setShowFaultPanel] = useState(false)
  const [faultType, setFaultType] = useState('')
  const [faultDesc, setFaultDesc] = useState('')
  const [faultRecords, setFaultRecords] = useState<{ type: string; desc: string; step: number; time: string }[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const faultTimerRef = useRef<ReturnType<typeof setInterval>>()

  const totalCapacity = 60
  const mode = '快充'
  const voltage = 380
  const current = 120
  const pileNo = 'A-03'
  const gunNo = '1'
  const operator = '国家电网'
  const protocol = 'GB/T 27930'
  const stationName = '国家电网充电站(朝阳公园)'

  const estimatedMinutes = power > 0 ? Math.round(((totalCapacity - charged) / power) * 60) : 0
  const totalCost = +(elecCost + serviceCost).toFixed(2)

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSoc(prev => Math.min(+(prev + Math.random() * 0.3).toFixed(1), 100))
      setPower(prev => +Math.max(0, prev + (Math.random() - 0.5) * 3).toFixed(1))
      setCharged(prev => +Math.min(prev + Math.random() * 0.15, totalCapacity).toFixed(2))
      setDuration(prev => prev + 1)
      setElecCost(prev => +(prev + Math.random() * 0.05).toFixed(2))
      setServiceCost(prev => +(prev + Math.random() * 0.02).toFixed(2))
      setPowerHistory(prev => {
        const last = prev[prev.length - 1]
        const next = [...prev.slice(1), +Math.max(0, last + (Math.random() - 0.5) * 3).toFixed(1)]
        return next
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (faultRecords.length === 0) return
    faultTimerRef.current = setInterval(() => {
      setFaultRecords(prev =>
        prev.map(r => (r.step < 2 ? { ...r, step: r.step + (Math.random() > 0.7 ? 1 : 0) } : r))
      )
    }, 5000)
    return () => {
      if (faultTimerRef.current) clearInterval(faultTimerRef.current)
    }
  }, [faultRecords.length])

  const handleStopCharging = useCallback(async () => {
    const result = await Dialog.confirm({
      content: '确定要结束充电吗？',
      confirmText: '确定结束',
      cancelText: '继续充电',
    })
    if (result) {
      if (timerRef.current) clearInterval(timerRef.current)
      Toast.show({ icon: 'success', content: '充电已结束' })
    }
  }, [])

  const handleSubmitFault = useCallback(() => {
    if (!faultType) {
      Toast.show('请选择故障类型')
      return
    }
    setFaultRecords(prev => [
      ...prev,
      {
        type: faultType,
        desc: faultDesc,
        step: 0,
        time: new Date().toLocaleTimeString(),
      },
    ])
    setFaultType('')
    setFaultDesc('')
    setShowFaultPanel(false)
    Toast.show({ icon: 'success', content: '故障已上报' })
  }, [faultType, faultDesc])

  const socDeg = (soc / 100) * 360
  const minPower = Math.min(...powerHistory)
  const maxPower = Math.max(...powerHistory)
  const powerRange = maxPower - minPower || 1

  return (
    <div className="charging-page">
      <NavBar>充电中</NavBar>

      <div className="charging-hero">
        <div className="soc-ring-wrap">
          <div
            className="soc-ring"
            style={{
              background: `conic-gradient(#00d68f ${socDeg}deg, rgba(255,255,255,0.2) ${socDeg}deg)`,
            }}
          >
            <div className="soc-ring-inner">
              <SetOutline className="soc-icon" />
              <span className="soc-value">{Math.round(soc)}%</span>
              <span className="soc-label">SOC</span>
            </div>
          </div>
        </div>
        <div className="station-name">{stationName}</div>
        <div className="mode-tag-row">
          <Tag color="primary">{mode}</Tag>
          <Tag color="default">{voltage}V / {current}A</Tag>
        </div>
      </div>

      <Space direction="vertical" block className="charging-body">
        <Card>
          <div className="power-section">
            <div className="power-header">
              <span className="power-label">实时功率</span>
              <span className="power-value">{power}<small>kW</small></span>
            </div>
            <div className="power-chart">
              <div className="chart-grid">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="chart-grid-line" />
                ))}
              </div>
              <svg className="chart-svg" viewBox={`0 0 ${MAX_POWER_POINTS - 1} 100`} preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#00b578"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  points={powerHistory
                    .map((v, i) => `${i},${100 - ((v - minPower) / powerRange) * 90 - 5}`)
                    .join(' ')}
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card>
          <div className="data-grid">
            <div className="data-cell">
              <div className="data-label">已充电量</div>
              <div className="data-num">{charged}<small>/{totalCapacity} kWh</small></div>
            </div>
            <div className="data-cell">
              <div className="data-label"><ClockCircleOutline /> 充电时长</div>
              <div className="data-num">{formatDuration(duration)}</div>
            </div>
            <div className="data-cell">
              <div className="data-label">预计剩余</div>
              <div className="data-num">{estimatedMinutes}<small>分钟</small></div>
            </div>
            <div className="data-cell">
              <div className="data-label"><CollectMoneyOutline /> 总费用</div>
              <div className="data-num">¥{totalCost}</div>
            </div>
          </div>
          <div className="cost-detail">
            <span>电费 ¥{elecCost}</span>
            <span>服务费 ¥{serviceCost}</span>
          </div>
        </Card>

        <Card>
          <div className="section-title">桩枪信息</div>
          <div className="info-rows">
            <div className="info-row"><span>桩编号</span><span>{pileNo}</span></div>
            <div className="info-row"><span>枪号</span><span>{gunNo}</span></div>
            <div className="info-row"><span>运营商</span><span>{operator}</span></div>
            <div className="info-row"><span>协议类型</span><span>{protocol}</span></div>
          </div>
        </Card>

        <Card onClick={() => setShowFaultPanel(!showFaultPanel)}>
          <div className="fault-entry">
            <span>故障上报</span>
            <RightOutline />
          </div>
        </Card>

        {showFaultPanel && (
          <Card className="fault-panel">
            <div className="section-title">故障上报</div>
            <div className="fault-types">
              {FAULT_TYPES.map(t => (
                <Tag
                  key={t}
                  color={faultType === t ? 'danger' : 'default'}
                  onClick={() => setFaultType(t)}
                  className="fault-tag"
                >
                  {t}
                </Tag>
              ))}
            </div>
            <TextArea
              placeholder="请描述故障详情..."
              value={faultDesc}
              onChange={setFaultDesc}
              rows={3}
              className="fault-textarea"
            />
            <Button block color="danger" size="small" onClick={handleSubmitFault}>
              提交故障上报
            </Button>
          </Card>
        )}

        {faultRecords.length > 0 && (
          <Card>
            <div className="section-title">上报记录</div>
            {faultRecords.map((r, i) => (
              <div key={i} className="fault-record">
                <div className="fault-record-head">
                  <Tag color="danger">{r.type}</Tag>
                  <span className="fault-record-time">{r.time}</span>
                </div>
                <div className="fault-record-steps">
                  {FAULT_STEPS.map((s, si) => (
                    <span key={s} className={`fault-step ${si <= r.step ? 'active' : ''}`}>
                      {s}{si < FAULT_STEPS.length - 1 ? ' → ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        )}
      </Space>

      <div className="charging-footer">
        <Button block color="danger" size="large" onClick={handleStopCharging}>
          结束充电
        </Button>
      </div>
    </div>
  )
}

export default Charging
