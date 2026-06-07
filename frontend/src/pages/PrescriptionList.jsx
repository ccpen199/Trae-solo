import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { prescriptionApi } from '../services/api.js'

function PrescriptionList() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  useEffect(() => {
    loadData()
  }, [page])

  const loadData = async () => {
    try {
      const data = await prescriptionApi.getList({ page, pageSize })
      setList(data.list)
      setTotal(data.total)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleAudit = async (id, status) => {
    try {
      await prescriptionApi.audit(id, status)
      loadData()
    } catch (error) {
      console.error('审核失败:', error)
    }
  }

  const handleTransfer = async (id) => {
    try {
      await prescriptionApi.transfer(id)
      loadData()
    } catch (error) {
      console.error('流转失败:', error)
    }
  }

  const handleVerify = async (id) => {
    try {
      await prescriptionApi.verify(id, 'PHARMACY001')
      loadData()
    } catch (error) {
      console.error('核销失败:', error)
    }
  }

  const getStatusBadge = (status) => {
    const badgeMap = {
      '待审核': 'badge-warning',
      '已审核': 'badge-info',
      '已流转': 'badge-info',
      '已核销': 'badge-success',
      '已过期': 'badge-error',
      '已驳回': 'badge-error'
    }
    return badgeMap[status] || 'badge-default'
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="header">
        <h1>📋 处方流转</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>处方编号</th>
                <th>参保人</th>
                <th>医院</th>
                <th>诊断</th>
                <th>总金额</th>
                <th>医保支付</th>
                <th>自付</th>
                <th>日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td style={{ fontFamily: 'monospace' }}>{item.id?.slice(0, 8)}</td>
                  <td>{item.insured_name}</td>
                  <td>{item.hospital_name}</td>
                  <td>{item.diagnosis}</td>
                  <td>¥{item.total_amount?.toFixed(2)}</td>
                  <td>¥{item.reimbursement_amount?.toFixed(2)}</td>
                  <td>¥{item.self_pay_amount?.toFixed(2)}</td>
                  <td>{item.prescription_date?.slice(0, 10)}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-default" onClick={() => navigate(`/prescriptions/${item.id}`)}>
                      详情
                    </button>
                    {item.status === '待审核' && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => handleAudit(item.id, '已审核')} style={{ marginLeft: '4px' }}>
                          通过
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleAudit(item.id, '已驳回')} style={{ marginLeft: '4px' }}>
                          驳回
                        </button>
                      </>
                    )}
                    {item.status === '已审核' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleTransfer(item.id)} style={{ marginLeft: '4px' }}>
                        流转
                      </button>
                    )}
                    {item.status === '已流转' && (
                      <button className="btn btn-sm btn-success" onClick={() => handleVerify(item.id)} style={{ marginLeft: '4px' }}>
                        核销
                      </button>
                    )}
                  </td>
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

export default PrescriptionList
