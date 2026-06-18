import { useState } from 'react'
import { NavBar, Card, Tag, Space, List, Button, Switch, Input, Toast } from 'antd-mobile'
import { SetOutline, ClockCircleOutline, CollectMoneyOutline, RightOutline } from 'antd-mobile-icons'
import './index.css'

const STRATEGIES = [
  {
    id: 'peak-valley',
    name: '削峰填谷策略',
    desc: '低谷充电、高峰放电，平衡电网负荷',
    chargeStart: '00:00',
    chargeEnd: '06:00',
    dischargeStart: '17:00',
    dischargeEnd: '21:00',
    targetSoc: 80,
    minSoc: 20,
    maxPower: 7,
    enabled: true,
  },
  {
    id: 'emergency',
    name: '应急备用策略',
    desc: '停电时自动切换为家庭供电',
    chargeStart: '22:00',
    chargeEnd: '06:00',
    dischargeStart: '',
    dischargeEnd: '',
    targetSoc: 100,
    minSoc: 30,
    maxPower: 7,
    enabled: false,
  },
  {
    id: 'economic',
    name: '经济最大化策略',
    desc: '根据电价差自动充放电，收益最大化',
    chargeStart: '00:00',
    chargeEnd: '06:00',
    dischargeStart: '17:00',
    dischargeEnd: '21:00',
    targetSoc: 90,
    minSoc: 10,
    maxPower: 11,
    enabled: false,
  },
]

const TRANSACTIONS = [
  { id: 1, date: '2026-06-17', type: '放电', energy: 15.2, income: 18.24 },
  { id: 2, date: '2026-06-17', type: '充电', energy: 20.0, income: -8.00 },
  { id: 3, date: '2026-06-16', type: '放电', energy: 12.8, income: 15.36 },
  { id: 4, date: '2026-06-16', type: '充电', energy: 18.5, income: -7.40 },
  { id: 5, date: '2026-06-15', type: '放电', energy: 10.0, income: 12.00 },
]

