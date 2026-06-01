import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../api.js';

function Reports() {
  const [activeTab, setActiveTab] = useState('grading');
  const [gradingData, setGradingData] = useState([]);
  const [acceptanceData, setAcceptanceData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gradingRes, acceptanceRes] = await Promise.all([
        reportsAPI.getSupplierGrading(),
        reportsAPI.getAcceptanceChecklist()
      ]);
      setGradingData(gradingRes.data);
      setAcceptanceData(acceptanceRes.data);
    } catch (error) {
      console.error('加载报表数据失败:', error);
    }
  };

  const getGradeBadge = (grade) => {
    const badges = {
      A: 'badge-success',
      B: 'badge-info',
      C: 'badge-warning',
      D: 'badge-danger'
    };
    return <span className={`badge ${badges[grade] || 'badge-secondary'}`}>{grade}</span>;
  };

  const getRiskBadge = (level) => {
    const badges = {
      low: 'badge-success',
      medium: 'badge-warning',
      high: 'badge-danger',
      critical: 'badge-danger'
    };
    const labels = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '极高风险'
    };
    return <span className={`badge ${badges[level] || 'badge-secondary'}`}>{labels[level] || level}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>验收报表</h1>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'grading' ? 'active' : ''}`} onClick={() => setActiveTab('grading')}>供应商分级</div>
        <div className={`tab ${activeTab === 'acceptance' ? 'active' : ''}`} onClick={() => setActiveTab('acceptance')}>验收清单</div>
      </div>

      {activeTab === 'grading' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>供应商名称</th>
                <th>行业</th>
                <th>地区</th>
                <th>风险等级</th>
                <th>最新得分</th>
                <th>评级</th>
                <th>评估次数</th>
                <th>关键供应商</th>
              </tr>
            </thead>
            <tbody>
              {gradingData.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.industry}</td>
                  <td>{item.region}</td>
                  <td>{getRiskBadge(item.risk_level)}</td>
                  <td>{item.latest_score ?? '-'}</td>
                  <td>{item.grade ? getGradeBadge(item.grade) : '-'}</td>
                  <td>{item.assessment_count}</td>
                  <td>{item.is_key_supplier ? '是' : '否'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'acceptance' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>ESG 结论验收清单</h3>
          <table className="table">
            <thead>
              <tr>
                <th>供应商</th>
                <th>问卷版本</th>
                <th>得分</th>
                <th>风险等级</th>
                <th>证据数量</th>
                <th>证据充分</th>
                <th>待整改项</th>
                <th>整改关闭</th>
                <th>复评时间</th>
              </tr>
            </thead>
            <tbody>
              {acceptanceData.map(item => (
                <tr key={item.id}>
                  <td>{item.supplier_name}</td>
                  <td>{item.questionnaire_version}</td>
                  <td>{item.total_score}</td>
                  <td>{getRiskBadge(item.risk_level)}</td>
                  <td>{item.evidence_count}</td>
                  <td>
                    <span className={`badge ${item.has_sufficient_evidence ? 'badge-success' : 'badge-warning'}`}>
                      {item.has_sufficient_evidence ? '是' : '否'}
                    </span>
                  </td>
                  <td>{item.pending_rectifications}</td>
                  <td>
                    <span className={`badge ${item.all_rectifications_closed ? 'badge-success' : 'badge-danger'}`}>
                      {item.all_rectifications_closed ? '是' : '否'}
                    </span>
                  </td>
                  <td>{item.next_review_date}</td>
                </tr>
              ))}
              {acceptanceData.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: '#6b7280' }}>暂无已完成的评估</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reports;
