import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrder, getTemperatureReport } from '../api'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [report, setReport] = useState(null)

  useEffect(() => {
    loadOrder()
  }, [id])

  const loadOrder = async () => {
    try {
      const res = await getOrder(id)
      setOrder(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const loadReport = async (dispatchId) => {
    try {
      const res = await getTemperatureReport(dispatchId)
      setReport(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  if (!order) return <div>加载中...</div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn" onClick={() => navigate(-1)} style={{ marginRight: 12 }}>← 返回</button>
          <h1 style={{ display: 'inline' }}>订单详情 - {order.order_no}</h1>
        </div>
      </div>

      <div className="card">
        <h3>订单信息</h3>
        <div className="form-row">
          <div><strong>药品批次：</strong>{order.drug_batch}</div>
          <div><strong>药品名称：</strong>{order.drug_name}</div>
          <div><strong>温区要求：</strong>{order.temp_zone_required} ({order.min_temp}~{order.max_temp}°C)</div>
          <div><strong>温度探头：</strong>{order.probe_id}</div>
          <div><strong>送达时限：</strong>{order.deadline?.slice(0, 16)}</div>
          <div><strong>状态：</strong>
            <span className={`status-badge status-${order.status}`} style={{ marginLeft: 8 }}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>客户信息</h3>
        <div className="form-row">
          <div><strong>客户名称：</strong>{order.customer_name}</div>
          <div><strong>联系电话：</strong>{order.customer_phone}</div>
          <div style={{ gridColumn: '1 / -1' }}><strong>收货地址：</strong>{order.customer_address}</div>
        </div>
      </div>

      <div className="card">
        <h3>审计追踪</h3>
        <div className="audit-trail">
          {order.audits?.map((a, i) => (
            <div key={a.id || i} className="audit-item">
              <div className="time">{a.created_at?.slice(0, 19)}</div>
              <div className="action">{a.action_type}</div>
              <div style={{ fontSize: 13, color: '#666' }}>操作人：{a.operator}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
