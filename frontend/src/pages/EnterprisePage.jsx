import { useState, useEffect } from 'react'
import { getUsers, getMeters, getBills, getEnterpriseAnalysis } from '../services/api'

const MOCK_USERS = [
  { user_id: 'ENT001', name: '华北钢铁集团有限公司', phone: '010-88886666', address: '北京市朝阳区建国路88号', user_type: 'enterprise' },
  { user_id: 'ENT002', name: '华东化工科技股份有限公司', phone: '021-66668888', address: '上海市浦东新区张江高科技园区', user_type: 'enterprise' },
  { user_id: 'ENT003', name: '西南矿业开发有限公司', phone: '028-55559999', address: '成都市高新区天府大道北段', user_type: 'enterprise' }
]

const MOCK_METERS = [
  { meter_id: 'M-ENT001-01', user_id: 'ENT001', address: '北京市朝阳区建国路88号A厂房', capacity: 2000, voltage_level: '10kV', topology_path: '110kV建国站→10kV建甲线→A厂房配变' },
  { meter_id: 'M-ENT001-02', user_id: 'ENT001', address: '北京市朝阳区建国路88号B厂房', capacity: 1500, voltage_level: '10kV', topology_path: '110kV建国站→10kV建乙线→B厂房配变' },
  { meter_id: 'M-ENT001-03', user_id: 'ENT001', address: '北京市朝阳区建国路88号办公楼', capacity: 500, voltage_level: '380V', topology_path: '110kV建国站→10kV建甲线→办公配变' },
  { meter_id: 'M-ENT002-01', user_id: 'ENT002', address: '上海市浦东新区张江高科技园区1号楼', capacity: 1800, voltage_level: '10kV', topology_path: '220kV张江站→10kV张甲线→1号楼配变' },
  { meter_id: 'M-ENT002-02', user_id: 'ENT002', address: '上海市浦东新区张江高科技园区2号楼', capacity: 1200, voltage_level: '10kV', topology_path: '220kV张江站→10kV张乙线→2号楼配变' },
  { meter_id: 'M-ENT002-03', user_id: 'ENT002', address: '上海市浦东新区张江高科技园区研发中心', capacity: 600, voltage_level: '380V', topology_path: '220kV张江站→10kV张甲线→研发配变' },
  { meter_id: 'M-ENT003-01', user_id: 'ENT003', address: '成都市高新区天府大道北段矿井A区', capacity: 2500, voltage_level: '35kV', topology_path: '220kV天府站→35kV天甲线→矿井A区变' },
  { meter_id: 'M-ENT003-02', user_id: 'ENT003', address: '成都市高新区天府大道北段矿井B区', capacity: 1600, voltage_level: '10kV', topology_path: '220kV天府站→10kV天乙线→矿井B区配变' },
  { meter_id: 'M-ENT003-03', user_id: 'ENT003', address: '成都市高新区天府大道北段综合楼', capacity: 400, voltage_level: '380V', topology_path: '220kV天府站→10kV天乙线→综合楼配变' }
]

