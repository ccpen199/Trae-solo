import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { prescriptionApi } from '../services/api.js'

function PrescriptionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prescription, setPrescription] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const data = await prescriptionApi.getDetail(id)
      setPrescription(data)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  if (!prescription) {
    return <div>加载中...</div>
  }

  return (
    <div>
      <div className="header">
        <h1>📋 处方详情</h1>
        <button className="btn btn-default" onClick={() => navigate(-1)}>← 返回</button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>基本信息</h2>
          <span className={`badge ${prescription.status === '已核销' ? 'badge-success' : prescription.status === '待审核' ? 'badge-warning' : 'badge-info'}`}>
            {prescription.status}
          </span>
        </div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">处方编号：</span>
              <span className="detail-value">{prescription.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">参保人：</span>
              <span className="detail-value">{prescription.insured_name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">身份证号：</span>
              <span className="detail-value">{prescription.id_card}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">开具医院：</span>
              <span className="detail-value">{prescription.hospital_name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">主治医生：</span>
              <span className="detail-value">{prescription.doctor_name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">诊断：</span>
              <span className="detail-value">{prescription.diagnosis}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">开具日期：</span>
              <span className="detail-value">{prescription.prescription_date?.slice(0, 10)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">核销时间：</span>
              <span className="detail-value">{prescription.verification_time?.slice(0, 19) || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>药品明细</h2>
        </div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>药品编码</th>
                <th>药品名称</th>
                <th>规格</th>
                <th>数量</th>
                <th>单位</th>
                <th>单价</th>
                <th>总价</th>
                <th>用法</th>
              </tr>
            </thead>
            <tbody>
              {prescription.items?.map(item => (
                <tr key={item.id}>
                  <td>{item.drug_code}</td>
                  <td>{item.drug_name}</td>
                  <td>{item.specification}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td>¥{item.unit_price?.toFixed(2)}</td>
                  <td>¥{item.total_price?.toFixed(2)}</td>
                  <td>{item.dosage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>费用信息</h2>
        </div>
        <div className="card-body">
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card" style={{ margin: 0 }}>
              <h3>总金额</h3>
              <div className="value">¥{prescription.total_amount?.toFixed(2)}</div>
            </div>
            <div className="stat-card" style={{ margin: 0 }}>
              <h3>医保报销</h3>
              <div className="value" style={{ color: '#52c41a' }}>¥{prescription.reimbursement_amount?.toFixed(2)}</div>
            </div>
            <div className="stat-card" style={{ margin: 0 }}>
              <h3>个人自付</h3>
              <div className="value" style={{ color: '#faad14' }}>¥{prescription.self_pay_amount?.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrescriptionDetail
