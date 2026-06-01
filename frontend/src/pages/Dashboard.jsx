import { useState, useEffect } from 'react'
import { getOrders, getDispatches, getAlerts, getVehicles } from '../api'

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, inTransit: 0, alerts: 0, vehicles: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ordersRes, dispatchesRes, alertsRes, vehiclesRes] = await Promise.all([
        getOrders(),
        getDispatches(),
        getAlerts(),
        getVehicles()
      ])

      setStats({
        orders: ordersRes.data.length,
        inTransit: dispatchesRes.data.filter(d => d.status === 'in_transit').length,
        alerts: alertsRes.data.filter(a => a.status === 'pending').length,
        vehicles: vehiclesRes.data.length
      })

      setRecentOrders(ordersRes.data.slice(0, 5))
      setRecentAlerts(alertsRes.data.slice(0, 5))
    } catch (e) {
      console.error('加载数据失败', e)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>数据概览</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{stats.orders}</div>
          <div className="label">订单总数</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.inTransit}</div>
          <div className="label">在途配送</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: stats.alerts > 0 ? '#dc2626' : '#16a34a' }}>
            {stats.alerts}
          </div>
          <div className="label">待处理预警</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.vehicles}</div>
          <div className="label">车辆总数</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3>最近订单</h3>
          <table>
            <thead>
              <tr>
                <th>订单号</th>
                <th>药品</th>
                <th>客户</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id}>
                  <td>{o.order_no}</td>
                  <td>{o.drug_name}</td>
                  <td>{o.customer_name}</td>
                  <td>
                    <span className={`status-badge status-${o.status}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>预警信息</h3>
          <table>
            <thead>
              <tr>
                <th>订单</th>
                <th>类型</th>
                <th>消息</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {recentAlerts.map(a => (
                <tr key={a.id}>
                  <td>{a.order_no || '-'}</td>
                  <td>{a.alert_type}</td>
                  <td>{a.message}</td>
                  <td>
                    <span className={`status-badge alert-${a.status === 'handled' ? 'handled' : 'warning'}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentAlerts.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                    暂无预警
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
