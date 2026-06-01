import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuditPlans, getIssues, createIssue, updateIssue, deleteIssue, getChecklistCategories, checkAuditPass } from '../api.js';

function Issues() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(planId || '');
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [auditPassInfo, setAuditPassInfo] = useState({ canPass: true, openCriticalCount: 0 });
  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    severity: 'major',
    responsible_person: '',
    deadline: '',
    evidence_requirement: '',
    status: 'open',
    rectification_evidence: '',
    recheck_result: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      loadIssues();
      loadAuditPassInfo();
    }
  }, [selectedPlan]);

  const loadData = async () => {
    try {
      const [plansRes, catRes] = await Promise.all([
        getAuditPlans(),
        getChecklistCategories()
      ]);
      setPlans(plansRes.data);
      setCategories(catRes.data);
      if (planId) {
        setSelectedPlan(planId);
      }
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  const loadIssues = async () => {
    try {
      const res = await getIssues(selectedPlan);
      setIssues(res.data);
    } catch (error) {
      console.error('加载问题失败', error);
    }
  };

  const loadAuditPassInfo = async () => {
    try {
      const res = await checkAuditPass(selectedPlan);
      setAuditPassInfo(res.data);
    } catch (error) {
      console.error('加载验厂状态失败', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingIssue) {
        await updateIssue(editingIssue.id, { ...formData, recheck_by: 1 });
      } else {
        await createIssue({ ...formData, audit_plan_id: selectedPlan });
      }
      setShowModal(false);
      setEditingIssue(null);
      loadIssues();
      loadAuditPassInfo();
      resetForm();
    } catch (error) {
      console.error('保存失败', error);
    }
  };

  const handleEdit = (issue) => {
    setEditingIssue(issue);
    setFormData({
      category_id: issue.category_id || '',
      description: issue.description,
      severity: issue.severity,
      responsible_person: issue.responsible_person || '',
      deadline: issue.deadline || '',
      evidence_requirement: issue.evidence_requirement || '',
      status: issue.status,
      rectification_evidence: issue.rectification_evidence || '',
      recheck_result: issue.recheck_result || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除此问题吗？')) {
      try {
        await deleteIssue(id);
        loadIssues();
        loadAuditPassInfo();
      } catch (error) {
        console.error('删除失败', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      description: '',
      severity: 'major',
      responsible_person: '',
      deadline: '',
      evidence_requirement: '',
      status: 'open',
      rectification_evidence: '',
      recheck_result: ''
    });
  };

  const getSeverityLabel = (severity) => {
    const map = {
      critical: { text: '严重', class: 'severity-critical' },
      major: { text: '主要', class: 'severity-major' },
      minor: { text: '一般', class: 'severity-minor' }
    };
    return map[severity] || map.minor;
  };

  const getStatusTag = (status) => {
    const map = {
      open: { text: '待整改', class: 'tag-danger' },
      rectifying: { text: '整改中', class: 'tag-warning' },
      rechecking: { text: '复查中', class: 'tag-info' },
      closed: { text: '已关闭', class: 'tag-success' }
    };
    const s = map[status] || map.open;
    return <span className={`tag ${s.class}`}>{s.text}</span>;
  };

  const isOverdue = (deadline, status) => {
    if (!deadline || status === 'closed') return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div>
      <h2 className="page-title">问题整改管理</h2>
      
      <div className="card">
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

        {selectedPlan && !auditPassInfo.canPass && (
          <div className="alert alert-error">
            ⚠️ 存在 {auditPassInfo.openCriticalCount} 个严重问题未关闭，该验厂不能通过！
          </div>
        )}
      </div>

      {selectedPlan && (
        <>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => { setShowModal(true); resetForm(); setEditingIssue(null); }}>
              + 添加问题
            </button>
          </div>

          <div className="card">
            {issues.length === 0 ? (
              <div className="empty-state">暂无问题记录</div>
            ) : (
              <div>
                {issues.map(issue => {
                  const sev = getSeverityLabel(issue.severity);
                  const overdue = isOverdue(issue.deadline, issue.status);
                  return (
                    <div key={issue.id} className="issue-card" style={{ borderColor: issue.severity === 'critical' ? '#ffccc7' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <span className={`issue-severity ${sev.class}`}>{sev.text}</span>
                          {overdue && <span className="tag tag-danger" style={{ marginLeft: '8px' }}>已超期</span>}
                          <span style={{ marginLeft: '8px' }}>{issue.category_name || '未分类'}</span>
                        </div>
                        <div>{getStatusTag(issue.status)}</div>
                      </div>
                      <p style={{ marginBottom: '12px', fontWeight: '500' }}>{issue.description}</p>
                      {issue.responsible_person && (
                        <p style={{ fontSize: '14px', color: '#595959', marginBottom: '4px' }}>
                          责任人: {issue.responsible_person}
                          {issue.deadline && ` | 截止日期: ${issue.deadline}`}
                        </p>
                      )}
                      {issue.evidence_requirement && (
                        <p style={{ fontSize: '14px', color: '#595959', marginBottom: '4px' }}>
                          证据要求: {issue.evidence_requirement}
                        </p>
                      )}
                      {issue.rectification_evidence && (
                        <p style={{ fontSize: '14px', color: '#595959', marginBottom: '4px' }}>
                          整改证据: {issue.rectification_evidence}
                        </p>
                      )}
                      {issue.recheck_result && (
                        <p style={{ fontSize: '14px', color: issue.recheck_result === 'pass' ? '#52c41a' : '#ff4d4f', marginBottom: '12px' }}>
                          复查结果: {issue.recheck_result === 'pass' ? '通过' : '不通过'}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button className="btn btn-sm btn-default" onClick={() => handleEdit(issue)}>编辑/复查</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(issue.id)}>删除</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {!selectedPlan && (
        <div className="card">
          <div className="empty-state">请选择验厂计划查看问题</div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingIssue ? '编辑问题' : '添加问题'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>问题分类</label>
                    <select className="select-control" value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                      <option value="">请选择分类</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>严重程度 *</label>
                    <select className="select-control" value={formData.severity} onChange={e => setFormData({ ...formData, severity: e.target.value })}>
                      <option value="critical">严重 (Critical)</option>
                      <option value="major">主要 (Major)</option>
                      <option value="minor">一般 (Minor)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>问题描述 *</label>
                  <textarea className="notes-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>责任人</label>
                    <input type="text" className="form-control" value={formData.responsible_person} onChange={e => setFormData({ ...formData, responsible_person: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>整改截止日期</label>
                    <input type="date" className="form-control" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>证据要求</label>
                  <textarea className="notes-textarea" value={formData.evidence_requirement} onChange={e => setFormData({ ...formData, evidence_requirement: e.target.value })} />
                </div>

                {editingIssue && (
                  <>
                    <div className="form-group">
                      <label>整改状态</label>
                      <select className="select-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="open">待整改</option>
                        <option value="rectifying">整改中</option>
                        <option value="rechecking">复查中</option>
                        <option value="closed">已关闭</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>整改证据</label>
                      <textarea className="notes-textarea" value={formData.rectification_evidence} onChange={e => setFormData({ ...formData, rectification_evidence: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label>复查结果</label>
                      <select className="select-control" value={formData.recheck_result} onChange={e => setFormData({ ...formData, recheck_result: e.target.value })}>
                        <option value="">未复查</option>
                        <option value="pass">通过</option>
                        <option value="fail">不通过</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Issues;
