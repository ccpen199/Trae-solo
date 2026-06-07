import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { insuredApi } from '../services/api.js'

function InsuredDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [person, setPerson] = useState(null)
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [personData, statsData] = await Promise.all([
        insuredApi.getDetail(id),
        insuredApi.getStatistics(id)
      ])
      setPerson(personData)
      setStats(statsData)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  if (!person) {
    return <div>加载中...</div>
  }

  return (
    <div>
      <div className="header">
        <h1>👤 参保人详情</h1>
        <button className="btn btn-default" onClick={() => navigate(-1)}>← 返回</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <h3>累计结算笔数</h3>
          <div className="value">{stats?.totalSettlements || 0}</div>
        </div>
        <div className="stat-card">
          <h3>累计结算金额</h3>
          <div className="value">¥{(stats?.totalSettlementAmount || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>处方数量</h3>
          <div className="value">{stats?.totalPrescriptions || 0}</div>
        </div>
        <div className="stat-card">
          <h3>账户余额</h3>
          <div className="value">¥{(stats?.accountBalance || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <div className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>基本信息</div>
          <div className={`tab ${activeTab === 'insurance' ? 'active' : ''}`} onClick={() => setActiveTab('insurance')}>参保信息</div>
          <div className={`tab ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>联系方式</div>
        </div>
        <div className="card-body">
          {activeTab === 'basic' && (
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">姓名：</span>
                <span className="detail-value">{person.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">性别：</span>
                <span className="detail-value">{person.gender}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">身份证号：</span>
                <span className="detail-value">{person.id_card}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">出生日期：</span>
                <span className="detail-value">{person.birth_date}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">医保卡号：</span>
                <span className="detail-value">{person.medical_card_number}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">参保状态：</span>
                <span className="detail-value">
                  <span className={`badge ${person.status === '正常参保' ? 'badge-success' : 'badge-default'}`}>
                    {person.status}
                  </span>
                </span>
              </div>
            </div>
          )}
          {activeTab === 'insurance' && (
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">参保类型：</span>
                <span className="detail-value">{person.insurance_type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">参保地：</span>
                <span className="detail-value">{person.insurance_area}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">参保日期：</span>
                <span className="detail-value">{person.insured_date}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">账户余额：</span>
                <span className="detail-value">¥{person.balance?.toFixed(2)}</span>
              </div>
            </div>
          )}
          {activeTab === 'contact' && (
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">联系电话：</span>
                <span className="detail-value">{person.phone}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">联系地址：</span>
                <span className="detail-value">{person.address}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InsuredDetail
