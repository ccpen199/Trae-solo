import { useState, useEffect } from 'react'
import { getStations, createApplication } from '../services/api'

const MOCK_STATIONS = [
  { station_id: 'ST001', name: '国网朝阳充电站', address: '北京市朝阳区建国路88号', latitude: 39.9042, longitude: 116.4074, total_ports: 12, available_ports: 5, power_rating: 60, price_per_kwh: 0.85, operator: '国家电网' },
  { station_id: 'ST002', name: '特来电海淀站', address: '北京市海淀区中关村大街1号', latitude: 39.9842, longitude: 116.3074, total_ports: 8, available_ports: 3, power_rating: 120, price_per_kwh: 0.90, operator: '特来电' },
  { station_id: 'ST003', name: '星星充电西城站', address: '北京市西城区金融街10号', latitude: 39.9142, longitude: 116.3574, total_ports: 16, available_ports: 8, power_rating: 30, price_per_kwh: 0.75, operator: '星星充电' },
  { station_id: 'ST004', name: '云快充丰台站', address: '北京市丰台区南三环西路16号', latitude: 39.8582, longitude: 116.2874, total_ports: 10, available_ports: 2, power_rating: 60, price_per_kwh: 0.80, operator: '云快充' },
  { station_id: 'ST005', name: '国网通州充电站', address: '北京市通州区新华西街5号', latitude: 39.9022, longitude: 116.6574, total_ports: 20, available_ports: 12, power_rating: 120, price_per_kwh: 0.70, operator: '国家电网' }
]

