import React, { useState, useEffect } from 'react';
import api from '../api';

function Prescriptions({ user }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [changes, setChanges] = useState([]);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    training_items: [],
    frequency: '',
    intensity: '',
    notes: '',
    assessment_nodes: []
  });
  const [newItem, setNewItem] = useState({ name: '', duration: '', sets: '', reps: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prescriptionsRes, patientsRes] = await Promise.all([
        api.get('/prescriptions'),
        api.get('/patients')
      ]);
      setPrescriptions(prescriptionsRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await api.put(`/prescriptions/${id}/confirm`, { confirmed_by: user.id });
      loadData();
    } catch (err) {
      alert('确认失败');
    }
  };

  const openEdit = async (prescription) => {
    setEditingPrescription(prescription);
    setFormData({
      ...prescription,
      training_items: prescription.training_items || [],
      assessment_nodes: prescription.assessment_nodes || []
    });
    setShowModal(true);
  };

  const openChanges = async (prescription) => {
    setSelectedPrescription(prescription);
    const res = await api.get(`/prescriptions/${prescription.id}/changes`);
    setChanges(res.data);
    setShowChangesModal(true);
  };

  const openAdd = () => {
    setEditingPrescription(null);
    setFormData({
      patient_id: '',
      training_items: [],
      frequency: '',
      intensity: '',
      notes: '',
      assessment_nodes: []
    });
    setShowModal(true);
  };

  const addTrainingItem = () => {
    if (newItem.name) {
      setFormData({
        ...formData,
        training_items: [...formData.training_items, { ...newItem }]
      });
      setNewItem({ name: '', duration: '', sets: '', reps: '' });
    }
  };

  const removeTrainingItem = (index) => {
    const items = [...formData.training_items];
    items.splice(index, 1);
    setFormData({ ...formData, training_items: items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPrescription) {
        await api.put(`/prescriptions/${editingPrescription.id}`, {
          ...formData,
          changed_by: user.id,
          reason: '处方调整'
        });
      } else {
        await api.post('/prescriptions', {
          ...formData,
          created_by: user.id
        });
      }
      setShowModal(false);
      setEditingPrescription(null);
      loadData();
    } catch (err) {
      alert('保存失败');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-pending', text: '待确认' },
      confirmed: { class: 'badge-confirmed', text: '已确认' },
      executing: { class: 'badge-active', text: '执行中' },
      completed: { class: 'badge', text: '已完成' },
      cancelled: { class: 'badge', text: '已取消' }
    };
    return badges[status] || { class: 'badge', text: status };
  };

  return (
    <div>
      <div className="header">
        <h2>处方管理</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          + 新建处方
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>患者</th>
              <th>创建人</th>
              <th>确认人</th>
              <th>频次</th>
              <th>强度</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map(p => (
              <tr key={p.id}>
                <td>{p.patient_name}</td>
                <td>{p.creator_name}</td>
                <td>{p.confirmer_name || '-'}</td>
                <td>{p.frequency || '-'}</td>
                <td>{p.intensity || '-'}</td>
                <td>
                  <span className={`badge ${getStatusBadge(p.status).class}`}>
                    {getStatusBadge(p.status).text}
                  </span>
                </td>
                <td>{p.created_at}</td>
                <td>
                  <div className="action-buttons">
                    {p.status === 'pending' && user.role === 'doctor' && (
                      <button className="btn btn-sm btn-success" onClick={() => handleConfirm(p.id)}>
                        确认
                      </button>
                    )}
                    <button className="btn btn-sm" onClick={() => openEdit(p)} style={{ background: '#95a5a6', color: '#fff' }}>
                      编辑
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={() => openChanges(p)}>
                      变更记录
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingPrescription ? '编辑处方' : '新建处方'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>选择患者</label>
                  <select 
                    value={formData.patient_id} 
                    onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
                    required
                    disabled={!!editingPrescription}
                  >
                    <option value="">请选择患者</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.patient_no}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>训练频次</label>
                    <input 
                      type="text" 
                      value={formData.frequency}
                      onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                      placeholder="例如：每周5次"
                    />
                  </div>
                  <div className="form-group">
                    <label>训练强度</label>
                    <select value={formData.intensity} onChange={e => setFormData({ ...formData, intensity: e.target.value })}>
                      <option value="">请选择</option>
                      <option value="低">低</option>
                      <option value="中">中</option>
                      <option value="高">高</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>训练项目</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="项目名称"
                      value={newItem.name}
                      onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                      style={{ flex: 2 }}
                    />
                    <input 
                      type="text" 
                      placeholder="时长(分钟)"
                      value={newItem.duration}
                      onChange={e => setNewItem({ ...newItem, duration: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="text" 
                      placeholder="组数"
                      value={newItem.sets}
                      onChange={e => setNewItem({ ...newItem, sets: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="text" 
                      placeholder="次数/组"
                      value={newItem.reps}
                      onChange={e => setNewItem({ ...newItem, reps: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn btn-primary" onClick={addTrainingItem}>+</button>
                  </div>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', background: '#f8f9fa', borderRadius: '4px' }}>
                    {formData.training_items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', padding: '8px 12px', borderBottom: '1px solid #e9ecef', alignItems: 'center' }}>
                        <span style={{ flex: 1 }}>
                          {item.name} - {item.duration}分钟 - {item.sets}组 x {item.reps}次
                        </span>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => removeTrainingItem(idx)}>删除</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>注意事项</label>
                  <textarea 
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>评估节点（用逗号分隔，如：第2周,第4周）</label>
                  <input 
                    type="text" 
                    value={formData.assessment_nodes.join(',')}
                    onChange={e => setFormData({ ...formData, assessment_nodes: e.target.value.split(',').filter(n => n) })}
                    placeholder="第2周,第4周"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" style={{ background: '#95a5a6', color: '#fff' }} onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPrescription ? '保存修改' : '创建处方'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChangesModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>处方变更记录</h3>
              <button className="close-btn" onClick={() => setShowChangesModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <table>
                <thead>
                  <tr>
                    <th>变更类型</th>
                    <th>变更人</th>
                    <th>变更时间</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', color: '#7f8c8d' }}>暂无变更记录</td></tr>
                  ) : (
                    changes.map(c => (
                      <tr key={c.id}>
                        <td>{c.change_type}</td>
                        <td>{c.changer_name}</td>
                        <td>{c.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Prescriptions;
