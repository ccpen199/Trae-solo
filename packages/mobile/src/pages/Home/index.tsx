import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar, SearchBar, Tabs, Card, Tag, Space } from 'antd-mobile'
import { LocationOutline, StarOutline, RightOutline } from 'antd-mobile-icons'
import { highways, cities, stations, operatorColors, protocolColors } from '../../mock/stations'
import './index.css'

function Home() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [selectedHighway, setSelectedHighway] = useState('G1')
  const [selectedCity, setSelectedCity] = useState('北京')
  const [selectedDistrict, setSelectedDistrict] = useState('')

  const filteredStations = stations.filter(s => {
    if (activeTab === 'all') return true
    if (activeTab === 'highway') return s.type === 'highway' && s.highway === selectedHighway
    if (activeTab === 'city') {
      if (!s.city) return false
      if (s.city !== selectedCity) return false
      if (selectedDistrict && s.district !== selectedDistrict) return false
      return true
    }
    return true
  })

  const currentCity = cities.find(c => c.name === selectedCity)

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return '#ff3141'
    if (rate >= 50) return '#ff8f1f'
    return '#00b578'
  }

  return (
    <div className="home-page">
      <NavBar back={null}>
        <div className="nav-title">
          <LocationOutline />
          <span>北京市</span>
        </div>
      </NavBar>

      <div className="search-section">
        <SearchBar placeholder="搜索充电站/地址" />
      </div>

      <Tabs activeKey={activeTab} onChange={key => setActiveTab(key)} className="scene-tabs">
        <Tabs.Tab title="全部" key="all" />
        <Tabs.Tab title="高速网络" key="highway" />
        <Tabs.Tab title="城市公共桩" key="city" />
      </Tabs>

      {activeTab === 'highway' && (
        <div className="highway-selector">
          <div className="highway-label">十横十纵两环</div>
          <div className="highway-list">
            {highways.map(hw => (
              <div
                key={hw.code}
                className={selectedHighway === hw.code ? 'highway-tag active' : 'highway-tag'}
                onClick={() => setSelectedHighway(hw.code)}
              >
                <span className="hw-code">{hw.code}</span>
                <span className="hw-name">{hw.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'city' && (
        <div className="city-selector">
          <div className="city-row">
            {cities.map(c => (
              <div
                key={c.name}
                className={selectedCity === c.name ? 'city-tag active' : 'city-tag'}
                onClick={() => { setSelectedCity(c.name); setSelectedDistrict('') }}
              >
                {c.name}
              </div>
            ))}
          </div>
          <div className="district-row">
            <div
              className={!selectedDistrict ? 'district-tag active' : 'district-tag'}
              onClick={() => setSelectedDistrict('')}
            >
              全部
            </div>
            {currentCity?.districts.map(d => (
              <div
                key={d}
                className={selectedDistrict === d ? 'district-tag active' : 'district-tag'}
                onClick={() => setSelectedDistrict(d)}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stations-section">
        <div className="section-header">
          <h3>
            {activeTab === 'highway'
              ? `${selectedHighway}沿线充电站`
              : activeTab === 'city'
              ? `${selectedCity}充电站`
              : '附近充电站'}
          </h3>
          <span className="station-count">{filteredStations.length}个站点</span>
        </div>

        <Space direction="vertical" block>
          {filteredStations.map(station => (
            <Card
              key={station.id}
              className="station-card"
              onClick={() => navigate(`/station/${station.id}`)}
            >
              <div className="station-header">
                <span className="station-name">{station.name}</span>
                <Tag
                  color={operatorColors[station.operator]}
                  className="operator-tag"
                >
                  {station.operator}
                </Tag>
              </div>

              <div className="station-tags">
                <Tag
                  fill="outline"
                  style={{
                    color: protocolColors[station.protocol],
                    borderColor: protocolColors[station.protocol],
                  }}
                >
                  {station.protocol}
                </Tag>
                {station.inspectionStatus === '有异常' && (
                  <Tag color="danger" className="inspection-tag">巡检异常</Tag>
                )}
              </div>

              <div className="station-meta">
                <span className="meta-item">
                  <LocationOutline /> {station.distance}
                </span>
                <span className="meta-item">
                  <StarOutline /> {station.rating}
                </span>
              </div>

              <div className="gun-status">
                <span className="gun-idle">🟢 空闲{station.guns.idle}</span>
                <span className="gun-charging">🔵 充电中{station.guns.charging}</span>
                <span className="gun-fault">🔴 故障{station.guns.fault}</span>
                <span className="gun-offline">⚫ 离线{station.guns.offline}</span>
              </div>

              <div className="occupancy-section">
                <div className="occupancy-header">
                  <span className="occupancy-label">实时占用率</span>
                  <span className="occupancy-value" style={{ color: getOccupancyColor(station.occupancyRate) }}>
                    {station.occupancyRate}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${station.occupancyRate}%`,
                      background: getOccupancyColor(station.occupancyRate),
                    }}
                  />
                </div>
              </div>

              <div className="station-footer">
                <div className="station-price">
                  <span>电费 ¥{station.electricityPrice}/度</span>
                  <span className="price-divider">|</span>
                  <span>服务费 ¥{station.servicePrice}/度</span>
                </div>
                <span className="fault-report-link">
                  故障上报 <RightOutline />
                </span>
              </div>
            </Card>
          ))}
        </Space>
      </div>
    </div>
  )
}

export default Home
