import React, { useState, useEffect } from 'react';
import { getReports, generateReport, exportReportPDF, getAuditPlans } from '../api.js';

function Reports() {
  const [reports, setReports] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reportsRes, plansRes] = await Promise.all([
        getReports(),
        getAuditPlans()
      ]);
      setReports(reportsRes.data);
      setPlans(plansRes.data.filter(p => p.status === 'scheduled' || p.status === 'in_progress'));
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPlan) return;
    
    setGenerating(true);
    try {
      const res = await generateReport(selectedPlan);
      setCurrentReport(res.data);
      loadData();
    } catch (error) {
      console.error('生成报告失败', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = (auditPlanId) => {
    exportReportPDF(auditPlanId);
  };

  const getRiskLabel = (level) => {
    const map = {
      low: { text: '低风险', class: 'tag-success' },
      medium: { text: '中风险', class: 'tag-warning' },
      high: { text: '高风险', class: 'tag-danger' }
    };
    const l = map[level] || map.medium;
    return <span className={`tag ${l.class}`}>{l.text}</span>;
  };

  const getConclusionColor = (conclusion) => {
    if (conclusion?.includes('通过') && !conclusion.includes('未通过')) return '#52c41a';
    if (conclusion?.includes('有条件')) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div>
      <h2 className="page-title">报告归档</h2>

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>生成新报告</h3>
        <div className="form-row">
          <div className="form-group">
            <label>选择验厂计划</label>
            <select className="select-control" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
              <option value="">请选择验厂计划</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.supplier_name} - {p.factory_name} ({p.audit_date})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={!selectedPlan || generating}>
              {generating ? '生成中...' : '生成报告'}
            </button>
          </div>
        </div>
      </div>

      {currentReport && (
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>报告预览</h3>
          
          <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: getConclusionColor(currentReport.conclusion) }}>
                  {currentReport.conclusion}
                </div>
                <div style={{ marginTop: '8px' }}>
                  总分: <strong>{currentReport.score.percentage}%</strong> ({currentReport.score.totalScore}/{currentReport.score.totalPossible})
                </div>
              </div>
              <div>
                风险等级: {getRiskLabel(currentReport.riskLevel)}
              </div>
            </div>
          </div>

          <h4 style={{ marginBottom: '12px' }}>分类评分</h4>
          <table className="table" style={{ marginBottom: '24px' }}>
            <thead>
              <tr>
                <th>分类</th>
                <th>得分</th>
                <th>满分</th>
                <th>百分比</th>
              </tr>
            </thead>
            <tbody>
              {currentReport.score.categoryScores.map((cat, idx) => (
                <tr key={idx}>
                  <td>{cat.category_name}</td>
                  <td>{cat.category_score}</td>
                  <td>{cat.category_total}</td>
                  <td>{cat.category_total > 0 ? Math.round((cat.category_score / cat.category_total) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 style={{ marginBottom: '12px' }}>问题汇总</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: '#fafafa', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentReport.issues.all.length}</div>
              <div style={{ color: '#8c8c8c' }}>总问题数</div>
            </div>
            <div style={{ padding: '16px', background: '#fff2f0', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>{currentReport.issues.critical.length}</div>
              <div style={{ color: '#8c8c8c' }}>严重问题</div>
            </div>
            <div style={{ padding: '16px', background: '#fffbe6', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>{currentReport.issues.open.length}</div>
              <div style={{ color: '#8c8c8c' }}>待整改</div>
            </div>
            <div style={{ padding: '16px', background: '#f6ffed', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{currentReport.issues.closed.length}</div>
              <div style={{ color: '#8c8c8c' }}>已关闭</div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-success" onClick={() => handleExportPDF(currentReport.plan.id)}>
              📄 导出 PDF 报告
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>报告归档列表</h3>
        {reports.length === 0 ? (
          <div className="empty-state">暂无报告</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>供应商</th>
                <th>工厂</th>
                <th>审核日期</th>
                <th>审核员</th>
                <th>得分</th>
                <th>风险等级</th>
                <th>结论</th>
                <th>导出次数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id}>
                  <td>{report.supplier_name}</td>
                  <td>{report.factory_name}</td>
                  <td>{report.audit_date}</td>
                  <td>{report.auditor_name}</td>
                  <td style={{ fontWeight: 'bold' }}>{report.total_score}%</td>
                  <td>{getRiskLabel(report.risk_level)}</td>
                  <td style={{ color: getConclusionColor(report.conclusion) }}>{report.conclusion}</td>
                  <td>{report.exported_count}</td>
                  <td>
                    <button className="btn btn-sm btn-default" onClick={() => handleExportPDF(report.audit_plan_id)}>
                      导出PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Reports;
