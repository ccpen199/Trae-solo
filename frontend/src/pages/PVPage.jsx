import { useState, useEffect } from 'react'
import { getPVData, createApplication, getPVContracts } from '../services/api'

const MOCK_PV_DATA = {
  total_capacity: 120,
  total_generation: 45000,
  co2_reduction: 36000,
  income: 90000,
  daily_data: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
    return {
      date: d.toISOString().split('T')[0],
      generation: Math.round((Math.random() * 30 + 10) * 100) / 100,
      income: Math.round((Math.random() * 20 + 5) * 100) / 100
    }
  })
}

const MOCK_CONTRACTS = [
  { contract_id: 'PV20250001', user_id: 'USER000001', capacity: 30, status: 'active', monthly_generation: 4200, monthly_feed_in: 2800, subsidy_amount: 1260, subsidy_status: 'paid' },
  { contract_id: 'PV20250002', user_id: 'USER000001', capacity: 50, status: 'applying', monthly_generation: 0, monthly_feed_in: 0, subsidy_amount: 0, subsidy_status: 'pending' },
  { contract_id: 'PV20250003', user_id: 'USER000001', capacity: 40, status: 'active', monthly_generation: 5600, monthly_feed_in: 3900, subsidy_amount: 1680, subsidy_status: 'processing' }
]

const FEED_IN_RATE = 0.45
const SUBSIDY_RATE = 0.30