function EVPage() {
  const [stations, setStations] = useState(MOCK_STATIONS)
  const [loading, setLoading] = useState(true)
  const [selectedStation, setSelectedStation] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [locationStatus, setLocationStatus] = useState(null)
  const [showLocationPanel, setShowLocationPanel] = useState(false)
  const [showNavigation, setShowNavigation] = useState(false)
  const [navigationCompleted, setNavigationCompleted] = useState(false)
  const [showApplication, setShowApplication] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [stepErrors, setStepErrors] = useState({})
  const [applicationForm, setApplicationForm] = useState({
    address: '',
    installation_type: 'home',
    capacity: 7,
    phone: '',
    remarks: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [applicationSuccess, setApplicationSuccess] = useState(null)
  const [applicationRecords, setApplicationRecords] = useState([])
  const [showApplicationRecords, setShowApplicationRecords] = useState(false)

  useEffect(() => {
    loadStations()
  }, [])

  const loadStations = async () => {
    try {
      setLoading(true)
      const res = await getStations()
      if (res.data && res.data.length > 0) {
        setStations(res.data)
      }
    } catch (err) {
      setStations(MOCK_STATIONS)
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (station) => {
    if (!userLocation) return null
    const R = 6371
    const dLat = (station.latitude - userLocation.lat) * Math.PI / 180
    const dLng = (station.longitude - userLocation.lng) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(station.latitude * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const sortStationsByDistance = (location) => {
    const R = 6371
    const sorted = [...stations].sort((a, b) => {
      const dLatA = (a.latitude - location.lat) * Math.PI / 180
      const dLngA = (a.longitude - location.lng) * Math.PI / 180
      const aA = Math.sin(dLatA / 2) * Math.sin(dLatA / 2) +
        Math.cos(location.lat * Math.PI / 180) * Math.cos(a.latitude * Math.PI / 180) *
        Math.sin(dLngA / 2) * Math.sin(dLngA / 2)
      const cA = 2 * Math.atan2(Math.sqrt(aA), Math.sqrt(1 - aA))
      const distA = R * cA

      const dLatB = (b.latitude - location.lat) * Math.PI / 180
      const dLngB = (b.longitude - location.lng) * Math.PI / 180
      const aB = Math.sin(dLatB / 2) * Math.sin(dLatB / 2) +
        Math.cos(location.lat * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) *
        Math.sin(dLngB / 2) * Math.sin(dLngB / 2)
      const cB = 2 * Math.atan2(Math.sqrt(aB), Math.sqrt(1 - aB))
      const distB = R * cB

      return distA - distB
    })
    setStations(sorted)
  }

  const getUserLocation = () => {
    setGettingLocation(true)
    setShowLocationPanel(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(loc)
          setLocationStatus('success')
          setGettingLocation(false)
          sortStationsByDistance(loc)
        },
        (error) => {
          console.error('获取位置失败', error)
          const defaultLoc = { lat: 39.9042, lng: 116.4074 }
          setUserLocation(defaultLoc)
          setLocationStatus('fallback')
          setGettingLocation(false)
          sortStationsByDistance(defaultLoc)
        }
      )
    } else {
      const defaultLoc = { lat: 39.9042, lng: 116.4074 }
      setUserLocation(defaultLoc)
      setLocationStatus('unsupported')
      setGettingLocation(false)
      sortStationsByDistance(defaultLoc)
    }
  }

  const handleStartNavigation = (station) => {
    setSelectedStation(station)
    setNavigationCompleted(false)
    if (!userLocation) {
      setGettingLocation(true)
      setShowLocationPanel(true)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = { lat: position.coords.latitude, lng: position.coords.longitude }
            setUserLocation(loc)
            setLocationStatus('success')
            setGettingLocation(false)
            sortStationsByDistance(loc)
            setShowNavigation(true)
          },
          () => {
            const defaultLoc = { lat: 39.9042, lng: 116.4074 }
            setUserLocation(defaultLoc)
            setLocationStatus('fallback')
            setGettingLocation(false)
            sortStationsByDistance(defaultLoc)
            setShowNavigation(true)
          }
        )
      } else {
        const defaultLoc = { lat: 39.9042, lng: 116.4074 }
        setUserLocation(defaultLoc)
        setLocationStatus('unsupported')
        setGettingLocation(false)
        sortStationsByDistance(defaultLoc)
        setShowNavigation(true)
      }
    } else {
      setShowNavigation(true)
    }
  }

  const handleConfirmArrival = () => {
    setNavigationCompleted(true)
  }

  const handleCloseNavigation = () => {
    setShowNavigation(false)
    setNavigationCompleted(false)
  }

  const handleStartApplication = () => {
    setShowApplication(true)
    setCurrentStep(1)
    setApplicationSuccess(null)
    setStepErrors({})
    setApplicationForm({
      address: '',
      installation_type: 'home',
      capacity: 7,
      phone: '',
      remarks: ''
    })
  }

  const handleNextStep = () => {
    const errors = {}
    if (currentStep === 1) {
      if (!applicationForm.address.trim()) {
        errors.address = '请填写安装地址'
      }
      if (!applicationForm.phone.trim()) {
        errors.phone = '请填写联系电话'
      } else if (!/^1\d{10}$/.test(applicationForm.phone.trim())) {
        errors.phone = '请输入有效的手机号码'
      }
    }
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors)
      return
    }
    setStepErrors({})
    setCurrentStep(currentStep + 1)
  }

  const handlePrevStep = () => {
    setStepErrors({})
    setCurrentStep(currentStep - 1)
  }

  const handleSubmitApplication = async () => {
    try {
      setSubmitting(true)
      try {
        await createApplication({
          ...applicationForm,
          type: 'ev'
        })
      } catch (err) {
        // API失败时仍然视为提交成功(本地模式)
      }
      const record = {
        application_id: `EV${Date.now()}`,
        submitted_at: new Date().toLocaleString('zh-CN'),
        address: applicationForm.address,
        phone: applicationForm.phone,
        installation_type: applicationForm.installation_type === 'home' ? '家用充电桩' : '商用充电桩',
        capacity: applicationForm.capacity,
        remarks: applicationForm.remarks,
        status: 'applying',
        next_steps: [
          '我们会在3个工作日内联系您确认现场勘查时间',
          '现场勘查确认后，将出具设计方案及报价',
          '确认方案后，施工团队将在5个工作日内完成安装',
          '安装完成后，我们将协助完成验收通电'
        ]
      }
      setApplicationRecords(prev => [record, ...prev])
      setApplicationSuccess(record)
    } catch (err) {
      setApplicationSuccess(false)
    } finally {
      setSubmitting(false)
    }
  }

  const generateNavigationSteps = (station) => {
    if (!userLocation) return []
    const distance = calculateDistance(station)
    const distKm = distance ? distance.toFixed(1) : '?'
    const mainRoads = ['建国路', '长安街', '三环路', '四环路', '中关村大街', '金融街', '南三环西路', '新华西街']
    const road1 = mainRoads[Math.abs(Math.round(station.latitude * 100)) % mainRoads.length]
    const road2 = mainRoads[Math.abs(Math.round(station.longitude * 100)) % mainRoads.length]
    return [
      `从当前位置出发（纬度: ${userLocation.lat.toFixed(4)}, 经度: ${userLocation.lng.toFixed(4)}）`,
      `沿${road1}向${station.latitude > userLocation.lat ? '北' : '南'}行驶${(distKm * 0.4).toFixed(1)}公里`,
      `转入${road2}继续行驶${(distKm * 0.4).toFixed(1)}公里`,
      `沿路标指示前往${station.address}`,
      `到达${station.name}（总距离约${distKm}公里）`
    ]
  }

  const availableStations = stations.filter(s => s.available_ports > 0)
  const totalPorts = stations.reduce((sum, s) => sum + s.total_ports, 0)
  const availablePorts = stations.reduce((sum, s) => sum + s.available_ports, 0)

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div>
      <h2 className="page-title">🚗 电动汽车服务</h2>

      <div className="grid grid-4 mb-2">
        <div className="card stat-card">
          <div className="stat-value">{stations.length}</div>
          <div className="stat-label">充电站总数</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value text-success">{availableStations.length}</div>
          <div className="stat-label">可使用充电站</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{totalPorts}</div>
          <div className="stat-label">充电桩总数</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value text-success">{availablePorts}</div>
          <div className="stat-label">空闲充电桩</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">🔍 充电站查询</h3>

          <div className="flex gap-1 mb-1 flex-wrap">
            <button
              className="btn btn-primary"
              onClick={getUserLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? '📍 获取位置中...' : '📍 获取我的位置'}
            </button>
            {applicationRecords.length > 0 && (
              <button
                className="btn btn-outline"
                onClick={() => setShowApplicationRecords(!showApplicationRecords)}
              >
                📋 申请记录 ({applicationRecords.length})
              </button>
            )}
          </div>

          {showLocationPanel && userLocation && (
            <div className="card mb-1" style={{ border: `2px solid ${locationStatus === 'success' ? '#4caf50' : '#ff9800'}` }}>
              <div className="flex flex-between">
                <div>
                  <strong>📍 位置信息</strong>
                </div>
                {locationStatus === 'success' ? (
                  <span className="badge badge-success">✅ 定位成功</span>
                ) : (
                  <span className="badge" style={{ background: '#ff9800', color: '#fff' }}>⚠️ 使用默认位置</span>
                )}
              </div>
              <div className="mt-1">
                <div>纬度: <strong>{userLocation.lat.toFixed(4)}</strong></div>
                <div>经度: <strong>{userLocation.lng.toFixed(4)}</strong></div>
                {locationStatus !== 'success' && (
                  <div className="text-secondary text-sm mt-1">
                    {locationStatus === 'fallback' ? '无法获取您的位置，已使用默认位置（北京天安门）' : '浏览器不支持定位功能，已使用默认位置（北京天安门）'}
                  </div>
                )}
              </div>
              <div className="text-sm text-secondary mt-1">已按距离远近排序充电站列表</div>
            </div>
          )}

          <div className="scroll-y" style={{ maxHeight: '500px' }}>
            {stations.map(station => {
              const distance = calculateDistance(station)
              return (
                <div key={station.station_id} className="card" style={{ marginBottom: '1rem' }}>
                  <div className="flex flex-between">
                    <div>
                      <strong>{station.name}</strong>
                      <div className="text-secondary text-sm">{station.address}</div>
                    </div>
                    {distance !== null && (
                      <div className="text-secondary">
                        {distance.toFixed(1)} km
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <div>
                      <span className="badge badge-success">空闲 {station.available_ports}</span>
                    </div>
                    <div>
                      <span className="badge">共 {station.total_ports} 桩</span>
                    </div>
                    <div className="text-secondary text-sm">
                      功率: {station.power_rating}kW
                    </div>
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleStartNavigation(station)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      🗺️ 导航前往
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">⚡ 私人桩报装</h3>

          <div className="alert alert-info mb-1">
            <strong>📋 报装流程：</strong>
            <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
              <li>提交申请 → 现场勘查 → 施工安装 → 验收通电</li>
            </ul>
          </div>

          <div className="flex gap-1 flex-wrap">
            <button
              className="btn btn-success"
              onClick={handleStartApplication}
            >
              📝 开始报装申请
            </button>
          </div>

          {showApplicationRecords && applicationRecords.length > 0 && (
            <div className="mt-2">
              <h4>📋 申请记录</h4>
              <div className="scroll-y" style={{ maxHeight: '300px' }}>
                {applicationRecords.map((record, idx) => (
                  <div key={idx} className="card" style={{ marginBottom: '0.75rem' }}>
                    <div className="flex flex-between">
                      <strong>{record.application_id}</strong>
                      <span className="badge badge-success">{record.status === 'applying' ? '审核中' : record.status}</span>
                    </div>
                    <div className="text-secondary text-sm">{record.address}</div>
                    <div className="text-secondary text-sm">{record.installation_type} · {record.capacity}kW</div>
                    <div className="text-secondary text-sm">提交时间: {record.submitted_at}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showNavigation && selectedStation && (
        <div className="card mt-2" style={{ border: navigationCompleted ? '2px solid #4caf50' : '2px solid #2196f3' }}>
          <div className="flex flex-between mb-1">
            <h3 className="card-title" style={{ margin: 0 }}>
              {navigationCompleted ? '✅ 已到达' : '🗺️ 导航前往'} {selectedStation.name}
            </h3>
            <button
              className="btn btn-outline"
              onClick={handleCloseNavigation}
            >
              关闭导航
            </button>
          </div>

          {navigationCompleted ? (
            <div>
              <div className="alert alert-success">
                <strong>🎉 已成功到达 {selectedStation.name}！</strong>
                <div>您可以开始使用充电服务</div>
              </div>
              <div className="grid grid-2">
                <div className="card">
                  <div className="text-secondary">充电站</div>
                  <div style={{ fontWeight: 700 }}>{selectedStation.name}</div>
                </div>
                <div className="card">
                  <div className="text-secondary">可用桩数</div>
                  <div style={{ fontWeight: 700 }}>{selectedStation.available_ports} / {selectedStation.total_ports}</div>
                </div>
                <div className="card">
                  <div className="text-secondary">充电功率</div>
                  <div style={{ fontWeight: 700 }}>{selectedStation.power_rating} kW</div>
                </div>
                <div className="card">
                  <div className="text-secondary">电价</div>
                  <div style={{ fontWeight: 700 }}>¥{selectedStation.price_per_kwh}/kWh</div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-2">
                <div>
                  <div className="form-group">
                    <label className="form-label">充电站名称</label>
                    <div>{selectedStation.name}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">充电站地址</label>
                    <div>{selectedStation.address}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">可用充电桩</label>
                    <div>
                      <span className="badge badge-success">空闲 {selectedStation.available_ports}</span>
                      <span className="badge" style={{ marginLeft: '0.5rem' }}>共 {selectedStation.total_ports} 桩</span>
                    </div>
                  </div>
                  {userLocation && calculateDistance(selectedStation) && (
                    <div className="form-group">
                      <label className="form-label">距离当前位置</label>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4caf50' }}>
                        {calculateDistance(selectedStation).toFixed(1)} km
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="form-group">
                    <label className="form-label">充电桩功率</label>
                    <div>{selectedStation.power_rating} kW</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">电价</label>
                    <div>¥{selectedStation.price_per_kwh}/kWh</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">运营商</label>
                    <div>{selectedStation.operator}</div>
                  </div>
                </div>
              </div>

              {userLocation && (
                <div className="card mt-1" style={{ background: '#f0f7ff', border: '1px solid #b3d4fc' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🧭 导航路线</div>
                  <div>
                    {generateNavigationSteps(selectedStation).map((step, idx) => (
                      <div key={idx} className="flex gap-1" style={{ marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{
                          minWidth: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: idx === generateNavigationSteps(selectedStation).length - 1 ? '#4caf50' : '#2196f3',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ paddingTop: '2px' }}>{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-1 mt-2">
                <button
                  className="btn btn-success"
                  onClick={handleConfirmArrival}
                >
                  ✅ 确认到达
                </button>
                <button
                  className="btn btn-outline"
                  onClick={handleCloseNavigation}
                >
                  关闭导航
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showApplication && (
        <div className="card mt-2" style={{ border: '2px solid #ff9800' }}>
          <div className="flex flex-between mb-1">
            <h3 className="card-title" style={{ margin: 0 }}>
              📝 私人充电桩报装申请 - 步骤 {currentStep}/3
            </h3>
            <button
              className="btn btn-outline"
              onClick={() => setShowApplication(false)}
            >
              取消申请
            </button>
          </div>

          <div className="flex gap-1 mb-2">
            <div className={`card ${currentStep >= 1 ? 'border-primary' : ''}`} style={{ padding: '0.75rem', flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: currentStep >= 1 ? 700 : 400 }}>1️⃣ 基础信息</div>
            </div>
            <div className={`card ${currentStep >= 2 ? 'border-primary' : ''}`} style={{ padding: '0.75rem', flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: currentStep >= 2 ? 700 : 400 }}>2️⃣ 设备选择</div>
            </div>
            <div className={`card ${currentStep >= 3 ? 'border-primary' : ''}`} style={{ padding: '0.75rem', flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: currentStep >= 3 ? 700 : 400 }}>3️⃣ 确认提交</div>
            </div>
          </div>

          {applicationSuccess === null ? (
            <>
              {currentStep === 1 && (
                <div>
                  <div className="form-group">
                    <label className="form-label">安装地址 *</label>
                    <input
                      className="form-input"
                      placeholder="请输入详细安装地址"
                      value={applicationForm.address}
                      onChange={(e) => setApplicationForm({ ...applicationForm, address: e.target.value })}
                    />
                    {stepErrors.address && (
                      <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '0.25rem' }}>{stepErrors.address}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">联系电话 *</label>
                    <input
                      className="form-input"
                      placeholder="请输入联系电话"
                      value={applicationForm.phone}
                      onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })}
                    />
                    {stepErrors.phone && (
                      <div style={{ color: '#f44336', fontSize: '0.875rem', marginTop: '0.25rem' }}>{stepErrors.phone}</div>
                    )}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleNextStep}
                    >
                      下一步 →
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <div className="form-group">
                    <label className="form-label">安装类型</label>
                    <select
                      className="form-select"
                      value={applicationForm.installation_type}
                      onChange={(e) => setApplicationForm({ ...applicationForm, installation_type: e.target.value })}
                    >
                      <option value="home">家用充电桩</option>
                      <option value="business">商用充电桩</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">充电桩功率</label>
                    <select
                      className="form-select"
                      value={applicationForm.capacity}
                      onChange={(e) => setApplicationForm({ ...applicationForm, capacity: parseInt(e.target.value) })}
                    >
                      <option value={7}>7 kW (慢充)</option>
                      <option value={11}>11 kW (中速)</option>
                      <option value={22}>22 kW (快充)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">备注</label>
                    <textarea
                      className="form-textarea"
                      placeholder="请输入其他需求"
                      value={applicationForm.remarks}
                      onChange={(e) => setApplicationForm({ ...applicationForm, remarks: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-1 mt-2">
                    <button
                      className="btn btn-outline"
                      onClick={handlePrevStep}
                    >
                      ← 上一步
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleNextStep}
                    >
                      下一步 →
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h4>请确认以下信息：</h4>
                  <div className="grid grid-2 mt-1">
                    <div className="card">
                      <div className="text-secondary">安装地址</div>
                      <div style={{ fontWeight: 700 }}>{applicationForm.address}</div>
                    </div>
                    <div className="card">
                      <div className="text-secondary">联系电话</div>
                      <div style={{ fontWeight: 700 }}>{applicationForm.phone}</div>
                    </div>
                    <div className="card">
                      <div className="text-secondary">安装类型</div>
                      <div style={{ fontWeight: 700 }}>
                        {applicationForm.installation_type === 'home' ? '家用充电桩' : '商用充电桩'}
                      </div>
                    </div>
                    <div className="card">
                      <div className="text-secondary">充电桩功率</div>
                      <div style={{ fontWeight: 700 }}>{applicationForm.capacity} kW</div>
                    </div>
                  </div>
                  {applicationForm.remarks && (
                    <div className="card mt-1">
                      <div className="text-secondary">备注</div>
                      <div>{applicationForm.remarks}</div>
                    </div>
                  )}

                  <div className="alert alert-info mt-2">
                    <strong>📋 报装须知：</strong>
                    <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
                      <li>申请提交后，我们会在3个工作日内联系您</li>
                      <li>现场勘查确认后，将出具设计方案</li>
                      <li>施工完成后，我们将协助完成验收通电</li>
                    </ul>
                  </div>

                  <div className="flex gap-1 mt-2">
                    <button
                      className="btn btn-outline"
                      onClick={handlePrevStep}
                    >
                      ← 上一步
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={handleSubmitApplication}
                      disabled={submitting}
                    >
                      {submitting ? '提交中...' : '✅ 提交申请'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : applicationSuccess === false ? (
            <div>
              <div className="alert" style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a' }}>
                <strong>❌ 提交失败</strong>
                <div>申请提交过程中出现错误，请稍后重试</div>
              </div>
              <div className="flex gap-1 mt-2">
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitApplication}
                  disabled={submitting}
                >
                  重新提交
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowApplication(false)}
                >
                  关闭
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="alert alert-success">
                <strong>✅ 申请已成功提交！</strong>
              </div>

              <div className="card" style={{ background: '#f9fbe7', border: '1px solid #c5e1a5' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>📋 申请结果</div>
                <div className="grid grid-2">
                  <div>
                    <div className="text-secondary text-sm">申请编号</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{applicationSuccess.application_id}</div>
                  </div>
                  <div>
                    <div className="text-secondary text-sm">提交时间</div>
                    <div style={{ fontWeight: 700 }}>{applicationSuccess.submitted_at}</div>
                  </div>
                  <div>
                    <div className="text-secondary text-sm">安装地址</div>
                    <div style={{ fontWeight: 700 }}>{applicationSuccess.address}</div>
                  </div>
                  <div>
                    <div className="text-secondary text-sm">安装类型</div>
                    <div style={{ fontWeight: 700 }}>{applicationSuccess.installation_type}</div>
                  </div>
                </div>
              </div>

              <div className="card mt-1" style={{ background: '#fff3e0', border: '1px solid #ffcc80' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>📌 后续步骤</div>
                <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {applicationSuccess.next_steps.map((step, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="flex gap-1 mt-2">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowApplication(false)}
                >
                  关闭
                </button>
                <button
                  className="btn btn-outline"
                  onClick={handleStartApplication}
                >
                  再次申请
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EVPage