function V2G() {
  const [vin, setVin] = useState('')
  const [plate, setPlate] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [strategyList, setStrategyList] = useState(STRATEGIES)

  const handleAuthenticate = () => {
    if (!vin || vin.length !== 17) {
      Toast.show('请输入17位VIN码')
      return
    }
    if (!plate) {
      Toast.show('请输入车牌号')
      return
    }
    setAuthenticated(true)
    Toast.show({ icon: 'success', content: '认证成功，已开启即插即充' })
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const updateStrategy = (id: string, field: string, value: string | number | boolean) => {
    setStrategyList(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const activeStrategy = strategyList.find(s => s.enabled)

  return (
    <div className="v2g-page">
      <NavBar>V2G充放电策略</NavBar>

      <Space direction="vertical" block className="v2g-body">
        <Card className="auth-card">
          <div className="auth-header">
            <span className="auth-title">车辆认证</span>
            {authenticated ? (
              <Tag color="success">已认证</Tag>
            ) : (
              <Tag color="default">未认证</Tag>
            )}
          </div>
          <div className="auth-fields">
            <div className="auth-field">
              <label>VIN码</label>
              <Input
                placeholder="17位车辆识别号"
                maxLength={17}
                value={vin}
                onChange={setVin}
                disabled={authenticated}
                clearable
              />
            </div>
            <div className="auth-field">
              <label>车牌号</label>
              <Input
                placeholder="如京A12345"
                value={plate}
                onChange={setPlate}
                disabled={authenticated}
                clearable
              />
            </div>
          </div>
          {authenticated && (
            <div className="auth-tip">
              <SetOutline /> 已开启即插即充，插枪自动识别，无需扫码
            </div>
          )}
          {!authenticated && (
            <Button
              block
              color="primary"
              size="small"
              onClick={handleAuthenticate}
              className="auth-btn"
            >
              认证车辆
            </Button>
          )}
        </Card>

        <Card className="status-card">
          <div className="status-header">
            <span className="status-title">运行状态</span>
            {activeStrategy ? (
              <Tag color="success">运行中</Tag>
            ) : (
              <Tag color="default">未启动</Tag>
            )}
          </div>
          <div className="status-strategy-name">
            {activeStrategy ? activeStrategy.name : '暂无活跃策略'}
          </div>
          <div className="status-metrics">
            <div className="metric-item">
              <div className="metric-label">实时功率</div>
              <div className="metric-value charging">+6.8<small>kW</small></div>
              <div className="metric-sub">充电中</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">今日收益</div>
              <div className="metric-value income">¥18.24</div>
              <div className="metric-sub">累计 ¥158.60</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">充放电次数</div>
              <div className="metric-value">32</div>
              <div className="metric-sub">充16 / 放16</div>
            </div>
          </div>
          <div className="battery-status">
            <div className="battery-row">
              <span className="battery-label">SOC</span>
              <div className="battery-bar-wrap">
                <div className="battery-bar">
                  <div className="battery-bar-fill" style={{ width: '65%' }} />
                </div>
                <span className="battery-val">65%</span>
              </div>
            </div>
            <div className="battery-row">
              <span className="battery-label">温度</span>
              <div className="battery-bar-wrap">
                <div className="battery-bar temp">
                  <div className="battery-bar-fill temp" style={{ width: '40%' }} />
                </div>
                <span className="battery-val">28°C</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="strategies-card">
          <div className="section-title">策略模板</div>
          <Space direction="vertical" block>
            {strategyList.map(strategy => (
              <div
                key={strategy.id}
                className={`strategy-block ${strategy.enabled ? 'active' : ''} ${expandedId === strategy.id ? 'expanded' : ''}`}
              >
                <div className="strategy-summary" onClick={() => toggleExpand(strategy.id)}>
                  <div className="strategy-left">
                    <div className="strategy-name">
                      {strategy.name}
                      {strategy.enabled && <Tag color="success" className="strategy-tag">启用</Tag>}
                    </div>
                    <div className="strategy-desc">{strategy.desc}</div>
                  </div>
                  <div className="strategy-right">
                    <Switch
                      checked={strategy.enabled}
                      onChange={(val) => {
                        updateStrategy(strategy.id, 'enabled', val)
                      }}
                    />
                    <RightOutline className={`expand-arrow ${expandedId === strategy.id ? 'rotated' : ''}`} />
                  </div>
                </div>

                {expandedId === strategy.id && (
                  <div className="strategy-detail">
                    <List>
                      <List.Item extra={
                        <Space align="center">
                          <Input
                            value={strategy.chargeStart}
                            onChange={v => updateStrategy(strategy.id, 'chargeStart', v)}
                            className="time-input"
                          />
                          <span>-</span>
                          <Input
                            value={strategy.chargeEnd}
                            onChange={v => updateStrategy(strategy.id, 'chargeEnd', v)}
                            className="time-input"
                          />
                        </Space>
                      }>
                        <ClockCircleOutline /> 充电时段
                      </List.Item>
                      <List.Item extra={
                        <Space align="center">
                          <Input
                            value={strategy.dischargeStart}
                            onChange={v => updateStrategy(strategy.id, 'dischargeStart', v)}
                            className="time-input"
                          />
                          <span>-</span>
                          <Input
                            value={strategy.dischargeEnd}
                            onChange={v => updateStrategy(strategy.id, 'dischargeEnd', v)}
                            className="time-input"
                          />
                        </Space>
                      }>
                        <ClockCircleOutline /> 放电时段
                      </List.Item>
                      <List.Item extra={
                        <Space align="center">
                          <Input
                            value={String(strategy.targetSoc)}
                            onChange={v => updateStrategy(strategy.id, 'targetSoc', Number(v) || 0)}
                            className="num-input"
                          />
                          <span>%</span>
                        </Space>
                      }>
                        目标SOC
                      </List.Item>
                      <List.Item extra={
                        <Space align="center">
                          <Input
                            value={String(strategy.minSoc)}
                            onChange={v => updateStrategy(strategy.id, 'minSoc', Number(v) || 0)}
                            className="num-input"
                          />
                          <span>%</span>
                        </Space>
                      }>
                        最低SOC
                      </List.Item>
                      <List.Item extra={
                        <Space align="center">
                          <Input
                            value={String(strategy.maxPower)}
                            onChange={v => updateStrategy(strategy.id, 'maxPower', Number(v) || 0)}
                            className="num-input"
                          />
                          <span>kW</span>
                        </Space>
                      }>
                        <SetOutline /> 最大功率
                      </List.Item>
                    </List>

                    {strategy.id === 'peak-valley' && (
                      <div className="strategy-extra">
                        <div className="extra-row">
                          <span>充电电价</span>
                          <Tag color="success">谷电 00:00-06:00</Tag>
                        </div>
                        <div className="extra-row">
                          <span>放电电价</span>
                          <Tag color="warning">峰电 17:00-21:00</Tag>
                        </div>
                      </div>
                    )}
                    {strategy.id === 'emergency' && (
                      <div className="strategy-extra">
                        <div className="extra-row">
                          <span>最低保留电量</span>
                          <span className="extra-val">30%</span>
                        </div>
                        <div className="extra-row">
                          <span>自动切换条件</span>
                          <Tag color="danger">停电检测</Tag>
                        </div>
                      </div>
                    )}
                    {strategy.id === 'economic' && (
                      <div className="strategy-extra">
                        <div className="extra-row">
                          <span>充电电价阈值</span>
                          <Tag color="success">&lt;0.4元/度</Tag>
                        </div>
                        <div className="extra-row">
                          <span>放电电价阈值</span>
                          <Tag color="warning">&gt;1.2元/度</Tag>
                        </div>
                        <div className="extra-row">
                          <span>充放电切换</span>
                          <Tag color="primary">自动</Tag>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </Space>
        </Card>

        <Card className="records-card">
          <div className="section-title">
            <CollectMoneyOutline /> V2G交易记录
          </div>
          {TRANSACTIONS.map(tx => (
            <div key={tx.id} className="record-item">
              <div className="record-left">
                <div className={`record-type ${tx.type === '充电' ? 'charge' : 'discharge'}`}>
                  {tx.type}
                </div>
                <div className="record-date">{tx.date}</div>
              </div>
              <div className="record-right">
                <div className="record-energy">{tx.energy} kWh</div>
                <div className={`record-income ${tx.income >= 0 ? 'positive' : 'negative'}`}>
                  {tx.income >= 0 ? '+' : ''}¥{Math.abs(tx.income).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </Card>
      </Space>
    </div>
  )
}

export default V2G
