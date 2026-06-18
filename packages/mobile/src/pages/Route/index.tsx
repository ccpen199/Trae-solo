import { useState } from 'react'
import { NavBar, SearchBar, Button, Card, Space, List, Tag } from 'antd-mobile'
import { LocationOutline, SetOutline, ClockCircleOutline, RightOutline } from 'antd-mobile-icons'
import './index.css'

function RoutePage() {
  const [departure, setDeparture] = useState('我的位置')
  const [destination, setDestination] = useState('')

  const recommendedRoutes = [
    {
      id: 1,
      name: '推荐路线',
      totalDistance: '45.6km',
      totalTime: '1小时20分',
      chargeStops: [
        { name: '国家电网充电站(京哈高速)', chargeTime: '25分钟', distance: '20.3km' }
      ],
      isRecommended: true
    },
    {
      id: 2,
      name: '省钱路线',
      totalDistance: '52.1km',
      totalTime: '1小时35分',
      chargeStops: [
        { name: '特来电充电站(通州)', chargeTime: '30分钟', distance: '28.5km' }
      ],
      isRecommended: false
    }
  ]

  return (
    <div className="route-page">
      <NavBar>AI路径规划</NavBar>

      <div className="route-search-card">
        <div className="search-input-group">
          <div className="search-item">
            <div className="search-dot start"></div>
            <SearchBar
              placeholder="输入起点"
              value={departure}
              onChange={setDeparture}
            />
          </div>
          <div className="search-divider">
            <div className="divider-line"></div>
          </div>
          <div className="search-item">
            <div className="search-dot end"></div>
            <SearchBar
              placeholder="输入目的地"
              value={destination}
              onChange={setDestination}
            />
          </div>
        </div>
        <Button block color="primary" size="large" className="plan-btn">
          智能规划路线
        </Button>
      </div>

      <div className="map-placeholder">
        <LocationOutline className="map-icon" />
        <span>路线地图预览</span>
      </div>

      <div className="routes-section">
        <div className="section-title">推荐路线</div>
        <Space direction="vertical" block>
          {recommendedRoutes.map((route) => (
            <Card key={route.id} className={route.isRecommended ? 'route-card recommended' : 'route-card'}>
              {route.isRecommended && (
                <Tag color="primary" className="recommend-tag">推荐</Tag>
              )}
              <div className="route-header">
                <span className="route-name">{route.name}</span>
                <span className="route-distance">{route.totalDistance}</span>
              </div>
              <div className="route-time">
                <ClockCircleOutline /> {route.totalTime}
              </div>
              <div className="route-stops">
                <div className="stops-label">
                  <SetOutline /> 中途充电
                </div>
                <List>
                  {route.chargeStops.map((stop, index) => (
                    <List.Item
                      key={index}
                      extra={
                        <div className="stop-extra">
                          <span className="stop-charge-time">{stop.chargeTime}</span>
                          <RightOutline />
                        </div>
                      }
                    >
                      <div className="stop-info">
                        <span className="stop-name">{stop.name}</span>
                        <span className="stop-distance">{stop.distance}</span>
                      </div>
                    </List.Item>
                  ))}
                </List>
              </div>
              <Button block color={route.isRecommended ? 'primary' : 'default'} size="small">
                选择此路线
              </Button>
            </Card>
          ))}
        </Space>
      </div>
    </div>
  )
}

export default RoutePage