const MOCK_BILLS = [
  { bill_id: 'B-ENT001-01-01', meter_id: 'M-ENT001-01', period: '2026-01', total_usage: 580000, amount: 406000.00, status: 'paid' },
  { bill_id: 'B-ENT001-01-02', meter_id: 'M-ENT001-01', period: '2026-02', total_usage: 520000, amount: 364000.00, status: 'paid' },
  { bill_id: 'B-ENT001-01-03', meter_id: 'M-ENT001-01', period: '2026-03', total_usage: 610000, amount: 427000.00, status: 'pending' },
  { bill_id: 'B-ENT001-02-01', meter_id: 'M-ENT001-02', period: '2026-01', total_usage: 430000, amount: 301000.00, status: 'paid' },
  { bill_id: 'B-ENT001-02-02', meter_id: 'M-ENT001-02', period: '2026-02', total_usage: 390000, amount: 273000.00, status: 'pending' },
  { bill_id: 'B-ENT001-03-01', meter_id: 'M-ENT001-03', period: '2026-01', total_usage: 85000, amount: 59500.00, status: 'paid' },
  { bill_id: 'B-ENT001-03-02', meter_id: 'M-ENT001-03', period: '2026-02', total_usage: 78000, amount: 54600.00, status: 'paid' },
  { bill_id: 'B-ENT001-03-03', meter_id: 'M-ENT001-03', period: '2026-03', total_usage: 92000, amount: 64400.00, status: 'pending' },
  { bill_id: 'B-ENT002-01-01', meter_id: 'M-ENT002-01', period: '2026-01', total_usage: 490000, amount: 343000.00, status: 'paid' },
  { bill_id: 'B-ENT002-01-02', meter_id: 'M-ENT002-01', period: '2026-02', total_usage: 460000, amount: 322000.00, status: 'paid' },
  { bill_id: 'B-ENT002-02-01', meter_id: 'M-ENT002-02', period: '2026-01', total_usage: 340000, amount: 238000.00, status: 'paid' },
  { bill_id: 'B-ENT002-02-02', meter_id: 'M-ENT002-02', period: '2026-02', total_usage: 310000, amount: 217000.00, status: 'overdue' },
  { bill_id: 'B-ENT002-02-03', meter_id: 'M-ENT002-02', period: '2026-03', total_usage: 355000, amount: 248500.00, status: 'pending' },
  { bill_id: 'B-ENT002-03-01', meter_id: 'M-ENT002-03', period: '2026-01', total_usage: 95000, amount: 66500.00, status: 'paid' },
  { bill_id: 'B-ENT002-03-02', meter_id: 'M-ENT002-03', period: '2026-02', total_usage: 88000, amount: 61600.00, status: 'pending' },
  { bill_id: 'B-ENT003-01-01', meter_id: 'M-ENT003-01', period: '2026-01', total_usage: 720000, amount: 504000.00, status: 'paid' },
  { bill_id: 'B-ENT003-01-02', meter_id: 'M-ENT003-01', period: '2026-02', total_usage: 680000, amount: 476000.00, status: 'paid' },
  { bill_id: 'B-ENT003-01-03', meter_id: 'M-ENT003-01', period: '2026-03', total_usage: 750000, amount: 525000.00, status: 'pending' },
  { bill_id: 'B-ENT003-02-01', meter_id: 'M-ENT003-02', period: '2026-01', total_usage: 440000, amount: 308000.00, status: 'paid' },
  { bill_id: 'B-ENT003-02-02', meter_id: 'M-ENT003-02', period: '2026-02', total_usage: 410000, amount: 287000.00, status: 'overdue' },
  { bill_id: 'B-ENT003-03-01', meter_id: 'M-ENT003-03', period: '2026-01', total_usage: 65000, amount: 45500.00, status: 'paid' },
  { bill_id: 'B-ENT003-03-02', meter_id: 'M-ENT003-03', period: '2026-02', total_usage: 58000, amount: 40600.00, status: 'pending' }
]

const MOCK_ANALYSIS = {
  ENT001: { total_meters: 3, total_capacity: 4000, total_usage_ytd: 2783000, total_amount_ytd: 1948500.00, load_utilization: 79.5, average_price_per_kwh: 0.7000, diagnosis: { load_level: 'high', recommendations: ['建议在高峰时段实施需求响应策略，转移部分非关键负载至谷时', '考虑加装无功补偿装置，提高功率因数至0.95以上', 'B厂房配变负载率偏高，建议增容或负载均衡调整', '建议开展电能质量监测，评估谐波治理需求'] } },
  ENT002: { total_meters: 3, total_capacity: 3600, total_usage_ytd: 1788000, total_amount_ytd: 1249700.00, load_utilization: 56.8, average_price_per_kwh: 0.6985, diagnosis: { load_level: 'medium', recommendations: ['2号楼配变存在闲置容量，可考虑承接周边新负荷', '建议优化生产工艺时序，提高谷时用电占比', '研发中心可安装分布式光伏，降低白天用电成本', '建议安装智能用电监测终端，精细化能耗管理'] } },
  ENT003: { total_meters: 3, total_capacity: 4500, total_usage_ytd: 3118000, total_amount_ytd: 2185600.00, load_utilization: 88.2, average_price_per_kwh: 0.7007, diagnosis: { load_level: 'high', recommendations: ['矿井A区主变负载率超过85%，存在安全风险，建议尽快增容', '建议实施峰谷分时用电调度，降低最大需量', '综合楼用电波动大，建议加装稳压装置', '考虑采用合同能源管理方式实施节能改造'] } }
}

