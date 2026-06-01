import { useEffect, useState } from 'react'
import { reportsAPI } from '../api'

export default function Reports() {
  const [utilization, setUtilization] = useState<any[]>([])
  const [overdueBills, setOverdueBills] = useState<any[]>([])
  const [duplicateCheck, setDuplicateCheck] = useState<any>(null)
  const [customerAnalysis, setCustomerAnalysis] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('utilization')

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      if (activeTab === 'utilization') {
        const res = await reportsAPI.getWarehouseUtilization()
        setUtilization(res.data)
      } else if (activeTab === 'overdue') {
        const res = await reportsAPI.getOverdueBills()
        setOverdueBills(res.data)
      } else if (activeTab === 'duplicate') {
        const res = await reportsAPI.checkDuplicateRental()
        setDuplicateCheck(res.data)
      } else if (activeTab === 'customer') {
        const res = await reportsAPI.getCustomerAnalysis()
        setCustomerAnalysis(res.data)
      }
    } catch (error) {
      console.error('加载报表数据失败:', error)
    }
  }

  const tabs = [
    { key: 'utilization', label: '仓库利用率' },
    { key: 'overdue', label: '逾期账单' },
    { key: 'duplicate', label: '重复出租检查' },
    { key: 'customer', label: '客户分析' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>数据报表</h1>
      </div>

      <div className="card">
        <div className="card-header" style={{ paddingBottom: 0 }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-default'}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: '24px' }}>
          {activeTab === 'utilization' && (
            <div>
              <h4 style={{ marginBottom: '16px' }}>仓库资源利用情况</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>仓库编码</th>
                    <th>仓库名称</th>
                    <th>面积(㎡)</th>
                    <th>状态</th>
                    <th>租赁合同</th>
                    <th>承租客户</th>
                    <th>租赁开始</th>
                    <th>租赁到期</th>
                  </tr>
                </thead>
                <tbody>
                  {utilization.map((w) => (
                    <tr key={w.id}>
                      <td>{w.code}</td>
                      <td>{w.name}</td>
                      <td>{w.area}</td>
                      <td>
                        <span className={`status-badge status-${w.status}`}>
                          {w.status === 'available' ? '可租' : w.status === 'rented' ? '已租' : w.status}
                        </span>
                      </td>
                      <td>{w.contract_code || '-'}</td>
                      <td>{w.customer_name || '-'}</td>
                      <td>{w.start_date || '-'}</td>
                      <td>{w.end_date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'overdue' && (
            <div>
              <h4 style={{ marginBottom: '16px', color: overdueBills.length > 0 ? '#ff4d4f' : '#52c41a' }}>
                {overdueBills.length > 0 ? `发现 ${overdueBills.length} 笔逾期账单` : '暂无逾期账单'}
              </h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>账单编号</th>
                    <th>合同</th>
                    <th>客户</th>
                    <th>仓库</th>
                    <th>账期</th>
                    <th>应收金额</th>
                    <th>已收金额</th>
                    <th>到期日</th>
                    <th>逾期天数</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueBills.map((b) => (
                    <tr key={b.id}>
                      <td>{b.bill_no}</td>
                      <td>{b.contract_code}</td>
                      <td>{b.customer_name}</td>
                      <td>{b.warehouse_name}</td>
                      <td>{b.period}</td>
                      <td>¥{b.amount?.toLocaleString()}</td>
                      <td>¥{b.paid_amount?.toLocaleString()}</td>
                      <td>{b.due_date}</td>
                      <td style={{ color: '#ff4d4f', fontWeight: 600 }}>{Math.floor(b.overdue_days)} 天</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'duplicate' && duplicateCheck && (
            <div>
              <h4 style={{ marginBottom: '16px', color: duplicateCheck.has_duplicates ? '#ff4d4f' : '#52c41a' }}>
                {duplicateCheck.has_duplicates ? `发现 ${duplicateCheck.duplicates.length} 个重复出租问题` : '检查通过，无重复出租'}
              </h4>
              {duplicateCheck.has_duplicates ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>仓库编码</th>
                      <th>仓库名称</th>
                      <th>当前状态</th>
                      <th>有效合同数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicateCheck.duplicates.map((d: any) => (
                      <tr key={d.warehouse_id}>
                        <td>{d.warehouse_code}</td>
                        <td>{d.warehouse_name}</td>
                        <td>{d.status}</td>
                        <td style={{ color: '#ff4d4f', fontWeight: 600 }}>{d.active_contracts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#52c41a' }}>
                  ✅ 所有仓库资源状态正常，无重复出租问题
                </div>
              )}
            </div>
          )}

          {activeTab === 'customer' && (
            <div>
              <h4 style={{ marginBottom: '16px' }}>客户价值分析</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>客户名称</th>
                    <th>公司</th>
                    <th>行业</th>
                    <th>合同数</th>
                    <th>累计消费</th>
                    <th>累计支付</th>
                  </tr>
                </thead>
                <tbody>
                  {customerAnalysis.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.company}</td>
                      <td>{c.industry || '-'}</td>
                      <td>{c.contract_count}</td>
                      <td>¥{(c.total_spend || 0).toLocaleString()}</td>
                      <td>¥{(c.total_paid || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
