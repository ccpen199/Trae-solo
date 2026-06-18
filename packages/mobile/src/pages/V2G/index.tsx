import { useState } from 'react'
import { NavBar, Card, List, Switch, Slider, Button, Space, Tag } from 'antd-mobile'
import { SetOutline, CollectMoneyOutline, ClockCircleOutline } from 'antd-mobile-icons'
import './index.css'

function V2G() {
  const [v2gEnabled, setV2gEnabled] = useState(true)
  const [dischargeLimit, setDischargeLimit] = useState(30)
  const [maxPrice, setMaxPrice] = useState(1.5)

  const strategies = [
    { id: 1, name: '峰谷套利模式', desc: '低谷充电、高峰放电', active: true },
    { id: 2, name: '备用电源模式', desc: '紧急情况自动供电', active: false },
    { id: 3, name: '电网辅助服务', desc: '参与电网调频调压', active: false }
  ]

  const todayIncome = 12.5

  return (
    <div className="v2g-page">
      <NavBar>V2G策略</NavBar>

      <div className="v2g-header-card">
        <div className="v2g-status">
          <div className="status-indicator">
            <SetOutline />
            <span className={v2gEnabled ? 'status-text active' : 'status-text'}>
              {v2gEnabled ? 'V2G运行中' : 'V2G已关闭'}
            </span>
          </div>
          <Switch
            checked={v2gEnabled}
            onChange={setV2gEnabled}
            color="primary"
          />
        </div>

        <div className="income-display">
          <div className="income-item">
            <CollectMoneyOutline />
            <div className="income-info">
              <span className="income-label">今日收益</span>
              <span className="income-value">¥{todayIncome.toFixed(2)}</span>
            </div>
          </div>
          <div className="income-item">
            <ClockCircleOutline />
            <div className="income-info">
              <span className="income-label">累计收益</span>
              <span className="income-value">¥128.60</span>
            </div>
          </div>
        </div>
      </div>

      <Space direction="vertical" block className="settings-section">
        <Card title="放电设置">
          <List>
            <List.Item
              extra={`${dischargeLimit}%`}
              children={
                <div className="setting-content">
                  <span className="setting-label">最低放电电量</span>
                  <span className="setting-desc">电池剩余电量低于此值时停止放电</span>
                </div>
              }
            />
            <div className="slider-wrapper">
              <Slider
                value={dischargeLimit}
                onChange={setDischargeLimit}
                min={10}
                max={80}
                step={5}
              />
            </div>
          </List>
        </Card>

        <Card title="电价设置">
          <List>
            <List.Item
              extra={`¥${maxPrice.toFixed(2)}/度`}
              children={
                <div className="setting-content">
                  <span className="setting-label">启动卖电价格</span>
                  <span className="setting-desc">电价高于此值时开始放电</span>
                </div>
              }
            />
            <div className="slider-wrapper">
              <Slider
                value={maxPrice}
                onChange={setMaxPrice}
                min={0.5}
                max={3}
                step={0.1}
              />
            </div>
          </List>
        </Card>

        <Card title="运行策略">
          <Space direction="vertical" block>
            {strategies.map((strategy) => (
              <div key={strategy.id} className={`strategy-item ${strategy.active ? 'active' : ''}`}>
                <div className="strategy-info">
                  <div className="strategy-name">
                    {strategy.name}
                    {strategy.active && <Tag color="success">运行中</Tag>}
                  </div>
                  <div className="strategy-desc">{strategy.desc}</div>
                </div>
                <Button size="small" color={strategy.active ? 'primary' : 'default'}>
                  {strategy.active ? '已启用' : '启用'}
                </Button>
              </div>
            ))}
          </Space>
        </Card>

        <Card title="高级设置">
          <List>
            <List.Item
              extra={<Switch defaultChecked />}
              arrow={false}
            >
              智能调度
            </List.Item>
            <List.Item
              extra={<Switch />}
              arrow={false}
            >
              并网保护
            </List.Item>
            <List.Item
              extra={<Switch defaultChecked />}
              arrow={false}
            >
              充电优先
            </List.Item>
          </List>
        </Card>
      </Space>
    </div>
  )
}

export default V2G
