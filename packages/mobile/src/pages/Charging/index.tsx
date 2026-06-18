import { NavBar, Button, Card, Space, Tag } from 'antd-mobile'
import { SetOutline, ClockCircleOutline, CollectMoneyOutline } from 'antd-mobile-icons'
import './index.css'

function Charging() {
  const chargingData = {
    stationName: '国家电网充电站(朝阳公园)',
    pileNo: 'A-03',
    startTime: '14:30',
    duration: '45分钟',
    charged: 32.5,
    totalCapacity: 60,
    currentPower: 45.6,
    estimatedTime: '约25分钟充满',
    cost: 28.65,
    batteryPercent: 68
  }

  return (
    <div className="charging-page">
      <NavBar>充电中</NavBar>

      <div className="charging-status-card">
        <div className="charging-indicator">
          <div className="charging-ring">
            <div className="charging-inner">
              <SetOutline className="charging-icon" />
              <span className="charging-percent">{chargingData.batteryPercent}%</span>
              <span className="charging-status-text">充电中</span>
            </div>
          </div>
        </div>

        <div className="station-info">
          <h3>{chargingData.stationName}</h3>
          <p>枪头编号：{chargingData.pileNo}</p>
        </div>
      </div>

      <Space direction="vertical" block className="info-section">
        <Card>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">已充电</div>
              <div className="info-value">{chargingData.charged}<span>kWh</span></div>
            </div>
            <div className="info-item">
              <div className="info-label">当前功率</div>
              <div className="info-value">{chargingData.currentPower}<span>kW</span></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">
                <ClockCircleOutline /> 充电时长
              </div>
              <div className="info-value">{chargingData.duration}</div>
            </div>
            <div className="info-item">
              <div className="info-label">
                <CollectMoneyOutline /> 预计费用
              </div>
              <div className="info-value">¥{chargingData.cost}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="battery-section">
            <div className="battery-header">
              <span>电池容量</span>
              <span>{chargingData.charged}/{chargingData.totalCapacity} kWh</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.round((chargingData.charged / chargingData.totalCapacity) * 100)}%` }}
              />
            </div>
            <div className="estimated-time">
              <Tag color="warning">{chargingData.estimatedTime}</Tag>
            </div>
          </div>
        </Card>
      </Space>

      <div className="action-buttons">
        <Button block color="danger" size="large">
          结束充电
        </Button>
      </div>
    </div>
  )
}

export default Charging