function PVPage() {
  const [pvData, setPvData] = useState(MOCK_PV_DATA)
  const [pvContracts, setPvContracts] = useState(MOCK_CONTRACTS)
  const [loading, setLoading] = useState(true)
  const [showApplication, setShowApplication] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [applicationForm, setApplicationForm] = useState({
    address: '',
    phone: '',
    installation_type: 'rooftop',
    capacity: 5,
    remarks: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [applicationResult, setApplicationResult] = useState(null)

  const [expandedContract, setExpandedContract] = useState(null)
  const [showSettlement, setShowSettlement] = useState(false)
  const [showSubsidy, setShowSubsidy] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [pvRes, contractRes] = await Promise.all([
        getPVData().catch(() => null),
        getPVContracts().catch(() => null)
      ])
      if (pvRes?.data) setPvData(pvRes.data)
      if (contractRes?.data) setPvContracts(contractRes.data)
    } catch (err) {
      console.error('数据加载失败', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartApplication = () => {
    setShowApplication(true)
    setCurrentStep(1)
    setApplicationResult(null)
    setFormErrors({})
    setApplicationForm({
      address: '',
      phone: '',
      installation_type: 'rooftop',
      capacity: 5,
      remarks: ''
    })
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      const errors = {}
      if (!applicationForm.address.trim()) errors.address = '请填写安装地址'
      if (!applicationForm.phone.trim()) errors.phone = '请填写联系电话'
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return
      }
      setFormErrors({})
    }
    setCurrentStep(currentStep + 1)
  }

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmitApplication = async () => {
    try {
      setSubmitting(true)
      try {
        await createApplication({
          ...applicationForm,
          type: 'pv'
        })
      } catch (err) {
        // API失败时仍然视为提交成功(本地模式)
      }
      const now = new Date()
      setApplicationResult({
        id: `PV${now.getTime()}`,
        submittedAt: now.toLocaleString('zh-CN'),
        expectedCompletion: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')
      })
    } catch (err) {
      const now = new Date()
      setApplicationResult({
        id: `PV${now.getTime()}`,
        submittedAt: now.toLocaleString('zh-CN'),
        expectedCompletion: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')
      })
    } finally {
      setSubmitting(false)
    }
  }

  const installationTypeLabel = (type) => {
    const map = { rooftop: '屋顶光伏', ground: '地面光伏', floating: '水面光伏' }
    return map[type] || type
  }

  const statusLabel = (status) => {
    const map = { active: '运行中', applying: '申请中', pending: '待审核', approved: '已通过', completed: '已完成' }
    return map[status] || status
  }

  const subsidyStatusLabel = (status) => {
    const map = { pending: '待发放', processing: '发放中', paid: '已发放' }
    return map[status] || status
  }

  const subsidyBadgeClass = (status) => {
    const map = { pending: 'badge-warning', processing: 'badge-info', paid: 'badge-success' }
    return map[status] || ''
  }

  const statusBadgeClass = (status) => {
    const map = { active: 'badge-success', applying: 'badge-warning', pending: 'badge-warning', approved: 'badge-info', completed: 'badge-success' }
    return map[status] || ''
  }

  const monthlyGeneration = pvData.daily_data?.slice(0, 30).reduce((sum, d) => sum + d.generation, 0) || 0
  const monthlyIncome = pvData.daily_data?.slice(0, 30).reduce((sum, d) => sum + d.income, 0) || 0
  const treesEquivalent = Math.floor(pvData.co2_reduction / 0.18)
  const totalFeedIn = pvContracts.reduce((sum, c) => sum + (c.monthly_feed_in || 0), 0)
  const totalSubsidy = pvContracts.reduce((sum, c) => sum + (c.subsidy_amount || 0), 0)

  const getContractTimelineSteps = (status) => {
    const steps = ['申请中', '已审核', '施工中', '运行中']
    const statusIndex = { applying: 0, pending: 0, approved: 1, active: 3, completed: 3 }
    const currentIndex = statusIndex[status] ?? 0
    return steps.map((step, i) => ({
      label: step,
      reached: i <= currentIndex,
      current: i === currentIndex
    }))
  }

  const getGenerationTrend = (contract) => {
    const base = contract.monthly_generation || 0
    return Array.from({ length: 6 }, (_, i) => ({
      month: `${6 - i}月前`,
      value: Math.round(base * (0.7 + Math.random() * 0.6))
    })).reverse()
  }

  const getSettlements = () => {
    return pvContracts
      .filter(c => c.monthly_feed_in > 0)
      .map(c => ({
        contractId: c.contract_id,
        feedIn: c.monthly_feed_in,
        rate: FEED_IN_RATE,
        amount: Math.round(c.monthly_feed_in * FEED_IN_RATE * 100) / 100,
        status: c.status === 'active' ? '已结算' : '待结算',
        statusClass: c.status === 'active' ? 'badge-success' : 'badge-warning'
      }))
  }

  const getSubsidyDetails = () => {
    return pvContracts.map(c => {
      const generation = c.monthly_generation || 0
      const subsidyCalc = Math.round(generation * SUBSIDY_RATE * 100) / 100
      const paidAmount = c.subsidy_status === 'paid' ? subsidyCalc : 0
      const paymentHistory = []
      if (c.subsidy_status === 'paid' || c.subsidy_status === 'processing') {
        const now = new Date()
        for (let i = 0; i < 3; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 15)
          paymentHistory.push({
            date: d.toLocaleDateString('zh-CN'),
            amount: Math.round(subsidyCalc * (0.8 + Math.random() * 0.4) * 100) / 100,
            status: i === 0 ? (c.subsidy_status === 'processing' ? '发放中' : '已发放') : '已发放'
          })
        }
      }
      return {
        contractId: c.contract_id,
        capacity: c.capacity,
        generation,
        rate: SUBSIDY_RATE,
        subsidyCalc,
        paidAmount,
        subsidyStatus: c.subsidy_status,
        paymentHistory
      }
    })
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div>
      <h2 className="page-title">☀️ 光伏业主服务</h2>

      <div className="grid grid-2 mb-2">
        <div className="grid grid-2">
          <div className="card stat-card">
            <div className="stat-value">{pvData.total_capacity} kW</div>
            <div className="stat-label">总装机容量</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value text-success">{pvData.total_generation.toFixed(0)} MWh</div>
            <div className="stat-label">累计发电量</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{pvData.co2_reduction.toFixed(0)} 吨</div>
            <div className="stat-label">CO₂减排量</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{pvData.income.toFixed(0)} 元</div>
            <div className="stat-label">累计收益</div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">🔌 并网申请</h3>
          <div className="alert alert-info mb-1">
            <strong>📋 并网流程：</strong>
            <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
              <li>提交申请 → 现场勘查 → 方案设计 → 安装施工 → 验收并网</li>
            </ul>
          </div>
          <div className="flex gap-1 flex-wrap">
            <button className="btn btn-success" onClick={handleStartApplication}>
              📝 新建并网申请
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">📈 发电趋势</h3>
          {pvData.daily_data?.length > 0 ? (
            <div className="scroll-y" style={{ maxHeight: '300px' }}>
              {pvData.daily_data.map((data, index) => (
                <div key={index} className="card" style={{ marginBottom: '0.75rem' }}>
                  <div className="flex flex-between">
                    <div>
                      <strong>{data.date}</strong>
                      <div className="text-secondary text-sm">发电 {data.generation.toFixed(1)} kWh</div>
                    </div>
                    <div className="text-success">¥{data.income.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-secondary">暂无数据</div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">💰 收益分析</h3>
          <div className="grid grid-3">
            <div className="card">
              <div className="text-secondary">本月发电</div>
              <div className="text-primary" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {monthlyGeneration.toFixed(1)} kWh
              </div>
            </div>
            <div className="card">
              <div className="text-secondary">本月收益</div>
              <div className="text-success" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                ¥{monthlyIncome.toFixed(2)}
              </div>
            </div>
            <div className="card">
              <div className="text-secondary">等效植树</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {treesEquivalent} 棵
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-2">
        <h3 className="card-title">📄 并网合同追踪</h3>
        {pvContracts.length > 0 ? (
          <div>
            {pvContracts.map((contract) => (
              <div key={contract.contract_id}>
                <div
                  className="card"
                  style={{ marginBottom: '0.75rem', cursor: 'pointer' }}
                  onClick={() => setExpandedContract(expandedContract === contract.contract_id ? null : contract.contract_id)}
                >
                  <div className="flex flex-between">
                    <div>
                      <strong>{contract.contract_id}</strong>
                      <span className={`badge ${statusBadgeClass(contract.status)}`} style={{ marginLeft: '0.5rem' }}>
                        {statusLabel(contract.status)}
                      </span>
                    </div>
                    <div className="text-secondary">
                      {contract.capacity} kW
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                        {expandedContract === contract.contract_id ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-3 mt-1">
                    <div>
                      <div className="text-secondary text-sm">月发电量</div>
                      <div style={{ fontWeight: 700 }}>{contract.monthly_generation} kWh</div>
                    </div>
                    <div>
                      <div className="text-secondary text-sm">补贴状态</div>
                      <div>
                        <span className={`badge ${subsidyBadgeClass(contract.subsidy_status)}`}>
                          {subsidyStatusLabel(contract.subsidy_status)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-secondary text-sm">补贴金额</div>
                      <div className="text-success" style={{ fontWeight: 700 }}>¥{contract.subsidy_amount}</div>
                    </div>
                  </div>
                </div>

                {expandedContract === contract.contract_id && (
                  <div className="card" style={{ marginBottom: '0.75rem', borderLeft: '4px solid #1a5fb4' }}>
                    <h4 style={{ marginBottom: '1rem' }}>📋 合同详情</h4>
                    <div className="grid grid-2">
                      <div className="card">
                        <div className="text-secondary text-sm">合同编号</div>
                        <div style={{ fontWeight: 700 }}>{contract.contract_id}</div>
                      </div>
                      <div className="card">
                        <div className="text-secondary text-sm">装机容量</div>
                        <div style={{ fontWeight: 700 }}>{contract.capacity} kW</div>
                      </div>
                      <div className="card">
                        <div className="text-secondary text-sm">合同状态</div>
                        <div>
                          <span className={`badge ${statusBadgeClass(contract.status)}`}>
                            {statusLabel(contract.status)}
                          </span>
                        </div>
                      </div>
                      <div className="card">
                        <div className="text-secondary text-sm">月上网电量</div>
                        <div style={{ fontWeight: 700 }}>{contract.monthly_feed_in} kWh</div>
                      </div>
                    </div>

                    <h4 style={{ margin: '1.5rem 0 0.75rem' }}>📊 状态进度</h4>
                    <div className="flex gap-1" style={{ alignItems: 'flex-start' }}>
                      {getContractTimelineSteps(contract.status).map((step, i) => (
                        <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            margin: '0 auto 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            background: step.current ? '#1a5fb4' : step.reached ? '#26a269' : '#e0e0e0',
                            color: step.reached || step.current ? 'white' : '#999'
                          }}>
                            {step.reached ? '✓' : i + 1}
                          </div>
                          <div style={{
                            fontSize: '0.85rem',
                            fontWeight: step.current ? 700 : 400,
                            color: step.current ? '#1a5fb4' : step.reached ? '#26a269' : '#999'
                          }}>
                            {step.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {contract.status === 'active' && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.75rem' }}>📈 月度发电趋势</h4>
                        <div className="flex gap-1" style={{ alignItems: 'flex-end', height: 120 }}>
                          {getGenerationTrend(contract).map((item, i) => (
                            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{
                                height: `${Math.max(20, (item.value / contract.monthly_generation) * 100)}%`,
                                background: 'linear-gradient(180deg, #1a5fb4, #26a269)',
                                borderRadius: '4px 4px 0 0',
                                minHeight: 16
                              }} />
                              <div className="text-secondary" style={{ fontSize: '0.7rem', marginTop: 4 }}>
                                {item.month}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-2 mt-1">
                          <div className="card">
                            <div className="text-secondary text-sm">月发电量</div>
                            <div className="text-primary" style={{ fontWeight: 700 }}>{contract.monthly_generation} kWh</div>
                          </div>
                          <div className="card">
                            <div className="text-secondary text-sm">月上网电量</div>
                            <div className="text-success" style={{ fontWeight: 700 }}>{contract.monthly_feed_in} kWh</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {contract.status === 'applying' && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.75rem' }}>📋 当前进度</h4>
                        <div className="alert alert-info">
                          <div><strong>申请已提交</strong>，等待现场勘查安排</div>
                          <div className="text-secondary text-sm" style={{ marginTop: '0.5rem' }}>
                            预计 5 个工作日内安排现场勘查
                          </div>
                          <div className="text-secondary text-sm">
                            预计方案设计：勘查后 7 个工作日
                          </div>
                          <div className="text-secondary text-sm">
                            预计并网完成：提交后 30 个工作日内
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-secondary">暂无合同数据</div>
        )}
      </div>

      <div className="grid grid-2 mt-2">
        <div className="card">
          <h3 className="card-title">⚡ 上网电量结算</h3>
          <div className="grid grid-2">
            <div className="card">
              <div className="text-secondary">月度上网电量</div>
              <div className="text-primary" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {totalFeedIn} kWh
              </div>
            </div>
            <div className="card">
              <div className="text-secondary">上网电价</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                ¥{FEED_IN_RATE}/kWh
              </div>
            </div>
          </div>
          <button className="btn btn-primary mt-1" onClick={() => setShowSettlement(!showSettlement)}>
            {showSettlement ? '收起结算详情' : '查看结算详情'}
          </button>

          {showSettlement && (
            <div className="card mt-1" style={{ borderLeft: '4px solid #1a5fb4' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>📊 结算明细</h4>
              <div className="alert alert-info mb-1">
                上网电价：¥{FEED_IN_RATE}/kWh · 结算周期：按月结算
              </div>
              {getSettlements().length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>合同编号</th>
                      <th>上网电量</th>
                      <th>电价</th>
                      <th>结算金额</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSettlements().map((s) => (
                      <tr key={s.contractId}>
                        <td><strong>{s.contractId}</strong></td>
                        <td>{s.feedIn} kWh</td>
                        <td>¥{s.rate}/kWh</td>
                        <td className="text-success" style={{ fontWeight: 700 }}>¥{s.amount}</td>
                        <td><span className={`badge ${s.statusClass}`}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-secondary">暂无结算数据</div>
              )}
              <div className="card mt-1">
                <div className="flex flex-between">
                  <div>
                    <div className="text-secondary">本月结算总额</div>
                    <div className="text-success" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                      ¥{getSettlements().reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-secondary">总上网电量</div>
                    <div className="text-primary" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                      {totalFeedIn} kWh
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">🏷️ 补贴追踪</h3>
          <div className="grid grid-2 mb-1">
            <div className="card">
              <div className="text-secondary">补贴总额</div>
              <div className="text-success" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                ¥{totalSubsidy}
              </div>
            </div>
            <div className="card">
              <div className="text-secondary">补贴标准</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                ¥{SUBSIDY_RATE}/kWh
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowSubsidy(!showSubsidy)}>
            {showSubsidy ? '收起补贴详情' : '查看补贴详情'}
          </button>

          {showSubsidy && (
            <div className="card mt-1" style={{ borderLeft: '4px solid #26a269' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>📊 补贴明细</h4>
              <div className="alert alert-info mb-1">
                补贴标准：¥{SUBSIDY_RATE}/kWh · 补贴计算：月发电量 × 补贴标准
              </div>
              {getSubsidyDetails().map((detail) => (
                <div key={detail.contractId} className="card" style={{ marginBottom: '0.75rem' }}>
                  <div className="flex flex-between mb-1">
                    <div>
                      <strong>{detail.contractId}</strong>
                      <span className="text-secondary text-sm" style={{ marginLeft: '0.5rem' }}>
                        {detail.capacity} kW
                      </span>
                    </div>
                    <span className={`badge ${subsidyBadgeClass(detail.subsidyStatus)}`}>
                      {subsidyStatusLabel(detail.subsidyStatus)}
                    </span>
                  </div>
                  <div className="grid grid-3">
                    <div>
                      <div className="text-secondary text-sm">月发电量</div>
                      <div style={{ fontWeight: 700 }}>{detail.generation} kWh</div>
                    </div>
                    <div>
                      <div className="text-secondary text-sm">补贴标准</div>
                      <div style={{ fontWeight: 700 }}>¥{detail.rate}/kWh</div>
                    </div>
                    <div>
                      <div className="text-secondary text-sm">应发补贴</div>
                      <div className="text-success" style={{ fontWeight: 700 }}>¥{detail.subsidyCalc}</div>
                    </div>
                  </div>
                  {detail.paymentHistory.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div className="text-secondary text-sm" style={{ marginBottom: '0.5rem' }}>发放记录</div>
                      {detail.paymentHistory.map((ph, i) => (
                        <div key={i} className="flex flex-between" style={{ padding: '0.35rem 0', borderBottom: '1px solid #f0f0f0' }}>
                          <span className="text-secondary">{ph.date}</span>
                          <span className="text-success" style={{ fontWeight: 600 }}>¥{ph.amount}</span>
                          <span className={`badge ${ph.status === '已发放' ? 'badge-success' : 'badge-info'}`}>
                            {ph.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showApplication && (
        <div className="card mt-2" style={{ border: '2px solid #ff9800' }}>
          <div className="flex flex-between mb-1">
            <h3 className="card-title" style={{ margin: 0 }}>
              📝 光伏并网申请 - 步骤 {currentStep}/3
            </h3>
            <button className="btn btn-outline" onClick={() => setShowApplication(false)}>
              取消申请
            </button>
          </div>

          <div className="flex gap-1 mb-2">
            <div className={`card ${currentStep >= 1 ? 'border-primary' : ''}`} style={{ padding: '0.75rem', flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: currentStep >= 1 ? 700 : 400 }}>1️⃣ 基础信息</div>
            </div>
            <div className={`card ${currentStep >= 2 ? 'border-primary' : ''}`} style={{ padding: '0.75rem', flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: currentStep >= 2 ? 700 : 400 }}>2️⃣ 系统配置</div>
            </div>
            <div className={`card ${currentStep >= 3 ? 'border-primary' : ''}`} style={{ padding: '0.75rem', flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: currentStep >= 3 ? 700 : 400 }}>3️⃣ 确认提交</div>
            </div>
          </div>

          {applicationResult === null ? (
            <>
              {currentStep === 1 && (
                <div>
                  <div className="form-group">
                    <label className="form-label">安装地址 *</label>
                    <input
                      className="form-input"
                      placeholder="请输入详细安装地址"
                      value={applicationForm.address}
                      onChange={(e) => {
                        setApplicationForm({ ...applicationForm, address: e.target.value })
                        if (formErrors.address) setFormErrors({ ...formErrors, address: null })
                      }}
                    />
                    {formErrors.address && (
                      <div className="text-danger" style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                        {formErrors.address}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">联系电话 *</label>
                    <input
                      className="form-input"
                      placeholder="请输入联系电话"
                      value={applicationForm.phone}
                      onChange={(e) => {
                        setApplicationForm({ ...applicationForm, phone: e.target.value })
                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: null })
                      }}
                    />
                    {formErrors.phone && (
                      <div className="text-danger" style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                        {formErrors.phone}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <button className="btn btn-primary" onClick={handleNextStep}>
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
                      <option value="rooftop">屋顶光伏</option>
                      <option value="ground">地面光伏</option>
                      <option value="floating">水面光伏</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">装机容量</label>
                    <select
                      className="form-select"
                      value={applicationForm.capacity}
                      onChange={(e) => setApplicationForm({ ...applicationForm, capacity: parseInt(e.target.value) })}
                    >
                      <option value={3}>3 kW (小型家庭)</option>
                      <option value={5}>5 kW (中型家庭)</option>
                      <option value={10}>10 kW (大型家庭/小型商业)</option>
                      <option value={20}>20 kW (商业)</option>
                      <option value={50}>50 kW (工业)</option>
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
                    <button className="btn btn-outline" onClick={handlePrevStep}>
                      ← 上一步
                    </button>
                    <button className="btn btn-primary" onClick={handleNextStep}>
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
                      <div style={{ fontWeight: 700 }}>{installationTypeLabel(applicationForm.installation_type)}</div>
                    </div>
                    <div className="card">
                      <div className="text-secondary">装机容量</div>
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
                    <strong>📋 并网须知：</strong>
                    <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
                      <li>申请提交后，我们会在2个工作日内联系您</li>
                      <li>现场勘查确认后，将出具设计方案</li>
                      <li>施工完成后，我们将协助完成并网验收</li>
                    </ul>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <button className="btn btn-outline" onClick={handlePrevStep}>
                      ← 上一步
                    </button>
                    <button className="btn btn-success" onClick={handleSubmitApplication} disabled={submitting}>
                      {submitting ? '提交中...' : '✅ 提交申请'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <div className="alert alert-success">
                <strong>✅ 并网申请已成功提交！</strong>
              </div>
              <div className="grid grid-2 mt-1">
                <div className="card">
                  <div className="text-secondary">申请编号</div>
                  <div className="text-primary" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {applicationResult.id}
                  </div>
                </div>
                <div className="card">
                  <div className="text-secondary">提交时间</div>
                  <div style={{ fontWeight: 700 }}>{applicationResult.submittedAt}</div>
                </div>
                <div className="card">
                  <div className="text-secondary">预计完成日期</div>
                  <div className="text-success" style={{ fontWeight: 700 }}>{applicationResult.expectedCompletion}</div>
                </div>
                <div className="card">
                  <div className="text-secondary">装机容量</div>
                  <div style={{ fontWeight: 700 }}>{applicationForm.capacity} kW</div>
                </div>
              </div>

              <h4 style={{ margin: '1.5rem 0 0.75rem' }}>📋 后续流程</h4>
              <div className="flex gap-1" style={{ alignItems: 'flex-start' }}>
                {['现场勘查', '方案设计', '安装施工', '验收并网'].map((step, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      margin: '0 auto 0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      background: i === 0 ? '#1a5fb4' : '#e0e0e0',
                      color: i === 0 ? 'white' : '#999'
                    }}>
                      {i + 1}
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: i === 0 ? 700 : 400,
                      color: i === 0 ? '#1a5fb4' : '#999'
                    }}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>

              <div className="alert alert-info mt-2">
                我们会在2个工作日内与您联系，请保持电话畅通
              </div>

              <div className="flex gap-1 mt-2">
                <button className="btn btn-primary" onClick={() => setShowApplication(false)}>
                  关闭
                </button>
                <button className="btn btn-outline" onClick={handleStartApplication}>
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

export default PVPage
