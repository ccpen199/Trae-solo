import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';
import { reportsAPI, suppliersAPI, assessmentsAPI } from '../api.js';

function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (statistics && document.getElementById('risk-chart')) {
      renderCharts();
    }
  }, [statistics]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, suppliersRes, assessmentsRes] = await Promise.all([
        reportsAPI.getStatistics(),
        suppliersAPI.getAll({ is_key_supplier: 'true' }),
        assessmentsAPI.getAll({ status: 'submitted' })
      ]);
      setStatistics(statsRes.data);
      setSuppliers(suppliersRes.data.slice(0, 5));
      setAssessments(assessmentsRes.data.slice(0, 5));
    } catch (error) {
      console.error('加载数据失败:', error);
      setError(error.message || '数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const renderCharts = () => {
    const riskChart = echarts.init(document.getElementById('risk-chart'));
    const riskData = statistics.risk_distribution || [];
    riskChart.setOption({
      title: { text: '风险等级分布', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: riskData.map(item => ({
          name: item.risk_level === 'low' ? '低风险' : item.risk_level === 'medium' ? '中风险' : '高风险',
          value: item.count
        }))
      }]
    });

    const industryChart = echarts.init(document.getElementById('industry-chart'));
    const industryData = statistics.industry_distribution || [];
    industryChart.setOption({
      title: { text: '行业分布', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: industryData.map(item => item.industry) },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: industryData.map(item => item.count),
        itemStyle: { color: '#3b82f6' }
      }]
    });
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

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-secondary',
      in_progress: 'badge-info',
      submitted: 'badge-warning',
      approved: 'badge-success'
    };
    const labels = {
      draft: '草稿',
      in_progress: '进行中',
      submitted: '待审核',
      approved: '已通过'
    };
    return <span className={`badge ${badges[status] || 'badge-secondary'}`}>{labels[status] || status}</span>;
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>数据加载中...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#ef4444', marginBottom: '16px' }}>加载失败: {error}</div>
        <button className="btn btn-primary" onClick={loadData}>重试</button>
      </div>
    );
  }

  if (!statistics) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>暂无数据</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>数据概览</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{statistics.total_suppliers}</div>
          <div className="label">供应商总数</div>
        </div>
        <div className="stat-card">
          <div className="value">{statistics.key_suppliers}</div>
          <div className="label">关键供应商</div>
        </div>
        <div className="stat-card">
          <div className="value">{statistics.total_assessments}</div>
          <div className="label">评估总数</div>
        </div>
        <div className="stat-card">
          <div className="value">{statistics.approved_assessments}</div>
          <div className="label">已通过评估</div>
        </div>
        <div className="stat-card">
          <div className="value">{statistics.pending_rectifications}</div>
          <div className="label">待整改项</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="card">
          <div id="risk-chart" className="chart-container"></div>
        </div>
        <div className="card">
          <div id="industry-chart" className="chart-container"></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>关键供应商</h3>
          <table className="table">
            <thead>
              <tr>
                <th>供应商名称</th>
                <th>行业</th>
                <th>风险等级</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.industry}</td>
                  <td>{getRiskBadge(supplier.risk_level)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>待审核评估</h3>
          <table className="table">
            <thead>
              <tr>
                <th>供应商</th>
                <th>问卷版本</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map(assessment => (
                <tr key={assessment.id}>
                  <td>{assessment.supplier_name}</td>
                  <td>{assessment.questionnaire_version}</td>
                  <td>{getStatusBadge(assessment.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
