import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentsAPI, suppliersAPI, questionnairesAPI } from '../api.js';

function Assessments() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [filter, setFilter] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [newAssessment, setNewAssessment] = useState({
    supplier_id: '',
    questionnaire_id: ''
  });

  useEffect(() => {
    loadAssessments();
    loadOptions();
  }, [filter]);

  const loadAssessments = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const res = await assessmentsAPI.getAll(params);
      setAssessments(res.data);
    } catch (error) {
      console.error('加载评估失败:', error);
    }
  };

  const loadOptions = async () => {
    try {
      const [suppliersRes, questionnairesRes] = await Promise.all([
        suppliersAPI.getAll(),
        questionnairesAPI.getAll()
      ]);
      setSuppliers(suppliersRes.data);
      setQuestionnaires(questionnairesRes.data);
      if (suppliersRes.data.length > 0 && questionnairesRes.data.length > 0) {
        setNewAssessment({
          supplier_id: suppliersRes.data[0].id,
          questionnaire_id: questionnairesRes.data[0].id
        });
      }
    } catch (error) {
      console.error('加载选项失败:', error);
    }
  };

  const handleCreateAssessment = async () => {
    try {
      const res = await assessmentsAPI.create(newAssessment);
      setShowNewModal(false);
      navigate(`/assessments/${res.data.id}`);
    } catch (error) {
      alert(error.response?.data?.error || '创建评估失败');
    }
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
        <h1>ESG 评估</h1>
        <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
          + 新建评估
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="form-group">
            <select className="form-control" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="in_progress">进行中</option>
              <option value="submitted">待审核</option>
              <option value="approved">已通过</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>供应商</th>
              <th>问卷名称</th>
              <th>版本</th>
              <th>得分</th>
              <th>风险等级</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map(assessment => (
              <tr key={assessment.id}>
                <td>{assessment.supplier_name}</td>
                <td>{assessment.questionnaire_name}</td>
                <td>{assessment.questionnaire_version}</td>
                <td>{assessment.total_score ?? '-'}</td>
                <td>{assessment.risk_level ? getRiskBadge(assessment.risk_level) : '-'}</td>
                <td>{getStatusBadge(assessment.status)}</td>
                <td>{assessment.created_at?.split('T')[0]}</td>
                <td>
                  <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}
                    onClick={() => navigate(`/assessments/${assessment.id}`)}>
                    {assessment.status === 'draft' ? '填写问卷' : '查看详情'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assessments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            暂无评估记录，点击"新建评估"开始
          </div>
        )}
      </div>

      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建评估</h3>
              <button className="close-btn" onClick={() => setShowNewModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>选择供应商 *</label>
                <select className="form-control"
                  value={newAssessment.supplier_id}
                  onChange={(e) => setNewAssessment({ ...newAssessment, supplier_id: e.target.value })}>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.is_key_supplier ? '(关键供应商)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>选择问卷 *</label>
                <select className="form-control"
                  value={newAssessment.questionnaire_id}
                  onChange={(e) => setNewAssessment({ ...newAssessment, questionnaire_id: e.target.value })}>
                  {questionnaires.map(q => (
                    <option key={q.id} value={q.id}>{q.name} ({q.version})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowNewModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateAssessment}>创建评估</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assessments;
