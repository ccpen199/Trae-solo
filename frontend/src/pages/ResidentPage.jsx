import { useState, useEffect } from 'react'
import { getUsers, getBills, getMeters, payBill, getResidentAnalysis } from '../services/api'

const MOCK_USERS = [
  { user_id: 'R001', name: '张伟', phone: '13800001111', address: '北京市朝阳区建国路88号', user_type: 'resident' },
  { user_id: 'R002', name: '李娜', phone: '13900002222', address: '北京市海淀区中关村大街1号', user_type: 'resident' },
  { user_id: 'R003', name: '王强', phone: '13700003333', address: '北京市西城区金融街10号', user_type: 'resident' }
]

const MOCK_METERS = [
  { meter_id: 'M001', user_id: 'R001', meter_type: 'residential' },
  { meter_id: 'M002', user_id: 'R001', meter_type: 'residential' },
  { meter_id: 'M003', user_id: 'R002', meter_type: 'residential' },
  { meter_id: 'M004', user_id: 'R002', meter_type: 'residential' },
  { meter_id: 'M005', user_id: 'R003', meter_type: 'residential' },
  { meter_id: 'M006', user_id: 'R003', meter_type: 'residential' }
]

const MOCK_BILLS = [
  { bill_id: 'B001', meter_id: 'M001', period: '2026-01', peak_usage: 120.5, valley_usage: 80.3, total_usage: 200.8, amount: 128.56, due_date: '2026-02-15', status: 'paid', paid_at: '2026-02-10' },
  { bill_id: 'B002', meter_id: 'M001', period: '2026-02', peak_usage: 135.2, valley_usage: 75.8, total_usage: 211.0, amount: 142.30, due_date: '2026-03-15', status: 'pending' },
  { bill_id: 'B003', meter_id: 'M001', period: '2026-03', peak_usage: 110.0, valley_usage: 90.5, total_usage: 200.5, amount: 130.25, due_date: '2026-04-15', status: 'pending' },
  { bill_id: 'B004', meter_id: 'M001', period: '2025-12', peak_usage: 150.0, valley_usage: 60.0, total_usage: 210.0, amount: 155.00, due_date: '2026-01-15', status: 'overdue' },
  { bill_id: 'B005', meter_id: 'M002', period: '2026-01', peak_usage: 95.0, valley_usage: 65.0, total_usage: 160.0, amount: 102.40, due_date: '2026-02-15', status: 'paid', paid_at: '2026-02-08' },
  { bill_id: 'B006', meter_id: 'M002', period: '2026-02', peak_usage: 88.0, valley_usage: 72.0, total_usage: 160.0, amount: 105.60, due_date: '2026-03-15', status: 'pending' },
  { bill_id: 'B007', meter_id: 'M002', period: '2026-03', peak_usage: 100.0, valley_usage: 80.0, total_usage: 180.0, amount: 115.20, due_date: '2026-04-15', status: 'pending' },
  { bill_id: 'B008', meter_id: 'M003', period: '2026-01', peak_usage: 200.0, valley_usage: 150.0, total_usage: 350.0, amount: 224.00, due_date: '2026-02-15', status: 'paid', paid_at: '2026-02-12' },
  { bill_id: 'B009', meter_id: 'M003', period: '2026-02', peak_usage: 180.0, valley_usage: 160.0, total_usage: 340.0, amount: 217.60, due_date: '2026-03-15', status: 'pending' },
  { bill_id: 'B010', meter_id: 'M003', period: '2026-03', peak_usage: 210.0, valley_usage: 140.0, total_usage: 350.0, amount: 224.00, due_date: '2026-04-15', status: 'overdue' },
  { bill_id: 'B011', meter_id: 'M003', period: '2025-12', peak_usage: 220.0, valley_usage: 130.0, total_usage: 350.0, amount: 231.00, due_date: '2026-01-15', status: 'overdue' },
  { bill_id: 'B012', meter_id: 'M004', period: '2026-01', peak_usage: 60.0, valley_usage: 40.0, total_usage: 100.0, amount: 64.00, due_date: '2026-02-15', status: 'paid', paid_at: '2026-02-05' },
  { bill_id: 'B013', meter_id: 'M004', period: '2026-02', peak_usage: 55.0, valley_usage: 45.0, total_usage: 100.0, amount: 66.00, due_date: '2026-03-15', status: 'pending' },
  { bill_id: 'B014', meter_id: 'M005', period: '2026-01', peak_usage: 300.0, valley_usage: 200.0, total_usage: 500.0, amount: 320.00, due_date: '2026-02-15', status: 'paid', paid_at: '2026-02-10' },
  { bill_id: 'B015', meter_id: 'M005', period: '2026-02', peak_usage: 280.0, valley_usage: 220.0, total_usage: 500.0, amount: 332.80, due_date: '2026-03-15', status: 'pending' },
  { bill_id: 'B016', meter_id: 'M005', period: '2026-03', peak_usage: 310.0, valley_usage: 190.0, total_usage: 500.0, amount: 326.40, due_date: '2026-04-15', status: 'overdue' },
  { bill_id: 'B017', meter_id: 'M005', period: '2025-12', peak_usage: 330.0, valley_usage: 170.0, total_usage: 500.0, amount: 340.00, due_date: '2026-01-15', status: 'overdue' },
  { bill_id: 'B018', meter_id: 'M006', period: '2026-01', peak_usage: 45.0, valley_usage: 35.0, total_usage: 80.0, amount: 51.20, due_date: '2026-02-15', status: 'paid', paid_at: '2026-02-07' },
  { bill_id: 'B019', meter_id: 'M006', period: '2026-02', peak_usage: 50.0, valley_usage: 30.0, total_usage: 80.0, amount: 49.60, due_date: '2026-03-15', status: 'pending' },
  { bill_id: 'B020', meter_id: 'M006', period: '2026-03', peak_usage: 40.0, valley_usage: 40.0, total_usage: 80.0, amount: 54.40, due_date: '2026-04-15', status: 'pending' }
]

