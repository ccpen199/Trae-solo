import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { suppliersAPI, questionnairesAPI, assessmentsAPI } from '../api.js';

function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [supplierRes, assessmentsRes, questionnairesRes] = await Promise.all([
        suppliersAPI.getById(id),
        suppliersAPI.getAssessments(id),
        questionnairesAPI.getAll()
      ]);
      setSupplier(supplierRes.data);
      setAssessments(assessmentsRes.data);
      setQuestionnaires(questionnairesRes.data);
      if (questionnairesRes.data.length > 0) {
        setSelectedQuestionnaire(questionnairesRes.data[0].id);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleCreateAssessment = async () => {
    try {
      await assessmentsAPI.create({
        supplier_id: id,
        questionnaire_id: selectedQuestionnaire
      });
      setShowNewAssessment(false);
      loadData();
    } catch (error) {
      console.error('创建评估失败:', error);
      alert(error.response?.data?.error || '创建失败');
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

  if (!supplier) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-default" style={{ marginRight: '12px' }} onClick={() => navigate('/suppliers')}>
            &larr; 返回
          </button>
          <h1 style={{ display: 'inline' }}>{supplier.name}</h1>
          {supplier.is_key_supplier && <span className="key-supplier" style={{ marginLeft: '12px' }}>关键供应商</span>}
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewAssessment(true)}>
          + 新建评估
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>基本信息</h3>
        <div className="form-row">
          <div>
            <strong>行业：</strong>{supplier.industry || '-'}
          </div>
          <div>
            <strong>地区：</strong>{supplier.region || '-'}
          </div>
          <div>
            <strong>供货品类：</strong>{supplier.product_category || '-'}
          </div>
          <div>
            <strong>合同金额：</strong>{supplier.contract_amount?.toLocaleString() || '-'}
          </div>
          <div>
            <strong>风险等级：</strong>{getRiskBadge(supplier.risk_level)}
          </div>
          <div>
            <strong>状态：</strong>{supplier.status === 'active' ? '活跃' : '停用'}
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <strong>联系人：</strong>{supplier.contact_name || '-'} | 
          <strong> 电话：</strong>{supplier.contact_phone || '-'} | 
          <strong> 邮箱：</strong>{supplier.contact_email || '-'}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>评估历史</h3>
        <table className="table">
          <thead>
            <tr>
              <th>问卷名称</th>
              <th>版本</th>
              <th>得分</th>
              <th>风险等级</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>下次复评</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map(assessment => (
              <tr key={assessment.id}>
                <td>{assessment.questionnaire_name}</td>
                <td>{assessment.questionnaire_version}</td>
                <td>{assessment.total_score ?? '-'}</td>
                <td>{assessment.risk_level ? getRiskBadge(assessment.risk_level) : '-'}</td>
                <td>{getStatusBadge(assessment.status)}</td>
                <td>{assessment.created_at?.split('T')[0]}</td>
                <td>{assessment.next_review_date || '-'}</td>
                <td>
                  <button className="btn btn-default" style={{ padding: '4px 8px', fontSize: '12px' }}
                    onClick={() => navigate(`/assessments/${assessment.id}`)}>
                    查看
                  </button>
                </td>
              </tr>
            ))}
            {assessments.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#6b7280' }}>暂无评估记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNewAssessment && (
        <div className="modal-overlay" onClick={() => setShowNewAssessment(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建评估</h3>
              <button className="close-btn" onClick={() => setShowNewAssessment(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>选择问卷</label>
                <select className="form-control"
                  value={selectedQuestionnaire}
                  onChange={(e) => setSelectedQuestionnaire(e.target.value)}>
                  {questionnaires.map(q => (
                    <option key={q.id} value={q.id}>{q.name} ({q.version})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowNewAssessment(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateAssessment}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierDetail;
