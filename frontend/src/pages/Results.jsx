import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resultAPI, interventionAPI } from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Results = () => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [riskDistribution, setRiskDistribution] = useState({});
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [filters, setFilters] = useState({ risk_level: '', grade: '' });
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [interventionForm, setInterventionForm] = useState({
    type: 'interview',
    content: '',
    outcome: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      if (hasRole('admin', 'psychologist', 'teacher')) {
        const [res, distRes, studentsRes] = await Promise.all([
          resultAPI.getResults(filters),
          resultAPI.getRiskDistribution(),
          resultAPI.getAtRiskStudents({ min_risk: 'mild' })
        ]);
        setResults(res.data);
        setRiskDistribution(distRes.data);
        setAtRiskStudents(studentsRes.data);
      } else if (hasRole('student')) {
        const res = await resultAPI.getResults({});
        setResults(res.data.filter(r => r.student_id === user.id));
      }
    } catch (error) {
      console.error('Load results error:', error);
    }
  };

  const handleViewResult = async (result) => {
    try {
      const res = await resultAPI.getResult(result.id);
      setSelectedResult(res.data);
    } catch (error) {
      alert(error.response?.data?.error || '加载失败');
    }
  };

  const handleCreateIntervention = async (e) => {
    e.preventDefault();
    try {
      await interventionAPI.createIntervention({
        student_id: selectedResult.student_id,
        result_id: selectedResult.id,
        ...interventionForm
      });
      setShowInterventionModal(false);
      alert('干预记录创建成功');
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    }
  };

  const getRiskBadge = (level) => {
    const badges = {
      severe: 'badge-severe',
      moderate: 'badge-moderate',
      mild: 'badge-mild',
      normal: 'badge-normal'
    };
    const labels = {
      severe: '严重风险',
      moderate: '中度风险',
      mild: '轻度风险',
      normal: '正常'
    };
    return <span className={`badge ${badges[level]}`}>{labels[level]}</span>;
  };

  const pieData = {
    labels: ['正常', '轻度风险', '中度风险', '严重风险'],
    datasets: [{
      data: [
        riskDistribution.normal || 0,
        riskDistribution.mild || 0,
        riskDistribution.moderate || 0,
        riskDistribution.severe || 0
      ],
      backgroundColor: ['#10b981', '#fbbf24', '#f59e0b', '#ef4444']
    }]
  };

  const dimensionData = selectedResult ? {
    labels: Object.values(selectedResult.dimension_scores || {}).map(d => d.label),
    datasets: [{
      label: '维度得分',
      data: Object.values(selectedResult.dimension_scores || {}).map(d => d.avgScore || 0),
      backgroundColor: '#667eea'
    }]
  } : null;

  return (
    <div>
      <div className="page-header">
        <h1>结果分析</h1>
      </div>

      {hasRole('admin', 'psychologist', 'teacher') && (
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            结果列表
          </button>
          <button
            className={`tab ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            统计分析
          </button>
          <button
            className={`tab ${activeTab === 'atRisk' ? 'active' : ''}`}
            onClick={() => setActiveTab('atRisk')}
          >
            风险学生
          </button>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="card">
          <div className="filter-bar">
            <select
              value={filters.risk_level}
              onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
            >
              <option value="">全部风险等级</option>
              <option value="normal">正常</option>
              <option value="mild">轻度风险</option>
              <option value="moderate">中度风险</option>
              <option value="severe">严重风险</option>
            </select>
            {hasRole('admin', 'psychologist') && (
              <select
                value={filters.grade}
                onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
              >
                <option value="">全部年级</option>
                {[7, 8, 9, 10, 11, 12].map(g => (
                  <option key={g} value={g}>{g}年级</option>
                ))}
              </select>
            )}
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📊</div>
              <p>暂无测评结果</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  {hasRole('admin', 'psychologist', 'teacher') && <th>学生</th>}
                  <th>测评计划</th>
                  <th>量表</th>
                  <th>总分</th>
                  <th>风险等级</th>
                  <th>测评时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={result.id}>
                    {hasRole('admin', 'psychologist', 'teacher') && (
                      <td>{result.student_name}</td>
                    )}
                    <td>{result.plan_name}</td>
                    <td>{result.scale_name}</td>
                    <td>{result.total_score?.toFixed(2)}</td>
                    <td>{getRiskBadge(result.risk_level)}</td>
                    <td>{new Date(result.created_at).toLocaleString()}</td>
                    <td className="actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleViewResult(result)}
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'statistics' && hasRole('admin', 'psychologist') && (
        <div className="grid grid-2">
          <div className="card">
            <h2>风险分布</h2>
            <div className="chart-container">
              <Pie data={pieData} />
            </div>
          </div>
          <div className="card">
            <h2>风险等级统计</h2>
            <div className="grid grid-4">
              <div className="stat-card normal">
                <div className="label">正常</div>
                <div className="value">{riskDistribution.normal || 0}</div>
              </div>
              <div className="stat-card mild">
                <div className="label">轻度</div>
                <div className="value">{riskDistribution.mild || 0}</div>
              </div>
              <div className="stat-card moderate">
                <div className="label">中度</div>
                <div className="value">{riskDistribution.moderate || 0}</div>
              </div>
              <div className="stat-card severe">
                <div className="label">严重</div>
                <div className="value">{riskDistribution.severe || 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'atRisk' && hasRole('admin', 'psychologist', 'teacher') && (
        <div className="card">
          <h2>需要关注的学生</h2>
          {atRiskStudents.length === 0 ? (
            <p style={{ color: '#666' }}>暂无需要关注的学生</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>学生姓名</th>
                  <th>年级班级</th>
                  <th>风险等级</th>
                  <th>总分</th>
                  <th>测评计划</th>
                  <th>开放干预</th>
                </tr>
              </thead>
              <tbody>
                {atRiskStudents.map(student => (
                  <tr key={student.student_id}>
                    <td>{student.student_name}</td>
                    <td>{student.grade}年级{student.class}</td>
                    <td>{getRiskBadge(student.risk_level)}</td>
                    <td>{student.total_score?.toFixed(2)}</td>
                    <td>{student.plan_name}</td>
                    <td>{student.open_interventions || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedResult && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>测评结果详情</h2>
              <button className="close-btn" onClick={() => setSelectedResult(null)}>&times;</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p><strong>学生：</strong>{selectedResult.student_name}</p>
              <p><strong>测评计划：</strong>{selectedResult.plan_name}</p>
              <p><strong>风险等级：</strong>{getRiskBadge(selectedResult.risk_level)}</p>
              <p><strong>总分：</strong>{selectedResult.total_score?.toFixed(2)}</p>
            </div>

            {dimensionData && (
              <div style={{ marginBottom: '20px' }}>
                <h3>维度得分</h3>
                <div className="chart-container" style={{ height: '200px' }}>
                  <Bar data={dimensionData} />
                </div>
              </div>
            )}

            {selectedResult.analysis_notes && (
              <div style={{ marginBottom: '20px' }}>
                <h3>分析备注</h3>
                <p>{selectedResult.analysis_notes}</p>
              </div>
            )}

            {hasRole('admin', 'psychologist', 'teacher') && (
              <button
                className="btn"
                onClick={() => setShowInterventionModal(true)}
              >
                创建干预记录
              </button>
            )}
          </div>
        </div>
      )}

      {showInterventionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>创建干预记录</h2>
              <button className="close-btn" onClick={() => setShowInterventionModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateIntervention}>
              <div className="form-group">
                <label>干预类型</label>
                <select
                  value={interventionForm.type}
                  onChange={(e) => setInterventionForm({ ...interventionForm, type: e.target.value })}
                >
                  <option value="interview">访谈</option>
                  <option value="referral">转介</option>
                  <option value="parent_communication">家长沟通</option>
                  <option value="follow_up">跟进</option>
                </select>
              </div>
              <div className="form-group">
                <label>内容记录</label>
                <textarea
                  value={interventionForm.content}
                  onChange={(e) => setInterventionForm({ ...interventionForm, content: e.target.value })}
                  rows="4"
                  required
                />
              </div>
              <div className="form-group">
                <label>结果/结论</label>
                <textarea
                  value={interventionForm.outcome}
                  onChange={(e) => setInterventionForm({ ...interventionForm, outcome: e.target.value })}
                  rows="2"
                />
              </div>
              <button type="submit" className="btn">创建</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
