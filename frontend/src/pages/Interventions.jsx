import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { interventionAPI, userAPI } from '../api';

const Interventions = () => {
  const { hasRole } = useAuth();
  const [interventions, setInterventions] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState(null);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [filters, setFilters] = useState({ is_closed: '', student_id: '' });
  const [formData, setFormData] = useState({
    student_id: '',
    type: 'interview',
    content: '',
    outcome: ''
  });

  const typeLabels = {
    interview: '访谈',
    referral: '转介',
    parent_communication: '家长沟通',
    follow_up: '跟进'
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const params = {};
      if (filters.is_closed !== '') params.is_closed = filters.is_closed;
      if (filters.student_id) params.student_id = filters.student_id;

      const [res, studentsRes] = await Promise.all([
        interventionAPI.getInterventions(params),
        userAPI.getStudents()
      ]);
      setInterventions(res.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Load interventions error:', error);
    }
  };

  const handleCreate = () => {
    setEditingIntervention(null);
    setFormData({
      student_id: students[0]?.id || '',
      type: 'interview',
      content: '',
      outcome: ''
    });
    setShowModal(true);
  };

  const handleEdit = (intervention) => {
    setEditingIntervention(intervention);
    setFormData({
      student_id: intervention.student_id,
      type: intervention.type,
      content: intervention.content,
      outcome: intervention.outcome
    });
    setShowModal(true);
  };

  const handleView = (intervention) => {
    setSelectedIntervention(intervention);
  };

  const handleClose = async (id) => {
    if (!confirm('确定要关闭这个干预记录吗？')) return;
    try {
      await interventionAPI.closeIntervention(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || '关闭失败');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个干预记录吗？')) return;
    try {
      await interventionAPI.deleteIntervention(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingIntervention) {
        await interventionAPI.updateIntervention(editingIntervention.id, formData);
      } else {
        await interventionAPI.createIntervention(formData);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || '保存失败');
    }
  };

  if (!hasRole('admin', 'psychologist', 'teacher')) {
    return <div className="card"><p>权限不足</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>干预跟进</h1>
        <button className="btn btn-sm" onClick={handleCreate}>+ 新建记录</button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <select
            value={filters.is_closed}
            onChange={(e) => setFilters({ ...filters, is_closed: e.target.value })}
          >
            <option value="">全部状态</option>
            <option value="false">进行中</option>
            <option value="true">已关闭</option>
          </select>
          <select
            value={filters.student_id}
            onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
          >
            <option value="">全部学生</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.grade}年级{s.class})</option>
            ))}
          </select>
        </div>

        {interventions.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🤝</div>
            <p>暂无干预记录</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>学生</th>
                <th>类型</th>
                <th>内容摘要</th>
                <th>创建人</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map(i => (
                <tr key={i.id}>
                  <td>{i.student_name}</td>
                  <td>{typeLabels[i.type]}</td>
                  <td>{i.content.substring(0, 30)}...</td>
                  <td>{i.creator_name}</td>
                  <td>
                    <span className={`badge ${i.is_closed ? 'badge-closed' : 'badge-active'}`}>
                      {i.is_closed ? '已关闭' : '进行中'}
                    </span>
                  </td>
                  <td>{new Date(i.created_at).toLocaleString()}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => handleView(i)}>查看</button>
                    {!i.is_closed && (
                      <>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(i)}>编辑</button>
                        {hasRole('admin', 'psychologist') && (
                          <button className="btn btn-sm btn-success" onClick={() => handleClose(i.id)}>关闭</button>
                        )}
                      </>
                    )}
                    {hasRole('admin', 'psychologist') && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(i.id)}>删除</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingIntervention ? '编辑干预记录' : '新建干预记录'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>学生</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: parseInt(e.target.value) })}
                  required
                  disabled={!!editingIntervention}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.grade}年级{s.class})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>干预类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
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
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="5"
                  required
                />
              </div>
              <div className="form-group">
                <label>结果/结论</label>
                <textarea
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  rows="3"
                />
              </div>
              <button type="submit" className="btn">
                {editingIntervention ? '保存修改' : '创建记录'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedIntervention && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>干预记录详情</h2>
              <button className="close-btn" onClick={() => setSelectedIntervention(null)}>&times;</button>
            </div>
            <div>
              <p><strong>学生：</strong>{selectedIntervention.student_name}</p>
              <p><strong>类型：</strong>{typeLabels[selectedIntervention.type]}</p>
              <p><strong>创建人：</strong>{selectedIntervention.creator_name}</p>
              <p><strong>状态：</strong>
                <span className={`badge ${selectedIntervention.is_closed ? 'badge-closed' : 'badge-active'}`}>
                  {selectedIntervention.is_closed ? '已关闭' : '进行中'}
                </span>
              </p>
              <p><strong>创建时间：</strong>{new Date(selectedIntervention.created_at).toLocaleString()}</p>
              <div style={{ marginTop: '20px' }}>
                <h4>内容记录</h4>
                <p style={{ whiteSpace: 'pre-wrap', background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                  {selectedIntervention.content}
                </p>
              </div>
              {selectedIntervention.outcome && (
                <div style={{ marginTop: '20px' }}>
                  <h4>结果/结论</h4>
                  <p style={{ whiteSpace: 'pre-wrap', background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                    {selectedIntervention.outcome}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interventions;
