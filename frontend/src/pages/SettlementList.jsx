import React, { useState, useEffect } from 'react'
import { settlementApi } from '../services/api.js'

function SettlementList() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  useEffect(() => {
    loadData()
  }, [page])

  const loadData = async () => {
    try {
      const data = await settlementApi.getList({ page, pageSize })
      setList(data.list)
      setTotal(data.total)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="header">
        <h1>💰 结算记录</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>参保人</th>
                <th>结算类型</th>
                <th>医疗机构</th>
                <th>总金额</th>
                <th>医保支付</th>
                <th>个人自付</th>
                <th>账户支付</th>
                <th>跨省</th>
                <th>日期</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td>{item.insured_name}</td>
                  <td>
                    <span className="badge badge-info">{item.settlement_type}</span>
                  </td>
                  <td>{item.hospital_name}</td>
                  <td>¥{item.total_amount?.toFixed(2)}</td>
                  <td style={{ color: '#52c41a' }}>¥{item.insurance_pay?.toFixed(2)}</td>
                  <td style={{ color: '#faad14' }}>¥{item.individual_pay?.toFixed(2)}</td>
                  <td>¥{item.account_pay?.toFixed(2)}</td>
                  <td>
                    {item.is_cross_province ? (
                      <span className="badge badge-warning">是</span>
                    ) : (
                      <span className="badge badge-default">否</span>
                    )}
                  </td>
                  <td>{item.settlement_date?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettlementList
