import React, { useState, useEffect } from 'react';
import { reportApi, familyApi } from '../utils/api.js';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [workload, setWorkload] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [satisfaction, setSatisfaction] = useState(null);
  const [highRiskCases, setHighRiskCases] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [summaryRes, workloadRes, renewalsRes, satisfactionRes, familyRes] = await Promise.all([
        reportApi.summary(),
        reportApi.workload(),
        reportApi.renewals(),
        reportApi.satisfaction(),
        familyApi.list(),
      ]);
      setSummary(summaryRes.data);
      setWorkload(workloadRes.data || []);
      setRenewals(renewalsRes.data || []);
      setSatisfaction(satisfactionRes.data);
      const highRisk = (familyRes.data || []).filter(
        (f) => f.riskLevel === 'high' || f.riskLevel === 'critical'
      );
      setHighRiskCases(highRisk);
    } catch (err) {
      setError('获取报表数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level) => {
    const levelMap = {
      low: { label: '低风险', class: 'badge-green' },
      medium: { label: '中风险', class: 'badge-yellow' },
      high: { label: '高风险', class: 'badge-orange' },
      critical: { label: '极高风险', class: 'badge-red' },
    };
    const info = levelMap[level] || { label: level, class: 'badge-gray' };
    return <span className={`badge ${info.class}`}>{info.label}</span>;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">运营报表</h1>
        <button className="btn btn-secondary" onClick={fetchAllData}>
          🔄 刷新数据
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="report-section">
        <h3>服务进度统计</h3>
        <div className="report-grid">
          <div className="report-item">
            <div className="report-item-label">家庭总数</div>
            <div className="report-item-value">{summary?.familyCount || 0}</div>
          </div>
          <div className="report-item">
            <div className="report-item-label">进行中</div>
            <div className="report-item-value">{summary?.activeCount || 0}</div>
          </div>
          <div className="report-item">
            <div className="report-item-label">已完成</div>
            <div className="report-item-value">{summary?.completedCount || 0}</div>
          </div>
          <div className="report-item">
            <div className="report-item-label">平均周期（周）</div>
            <div className="report-item-value">{summary?.avgDuration || 0}</div>
          </div>
        </div>
      </div>

      <div className="report-section">
        <h3>续费统计</h3>
        {renewals.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px' }}>
            <p>暂无续费数据</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>家庭</th>
                <th>原服务包</th>
                <th>续费服务包</th>
                <th>续费日期</th>
                <th>续费金额</th>
              </tr>
            </thead>
            <tbody>
              {renewals.map((item) => (
                <tr key={item.id}>
                  <td>{item.familyName || '未知家庭'}</td>
                  <td>{item.originalPackage || '-'}</td>
                  <td>{item.renewedPackage || '-'}</td>
                  <td>{item.renewalDate ? new Date(item.renewalDate).toLocaleDateString('zh-CN') : '-'}</td>
                  <td>¥{item.amount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="report-section">
        <h3>满意度分析</h3>
        <div className="report-grid">
          <div className="report-item">
            <div className="report-item-label">平均满意度</div>
            <div className="report-item-value">{satisfaction?.avgScore || 0} / 5</div>
          </div>
          <div className="report-item">
            <div className="report-item-label">评价总数</div>
            <div className="report-item-value">{satisfaction?.totalReviews || 0}</div>
          </div>
          <div className="report-item">
            <div className="report-item-label">非常满意</div>
            <div className="report-item-value">{satisfaction?.verySatisfied || 0}</div>
          </div>
          <div className="report-item">
            <div className="report-item-label">满意</div>
            <div className="report-item-value">{satisfaction?.satisfied || 0}</div>
          </div>
          <div className="report-item">
            <div className="report-item-label">一般</div>
            <div className="report-item-value">{satisfaction?.neutral || 0}</div>
          </div>
          <div className="report-item">
            <div className="report-item-label">不满意</div>
            <div className="report-item-value">{satisfaction?.dissatisfied || 0}</div>
          </div>
        </div>
      </div>

      <div className="report-section">
        <h3>高风险个案列表</h3>
        {highRiskCases.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px' }}>
            <p>暂无高风险个案</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>孩子姓名</th>
                <th>年龄</th>
                <th>主要问题</th>
                <th>风险等级</th>
                <th>状态</th>
                <th>咨询师</th>
              </tr>
            </thead>
            <tbody>
              {highRiskCases.map((item) => (
                <tr key={item.id}>
                  <td>{item.childName}</td>
                  <td>{item.age}</td>
                  <td style={{ maxWidth: '300px' }}>
                    {item.mainIssue?.length > 50
                      ? item.mainIssue.substring(0, 50) + '...'
                      : item.mainIssue}
                  </td>
                  <td>{getRiskBadge(item.riskLevel)}</td>
                  <td>
                    {item.status === 'active' ? (
                      <span className="badge badge-green">进行中</span>
                    ) : (
                      <span className="badge badge-gray">{item.status}</span>
                    )}
                  </td>
                  <td>{item.consultantName || '未分配'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="report-section">
        <h3>咨询师负载统计</h3>
        {workload.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px' }}>
            <p>暂无负载数据</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>咨询师</th>
                <th>负责家庭数</th>
                <th>进行中个案</th>
                <th>本周咨询次数</th>
                <th>负载状态</th>
              </tr>
            </thead>
            <tbody>
              {workload.map((item) => (
                <tr key={item.id}>
                  <td>{item.consultantName || '未知'}</td>
                  <td>{item.familyCount || 0}</td>
                  <td>{item.activeCases || 0}</td>
                  <td>{item.weeklySessions || 0}</td>
                  <td>
                    {item.loadStatus === 'normal' ? (
                      <span className="badge badge-green">正常</span>
                    ) : item.loadStatus === 'busy' ? (
                      <span className="badge badge-yellow">繁忙</span>
                    ) : item.loadStatus === 'overloaded' ? (
                      <span className="badge badge-red">过载</span>
                    ) : (
                      <span className="badge badge-gray">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">数据说明</h3>
        </div>
        <div style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.8' }}>
          <p><strong>服务进度统计：</strong>展示当前系统中所有家庭档案的服务状态分布情况。</p>
          <p><strong>续费统计：</strong>展示有续费记录的家庭信息，包括续费前后的服务包对比。</p>
          <p><strong>满意度分析：</strong>基于家长反馈的满意度评价数据，5分制评分。</p>
          <p><strong>高风险个案：</strong>风险等级为"高风险"或"极高风险"的家庭档案，需要重点关注。</p>
          <p><strong>咨询师负载：</strong>按咨询师统计的工作量情况，帮助合理分配个案。</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
