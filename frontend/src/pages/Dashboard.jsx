import { useState, useEffect } from 'react'
import { api } from '../utils/api'

function Dashboard() {
  const [inventory, setInventory] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [inv, logData] = await Promise.all([
        api.get('/inventory/summary'),
        api.get('/inventory/logs')
      ])
      setInventory(inv)
      setLogs(logData)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>

  if (!inventory) {
    return (
      <div className="card">
        <div className="alert alert-danger">
          ⚠️ 无法加载库存数据，请检查后端服务是否正常运行。
        </div>
        <button className="btn btn-primary" onClick={loadData}>重试</button>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>📊 库存看板</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card success">
          <div className="stat-value">{inventory?.total_available || 0}</div>
          <div className="stat-label">可用布草</div>
        </div>
        <div className="stat-card info">
          <div className="stat-value">{inventory?.total_in_wash || 0}</div>
          <div className="stat-label">洗涤中</div>
        </div>
        <div className={`stat-card ${(inventory?.discrepancies || 0) > 0 ? 'danger' : 'success'}`}>
          <div className="stat-value">{inventory?.discrepancies || 0}</div>
          <div className="stat-label">待处理差异</div>
        </div>
        <div className={`stat-card ${(inventory?.pending_approvals || 0) > 0 ? 'warning' : 'success'}`}>
          <div className="stat-value">{inventory?.pending_approvals || 0}</div>
          <div className="stat-label">待审批报损</div>
        </div>
      </div>

      {inventory?.below_safety_items?.length > 0 && (
        <div className="alert alert-danger">
          ⚠️ 警告：以下布草品类库存低于安全库存（10件），可能影响客房排房：
          {inventory.below_safety_items.map(item => (
            <span key={item.category} style={{ marginLeft: '10px', fontWeight: 'bold' }}>
              {item.category} ({item.available}件)
            </span>
          ))}
        </div>
      )}

      <div className="card">
        <h3>按品类库存统计</h3>
        <table className="table">
          <thead>
            <tr>
              <th>品类</th>
              <th>可用</th>
              <th>洗涤中</th>
              <th>使用中</th>
              <th>已报损</th>
              <th>已遗失</th>
              <th>安全库存</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {inventory?.by_category?.map(item => (
              <tr key={item.category}>
                <td>{item.category}</td>
                <td>{item.available}</td>
                <td>{item.in_wash}</td>
                <td>{item.in_use}</td>
                <td>{item.scrapped}</td>
                <td>{item.lost}</td>
                <td>{item.safety_stock}</td>
                <td>
                  {item.below_safety ? (
                    <span className="status-badge status-lost">库存不足</span>
                  ) : (
                    <span className="status-badge status-available">正常</span>
                  )}
                </td>
              </tr>
            )) || []}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>最近库存变动</h3>
        <table className="table">
          <thead>
            <tr>
              <th>时间</th>
              <th>品类</th>
              <th>变动类型</th>
              <th>数量</th>
              <th>操作人</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {(logs || []).slice(0, 10).map(log => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td>{log.linen_category}</td>
                <td>{log.change_type}</td>
                <td style={{ color: log.quantity > 0 ? '#16a34a' : '#dc2626' }}>
                  {log.quantity > 0 ? '+' : ''}{log.quantity}
                </td>
                <td>{log.operator}</td>
                <td>{log.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Dashboard