const LOAD_CURVE_DATA = [
  { hour: '00:00', load: 25 },
  { hour: '03:00', load: 20 },
  { hour: '06:00', load: 45 },
  { hour: '09:00', load: 75 },
  { hour: '12:00', load: 85 },
  { hour: '15:00', load: 70 },
  { hour: '18:00', load: 55 },
  { hour: '21:00', load: 35 }
]

const RECOMMENDATION_PRIORITIES = ['high', 'medium', 'medium', 'low']

function EnterprisePage() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [meters, setMeters] = useState([])
  const [bills, setBills] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLoadCurve, setShowLoadCurve] = useState(false)
  const [showDiagnosisReport, setShowDiagnosisReport] = useState(false)
  const [showFeeAnomaly, setShowFeeAnomaly] = useState(null)
  const [selectedMeterDetail, setSelectedMeterDetail] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [showExportConfirm, setShowExportConfirm] = useState(false)
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      let enterprises = []
      let metersData = []
      try {
        const [usersRes, metersRes] = await Promise.all([getUsers(), getMeters()])
        enterprises = usersRes.data.filter(u => u.user_type === 'enterprise')
        metersData = metersRes.data
      } catch (err) {}
      if (enterprises.length === 0) enterprises = MOCK_USERS
      if (metersData.length === 0) metersData = MOCK_METERS
      setUsers(enterprises)
      setMeters(metersData)
      if (enterprises.length > 0) {
        setSelectedUser(enterprises[0])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedUser) {
      loadUserData()
    }
  }, [selectedUser])

  const loadUserData = async () => {
    if (!selectedUser) return
    const userMeters = meters.filter(m => m.user_id === selectedUser.user_id)
    let allBills = []
    if (userMeters.length > 0) {
      for (const meter of userMeters) {
        try {
          const billsRes = await getBills(meter.meter_id)
          allBills.push(...billsRes.data)
        } catch (err) {}
      }
    }
    if (allBills.length === 0) {
      const mockUserMeters = MOCK_METERS.filter(m => m.user_id === selectedUser.user_id)
      allBills = MOCK_BILLS.filter(b => mockUserMeters.some(m => m.meter_id === b.meter_id))
    }
    setBills(allBills)

    let analysisData = null
    try {
      if (userMeters.length > 0) {
        const analysisRes = await getEnterpriseAnalysis(selectedUser.user_id)
        analysisData = analysisRes.data
      }
    } catch (err) {}
    if (!analysisData || !analysisData.diagnosis) {
      analysisData = MOCK_ANALYSIS[selectedUser.user_id] || MOCK_ANALYSIS['ENT001']
    }
    setAnalysis(analysisData)
  }

  const userMeters = meters.filter(m => m.user_id === selectedUser?.user_id)

  const handleProcessAnomaly = (bill) => {
    setShowPaymentConfirm(bill)
  }

  const confirmPayment = () => {
    if (!showPaymentConfirm) return
    const bill = showPaymentConfirm
    setBills(prev => prev.map(b =>
      b.bill_id === bill.bill_id
        ? { ...b, status: 'paid' }
        : b
    ))
    const daysOverdue = Math.ceil(
      (new Date() - new Date(bill.period + '-15')) / (1000 * 60 * 60 * 24)
    )
    const lateFee = bill.amount * 0.0005 * Math.max(daysOverdue, 0)
    setPaymentHistory(prev => [
      {
        billId: bill.bill_id,
        amount: bill.amount + lateFee,
        timestamp: new Date().toLocaleString(),
        status: '逾期处理'
      },
      ...prev
    ])
    setShowPaymentConfirm(null)
    setShowFeeAnomaly(null)
  }

  const getDaysOverdue = (bill) => {
    const dueDate = new Date(bill.period + '-15')
    const now = new Date()
    return Math.max(Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24)), 0)
  }

  const getLateFee = (bill) => {
    return bill.amount * 0.0005 * getDaysOverdue(bill)
  }

  const getLoadColor = (utilization) => {
    if (utilization < 60) return '#4caf50'
    if (utilization <= 80) return '#ff9800'
    return '#f44336'
  }

  const getPriorityLabel = (priority) => {
    if (priority === 'high') return { text: '高', className: 'badge-danger' }
    if (priority === 'medium') return { text: '中', className: 'badge-warning' }
    return { text: '低', className: 'badge-success' }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div>
      <h2 className="page-title">🏢 企事业端服务</h2>

      <div className="grid grid-3 mb-2">
        <div className="card stat-card">
          <div className="stat-value">{analysis?.total_meters || 0}</div>
          <div className="stat-label">计量点数</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{analysis?.total_capacity?.toLocaleString() || 0}</div>
          <div className="stat-label">总装机容量(kW)</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{analysis?.load_utilization?.toFixed(1) || 0}%</div>
          <div className="stat-label">负载利用率(%)</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">🏢 企业信息</h3>
          {selectedUser && (
            <div>
              <div className="form-group">
                <label className="form-label">企业编号</label>
                <div>{selectedUser.user_id}</div>
              </div>
              <div className="form-group">
                <label className="form-label">企业名称</label>
                <div>{selectedUser.name}</div>
              </div>
              <div className="form-group">
                <label className="form-label">联系电话</label>
                <div>{selectedUser.phone}</div>
              </div>
              <div className="form-group">
                <label className="form-label">用电地址</label>
                <div>{selectedUser.address}</div>
              </div>
              <div className="form-group">
                <label className="form-label">切换企业</label>
                <select
                  className="form-select"
                  value={selectedUser.user_id}
                  onChange={(e) => {
                    const user = users.find(u => u.user_id === e.target.value)
                    setSelectedUser(user)
                    setShowLoadCurve(false)
                    setShowDiagnosisReport(false)
                    setShowFeeAnomaly(null)
                    setSelectedMeterDetail(null)
                  }}
                >
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.name} - {u.user_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">⚡ 负荷监测</h3>
          {analysis && (
            <div>
              <div className="form-group">
                <label className="form-label">实时负载</label>
                <div className="flex gap-1">
                  <div style={{ flex: 1, background: '#e3f2fd', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1976d2' }}>
                      {analysis.total_usage_ytd.toLocaleString()}
                    </div>
                    <div className="text-secondary">年累计用电(kWh)</div>
                  </div>
                  <div style={{ flex: 1, background: '#f3e5f5', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7b1fa2' }}>
                      ¥{analysis.total_amount_ytd.toLocaleString()}
                    </div>
                    <div className="text-secondary">年累计电费(元)</div>
                  </div>
                </div>
              </div>
              <div className="form-group mt-1">
                <label className="form-label">平均电价</label>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  ¥{analysis.average_price_per_kwh.toFixed(4)}/kWh
                </div>
              </div>
              <div className="mt-1">
                <button className="btn btn-primary" onClick={() => setShowLoadCurve(!showLoadCurve)}>
                  {showLoadCurve ? '关闭负荷曲线' : '查看负荷曲线'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">📊 能效诊断报告</h3>
          {analysis?.diagnosis && (
            <div>
              <div className={`alert ${
                analysis.diagnosis.load_level === 'high' ? 'alert-danger' :
                analysis.diagnosis.load_level === 'medium' ? 'alert-warning' :
                'alert-success'
              } mb-1`}>
                <strong>负载等级:</strong> {
                  analysis.diagnosis.load_level === 'high' ? '高负载' :
                  analysis.diagnosis.load_level === 'medium' ? '中负载' : '低负载'
                }
              </div>
              <h4 className="section-title mt-1">优化建议</h4>
              <ul style={{ paddingLeft: '1.5rem' }}>
                {analysis.diagnosis.recommendations.map((rec, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>
                    {rec}
                  </li>
                ))}
              </ul>
              <div className="mt-1">
                <button className="btn btn-primary" onClick={() => setShowDiagnosisReport(!showDiagnosisReport)}>
                  {showDiagnosisReport ? '关闭诊断报告' : '生成诊断报告'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">📈 计量点拓扑</h3>
          <div className="text-secondary mb-1">
            共 {analysis?.total_meters || userMeters.length} 个计量点
          </div>
          {userMeters.map(meter => (
            <div key={meter.meter_id} className="card" style={{ padding: '1rem', marginBottom: '0.5rem' }}>
              <div
                className="flex flex-between"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMeterDetail(
                  selectedMeterDetail === meter.meter_id ? null : meter.meter_id
                )}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{meter.meter_id}</div>
                  <div className="text-secondary">{meter.address}</div>
                </div>
                <div className="text-primary">
                  {meter.capacity} kW · {meter.voltage_level}
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                    {selectedMeterDetail === meter.meter_id ? '▲' : '▼'}
                  </span>
                </div>
              </div>
              {selectedMeterDetail === meter.meter_id && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">容量</label>
                      <div style={{ fontWeight: 700 }}>{meter.capacity} kW</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">电压等级</label>
                      <div style={{ fontWeight: 700 }}>{meter.voltage_level}</div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">拓扑路径</label>
                    <div style={{ fontSize: '0.875rem', color: '#555' }}>{meter.topology_path}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">负载状态</label>
                    <div>
                      {(() => {
                        const meterBills = bills.filter(b => b.meter_id === meter.meter_id)
                        const latestUsage = meterBills.length > 0
                          ? meterBills.sort((a, b) => b.period.localeCompare(a.period))[0].total_usage
                          : 0
                        const monthlyHours = 720
                        const avgLoad = latestUsage / monthlyHours
                        const loadRate = (avgLoad / meter.capacity) * 100
                        const color = getLoadColor(loadRate)
                        return (
                          <span style={{ color, fontWeight: 700 }}>
                            {loadRate.toFixed(1)}%
                            {loadRate < 60 ? ' (正常)' : loadRate <= 80 ? ' (偏高)' : ' (过载)'}
                          </span>
                        )
                      })()}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">近期账单</label>
                    {bills
                      .filter(b => b.meter_id === meter.meter_id)
                      .sort((a, b) => b.period.localeCompare(a.period))
                      .slice(0, 3)
                      .map(bill => (
                        <div key={bill.bill_id} className="flex flex-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span>{bill.period}</span>
                          <span>¥{bill.amount.toLocaleString()}</span>
                          <span className={`badge ${
                            bill.status === 'paid' ? 'badge-success' :
                            bill.status === 'pending' ? 'badge-warning' :
                            'badge-danger'
                          }`}>
                            {bill.status === 'paid' ? '已支付' :
                             bill.status === 'pending' ? '待支付' : '逾期'}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-2">
        <h3 className="card-title">💰 费用明细</h3>
        <table className="table">
          <thead>
            <tr>
              <th>计量点</th>
              <th>账期</th>
              <th>总用电量(kWh)</th>
              <th>金额(元)</th>
              <th>单价(元/kWh)</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill.bill_id}>
                <td>{bill.meter_id}</td>
                <td>{bill.period}</td>
                <td>{bill.total_usage.toLocaleString()}</td>
                <td><strong>¥{bill.amount.toLocaleString()}</strong></td>
                <td>¥{(bill.amount / bill.total_usage).toFixed(4)}</td>
                <td>
                  <span className={`badge ${
                    bill.status === 'paid' ? 'badge-success' :
                    bill.status === 'pending' ? 'badge-warning' :
                    'badge-danger'
                  }`}>
                    {bill.status === 'paid' ? '已支付' :
                     bill.status === 'pending' ? '待支付' : '逾期'}
                  </span>
                </td>
                <td>
                  {bill.status === 'overdue' && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => setShowFeeAnomaly(bill)}
                    >
                      异常处置
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showLoadCurve && analysis && (
        <div className="card mt-2">
          <div className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0 }}>📈 负荷曲线 (24小时)</h3>
            <button className="btn btn-outline" onClick={() => setShowLoadCurve(false)}>关闭</button>
          </div>
          <div style={{ padding: '1rem 0' }}>
            {LOAD_CURVE_DATA.map((item, index) => {
              const loadKw = Math.round(analysis.total_capacity * item.load / 100)
              const barColor = item.load >= 80 ? '#f44336' : item.load >= 60 ? '#ff9800' : '#4caf50'
              return (
                <div key={index} className="flex" style={{ alignItems: 'center', marginBottom: '0.5rem', gap: '0.75rem' }}>
                  <div style={{ width: '3.5rem', textAlign: 'right', fontSize: '0.875rem', color: '#666' }}>{item.hour}</div>
                  <div style={{ flex: 1, background: '#f5f5f5', borderRadius: '4px', height: '1.5rem', position: 'relative' }}>
                    <div style={{
                      width: `${item.load}%`,
                      height: '100%',
                      background: barColor,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                    <span style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: item.load > 50 ? '#fff' : '#333'
                    }}>
                      {item.load}% ({loadKw} kW)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="grid grid-3 mt-1">
            <div className="card" style={{ padding: '1rem', textAlign: 'center', background: '#fff3e0' }}>
              <div className="text-secondary">峰值时段</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f44336' }}>10:00-14:00</div>
              <div className="text-secondary">负载 {LOAD_CURVE_DATA.find(d => d.hour === '12:00')?.load}%</div>
            </div>
            <div className="card" style={{ padding: '1rem', textAlign: 'center', background: '#e8f5e9' }}>
              <div className="text-secondary">谷值时段</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4caf50' }}>00:00-06:00</div>
              <div className="text-secondary">负载 {LOAD_CURVE_DATA.find(d => d.hour === '03:00')?.load}%</div>
            </div>
            <div className="card" style={{ padding: '1rem', textAlign: 'center', background: '#e3f2fd' }}>
              <div className="text-secondary">平均负载</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1976d2' }}>
                {Math.round(LOAD_CURVE_DATA.reduce((s, d) => s + d.load, 0) / LOAD_CURVE_DATA.length)}%
              </div>
              <div className="text-secondary">
                {Math.round(analysis.total_capacity * LOAD_CURVE_DATA.reduce((s, d) => s + d.load, 0) / LOAD_CURVE_DATA.length / 100)} kW
              </div>
            </div>
          </div>
          <div className="card mt-1" style={{ padding: '1rem' }}>
            <div className="flex flex-between" style={{ alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600 }}>负载利用率：</span>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: getLoadColor(analysis.load_utilization)
                }}>
                  {analysis.load_utilization}%
                </span>
              </div>
              <div className="flex gap-1" style={{ alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4caf50', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.8rem' }}>&lt;60%</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff9800', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.8rem' }}>60-80%</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f44336', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.8rem' }}>&gt;80%</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDiagnosisReport && analysis && selectedUser && (
        <div className="card mt-2">
          <div className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0 }}>📋 能效诊断报告</h3>
            <button className="btn btn-outline" onClick={() => { setShowDiagnosisReport(false); setShowExportConfirm(false) }}>关闭</button>
          </div>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', background: '#fafafa', border: '1px solid #e0e0e0' }}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">报告编号</label>
                <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  RPT-{selectedUser.user_id}-{Date.now().toString().slice(-10)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">报告日期</label>
                <div>{new Date().toLocaleDateString('zh-CN')}</div>
              </div>
              <div className="form-group">
                <label className="form-label">企业名称</label>
                <div style={{ fontWeight: 700 }}>{selectedUser.name}</div>
              </div>
              <div className="form-group">
                <label className="form-label">负载等级评估</label>
                <div>
                  <span className={`badge ${
                    analysis.diagnosis.load_level === 'high' ? 'badge-danger' :
                    analysis.diagnosis.load_level === 'medium' ? 'badge-warning' :
                    'badge-success'
                  }`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                    {analysis.diagnosis.load_level === 'high' ? '高负载' :
                     analysis.diagnosis.load_level === 'medium' ? '中负载' : '低负载'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <h4 className="section-title">关键指标</h4>
          <div className="grid grid-3 mb-1">
            <div className="card" style={{ padding: '1rem', textAlign: 'center', background: '#e3f2fd' }}>
              <div className="text-secondary">总容量</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1976d2' }}>
                {analysis.total_capacity.toLocaleString()} kW
              </div>
            </div>
            <div className="card" style={{ padding: '1rem', textAlign: 'center', background: getLoadColor(analysis.load_utilization) + '1a' }}>
              <div className="text-secondary">负载利用率</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getLoadColor(analysis.load_utilization) }}>
                {analysis.load_utilization}%
              </div>
            </div>
            <div className="card" style={{ padding: '1rem', textAlign: 'center', background: '#f3e5f5' }}>
              <div className="text-secondary">平均电价</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7b1fa2' }}>
                ¥{analysis.average_price_per_kwh.toFixed(4)}/kWh
              </div>
            </div>
          </div>

          <h4 className="section-title">详细建议</h4>
          <div style={{ marginBottom: '1rem' }}>
            {analysis.diagnosis.recommendations.map((rec, index) => {
              const priority = RECOMMENDATION_PRIORITIES[index] || 'low'
              const priorityInfo = getPriorityLabel(priority)
              return (
                <div key={index} className="card" style={{ padding: '1rem', marginBottom: '0.5rem', borderLeft: `4px solid ${priority === 'high' ? '#f44336' : priority === 'medium' ? '#ff9800' : '#4caf50'}` }}>
                  <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>建议 {index + 1}</span>
                    <span className={`badge ${priorityInfo.className}`}>
                      优先级: {priorityInfo.text}
                    </span>
                  </div>
                  <div style={{ lineHeight: 1.6 }}>{rec}</div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-1">
            <button className="btn btn-success" onClick={() => setShowExportConfirm(true)}>
              导出报告
            </button>
          </div>

          {showExportConfirm && (
            <div className="alert alert-success mt-1">
              <strong>导出成功</strong>
              <div>诊断报告已生成并导出为PDF文件，报告编号: RPT-{selectedUser.user_id}-{Date.now().toString().slice(-10)}</div>
              <button className="btn btn-outline mt-1" onClick={() => setShowExportConfirm(false)}>确认</button>
            </div>
          )}
        </div>
      )}

      {showFeeAnomaly && (
        <div className="card mt-2" style={{ border: '2px solid #f44336' }}>
          <div className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0, color: '#d32f2f' }}>⚠️ 费用异常处置</h3>
            <button className="btn btn-outline" onClick={() => setShowFeeAnomaly(null)}>关闭</button>
          </div>

          <div className="grid grid-2 mb-1">
            <div className="card" style={{ padding: '1rem' }}>
              <div className="form-group">
                <label className="form-label">异常类型</label>
                <div><span className="badge badge-danger">逾期未缴</span></div>
              </div>
              <div className="form-group">
                <label className="form-label">账单编号</label>
                <div style={{ fontWeight: 700 }}>{showFeeAnomaly.bill_id}</div>
              </div>
              <div className="form-group">
                <label className="form-label">账期</label>
                <div>{showFeeAnomaly.period}</div>
              </div>
              <div className="form-group">
                <label className="form-label">计量点</label>
                <div>{showFeeAnomaly.meter_id}</div>
              </div>
            </div>
            <div className="card" style={{ padding: '1rem' }}>
              <div className="form-group">
                <label className="form-label">原始金额</label>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>¥{showFeeAnomaly.amount.toLocaleString()}</div>
              </div>
              <div className="form-group">
                <label className="form-label">逾期天数</label>
                <div style={{ color: '#d32f2f', fontWeight: 700, fontSize: '1.25rem' }}>
                  {getDaysOverdue(showFeeAnomaly)} 天
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">违约金 (按日利率0.05%)</label>
                <div style={{ color: '#ff9800', fontWeight: 700 }}>
                  ¥{getLateFee(showFeeAnomaly).toFixed(2)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">应缴总额</label>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d32f2f' }}>
                  ¥{(showFeeAnomaly.amount + getLateFee(showFeeAnomaly)).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="alert alert-danger mb-1">
            <strong>逾期提醒：</strong>此账单已逾期 {getDaysOverdue(showFeeAnomaly)} 天，累计违约金 ¥{getLateFee(showFeeAnomaly).toFixed(2)}，请尽快处理以避免产生更多费用。
          </div>

          <div className="flex gap-1">
            <button className="btn btn-danger" onClick={() => handleProcessAnomaly(showFeeAnomaly)}>
              立即处理
            </button>
            <button className="btn btn-outline" onClick={() => setShowFeeAnomaly(null)}>
              稍后处理
            </button>
          </div>
        </div>
      )}

      {showPaymentConfirm && (
        <div className="card mt-2" style={{ border: '2px solid #1976d2' }}>
          <div className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0 }}>支付确认</h3>
            <button className="btn btn-outline" onClick={() => setShowPaymentConfirm(null)}>取消</button>
          </div>
          <div className="grid grid-2">
            <div>
              <div className="form-group">
                <label className="form-label">账单编号</label>
                <div>{showPaymentConfirm.bill_id}</div>
              </div>
              <div className="form-group">
                <label className="form-label">账期</label>
                <div>{showPaymentConfirm.period}</div>
              </div>
              <div className="form-group">
                <label className="form-label">账单状态</label>
                <span className="badge badge-danger">逾期</span>
              </div>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">原始金额</label>
                <div>¥{showPaymentConfirm.amount.toLocaleString()}</div>
              </div>
              <div className="form-group">
                <label className="form-label">违约金</label>
                <div>¥{getLateFee(showPaymentConfirm).toFixed(2)}</div>
              </div>
              <div className="form-group">
                <label className="form-label">支付总额</label>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1976d2' }}>
                  ¥{(showPaymentConfirm.amount + getLateFee(showPaymentConfirm)).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          <div className="alert alert-info">确认支付后将立即更新账单状态并记录缴费信息</div>
          <div className="flex gap-1 mt-1">
            <button className="btn btn-success" onClick={confirmPayment}>确认支付</button>
            <button className="btn btn-outline" onClick={() => setShowPaymentConfirm(null)}>取消</button>
          </div>
        </div>
      )}

      <div className="card mt-2">
        <h3 className="card-title">💳 缴费记录</h3>
        {paymentHistory.length > 0 ? (
          <table className="table" style={{ fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th>账单编号</th>
                <th>金额</th>
                <th>状态</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.slice(0, 10).map((record, index) => (
                <tr key={index}>
                  <td>{record.billId}</td>
                  <td>¥{record.amount.toFixed(2)}</td>
                  <td><span className="badge badge-success">{record.status}</span></td>
                  <td>{record.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-secondary">暂无缴费记录</div>
        )}
      </div>
    </div>
  )
}

export default EnterprisePage