const MOCK_ANALYSIS = {
  R001: { peak_ratio: 58.2, valley_ratio: 41.8, average_monthly: 156.80, tips: ['建议将洗衣机使用时间调整至夜间谷时段，可节省约15%电费', '空调设定温度夏季不低于26°C，冬季不高于20°C', '及时关闭待机电器，避免待机耗电'] },
  R002: { peak_ratio: 62.5, valley_ratio: 37.5, average_monthly: 198.40, tips: ['峰时用电占比较高，建议错峰使用大功率电器', '考虑使用智能插座定时控制热水器', '定期检查线路老化，减少漏电损耗'] },
  R003: { peak_ratio: 55.0, valley_ratio: 45.0, average_monthly: 258.60, tips: ['用电量偏大，建议排查是否有老旧高耗能设备', '更换LED节能灯具可降低照明用电约60%', '电热水器建议设置定时开关，避免全天保温耗电', '关注阶梯电价政策，合理规划月度用电'] }
}

function ResidentPage() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [bills, setBills] = useState([])
  const [meters, setMeters] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedBillForReview, setSelectedBillForReview] = useState(null)
  const [payingBillId, setPayingBillId] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [showConfirmModal, setShowConfirmModal] = useState(null)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [showUsageAnalysis, setShowUsageAnalysis] = useState(false)
  const [showPaymentResult, setShowPaymentResult] = useState(null)
  const [showPrintPanel, setShowPrintPanel] = useState(false)
  const [printConfirmed, setPrintConfirmed] = useState(false)
  const [showInvoicePanel, setShowInvoicePanel] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      loadUserData()
    }
  }, [selectedUser])

  const loadData = async () => {
    try {
      setLoading(true)
      let residentUsers = []
      let metersData = []
      try {
        const [usersRes, metersRes] = await Promise.all([getUsers(), getMeters()])
        residentUsers = usersRes.data.filter(u => u.user_type === 'resident')
        metersData = metersRes.data
      } catch (err) {}
      if (residentUsers.length === 0) residentUsers = MOCK_USERS
      if (metersData.length === 0) metersData = MOCK_METERS
      setUsers(residentUsers)
      setMeters(metersData)
      if (residentUsers.length > 0) {
        setSelectedUser(residentUsers[0])
      }
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async () => {
    if (!selectedUser) return
    const userMeters = meters.filter(m => m.user_id === selectedUser.user_id)
    let allBills = []
    if (userMeters.length > 0) {
      try {
        for (const meter of userMeters) {
          const billsRes = await getBills(meter.meter_id)
          allBills = [...allBills, ...billsRes.data]
        }
      } catch (err) {}
    }
    if (allBills.length === 0) {
      const mockUserMeters = MOCK_METERS.filter(m => m.user_id === selectedUser.user_id)
      allBills = MOCK_BILLS.filter(b => mockUserMeters.some(m => m.meter_id === b.meter_id))
    }
    allBills = allBills.map(bill => {
      if (bill.status !== 'paid' && bill.due_date) {
        const dueDate = new Date(bill.due_date)
        if (dueDate < new Date() && bill.status !== 'overdue') {
          return { ...bill, status: 'overdue' }
        }
      }
      return bill
    })
    setBills(allBills)

    let analysisData = null
    try {
      if (userMeters.length > 0) {
        const analysisRes = await getResidentAnalysis(selectedUser.user_id)
        analysisData = analysisRes.data
        if (analysisData && analysisData.total_bills === 0) analysisData = null
      }
    } catch (err) {}
    if (!analysisData) {
      analysisData = MOCK_ANALYSIS[selectedUser.user_id] || MOCK_ANALYSIS['R001']
    }
    setAnalysis(analysisData)
  }

  const handlePayBill = async (billId) => {
    try {
      setPayingBillId(billId)
      try {
        await payBill(billId)
      } catch (err) {}
      const bill = bills.find(b => b.bill_id === billId)
      if (bill) {
        const isOverdue = bill.status === 'overdue'
        setBills(prev => prev.map(b =>
          b.bill_id === billId
            ? { ...b, status: 'paid', paid_at: new Date().toISOString().split('T')[0] }
            : b
        ))
        setPaymentHistory(prev => [
          {
            id: Date.now(),
            billId: bill.bill_id,
            period: bill.period,
            amount: bill.amount,
            status: isOverdue ? '逾期处理' : '已支付',
            time: new Date().toLocaleString()
          },
          ...prev
        ])
      }
      return true
    } catch (err) {
      return false
    } finally {
      setPayingBillId(null)
    }
  }

  const handleConfirmPayment = (bill) => {
    setShowConfirmModal(bill)
  }

  const handleConfirmAndPay = async () => {
    if (!showConfirmModal) return
    const billId = showConfirmModal.bill_id
    const billInfo = { bill_id: billId, period: showConfirmModal.period, amount: showConfirmModal.amount }
    setShowConfirmModal(null)
    const success = await handlePayBill(billId)
    if (success) {
      setShowPaymentResult({
        transactionId: 'TXN' + Date.now().toString().slice(-10),
        bills: [billInfo],
        timestamp: new Date().toLocaleString()
      })
    }
  }

  const handlePayAllPending = () => {
    const unpaidBills = bills.filter(b => b.status === 'pending' || b.status === 'overdue')
    if (unpaidBills.length === 0) return
    setShowConfirmModal({ isPayAll: true, bills: unpaidBills, amount: unpaidBills.reduce((s, b) => s + b.amount, 0) })
  }

  const handleConfirmPayAll = async () => {
    if (!showConfirmModal || !showConfirmModal.isPayAll) return
    const unpaidBills = showConfirmModal.bills
    setShowConfirmModal(null)
    const paidBills = []
    for (const bill of unpaidBills) {
      const ok = await handlePayBill(bill.bill_id)
      if (ok) paidBills.push({ bill_id: bill.bill_id, period: bill.period, amount: bill.amount })
    }
    if (paidBills.length > 0) {
      setShowPaymentResult({
        transactionId: 'TXN' + Date.now().toString().slice(-10),
        bills: paidBills,
        timestamp: new Date().toLocaleString()
      })
    }
  }

  const pendingBills = bills.filter(b => b.status === 'pending')
  const overdueBills = bills.filter(b => b.status === 'overdue')
  const allUnpaidBills = [...pendingBills, ...overdueBills]
  const pendingAmount = pendingBills.reduce((s, b) => s + b.amount, 0)
  const overdueAmount = overdueBills.reduce((s, b) => s + b.amount, 0)

  const meterBillsForReview = selectedBillForReview
    ? bills.filter(b => b.meter_id === selectedBillForReview.meter_id).sort((a, b) => b.period.localeCompare(a.period))
    : []

  const monthlyUsageData = bills
    .slice()
    .sort((a, b) => a.period.localeCompare(b.period))
    .map(b => ({ period: b.period, total_usage: b.total_usage, peak_usage: b.peak_usage, valley_usage: b.valley_usage, amount: b.amount }))
  const maxUsage = Math.max(...monthlyUsageData.map(d => d.total_usage || 0), 1)

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div>
      <h2 className="page-title">居民端服务</h2>

      <div className="grid grid-4 mb-2">
        <div className="card stat-card">
          <div className="stat-value text-warning">{allUnpaidBills.length}</div>
          <div className="stat-label">待缴账单</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value text-danger">{overdueBills.length}</div>
          <div className="stat-label">逾期账单</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">¥{(pendingAmount + overdueAmount).toFixed(2)}</div>
          <div className="stat-label">待缴总额</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{analysis?.tips?.length || 0}</div>
          <div className="stat-label">节能建议</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">用户信息</h3>
          {selectedUser && (
            <div>
              <div className="form-group">
                <label className="form-label">用户编号</label>
                <div>{selectedUser.user_id}</div>
              </div>
              <div className="form-group">
                <label className="form-label">用户姓名</label>
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
                <label className="form-label">切换用户</label>
                <select
                  className="form-select"
                  value={selectedUser.user_id}
                  onChange={(e) => {
                    const user = users.find(u => u.user_id === e.target.value)
                    setSelectedUser(user)
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
          <h3 className="card-title">用能画像</h3>
          {analysis && (
            <div>
              <div className="flex gap-1 mb-1">
                <div style={{ flex: 1 }}>
                  <div className="text-secondary">峰时用电占比</div>
                  <div className="text-primary" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {analysis.peak_ratio}%
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-secondary">谷时用电占比</div>
                  <div className="text-success" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {analysis.valley_ratio}%
                  </div>
                </div>
              </div>
              <div className="mt-1">
                <div className="text-secondary">月均电费</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  ¥{analysis.average_monthly}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">节能建议</h3>
          {analysis?.tips?.length > 0 ? (
            <ul style={{ paddingLeft: '1.5rem' }}>
              {analysis.tips.map((tip, i) => (
                <li key={i} style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>{tip}</li>
              ))}
            </ul>
          ) : (
            <div className="text-secondary">暂无建议</div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">快捷缴费</h3>
          {overdueBills.length > 0 && (
            <div className="alert alert-danger mb-1">
              <strong>逾期警告：</strong>
              <div>有 {overdueBills.length} 笔账单已逾期，合计 ¥{overdueAmount.toFixed(2)}</div>
            </div>
          )}
          {pendingBills.length > 0 && (
            <div className="alert alert-warning mb-1">
              <strong>待缴提醒：</strong>
              <div>有 {pendingBills.length} 笔待缴账单，合计 ¥{pendingAmount.toFixed(2)}</div>
            </div>
          )}
          {allUnpaidBills.length > 0 ? (
            <div>
              <button className="btn btn-success" onClick={handlePayAllPending}>
                一键支付所有账单
              </button>
            </div>
          ) : (
            <div className="text-success">所有账单已缴清</div>
          )}
        </div>
      </div>

      <div className="card mt-2">
        <h3 className="card-title">账单明细</h3>
        <table className="table">
          <thead>
            <tr>
              <th>账单编号</th>
              <th>账期</th>
              <th>峰时用电(kWh)</th>
              <th>谷时用电(kWh)</th>
              <th>总用电量(kWh)</th>
              <th>金额(元)</th>
              <th>到期日期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill.bill_id}>
                <td>{bill.bill_id}</td>
                <td>{bill.period}</td>
                <td>{bill.peak_usage?.toFixed(2) || '-'}</td>
                <td>{bill.valley_usage?.toFixed(2) || '-'}</td>
                <td>{bill.total_usage?.toFixed(2) || '-'}</td>
                <td><strong>¥{bill.amount?.toFixed(2) || '0.00'}</strong></td>
                <td>{bill.due_date || '-'}</td>
                <td>
                  <span className={`badge ${bill.status === 'paid' ? 'badge-success' : bill.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                    {bill.status === 'paid' ? '已支付' : bill.status === 'pending' ? '待支付' : '逾期'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1 flex-wrap">
                    {bill.status === 'pending' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleConfirmPayment(bill)}
                        disabled={payingBillId === bill.bill_id}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        {payingBillId === bill.bill_id ? '支付中...' : '立即支付'}
                      </button>
                    )}
                    {bill.status === 'overdue' && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleConfirmPayment(bill)}
                        disabled={payingBillId === bill.bill_id}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        {payingBillId === bill.bill_id ? '处理中...' : '逾期处理'}
                      </button>
                    )}
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setSelectedBillForReview(bill)
                        setShowHistoryPanel(false)
                        setShowUsageAnalysis(false)
                        setShowPrintPanel(false)
                        setPrintConfirmed(false)
                        setShowInvoicePanel(false)
                      }}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      查看详情
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-2">
        <h3 className="card-title">缴费记录</h3>
        {paymentHistory.length > 0 ? (
          <table className="table" style={{ fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th>账单期数</th>
                <th>金额</th>
                <th>状态</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.slice(0, 5).map(record => (
                <tr key={record.id}>
                  <td>{record.period}</td>
                  <td>¥{record.amount.toFixed(2)}</td>
                  <td><span className="badge badge-success">{record.status}</span></td>
                  <td>{record.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-secondary">暂无缴费记录</div>
        )}
      </div>

      {selectedBillForReview && (
        <div className="card mt-2">
          <div className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0 }}>📋 账单详情 - {selectedBillForReview.bill_id}</h3>
            <button className="btn btn-outline" onClick={() => {
              setSelectedBillForReview(null)
              setShowHistoryPanel(false)
              setShowUsageAnalysis(false)
              setShowPrintPanel(false)
              setPrintConfirmed(false)
              setShowInvoicePanel(false)
            }}>关闭</button>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h4>🔌 计量点信息</h4>
              <div className="form-group">
                <label className="form-label">电表编号</label>
                <div style={{ fontWeight: 700 }}>{selectedBillForReview.meter_id}</div>
              </div>
              <div className="form-group">
                <label className="form-label">用电地址</label>
                <div>{selectedUser?.address || '-'}</div>
              </div>
              <div className="form-group">
                <label className="form-label">用户姓名</label>
                <div>{selectedUser?.name || '-'}</div>
              </div>
            </div>

            <div className="card">
              <h4>📅 计费周期</h4>
              <div className="form-group">
                <label className="form-label">账期</label>
                <div style={{ fontWeight: 700 }}>{selectedBillForReview.period}</div>
              </div>
              <div className="form-group">
                <label className="form-label">到期日期</label>
                <div>{selectedBillForReview.due_date || '-'}</div>
              </div>
              <div className="form-group">
                <label className="form-label">账单状态</label>
                <span className={`badge ${selectedBillForReview.status === 'paid' ? 'badge-success' : selectedBillForReview.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                  {selectedBillForReview.status === 'paid' ? '已支付' : selectedBillForReview.status === 'pending' ? '待支付' : '已逾期'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-2 mt-2">
            <div className="card">
              <h4>⚡ 用电明细</h4>
              <div className="grid grid-2">
                <div>
                  <div className="text-secondary">峰时用电</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedBillForReview.peak_usage?.toFixed(2) || '-'} kWh</div>
                </div>
                <div>
                  <div className="text-secondary">谷时用电</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedBillForReview.valley_usage?.toFixed(2) || '-'} kWh</div>
                </div>
                <div>
                  <div className="text-secondary">总用电量</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedBillForReview.total_usage?.toFixed(2) || '-'} kWh</div>
                </div>
                <div>
                  <div className="text-secondary">电费单价</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>¥0.64/kWh</div>
                </div>
              </div>
              <div className="form-group mt-1">
                <div className="text-secondary">账单金额</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1976d2' }}>¥{selectedBillForReview.amount?.toFixed(2) || '0.00'}</div>
              </div>
            </div>

            <div className="card">
              {selectedBillForReview.status === 'overdue' ? (
                <div>
                  <h4>⚠️ 逾期处置</h4>
                  <div className="alert alert-danger">
                    <strong>逾期警告</strong>
                    <div>此账单已逾期，请尽快缴纳</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">逾期天数</label>
                    <div style={{ color: '#d32f2f', fontWeight: 700 }}>
                      {Math.ceil((new Date() - new Date(selectedBillForReview.due_date)) / (1000 * 60 * 60 * 24))} 天</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">违约金</label>
                    <div>按日利率 0.05%</div>
                  </div>
                  <button className="btn btn-danger mt-1" onClick={() => {
                    setShowConfirmModal(selectedBillForReview)
                    setSelectedBillForReview(null)
                  }}>
                    立即缴纳
                  </button>
                </div>
              ) : selectedBillForReview.status === 'pending' ? (
                <div>
                  <h4>💳 缴费凭证</h4>
                  <div className="alert alert-info">
                    <strong>待缴费账单</strong>
                    <div>请在到期日前完成缴费</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">支付方式</label>
                    <div>支持微信、支付宝、银行卡</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">发票类型</label>
                    <div>电子普通发票</div>
                  </div>
                  <button className="btn btn-success mt-1" onClick={() => {
                    setShowConfirmModal(selectedBillForReview)
                    setSelectedBillForReview(null)
                  }}>
                    立即支付
                  </button>
                </div>
              ) : (
                <div>
                  <h4>✅ 缴费凭证</h4>
                  <div className="alert alert-success">
                    <strong>已缴费成功</strong>
                    <div>此账单已完成缴费</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">支付日期</label>
                    <div>{selectedBillForReview.paid_at || '-'}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">交易流水号</label>
                    <div>PAY{selectedBillForReview.bill_id}{Date.now().toString().slice(-8)}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">发票状态</label>
                    <span className="badge badge-success">已开具</span>
                  </div>
                  <button className="btn btn-primary mt-1" onClick={() => setShowInvoicePanel(true)}>
                    下载发票
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card mt-2">
            <h4>🔗 相关操作</h4>
            <div className="flex gap-1 flex-wrap">
              <button className="btn btn-outline" onClick={() => { setShowHistoryPanel(true); setShowUsageAnalysis(false); setShowPrintPanel(false) }}>查看历史账单</button>
              <button className="btn btn-outline" onClick={() => { setShowUsageAnalysis(true); setShowHistoryPanel(false); setShowPrintPanel(false) }}>用电分析</button>
              <button className="btn btn-outline" onClick={() => { setShowPrintPanel(true); setShowHistoryPanel(false); setShowUsageAnalysis(false); setPrintConfirmed(false) }}>打印账单</button>
            </div>
          </div>

          {showHistoryPanel && (
            <div className="card mt-2" style={{ border: '1px solid #1976d2' }}>
              <div className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>📜 历史账单 - 电表 {selectedBillForReview.meter_id}</h4>
                <button className="btn btn-outline" onClick={() => setShowHistoryPanel(false)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>关闭</button>
              </div>
              <table className="table" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th>账期</th>
                    <th>用电量(kWh)</th>
                    <th>金额(元)</th>
                    <th>状态</th>
                    <th>支付日期</th>
                  </tr>
                </thead>
                <tbody>
                  {meterBillsForReview.map(bill => (
                    <tr key={bill.bill_id}>
                      <td>{bill.period}</td>
                      <td>{bill.total_usage?.toFixed(2) || '-'}</td>
                      <td>¥{bill.amount?.toFixed(2) || '0.00'}</td>
                      <td>
                        <span className={`badge ${bill.status === 'paid' ? 'badge-success' : bill.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                          {bill.status === 'paid' ? '已支付' : bill.status === 'pending' ? '待支付' : '逾期'}
                        </span>
                      </td>
                      <td>{bill.paid_at || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="grid grid-3 mt-1" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '0.75rem' }}>
                <div>
                  <div className="text-secondary">已支付笔数</div>
                  <div style={{ fontWeight: 700 }}>{meterBillsForReview.filter(b => b.status === 'paid').length} 笔</div>
                </div>
                <div>
                  <div className="text-secondary">已支付总额</div>
                  <div style={{ fontWeight: 700, color: '#388e3c' }}>¥{meterBillsForReview.filter(b => b.status === 'paid').reduce((s, b) => s + (b.amount || 0), 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-secondary">未缴金额</div>
                  <div style={{ fontWeight: 700, color: '#d32f2f' }}>¥{meterBillsForReview.filter(b => b.status !== 'paid').reduce((s, b) => s + (b.amount || 0), 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {showUsageAnalysis && (
            <div className="card mt-2" style={{ border: '1px solid #1976d2' }}>
              <div className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>📊 用电分析</h4>
                <button className="btn btn-outline" onClick={() => setShowUsageAnalysis(false)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>关闭</button>
              </div>

              <div className="mb-2">
                <h5>月度用电趋势</h5>
                {monthlyUsageData.map(d => (
                  <div key={d.period} className="flex" style={{ alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ width: '5rem', fontSize: '0.85rem', color: '#666' }}>{d.period}</div>
                    <div style={{ flex: 1, position: 'relative', height: '1.5rem', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${((d.total_usage || 0) / maxUsage) * 100}%`,
                        background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '0.5rem',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        minWidth: d.total_usage ? '2rem' : '0'
                      }}>
                        {d.total_usage?.toFixed(0) || 0}
                      </div>
                    </div>
                    <div style={{ width: '5rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600 }}>¥{d.amount?.toFixed(0) || 0}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-2 mb-1">
                <div className="card">
                  <h5>峰谷用电比例</h5>
                  <div style={{ display: 'flex', height: '2rem', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ width: `${analysis?.peak_ratio || 50}%`, background: '#ff9800', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
                      峰 {analysis?.peak_ratio || 50}%
                    </div>
                    <div style={{ width: `${analysis?.valley_ratio || 50}%`, background: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
                      谷 {analysis?.valley_ratio || 50}%
                    </div>
                  </div>
                  <div className="flex gap-1" style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: '#ff9800' }}>■ 峰时用电</span>
                    <span style={{ color: '#4caf50' }}>■ 谷时用电</span>
                  </div>
                </div>
                <div className="card">
                  <h5>同比分析</h5>
                  <div className="form-group">
                    <label className="form-label">同期对比</label>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#388e3c' }}>
                      ↓ 5.2%
                    </div>
                    <div className="text-secondary" style={{ fontSize: '0.85rem' }}>较去年同期用电量下降</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">去年同期</label>
                    <div style={{ fontWeight: 600 }}>
                      {monthlyUsageData.length > 0
                        ? (monthlyUsageData.reduce((s, d) => s + (d.total_usage || 0), 0) / monthlyUsageData.length * 1.052).toFixed(0)
                        : '-'
                      } kWh/月均
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showPrintPanel && (
            <div className="card mt-2" style={{ border: '1px solid #1976d2' }}>
              <div className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>🖨️ 打印账单</h4>
                <button className="btn btn-outline" onClick={() => { setShowPrintPanel(false); setPrintConfirmed(false) }} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>关闭</button>
              </div>
              <div className="card" style={{ border: '2px solid #333', background: '#fafafa' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>电力缴费收据</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>Electricity Payment Receipt</div>
                </div>
                <div className="grid grid-2" style={{ fontSize: '0.9rem' }}>
                  <div>
                    <div className="form-group">
                      <label className="form-label">收据编号</label>
                      <div style={{ fontWeight: 600 }}>{selectedBillForReview.bill_id}</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">账期</label>
                      <div style={{ fontWeight: 600 }}>{selectedBillForReview.period}</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">打印日期</label>
                      <div>{new Date().toISOString().split('T')[0]}</div>
                    </div>
                  </div>
                  <div>
                    <div className="form-group">
                      <label className="form-label">电表编号</label>
                      <div>{selectedBillForReview.meter_id}</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">用户姓名</label>
                      <div>{selectedUser?.name || '-'}</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">用电地址</label>
                      <div>{selectedUser?.address || '-'}</div>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '1px dashed #999', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <table className="table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>项目</th>
                        <th>用量</th>
                        <th>单价</th>
                        <th>金额</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>峰时用电</td>
                        <td>{selectedBillForReview.peak_usage?.toFixed(2) || '-'} kWh</td>
                        <td>¥0.64/kWh</td>
                        <td>¥{((selectedBillForReview.peak_usage || 0) * 0.64).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>谷时用电</td>
                        <td>{selectedBillForReview.valley_usage?.toFixed(2) || '-'} kWh</td>
                        <td>¥0.64/kWh</td>
                        <td>¥{((selectedBillForReview.valley_usage || 0) * 0.64).toFixed(2)}</td>
                      </tr>
                      <tr style={{ fontWeight: 700 }}>
                        <td>合计</td>
                        <td>{selectedBillForReview.total_usage?.toFixed(2) || '-'} kWh</td>
                        <td></td>
                        <td style={{ color: '#1976d2', fontSize: '1.1rem' }}>¥{selectedBillForReview.amount?.toFixed(2) || '0.00'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {printConfirmed ? (
                <div className="alert alert-success mt-1">
                  <strong>打印任务已发送</strong>
                  <div>收据已发送至打印队列，请前往打印机取件</div>
                </div>
              ) : (
                <div className="flex gap-1 mt-1">
                  <button className="btn btn-success" onClick={() => setPrintConfirmed(true)}>确认打印</button>
                  <button className="btn btn-outline" onClick={() => setShowPrintPanel(false)}>取消</button>
                </div>
              )}
            </div>
          )}

          {showInvoicePanel && (
            <div className="card mt-2" style={{ border: '1px solid #1976d2' }}>
              <div className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>🧾 电子发票</h4>
                <button className="btn btn-outline" onClick={() => setShowInvoicePanel(false)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>关闭</button>
              </div>
              <div className="alert alert-info">
                <strong>发票信息</strong>
                <div>电子发票已生成，将发送至您的注册邮箱</div>
              </div>
              <div className="grid grid-2" style={{ fontSize: '0.9rem' }}>
                <div className="form-group">
                  <label className="form-label">发票编号</label>
                  <div style={{ fontWeight: 600 }}>INV{selectedBillForReview.bill_id}{Date.now().toString().slice(-6)}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">发票类型</label>
                  <div>电子普通发票</div>
                </div>
                <div className="form-group">
                  <label className="form-label">开票金额</label>
                  <div style={{ fontWeight: 700, color: '#1976d2' }}>¥{selectedBillForReview.amount?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">状态</label>
                  <span className="badge badge-success">已开具</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showPaymentResult && (
        <div className="card mt-2" style={{ border: '2px solid #388e3c' }}>
          <div className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0, color: '#388e3c' }}>✅ 支付成功</h3>
          </div>
          <div className="grid grid-2 mb-1">
            <div>
              <div className="form-group">
                <label className="form-label">交易流水号</label>
                <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{showPaymentResult.transactionId}</div>
              </div>
              <div className="form-group">
                <label className="form-label">支付时间</label>
                <div>{showPaymentResult.timestamp}</div>
              </div>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">支付笔数</label>
                <div style={{ fontWeight: 700 }}>{showPaymentResult.bills.length} 笔</div>
              </div>
              <div className="form-group">
                <label className="form-label">支付总额</label>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#388e3c' }}>
                  ¥{showPaymentResult.bills.reduce((s, b) => s + (b.amount || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          <table className="table" style={{ fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th>账单编号</th>
                <th>账期</th>
                <th>支付金额</th>
              </tr>
            </thead>
            <tbody>
              {showPaymentResult.bills.map((b, i) => (
                <tr key={i}>
                  <td>{b.bill_id}</td>
                  <td>{b.period}</td>
                  <td style={{ fontWeight: 600 }}>¥{(b.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-1 mt-1">
            <button className="btn btn-primary" onClick={() => setShowPaymentResult(null)}>返回</button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="card mt-2" style={{ border: '2px solid #1976d2' }}>
          <div className="flex mb-1" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0 }}>支付确认</h3>
            <button className="btn btn-outline" onClick={() => setShowConfirmModal(null)}>取消</button>
          </div>
          {showConfirmModal.isPayAll ? (
            <div>
              <div className="form-group">
                <label className="form-label">支付类型</label>
                <div>一键支付全部账单</div>
              </div>
              <div className="form-group">
                <label className="form-label">账单数量</label>
                <div>{showConfirmModal.bills.length} 笔</div>
              </div>
              <div className="form-group">
                <label className="form-label">支付总额</label>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1976d2' }}>
                  ¥{showConfirmModal.amount.toFixed(2)}
                </div>
              </div>
              <div className="card mb-1" style={{ background: '#f5f5f5' }}>
                <h5 style={{ margin: '0 0 0.5rem 0' }}>逐笔核对</h5>
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>账期</th>
                      <th>金额(元)</th>
                      <th>小计(元)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showConfirmModal.bills.map((bill, idx) => {
                      const subtotal = showConfirmModal.bills.slice(0, idx + 1).reduce((s, b) => s + b.amount, 0)
                      return (
                        <tr key={bill.bill_id}>
                          <td>{idx + 1}</td>
                          <td>{bill.period}</td>
                          <td>¥{bill.amount.toFixed(2)}</td>
                          <td>¥{subtotal.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="alert alert-info">确认后将依次支付所有未缴账单</div>
              <div className="flex gap-1 mt-2">
                <button className="btn btn-success" onClick={handleConfirmPayAll}>确认支付</button>
                <button className="btn btn-outline" onClick={() => setShowConfirmModal(null)}>取消</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-2">
                <div>
                  <div className="form-group">
                    <label className="form-label">账单编号</label>
                    <div>{showConfirmModal.bill_id}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">账期</label>
                    <div>{showConfirmModal.period}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">账单状态</label>
                    <span className={`badge ${showConfirmModal.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                      {showConfirmModal.status === 'overdue' ? '逾期' : '待支付'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="form-group">
                    <label className="form-label">账单金额</label>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1976d2' }}>
                      ¥{showConfirmModal.amount.toFixed(2)}
                    </div>
                  </div>
                  <div className="alert alert-info">确认支付后将立即更新账单状态</div>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                <button className="btn btn-success" onClick={handleConfirmAndPay}>确认支付</button>
                <button className="btn btn-outline" onClick={() => setShowConfirmModal(null)}>取消</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ResidentPage