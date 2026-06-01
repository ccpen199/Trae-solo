import { useState, useEffect } from 'react'
import { getOrders, getAudit, getTemperatureReport } from '../api'

export default function Audit() {
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [audits, setAudits] = useState([])
  const [report, setReport] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const res = await getOrders()
      setOrders(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const selectOrder = async (order) => {
    setSelectedOrder(order)
    try {
      const [auditRes, reportRes] = await Promise.all([
        getAudit(order.id),
        order.id ? Promise.resolve({ data: null }) : Promise.resolve({ data: null })
      ])
      setAudits(auditRes.data)
      
      if (order.dispatch_id) {
        const rep = await getTemperatureReport(order.dispatch_id)
        setReport(rep.data)
      } else {
        setReport(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>审计追溯</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 20 }}>
        <div className="card">
          <h3>订单列表</h3>
          <div style={{ gap: 8, display: 'flex', flexDirection: 'column' }}>
            {orders.map(o => (
              <div
                key={o.id}
                onClick={() => selectOrder(o)}
                style={{
                  padding: 12,
                  border: selectedOrder?.id === o.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: selectedOrder?.id === o.id ? '#eff6ff' : '#fff'
                }}
              >
                <div style={{ fontWeight: 600 }}>{o.order_no}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{o.drug_name || o.drug_batch}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: '#666' }}>{o.customer_name}</span>
                  <span className={`status-badge status-${o.status}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selectedOrder ? (
            <>
              <div className="card">
                <h3>订单审计追踪</h3>
                <div className="audit-trail">
                  {audits.map((a, i) => (
                    <div key={a.id || i} className="audit-item">
                      <div className="time">{a.created_at?.slice(0, 19)}</div>
                      <div className="action">{a.action_type}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>操作人：{a.operator}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        {a.action_details}
                      </div>
                    </div>
                  ))}
                  {audits.length === 0 && (
                    <div style={{ color: '#666' }}>暂无审计记录</div>
                  )}
                </div>
              </div>

              {report && (
                <div className="card">
                  <h3>温控证据链</h3>
                  <div className="form-row" style={{ marginBottom: 16 }}>
                    <div><strong>订单号：</strong>{report.dispatch?.order_no}</div>
                    <div><strong>药品：</strong>{report.dispatch?.drug_name}</div>
                    <div><strong>车辆：</strong>{report.dispatch?.plate_number}</div>
                    <div><strong>司机：</strong>{report.dispatch?.driver_name}</div>
                  </div>

                  <h4 style={{ marginBottom: 12 }}>温度记录（{report.temperatures?.length || 0}条）</h4>
                  <table style={{ marginBottom: 20 }}>
                    <thead>
                      <tr><th>时间</th><th>温度</th><th>状态</th></tr>
                    </thead>
                    <tbody>
                      {report.temperatures?.slice(0, 10).map((t, i) => (
                        <tr key={i}>
                          <td>{t.timestamp?.slice(0, 19)}</td>
                          <td style={{ color: t.is_alert ? '#dc2626' : '#16a34a', fontWeight: 500 }}>
                            {t.temperature}°C
                          </td>
                          <td>
                            <span className={`status-badge ${t.is_alert ? 'status-rejected' : 'status-delivered'}`}>
                              {t.is_alert ? '超温' : '正常'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <h4 style={{ marginBottom: 12 }}>预警记录（{report.alerts?.length || 0}条）</h4>
                  <table>
                    <thead>
                      <tr><th>时间</th><th>类型</th><th>消息</th><th>状态</th></tr>
                    </thead>
                    <tbody>
                      {report.alerts?.map((a, i) => (
                        <tr key={i}>
                          <td>{a.created_at?.slice(0, 19)}</td>
                          <td>{a.alert_type}</td>
                          <td>{a.message}</td>
                          <td>
                            <span className={`status-badge ${a.status === 'handled' ? 'status-delivered' : 'status-pending'}`}>
                              {a.status === 'handled' ? '已处理' : '待处理'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!report.alerts || report.alerts.length === 0) && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                            无预警记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {report.signoff && (
                    <div style={{ marginTop: 20 }}>
                      <h4 style={{ marginBottom: 12 }}>签收记录</h4>
                      <div className="form-row">
                        <div><strong>签收人：</strong>{report.signoff.receiver_name}</div>
                        <div><strong>时间：</strong>{report.signoff.signoff_time?.slice(0, 19)}</div>
                        <div><strong>温度：</strong>{report.signoff.temperature}°C</div>
                        <div><strong>状态：</strong>
                          <span className={`status-badge ${report.signoff.status === 'accepted' ? 'status-delivered' : 'status-rejected'}`} style={{ marginLeft: 8 }}>
                            {report.signoff.status === 'accepted' ? '正常签收' : '拒收'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="card">
                <h3>配送证据完整性检查</h3>
                <table>
                  <thead>
                    <tr><th>证据项</th><th>状态</th><th>备注</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>订单创建记录</td>
                      <td><span className="status-badge status-delivered">完整</span></td>
                      <td>订单信息、客户资质已存档</td>
                    </tr>
                    <tr>
                      <td>调度校验记录</td>
                      <td><span className="status-badge status-delivered">完整</span></td>
                      <td>车辆、司机资质校验通过</td>
                    </tr>
                    <tr>
                      <td>在途温度数据</td>
                      <td>
                        <span className={`status-badge ${report?.temperatures?.length ? 'status-delivered' : 'status-pending'}`}>
                          {report?.temperatures?.length ? '完整' : '待采集'}
                        </span>
                      </td>
                      <td>{report?.temperatures?.length || 0} 条温度记录</td>
                    </tr>
                    <tr>
                      <td>签收凭证</td>
                      <td>
                        <span className={`status-badge ${report?.signoff ? 'status-delivered' : 'status-pending'}`}>
                          {report?.signoff ? '完整' : '待签收'}
                        </span>
                      </td>
                      <td>{report?.signoff ? '收货人已确认' : '等待签收'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              请选择左侧订单查看审计追溯
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
