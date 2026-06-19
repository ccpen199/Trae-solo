import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar, SearchBar, Tabs, Card, Tag, Space, Dialog, Toast } from 'antd-mobile'
import { LocationOutline, StarOutline, SetOutline, ClockCircleOutline, CollectMoneyOutline, MessageOutline, RightOutline, UserOutline } from 'antd-mobile-icons'
import { highways, cities, stations as stationsData, operatorColors, protocolColors } from '../../mock/stations'
import './index.css'

function Home() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [selectedHighway, setSelectedHighway] = useState('G1')
  const [selectedCity, setSelectedCity] = useState('北京')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedOperator, setSelectedOperator] = useState<string>('')
  const [selectedProtocol, setSelectedProtocol] = useState<string>('')
  const [selectedAbnormal, setSelectedAbnormal] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const operators = ['国网电动', '特来电', '星星充电', '小桔充电', '云快充']
  const protocols = ['国网协议', '第三方API', 'GB/T 27930']
  const abnormalTypes = [
    { key: 'fault', label: '有故障', color: '#ff3141' },
    { key: 'offline', label: '有离线', color: '#666' },
    { key: 'inspection', label: '巡检异常', color: '#ff8f1f' },
    { key: 'pending', label: '未处理工单', color: '#722ed1' },
  ]

  const totalFaults = useMemo(() => stationsData.reduce((s, st) => s + st.guns.fault, 0), [])
  const totalOfflines = useMemo(() => stationsData.reduce((s, st) => s + st.guns.offline, 0), [])
  const inspectionAbnormal = useMemo(() => stationsData.filter(s => s.inspectionStatus === '有异常').length, [])
  const totalStations = stationsData.length
  const totalGuns = useMemo(() => stationsData.reduce((s, st) => s + st.guns.idle + st.guns.charging + st.guns.fault + st.guns.offline, 0), [])
  const totalIdleGuns = useMemo(() => stationsData.reduce((s, st) => s + st.guns.idle, 0), [])
  const todayOrders = 326
  const pendingOrders = 12
  const todayFixed = 28

  const totalDistricts = cities.reduce((s, c) => s + c.districts.length, 0)

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

  const filteredStations = useMemo(() => {
    return stationsData.filter(s => {
      if (activeTab === 'highway' && (s.type !== 'highway' || s.highway !== selectedHighway)) return false
      if (activeTab === 'city') {
        if (s.type !== 'city') return false
        if (s.city !== selectedCity) return false
        if (selectedDistrict && s.district !== selectedDistrict) return false
      }
      if (selectedOperator && s.operator !== selectedOperator) return false
      if (selectedProtocol && s.protocol !== selectedProtocol) return false
      if (selectedAbnormal === 'fault' && s.guns.fault === 0) return false
      if (selectedAbnormal === 'offline' && s.guns.offline === 0) return false
      if (selectedAbnormal === 'inspection' && s.inspectionStatus !== '有异常') return false
      if (selectedAbnormal === 'pending' && s.guns.fault === 0 && s.guns.offline === 0 && s.inspectionStatus !== '有异常') return false
      if (searchKeyword && !s.name.includes(searchKeyword) && !s.address.includes(searchKeyword)) return false
      return true
    })
  }, [activeTab, selectedHighway, selectedCity, selectedDistrict, selectedOperator, selectedProtocol, selectedAbnormal, searchKeyword])

  const handleAlertClick = (type: string) => {
    setActiveTab('all')
    setSelectedOperator('')
    setSelectedProtocol('')
    if (type === 'fault') {
      setSelectedAbnormal('fault')
      Toast.show('已筛选有故障的站点')
    } else if (type === 'offline') {
      setSelectedAbnormal('offline')
      Toast.show('已筛选有离线桩的站点')
    } else if (type === 'inspection') {
      setSelectedAbnormal('inspection')
      Toast.show('已筛选巡检异常的站点')
    } else if (type === 'pending') {
      setSelectedAbnormal('pending')
      Toast.show('已筛选有未处理工单的站点')
    } else {
      setSelectedAbnormal('')
      Toast.show('已筛选今日已修复的站点')
    }
  }

  const showInspectionDetail = (station: typeof stationsData[0]) => {
    Dialog.show({
      title: '巡检异常详情',
      content: (
        <div className="inspection-dialog">
          <div className="inspection-dialog-item">
            <ClockCircleOutline />
            <span>上次巡检：{station.lastInspectionTime}</span>
          </div>
          <div className="inspection-dialog-item">
            <SetOutline />
            <span>巡检单号：INSP202606180023</span>
          </div>
          <div className="inspection-dialog-item">
            <MessageOutline />
            <span>巡检员：巡检组-刘师傅</span>
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
          <div className="inspection-dialog-title">处理建议：</div>
          <div className="inspection-dialog-anomaly">
            <span className="anomaly-dot suggestion" />
            建议48小时内安排场站驻场更换磨损部件，关联工单已自动创建
          </div>
        </div>
      ),
      closeOnAction: true,
      actions: [
        [
          {
            key: 'view',
            text: '查看处理工单',
            primary: true,
            onClick: () => {
              navigate(`/station/${station.id}`)
            },
          },
          {
            key: 'ok',
            text: '我知道了',
          },
        ],
      ],
    })
  }

  const showNetworkMap = () => {
    Dialog.show({
      title: '十横十纵两环 线路覆盖图',
      content: (
        <div className="network-map-dialog">
          <div className="network-map-legend">
            <div className="legend-item"><span className="legend-dot h" />横线</div>
            <div className="legend-item"><span className="legend-dot v" />纵线</div>
            <div className="legend-item"><span className="legend-dot r" />环线</div>
          </div>
          <div className="network-map">
            <div className="map-row">
              <div className="map-line h-line h1"></div>
              <div className="map-label">G10 绥满</div>
            </div>
            <div className="map-row">
              <div className="map-line h-line h2"></div>
              <div className="map-label">G20 青银</div>
            </div>
            <div className="map-row">
              <div className="map-line h-line h3"></div>
              <div className="map-label">G30 连霍</div>
            </div>
            <div className="map-row">
              <div className="map-line h-line h4"></div>
              <div className="map-label">G40 沪陕</div>
            </div>
            <div className="map-row">
              <div className="map-line h-line h5"></div>
              <div className="map-label">G50 沪渝</div>
            </div>
            <div className="map-row">
              <div className="map-vlines">
                <div className="map-line v-line v1"></div>
                <div className="map-line v-line v2"></div>
                <div className="map-line v-line v3"></div>
                <div className="map-line v-line v4"></div>
                <div className="map-line v-line v5"></div>
              </div>
              <div className="v-labels">
                <span>G1</span><span>G2</span><span>G4</span><span>G5</span><span>G6</span>
              </div>
            </div>
            <div className="map-row ring-row">
              <div className="map-ring">
                <div className="ring-outer"></div>
                <div className="ring-inner"></div>
              </div>
              <div className="ring-labels">
                <div>北京六环</div>
                <div>上海外环</div>
                <div>广州绕城</div>
              </div>
            </div>
          </div>
          <div className="network-summary">
            <div className="summary-row">
              <span>十横：</span><span>G10/G12/G16/G18/G20/G22/G30/G36/G40/G50</span>
            </div>
            <div className="summary-row">
              <span>十纵：</span><span>G1/G2/G3/G4/G5/G6/G7/G11/G15/G35</span>
            </div>
            <div className="summary-row">
              <span>两环：</span><span>北京六环、上海外环 / 广州绕城</span>
            </div>
            <div className="summary-row">
              <span>覆盖：</span><span>{highways.length}条高速干线 / {cities.length}大城市 / {totalDistricts}城区 / {totalStations}个充电站</span>
            </div>
          </div>
        </div>
      ),
      closeOnAction: true,
      actions: [[{ key: 'ok', text: '我知道了', primary: true }]],
    })
  }

  const goToRoute = () => navigate('/route')
  const goToV2G = () => navigate('/v2g')
  const goToCharging = () => navigate('/charging')
  const goToCommunity = () => navigate('/community')

  const clearFilters = () => {
    setSelectedOperator('')
    setSelectedProtocol('')
    setSelectedAbnormal('')
    setSearchKeyword('')
  }

  const hasActiveFilters = selectedOperator || selectedProtocol || selectedAbnormal

  return (
    <div className="home-page">
      <NavBar back={null}>
        <div className="nav-title">
          <LocationOutline />
          <span>北京市</span>
        </div>
      </NavBar>

      <div className="search-section">
        <SearchBar
          placeholder="搜索充电站/地址"
          value={searchKeyword}
          onChange={setSearchKeyword}
        />
      </div>

      <div className="quick-entry-section">
        <div className="quick-entry-grid">
          <div className="quick-entry-item" onClick={goToRoute}>
            <div className="quick-entry-icon route">🛣️</div>
            <div className="quick-entry-label">跨城补能</div>
          </div>
          <div className="quick-entry-item" onClick={goToCharging}>
            <div className="quick-entry-icon charging">⚡</div>
            <div className="quick-entry-label">实时充电</div>
          </div>
          <div className="quick-entry-item" onClick={goToV2G}>
            <div className="quick-entry-icon v2g">🔋</div>
            <div className="quick-entry-label">V2G认证</div>
          </div>
          <div className="quick-entry-item" onClick={goToCommunity}>
            <div className="quick-entry-icon community">💬</div>
            <div className="quick-entry-label">车友社区</div>
          </div>
        </div>
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
        <div className="overview-footer" onClick={showNetworkMap}>
          <span className="map-icon">🗺️</span>
          <span>十横十纵两环覆盖 {highways.length}条高速干线 / {cities.length}大城市 / {totalDistricts}城区</span>
          <RightOutline className="footer-arrow" />
        </div>
      </div>

      <div className="alert-scroll">
        <div
          className="alert-card alert-danger"
          onClick={() => handleAlertClick('fault')}
        >
          <div className="alert-icon">🔴</div>
          <div className="alert-info">
            <div className="alert-value">{totalFaults}</div>
            <div className="alert-label">故障桩总数</div>
          </div>
        </div>
        <div
          className="alert-card alert-offline"
          onClick={() => handleAlertClick('offline')}
        >
          <div className="alert-icon">⚫</div>
          <div className="alert-info">
            <div className="alert-value">{totalOfflines}</div>
            <div className="alert-label">离线桩总数</div>
          </div>
        </div>
        <div
          className="alert-card alert-warning"
          onClick={() => handleAlertClick('inspection')}
        >
          <div className="alert-icon">🟡</div>
          <div className="alert-info">
            <div className="alert-value">{inspectionAbnormal}</div>
            <div className="alert-label">巡检异常站</div>
          </div>
        </div>
        <div
          className="alert-card alert-pending"
          onClick={() => handleAlertClick('pending')}
        >
          <div className="alert-icon">📋</div>
          <div className="alert-info">
            <div className="alert-value">{pendingOrders}</div>
            <div className="alert-label">未处理工单</div>
          </div>
        </div>
        <div
          className="alert-card alert-fixed"
          onClick={() => handleAlertClick('fixed')}
        >
          <div className="alert-icon">🔧</div>
          <div className="alert-info">
            <div className="alert-value">{todayFixed}</div>
            <div className="alert-label">今日已修复</div>
          </div>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={key => { setActiveTab(key); clearFilters() }} className="scene-tabs">
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
                onClick={() => { setSelectedHighway(hw.code); clearFilters() }}
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
            <div className="summary-route-btn" onClick={goToRoute}>
              <SetOutline />
              <span>跨城补能规划</span>
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
                onClick={() => { setSelectedCity(c.name); setSelectedDistrict(''); clearFilters() }}
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

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-label">运营商：</div>
          <div className="filter-tags">
            <div
              className={!selectedOperator ? 'filter-tag active' : 'filter-tag'}
              onClick={() => setSelectedOperator('')}
            >
              全部
            </div>
            {operators.map(op => (
              <div
                key={op}
                className={selectedOperator === op ? 'filter-tag active' : 'filter-tag'}
                style={{ borderColor: operatorColors[op], color: selectedOperator === op ? '#fff' : operatorColors[op] }}
                onClick={() => setSelectedOperator(selectedOperator === op ? '' : op)}
              >
                {op}
              </div>
            ))}
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-label">接入协议：</div>
          <div className="filter-tags">
            <div
              className={!selectedProtocol ? 'filter-tag active' : 'filter-tag'}
              onClick={() => setSelectedProtocol('')}
            >
              全部
            </div>
            {protocols.map(p => (
              <div
                key={p}
                className={selectedProtocol === p ? 'filter-tag active' : 'filter-tag'}
                style={{ borderColor: protocolColors[p], color: selectedProtocol === p ? '#fff' : protocolColors[p] }}
                onClick={() => setSelectedProtocol(selectedProtocol === p ? '' : p)}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-label">异常等级：</div>
          <div className="filter-tags">
            <div
              className={!selectedAbnormal ? 'filter-tag active' : 'filter-tag'}
              onClick={() => setSelectedAbnormal('')}
            >
              全部
            </div>
            {abnormalTypes.map(at => (
              <div
                key={at.key}
                className={selectedAbnormal === at.key ? 'filter-tag active' : 'filter-tag'}
                style={{ borderColor: at.color, color: selectedAbnormal === at.key ? '#fff' : at.color }}
                onClick={() => setSelectedAbnormal(selectedAbnormal === at.key ? '' : at.key)}
              >
                {at.label}
              </div>
            ))}
          </div>
        </div>
        {hasActiveFilters && (
          <div className="filter-clear-row">
            <span className="filter-result">筛选结果：{filteredStations.length}个站点</span>
            <span className="filter-clear" onClick={clearFilters}>清除筛选</span>
          </div>
        )}
      </div>

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

        {filteredStations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-text">没有找到符合筛选条件的站点</div>
            <div className="empty-btn" onClick={clearFilters}>清除筛选条件</div>
          </div>
        ) : (
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
                  {station.type === 'highway' && (
                    <Tag color="default" fill="outline" className="type-tag">
                      🛣️ {station.highway}
                    </Tag>
                  )}
                  {station.type === 'city' && (
                    <Tag color="default" fill="outline" className="type-tag">
                      🏙️ {station.district}
                    </Tag>
                  )}
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

                {(station.guns.fault > 0 || station.guns.offline > 0 || station.inspectionStatus === '有异常') && (
                  <div className="alert-processing">
                    <MessageOutline />
                    <span>
                      告警处理中 {station.guns.fault + station.guns.offline + (station.inspectionStatus === '有异常' ? 1 : 0)}项
                    </span>
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
                      navigate(`/station/${station.id}`)
                    }}
                  >
                    <SetOutline />
                    查看处理工单
                    <RightOutline className="wo-arrow" />
                  </span>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </div>
    </div>
  )
}

export default Home
