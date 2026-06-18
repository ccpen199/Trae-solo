import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar, SearchBar, Tabs, Card, Tag, Space, Dialog, Toast } from 'antd-mobile'
import { LocationOutline, StarOutline, SetOutline, ClockCircleOutline, CollectMoneyOutline, MessageOutline } from 'antd-mobile-icons'
import { highways, cities, stations as stationsData, operatorColors, protocolColors } from '../../mock/stations'
import './index.css'

function Home() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [selectedHighway, setSelectedHighway] = useState('G1')
  const [selectedCity, setSelectedCity] = useState('北京')
  const [selectedDistrict, setSelectedDistrict] = useState('')

  const totalFaults = useMemo(() => stationsData.reduce((s, st) => s + st.guns.fault, 0), [])
  const totalOfflines = useMemo(() => stationsData.reduce((s, st) => s + st.guns.offline, 0), [])
  const inspectionAbnormal = useMemo(() => stationsData.filter(s => s.inspectionStatus === '有异常').length, [])
  const totalStations = stationsData.length
  const totalGuns = useMemo(() => stationsData.reduce((s, st) => s + st.guns.idle + st.guns.charging + st.guns.fault + st.guns.offline, 0), [])
  const totalIdleGuns = useMemo(() => stationsData.reduce((s, st) => s + st.guns.idle, 0), [])
  const todayOrders = 326
  const pendingOrders = 12
  const todayFixed = 28

  const currentCity = cities.find(c => c.name === selectedCity)

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return '#ff3141'
    if (rate >= 50) return '#ff8f1f'
    return '#00b578'
  }

  const highwayLengthMap: Record<string, number> = {
    G1: 1209, G2: 1262, G4: 2272, G5: 2865, G6: 3718,
    G15: 3710, G20: 1610, G30: 4395, G36: 722, G50: 1900,
  }

  const highwayStations = useMemo(() => stationsData.filter(s => s.type === 'highway' && s.highway === selectedHighway), [selectedHighway])
  const highwaySummary = useMemo(() => {
    const total = highwayStations.length
    const gunsSum = highwayStations.reduce((s, st) => s + st.guns.idle + st.guns.charging + st.guns.fault + st.guns.offline, 0)
    const idleSum = highwayStations.reduce((s, st) => s + st.guns.idle, 0)
    const faultSum = highwayStations.reduce((s, st) => s + st.guns.fault, 0)
    const avgPrice = total > 0 ? (highwayStations.reduce((s, st) => s + st.electricityPrice, 0) / total).toFixed(2) : '0.00'
    const avgOccupancy = total > 0 ? Math.round(highwayStations.reduce((s, st) => s + st.occupancyRate, 0) / total) : 0
    return { total, gunsSum, idleSum, faultSum, avgPrice, avgOccupancy }
  }, [highwayStations])

  const cityStations = useMemo(() => stationsData.filter(s => s.type === 'city' && s.city === selectedCity), [selectedCity])
  const citySummary = useMemo(() => {
    const total = cityStations.length
    const gunsSum = cityStations.reduce((s, st) => s + st.guns.idle + st.guns.charging + st.guns.fault + st.guns.offline, 0)
    const idleSum = cityStations.reduce((s, st) => s + st.guns.idle, 0)
    const faultSum = cityStations.reduce((s, st) => s + st.guns.fault, 0)
    const districts = currentCity?.districts || []
    const districtCounts = districts.map(d => ({
      name: d,
      count: cityStations.filter(s => s.district === d).length,
    }))
    const maxCount = Math.max(...districtCounts.map(d => d.count), 1)
    return { total, gunsSum, idleSum, faultSum, districtCounts, maxCount, coveredDistricts: districtCounts.filter(d => d.count > 0).length }
  }, [cityStations, currentCity])

  const filteredStations = stationsData.filter(s => {
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

  const showInspectionDetail = (station: typeof stationsData[0]) => {
    Dialog.show({
      title: '巡检异常详情',
      content: (
        <div className="inspection-dialog">
          <div className="inspection-dialog-item">
            <ClockCircleOutline />
            <span>上次巡检：{station.lastInspectionTime}</span>
          </div>
          <div className="inspection-dialog-title">异常项：</div>
          {station.inspectionItems.length > 0 ? (
            station.inspectionItems.map((item, idx) => (
              <div key={idx} className="inspection-dialog-anomaly">
                <span className="anomaly-dot" />
                {item}
              </div>
            ))
          ) : (
            <div className="inspection-dialog-empty">暂无异常详情</div>
          )}
        </div>
      ),
      closeOnAction: true,
      actions: [
        [
          {
            key: 'ok',
            text: '我知道了',
            danger: false,
          },
        ],
      ],
    })
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

      <div className="overview-card">
        <div className="overview-grid">
          <div className="overview-item">
            <div className="overview-value">{totalStations}</div>
            <div className="overview-label">站点总数</div>
          </div>
          <div className="overview-item">
            <div className="overview-value">{totalGuns}</div>
            <div className="overview-label">充电桩总数</div>
          </div>
          <div className="overview-item">
            <div className="overview-value" style={{ color: '#00b578' }}>{totalIdleGuns}</div>
            <div className="overview-label">空闲充电桩</div>
          </div>
          <div className="overview-item">
            <div className="overview-value" style={{ color: '#1677ff' }}>{todayOrders}</div>
            <div className="overview-label">今日订单</div>
          </div>
        </div>
        <div className="overview-footer">
          十横十纵两环覆盖 12条高速干线 / 3大城市 / 9城区
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={key => setActiveTab(key)} className="scene-tabs">
        <Tabs.Tab title="全部" key="all" />
        <Tabs.Tab title="高速网络" key="highway" />
        <Tabs.Tab title="城市公共桩" key="city" />
      </Tabs>

      <div className="alert-scroll">
        <div
          className="alert-card alert-danger"
          onClick={() => Toast.show('查看告警详情')}
        >
          <div className="alert-icon">🔴</div>
          <div className="alert-info">
            <div className="alert-value">{totalFaults}</div>
            <div className="alert-label">故障桩总数</div>
          </div>
        </div>
        <div
          className="alert-card alert-offline"
          onClick={() => Toast.show('查看告警详情')}
        >
          <div className="alert-icon">⚫</div>
          <div className="alert-info">
            <div className="alert-value">{totalOfflines}</div>
            <div className="alert-label">离线桩总数</div>
          </div>
        </div>
        <div
          className="alert-card alert-warning"
          onClick={() => Toast.show('查看告警详情')}
        >
          <div className="alert-icon">🟡</div>
          <div className="alert-info">
            <div className="alert-value">{inspectionAbnormal}</div>
            <div className="alert-label">巡检异常站</div>
          </div>
        </div>
        <div
          className="alert-card alert-pending"
          onClick={() => Toast.show('查看告警详情')}
        >
          <div className="alert-icon">📋</div>
          <div className="alert-info">
            <div className="alert-value">{pendingOrders}</div>
            <div className="alert-label">未处理工单</div>
          </div>
        </div>
        <div
          className="alert-card alert-fixed"
          onClick={() => Toast.show('查看告警详情')}
        >
          <div className="alert-icon">🔧</div>
          <div className="alert-info">
            <div className="alert-value">{todayFixed}</div>
            <div className="alert-label">今日已修复</div>
          </div>
        </div>
      </div>

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

      {activeTab === 'highway' && (
        <div className="summary-panel">
          <div className="summary-header">
            <div className="summary-title">
              <span className="summary-icon">🛣️</span>
              <span>{selectedHighway} {highways.find(h => h.code === selectedHighway)?.name}</span>
            </div>
          </div>
          <div className="summary-stats">
            <div className="summary-stat">
              <div className="summary-stat-value">{highwayLengthMap[selectedHighway] || 1000}km</div>
              <div className="summary-stat-label">线路全长</div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-value">{highwaySummary.total}</div>
              <div className="summary-stat-label">服务区站数</div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-value">{highwaySummary.gunsSum}</div>
              <div className="summary-stat-label">充电桩总数</div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-value" style={{ color: '#00b578' }}>{highwaySummary.idleSum}</div>
              <div className="summary-stat-label">空闲数</div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-value" style={{ color: '#ff3141' }}>{highwaySummary.faultSum}</div>
              <div className="summary-stat-label">故障数</div>
            </div>
          </div>
          <div className="summary-extra">
            <div className="summary-extra-item">
              <CollectMoneyOutline />
              <span>平均电价 ¥{highwaySummary.avgPrice}/度</span>
            </div>
          </div>
          <div className="summary-occupancy">
            <div className="summary-occupancy-header">
              <span>实时占用率平均</span>
              <span style={{ color: getOccupancyColor(highwaySummary.avgOccupancy), fontWeight: 600 }}>{highwaySummary.avgOccupancy}%</span>
            </div>
            <div className="summary-occupancy-bar">
              <div
                className="summary-occupancy-fill"
                style={{
                  width: `${highwaySummary.avgOccupancy}%`,
                  background: getOccupancyColor(highwaySummary.avgOccupancy),
                }}
              />
            </div>
            <div className="summary-occupancy-status">
              <span className={`status-dot ${highwaySummary.avgOccupancy >= 80 ? 'status-red' : highwaySummary.avgOccupancy >= 50 ? 'status-orange' : 'status-green'}`} />
              <span>{highwaySummary.avgOccupancy >= 80 ? '紧张' : highwaySummary.avgOccupancy >= 50 ? '较忙' : '充足'}</span>
            </div>
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

      {activeTab === 'city' && (
        <div className="summary-panel">
          <div className="summary-header">
            <div className="summary-title">
              <span className="summary-icon">🏙️</span>
              <span>{selectedCity}</span>
            </div>
          </div>
          <div className="summary-stats">
            <div className="summary-stat">
              <div className="summary-stat-value">{citySummary.coveredDistricts}</div>
              <div className="summary-stat-label">覆盖城区</div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-value">{citySummary.total}</div>
              <div className="summary-stat-label">场站总数</div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-value">{citySummary.gunsSum}</div>
              <div className="summary-stat-label">充电桩总数</div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-value" style={{ color: '#00b578' }}>{citySummary.idleSum}</div>
              <div className="summary-stat-label">空闲数</div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-value" style={{ color: '#ff3141' }}>{citySummary.faultSum}</div>
              <div className="summary-stat-label">故障数</div>
            </div>
          </div>
          <div className="district-distribution">
            <div className="district-distribution-title">各城区站点分布</div>
            {citySummary.districtCounts.map(dc => (
              <div key={dc.name} className="district-bar-row">
                <span className="district-bar-label">{dc.name}</span>
                <div className="district-bar-track">
                  <div
                    className="district-bar-fill"
                    style={{ width: `${(dc.count / citySummary.maxCount) * 100}%` }}
                  />
                </div>
                <span className="district-bar-count">{dc.count}站</span>
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
                  <Tag
                    color="danger"
                    className="inspection-tag"
                    onClick={(e) => {
                      e.stopPropagation()
                      showInspectionDetail(station)
                    }}
                  >
                    巡检异常
                  </Tag>
                )}
              </div>

              <div className="station-meta">
                <span className="meta-item">
                  <LocationOutline /> {station.distance}
                </span>
                <span className="meta-item">
                  <StarOutline /> {station.rating}
                </span>
                <span className="meta-item">
                  <ClockCircleOutline /> {station.businessHours}
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

              {(station.guns.fault > 0 || station.guns.offline > 0) && (
                <div className="alert-processing">
                  <MessageOutline />
                  <span>告警处理中 {station.guns.fault + station.guns.offline}项</span>
                </div>
              )}

              <div className="station-footer">
                <div className="station-price">
                  <span>电费 ¥{station.electricityPrice}/度</span>
                  <span className="price-divider">|</span>
                  <span>服务费 ¥{station.servicePrice}/度</span>
                </div>
                <span
                  className="work-order-link"
                  onClick={(e) => {
                    e.stopPropagation()
                    Toast.show(`处理工单 #WO${station.id.toUpperCase()}`)
                  }}
                >
                  <SetOutline />
                  查看处理工单
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
