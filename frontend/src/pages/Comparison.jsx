import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Comparison() {
  const [results, setResults] = useState([])
  const [summary, setSummary] = useState({ stats: {}, topInverted: [] })
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showRaw, setShowRaw] = useState(null)
  const [rawData, setRawData] = useState([])
  const [filterInverted, setFilterInverted] = useState(false)
  const [filterInventory, setFilterInventory] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadData()
  }, [selectedDate, filterInverted, filterInventory, page])

  const loadData = async () => {
    const params = new URLSearchParams({
      checkin_date: selectedDate,
      page,
      pageSize: 20
    })
    if (filterInverted) params.append('is_price_inverted', 1)
    if (filterInventory) params.append('is_inventory_anomaly', 1)

    const [res, summaryRes] = await Promise.all([
      axios.get(`/api/comparison?${params}`),
      axios.get(`/api/comparison/summary?checkin_date=${selectedDate}`)
    ])
    setResults(res.data.data)
    setTotal(res.data.total)
    setSummary(summaryRes.data)
  }

  const runComparison = async () => {
    await axios.post('/api/comparison/run', { checkin_date: selectedDate })
    loadData()
  }

  const loadRawData = async (item) => {
    const res = await axios.get(`/api/comparison/raw/${item.room_type_id}/${selectedDate}`)
    setRawData(res.data.data)
    setShowRaw(item)
  }

  return (
    <div>
      <div className="header">
        <h1>⚖️ 比价分析</h1>
        <div style={{display: 'flex', gap: 8}}>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd'}} />
          <button className="btn btn-primary" onClick={runComparison}>运行比价</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>对比房型数</h3>
          <div className="value">{summary.stats?.total_comparisons || 0}</div>
        </div>
        <div className="stat-card">
          <h3>价格倒挂</h3>
          <div className="value" style={{color: '#dc3545'}}>{summary.stats?.inverted_count || 0}</div>
        </div>
        <div className="stat-card">
          <h3>库存异常</h3>
          <div className="value" style={{color: '#ffc107'}}>{summary.stats?.inventory_anomaly_count || 0}</div>
        </div>
        <div className="stat-card">
          <h3>平均价差</h3>
          <div className="value">¥{summary.stats?.avg_price_diff?.toFixed?.(0) || 0}</div>
        </div>
      </div>

      {summary.topInverted?.length > 0 && (
        <div className="card">
          <div className="card-header"><h2>⚠️ TOP 10 价格倒挂</h2></div>
          <div className="card-body">
            <table>
              <thead>
                <tr>
                  <th>酒店</th>
                  <th>房型</th>
                  <th>我方价格</th>
                  <th>最低价格</th>
                  <th>最低渠道</th>
                  <th>价差</th>
                  <th>价差%</th>
                </tr>
              </thead>
              <tbody>
                {summary.topInverted.slice(0, 5).map(item => (
                  <tr key={item.id}>
                    <td>{item.hotel_name}</td>
                    <td>{item.room_name}</td>
                    <td className="inverted">¥{item.our_total_price}</td>
                    <td>¥{item.lowest_price}</td>
                    <td><span className="badge badge-info">{item.lowest_channel}</span></td>
                    <td className="inverted">+¥{item.price_difference}</td>
                    <td className="inverted">+{item.price_difference_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>比价结果</h2>
          <div style={{display: 'flex', gap: 8}}>
            <label style={{display: 'flex', alignItems: 'center', gap: 4}}>
              <input type="checkbox" checked={filterInverted} onChange={e => setFilterInverted(e.target.checked)} />
              仅显示价格倒挂
            </label>
            <label style={{display: 'flex', alignItems: 'center', gap: 4}}>
              <input type="checkbox" checked={filterInventory} onChange={e => setFilterInventory(e.target.checked)} />
              仅显示库存异常
            </label>
          </div>
        </div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>房型</th>
                <th>我方价格</th>
                <th>最低价格</th>
                <th>最低渠道</th>
                <th>价差</th>
                <th>价差%</th>
                <th>价格倒挂</th>
                <th>库存异常</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {results.map(item => (
                <tr key={item.id}>
                  <td>{item.room_name}</td>
                  <td>¥{item.our_total_price}</td>
                  <td>¥{item.lowest_price}</td>
                  <td><span className="badge badge-info">{item.lowest_channel}</span></td>
                  <td className={item.price_difference > 0 ? 'inverted' : 'positive'}>
                    {item.price_difference > 0 ? '+' : ''}¥{item.price_difference}
                  </td>
                  <td className={item.price_difference_percent > 0 ? 'inverted' : 'positive'}>
                    {item.price_difference_percent > 0 ? '+' : ''}{item.price_difference_percent}%
                  </td>
                  <td>{item.is_price_inverted ? <span className="badge badge-danger">是</span> : '-'}</td>
                  <td>{item.is_inventory_anomaly ? <span className="badge badge-warning">是</span> : '-'}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => loadRawData(item)}>原始数据</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > 20 && (
            <div className="pagination">
              {Array.from({length: Math.ceil(total / 20)}, (_, i) => (
                <button key={i} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showRaw && (
        <div className="card">
          <div className="card-header" style={{display: 'flex', justifyContent: 'space-between'}}>
            <h2>📋 原始采集记录 - {showRaw.room_name}</h2>
            <button className="btn btn-sm" onClick={() => setShowRaw(null)}>关闭</button>
          </div>
          <div className="card-body">
            <table>
              <thead>
                <tr>
                  <th>渠道</th>
                  <th>房型名称</th>
                  <th>房价</th>
                  <th>税费</th>
                  <th>总价</th>
                  <th>库存</th>
                  <th>促销</th>
                  <th>采集时间</th>
                </tr>
              </thead>
              <tbody>
                {rawData.map(d => (
                  <tr key={d.id}>
                    <td>{d.channel_name}</td>
                    <td>{d.channel_room_name}</td>
                    <td>¥{d.price}</td>
                    <td>¥{d.tax}</td>
                    <td><strong>¥{d.total_price}</strong></td>
                    <td>{d.inventory}间</td>
                    <td>{d.promotion || '-'}</td>
                    <td>{d.collected_at?.slice(0, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
